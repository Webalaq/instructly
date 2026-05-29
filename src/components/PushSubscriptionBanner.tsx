"use client";

import { useState, useSyncExternalStore } from "react";
import { BellIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

function getShowSnapshot() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (Notification.permission === "granted") return false;
  if (Notification.permission === "denied") return false;
  if (sessionStorage.getItem("push-dismissed")) return false;
  return true;
}

function getServerSnapshot() {
  return false;
}

export function PushSubscriptionBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getShowSnapshot, getServerSnapshot);
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!shouldShow || !show) return null;

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setShow(false);
    } catch {
      setShow(false);
    }
    setLoading(false);
  }

  function handleDismiss() {
    sessionStorage.setItem("push-dismissed", "1");
    setShow(false);
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 shrink-0">
        <BellIcon className="size-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">Enable notifications</div>
        <div className="text-xs text-muted-foreground">Get lesson reminders and updates</div>
      </div>
      <Button size="sm" onClick={handleEnable} disabled={loading} className="shrink-0">
        {loading ? "..." : "Enable"}
      </Button>
      <button type="button" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
