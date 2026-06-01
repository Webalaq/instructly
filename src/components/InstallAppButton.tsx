"use client";

import { useState, useEffect, useCallback } from "react";
import { DownloadIcon, ShareIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Android/desktop install prompt
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (isInstalled) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
            <CheckCircleIcon className="size-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-semibold">App installed</div>
            <div className="text-xs text-muted-foreground">Instructly is on your home screen</div>
          </div>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
            <DownloadIcon className="size-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Install app</div>
            <div className="text-xs text-muted-foreground">Add to your home screen for quick access</div>
          </div>
        </div>
        {showIOSGuide ? (
          <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
            <p className="font-medium">How to install on iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Tap the <ShareIcon className="inline size-4 -mt-0.5" /> Share button in Safari</li>
              <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></li>
              <li>Tap <strong className="text-foreground">Add</strong> to confirm</li>
            </ol>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowIOSGuide(true)}>
            Show instructions
          </Button>
        )}
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
            <DownloadIcon className="size-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Install app</div>
            <div className="text-xs text-muted-foreground">Add to your home screen for quick access</div>
          </div>
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    );
  }

  // No install prompt available (desktop browser, or already dismissed)
  return null;
}
