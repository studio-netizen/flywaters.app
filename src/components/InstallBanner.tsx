import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const DISMISS_KEY = "fw-install-banner-dismissed";

const InstallBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;

    const t = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div
      className="fixed left-3 right-3 z-50 lg:hidden"
      style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Installa Flywaters"
    >
      <div className="bg-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] border border-black/[0.06] p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#242242] leading-tight">
            🎣 Aggiungi Flywaters alla home!
          </p>
          <p className="text-xs text-[#5a5a52] mt-1">Più veloce di un'app — gratis</p>
        </div>
        <Link
          to="/installa-app"
          onClick={() => setShow(false)}
          className="flex-shrink-0 text-xs font-semibold text-[#242242] px-3 py-2 rounded-full bg-[#f5f0e8] hover:bg-[#ebe4d6] transition-colors whitespace-nowrap"
        >
          Scopri come
        </Link>
        <button
          onClick={dismiss}
          aria-label="Chiudi"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#8c8c7a] hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
