import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Languages, Menu, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n } from "@/contexts/I18nContext";
import { useCompare } from "@/contexts/CompareContext";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { t, lang, setLang, currentLang } = useI18n();
  const { items } = useCompare();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const internalMode = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/provider");

  const publicNavLinks = [
    { href: "/en/korea-skin-clinic-gangnam", label: t("nav.skinPackages") },
    { href: "/hospitals", label: t("nav.hospitals") },
    { href: "/treatments", label: t("nav.treatments") },
    { href: "/compare", label: t("nav.compare") },
    { href: "/#process", label: t("nav.process") },
  ];
  const internalNavLinks = [
    { href: "/admin/cases", label: "케이스" },
    { href: "/partner/cases", label: "파트너" },
    { href: "/provider/quotes", label: "병원 견적" },
    { href: "/admin/quote-booking", label: "견적/예약" },
    { href: "/admin/beta", label: "베타 운영" },
    { href: "/admin/landing-routes", label: "랜딩 경로" },
  ];
  const navLinks = internalMode ? internalNavLinks : publicNavLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-ink-950 text-sm font-semibold text-white">
              {internalMode ? "허브" : "GP"}
            </div>
            <div className="leading-tight">
              <div className="font-serif text-lg text-ink-950">{internalMode ? "글로벌 환자 허브" : "Global Patient Hub"}</div>
              <div className="text-xs font-medium text-teal-700">{internalMode ? "한국 의료 네트워크" : "Korea care network"}</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = link.href !== "/#process" && location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-ink-100 text-ink-950" : "text-ink-600 hover:bg-ink-50 hover:text-ink-950",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {!internalMode && (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/compare">
                <Button variant="outline" size="sm" className="relative border-ink-200 text-ink-700 hover:bg-ink-50">
                  <Scale className="size-4" />
                  {t("nav.compare")}
                  {items.length > 0 && (
                    <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
                      {items.length}
                    </span>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950">
                    <Languages className="size-4" />
                    {currentLang.shortLabel}
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {LANGUAGES.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      onClick={() => setLang(language.code)}
                      className={cn("cursor-pointer", lang === language.code && "bg-teal-50 font-medium text-teal-800")}
                    >
                      <span className="mr-2 text-xs text-ink-400">{language.shortLabel}</span>
                      {language.nativeLabel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/consultation">
                <Button size="sm" className="btn-scale bg-teal-700 text-white hover:bg-teal-800">
                  {t("nav.cta")}
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-md p-2 text-ink-700 hover:bg-ink-50 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="메뉴 열기"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-200 bg-white md:hidden">
          <div className="container-wide flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </Link>
            ))}
            {!internalMode && (
              <>
                <div className="mt-2 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => {
                        setLang(language.code);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold",
                        lang === language.code
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-ink-200 text-ink-600",
                      )}
                    >
                      {language.shortLabel}
                    </button>
                  ))}
                </div>
                <Link href="/consultation" onClick={() => setMobileOpen(false)}>
                  <Button className="mt-2 w-full bg-teal-700 text-white hover:bg-teal-800">{t("nav.cta")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
