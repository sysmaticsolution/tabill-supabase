"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const isSafari = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  }, []);
  const iosDismissKey = "pwa-ios-dismissed";
  const [iosDismissed, setIosDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

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

    // Load iOS dismissal
    try {
      const v = typeof window !== "undefined" ? window.localStorage.getItem(iosDismissKey) : null;
      if (v === "1") setIosDismissed(true);
    } catch {}

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
          Add to Home Screen
        </Button>
      ) : isIOS && !iosDismissed ? (
        <>
          <Button onClick={() => setShowIosGuide(true)} variant="default" className="shadow-lg">
            Add to Home Screen
          </Button>

          <AlertDialog open={showIosGuide} onOpenChange={setShowIosGuide}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add “Tabill” to your Home Screen</AlertDialogTitle>
                <AlertDialogDescription>
                  {isSafari ? (
                    <>
                      1) Tap the Share icon (square with an up arrow)
                      <br />
                      2) Scroll and tap <strong>Add to Home Screen</strong>
                      <br />
                      3) Tap <strong>Add</strong>
                    </>
                  ) : (
                    <>
                      For best results, open this site in Safari on your iPhone/iPad, then:
                      <br />
                      1) Tap the Share icon
                      <br />
                      2) Tap <strong>Add to Home Screen</strong>
                      <br />
                      3) Tap <strong>Add</strong>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(iosDismissKey, "1");
                    } catch {}
                    setIosDismissed(true);
                    setShowIosGuide(false);
                  }}
                >
                  Don’t remind me
                </Button>
                <AlertDialogAction asChild>
                  <Button onClick={() => setShowIosGuide(false)}>Got it</Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
