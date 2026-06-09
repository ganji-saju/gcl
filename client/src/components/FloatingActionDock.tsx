import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, MessageSquareText, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACT_LINKS = [
  {
    label: "WhatsApp",
    shortLabel: "WA",
    href: "https://wa.me/82262002026?text=Hello%20Global%20Patient%20Hub%2C%20I%20would%20like%20to%20ask%20about%20Korea%20skin%20packages.",
    className: "bg-[#25D366] text-white hover:bg-[#1fb758]",
  },
  {
    label: "LINE",
    shortLabel: "LINE",
    href: "https://line.me/R/ti/p/@globalpatienthub",
    className: "bg-[#06C755] text-white hover:bg-[#05aa49]",
  },
  {
    label: "WeChat",
    shortLabel: "WC",
    href: "weixin://dl/chat?globalpatienthub",
    className: "bg-[#07C160] text-white hover:bg-[#06a653]",
  },
  {
    label: "KakaoTalk",
    shortLabel: "KO",
    href: "https://pf.kakao.com/_globalpatienthub/chat",
    className: "bg-[#FEE500] text-ink-950 hover:bg-[#f3d900]",
  },
];

export default function FloatingActionDock() {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 420);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={cn(
          "grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-800 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-ink-50",
          showTop ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <ArrowUp className="size-5" />
      </button>

      <div className="flex flex-col items-end gap-2">
        {CONTACT_LINKS.map((link, index) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${link.label}`}
            className={cn(
              "group flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-sm font-semibold shadow-lg transition-all duration-200",
              link.className,
              open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
            )}
            style={{ transitionDelay: open ? `${index * 35}ms` : "0ms" }}
          >
            <span className="grid size-7 place-items-center rounded-full bg-white/25 text-[11px] font-bold">
              {link.shortLabel}
            </span>
            <span>{link.label}</span>
          </a>
        ))}

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? "Close contact shortcuts" : "Open contact shortcuts"}
          className="flex h-12 items-center gap-2 rounded-full bg-ink-950 pl-4 pr-5 text-sm font-semibold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-ink-800"
        >
          <span className="grid size-8 place-items-center rounded-full bg-teal-500 text-white">
            {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
          </span>
          <span className="hidden sm:inline">Chat</span>
          {open ? <MessageSquareText className="size-4 text-teal-200" /> : <Send className="size-4 text-teal-200" />}
        </button>
      </div>
    </div>
  );
}
