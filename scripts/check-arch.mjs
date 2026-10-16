import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const MAX_FILE_LINES = 200;

function collectFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, result);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      result.push(full);
    }
  }
  return result;
}

function parseImports(content) {
  const regex = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveImportToRelPath(fromFile, imp) {
  let targetBase = null;
  if (imp.startsWith('@/')) {
    targetBase = path.join(SRC_DIR, imp.slice(2));
  } else if (imp.startsWith('.')) {
    targetBase = path.resolve(path.dirname(fromFile), imp);
  }
  if (!targetBase) return null;
  const candidates = [
    `${targetBase}.ts`,
    `${targetBase}.tsx`,
    path.join(targetBase, 'index.ts'),
    path.join(targetBase, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return path.relative(SRC_DIR, c).replace(/\\/g, '/');
    }
  }
  return null;
}

const files = collectFiles(SRC_DIR);
const errors = [];
const graph = new Map();

for (const file of files) {
  const rel = path.relative(SRC_DIR, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  const codeLines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('/*') && !l.startsWith('*'));

  if (codeLines.length > MAX_FILE_LINES) {
    errors.push(`[MAX-LINES] ${rel} memiliki ${codeLines.length} baris kode aktif (maks ${MAX_FILE_LINES}).`);
  }

  const imports = parseImports(raw);
  const edges = [];

  for (const imp of imports) {
    const resolved = resolveImportToRelPath(file, imp);
    if (resolved) edges.push(resolved);

    if (rel.startsWith('shared/') && !rel.startsWith('shared/db/schema')) {
      if (imp.startsWith('@/features/') || imp.startsWith('@/app/')) {
        errors.push(`[LAYER-VIOLATION] ${rel} (shared) mengimpor ${imp}.`);
      }
    }

    if (rel.startsWith('features/')) {
      const featureName = rel.split('/')[1];
      if (imp.startsWith('@/app/')) {
        errors.push(`[LAYER-VIOLATION] ${rel} mengimpor app layer (${imp}).`);
      }
      if (imp.startsWith('@/features/')) {
        const parts = imp.replace('@/features/', '').split('/');
        const targetFeature = parts[0];
        if (targetFeature !== featureName && parts.length > 1) {
          errors.push(`[PUBLIC-API-VIOLATION] ${rel} mengimpor internal fitur lain: ${imp}. Gunakan @/features/${targetFeature}.`);
        }
      }
      if (rel.includes('/domain/')) {
        if (
          imp.includes('/application') ||
          imp.includes('/infrastructure') ||
          imp.includes('/presentation') ||
          imp.startsWith('drizzle-orm') ||
          imp === 'react' ||
          imp.startsWith('next/')
        ) {
          errors.push(`[DOMAIN-PURITY] ${rel} mengimpor dependensi non-domain: ${imp}.`);
        }
      }
    }
  }

  if (
    raw.includes('insert(stockMovements)') &&
    !rel.startsWith('features/stock/') &&
    !rel.startsWith('shared/db/seed') &&
    !rel.startsWith('tests/')
  ) {
    errors.push(`[STOCK-LEDGER-GUARD] ${rel} menulis langsung ke stockMovements. Hanya fitur stock yang diizinkan.`);
  }

  graph.set(rel, edges);
}

const visited = new Set();
const visiting = new Set();

function dfs(node, stack) {
  visiting.add(node);
  for (const next of graph.get(node) || []) {
    if (visiting.has(next)) {
      const cycle = [...stack.slice(stack.indexOf(next)), next].join(' -> ');
      errors.push(`[CIRCULAR-DEPENDENCY] Siklus terdeteksi: ${cycle}`);
    } else if (!visited.has(next)) {
      dfs(next, [...stack, next]);
    }
  }
  visiting.delete(node);
  visited.add(node);
}

for (const node of graph.keys()) {
  if (!visited.has(node)) dfs(node, [node]);
}

if (errors.length > 0) {
  console.error('❌ Pelanggaran Arsitektur Ditemukan:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
} else {
  console.log(`✅ Pemeriksaan Arsitektur Lulus (${files.length} file diverifikasi, 0 pelanggaran, 0 circular dependency).`);
}
