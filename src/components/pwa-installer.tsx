"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

function getStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Chrome PWA and iOS Safari
  return (
    window.matchMedia?.("display-mode: standalone").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function PwaInstaller() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(getStandalone());
  const isIOS = useMemo(
    () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent),
    []
  );

  useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("SW registration failed", e);
      });
    }

    const onBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  if (installed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      {canInstall ? (
        <Button onClick={onInstallClick} variant="default" className="shadow-lg">
          Install Tabill App
        </Button>
      ) : isIOS ? (
        <div className="rounded-md bg-background/90 border px-3 py-2 text-sm shadow-lg">
          <span className="font-medium">Add to Home Screen:</span> Share → Add to Home Screen
        </div>
      ) : null}
    </div>
  );
}
