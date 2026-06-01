"use client";

import { useState, useEffect, useCallback } from "react";
import { DownloadIcon, ShareIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getInitialPlatform() {
  if (typeof window === "undefined") return { installed: false, ios: false };
  if (window.matchMedia("(display-mode: standalone)").matches) return { installed: true, ios: false };
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return { installed: false, ios };
}

export function InstallAppButton() {
  const [platform, setPlatform] = useState(getInitialPlatform);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setPlatform((prev) => ({ ...prev, installed: true }));
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setPlatform((prev) => ({ ...prev, installed: true }));
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (platform.installed) {
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

  if (platform.ios) {
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
