'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from './button';

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats: string[];
    }) => BarcodeDetectorLike;
  }
}

function runNativeDetectorLoop(
  detector: BarcodeDetectorLike,
  videoEl: HTMLVideoElement,
  isStopped: () => boolean,
  onDetected: (code: string) => void
): void {
  const loop = async () => {
    if (isStopped()) return;
    const codes = await detector.detect(videoEl).catch(() => []);
    const val = codes[0]?.rawValue;
    if (val) {
      onDetected(val);
      return;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

async function startCameraDetection(
  videoEl: HTMLVideoElement,
  onDetected: (code: string) => void,
  onError: (msg: string) => void
): Promise<() => void> {
  let stopped = false;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'],
      });
      runNativeDetectorLoop(detector, videoEl, () => stopped, onDetected);
    } else {
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const reader = new BrowserMultiFormatReader();
      reader.decodeFromVideoDevice(null, videoEl, (res) => {
        if (!stopped && res) {
          onDetected(res.getText());
          reader.reset();
        }
      });
    }
  } catch {
    onError('Kamera tidak dapat diakses. Ketik kode/barcode secara manual.');
  }
  return () => {
    stopped = true;
    stream?.getTracks().forEach((t) => t.stop());
  };
}

function ScannerModal({
  videoRef,
  errorMsg,
  onClose,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  errorMsg: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Arahkan ke Barcode</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <video
          ref={videoRef}
          className="h-56 w-full rounded-xl bg-black object-cover"
          playsInline
          muted
        />
        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      </div>
    </div>
  );
}

export function BarcodeScannerButton({
  onScan,
}: {
  onScan: (barcode: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    let cleanup: (() => void) | undefined;
    startCameraDetection(
      videoRef.current,
      (code) => { onScan(code); setOpen(false); },
      (msg) => setErrorMsg(msg)
    ).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, [open, onScan]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => { setErrorMsg(null); setOpen(true); }}>
        <Camera className="h-4 w-4" /> Scan Barcode
      </Button>
      {open && <ScannerModal videoRef={videoRef} errorMsg={errorMsg} onClose={() => setOpen(false)} />}
    </>
  );
}
