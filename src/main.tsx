import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import "./i18n";

// Microsoft Clarity — only in production when project ID is configured
const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
if (clarityId && import.meta.env.PROD) {
  const w = window as any;
  w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.src = "https://www.clarity.ms/tag/" + clarityId;
  const t = document.getElementsByTagName("script")[0];
  t.parentNode?.insertBefore(s, t);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);

// Connectivity toasts: warn on offline, confirm on reconnect.
(async () => {
  const { toast } = await import("sonner");
  const { default: i18n } = await import("./i18n");
  let wasOffline = !navigator.onLine;
  window.addEventListener("offline", () => {
    wasOffline = true;
    toast.warning(i18n.t("network.offline"));
  });
  window.addEventListener("online", () => {
    if (wasOffline) {
      wasOffline = false;
      toast.success(i18n.t("network.backOnline"));
    }
  });
})();


// Register service worker (skip in Lovable preview / iframes / dev)
if ("serviceWorker" in navigator) {
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovableproject-dev.com") ||
    host.endsWith(".beta.lovable.dev") ||
    host === "localhost" ||
    host === "127.0.0.1";
  const killed = new URLSearchParams(window.location.search).get("sw") === "off";

  if (!isPreview && !inIframe && !killed && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      });
    });
  }
}
