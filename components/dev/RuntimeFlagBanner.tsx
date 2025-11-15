'use client';
import { useEffect, useState } from 'react';

export default function RuntimeFlagBanner() {
  const [msg, setMsg] = useState<string>('');
  useEffect(() => {
    fetch('/api/_diag/flags').then(r => r.json()).then(d => {
      setMsg(`FF_LAYOUT_V1: ${String(d.resolved)} (raw="${d.raw}" env=${d.vercelEnv})`);
    }).catch(() => setMsg('FF diag failed'));
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-2 left-2 z-[9999] rounded-md border px-2 py-1 text-xs bg-white/80 backdrop-blur">
      {msg}
    </div>
  );
}
