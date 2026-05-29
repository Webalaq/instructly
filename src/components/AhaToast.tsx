"use client";

import { useEffect, useRef } from "react";
import { CheckCircleIcon, XIcon } from "lucide-react";

interface AhaToastProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function AhaToast({ show, title, message, onClose, duration = 6000 }: AhaToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (show) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom-4 fade-in sm:bottom-6 sm:left-auto sm:right-6">
      <div className="rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex gap-3">
          <CheckCircleIcon className="size-6 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
