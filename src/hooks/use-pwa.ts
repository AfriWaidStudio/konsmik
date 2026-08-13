import * as React from "react";

export function usePwaInstall() {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [promptEvent, setPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const getStandalone = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isSafariStandalone = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      return isStandalone || isSafariStandalone;
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setCanInstall(false);
      setIsInstalled(true);
    };

    setIsInstalled(getStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled as EventListener);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setIsInstalled(getStandalone());

    mediaQuery.addEventListener?.("change", onDisplayModeChange);
    mediaQuery.addListener?.(onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled as EventListener);
      mediaQuery.removeEventListener?.("change", onDisplayModeChange);
      mediaQuery.removeListener?.(onDisplayModeChange);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!promptEvent) return false;

    promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setCanInstall(false);
    setPromptEvent(null);
    return choice.outcome === "accepted";
  }, [promptEvent]);

  return { canInstall, isInstalled, install };
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
