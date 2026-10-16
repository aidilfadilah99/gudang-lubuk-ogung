import React from 'react';
import { ColdStartBanner } from '@/shared/ui/card';

export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <ColdStartBanner />
    </div>
  );
}
