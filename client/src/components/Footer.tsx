import { Link, useLocation } from "wouter";
import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  const [location] = useLocation();
  const internalMode = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/provider");

  const internalLinks = [
    { href: "/admin/ops-health", label: "운영 상태 점검" },
    { href: "/admin/cases", label: "케이스 보드" },
    { href: "/partner/cases", label: "파트너 보드" },
    { href: "/provider/quotes", label: "병원 견적 데스크" },
    { href: "/admin/quote-booking", label: "견적/예약 관리" },
  ];

  return (
    <footer className="border-t border-ink-200 bg-ink-950 text-white">
      <div className="container-wide py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-white text-sm font-semibold text-ink-950">
                {internalMode ? "허브" : "GP"}
              </div>
              <div>
                <div className="font-serif text-xl">{internalMode ? "글로벌 환자 허브" : "Global Patient Hub"}</div>
                <div className="text-sm text-teal-200">{internalMode ? "한국 의료 운영 네트워크" : t("footer.tagline")}</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-ink-300">
              {internalMode ? "환자, 파트너, 병원 케이스를 한 곳에서 관리하는 내부 운영 화면입니다." : t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">{internalMode ? "운영 메뉴" : t("footer.explore")}</h4>
            <div className="grid gap-2 text-sm">
              {(internalMode ? internalLinks : [
                { href: "/hospitals", label: t("nav.hospitals") },
                { href: "/treatments", label: t("nav.treatments") },
                { href: "/compare", label: t("nav.compare") },
                { href: "/consultation", label: t("nav.consultation") },
              ]).map((link) => (
                <Link key={link.href} href={link.href} className="text-ink-300 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">{internalMode ? "운영 연락처" : t("footer.contact")}</h4>
            <div className="grid gap-3 text-sm text-ink-300">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 text-teal-300" />
                {internalMode ? "서울 운영팀" : t("footer.location")}
              </div>
              <a href="tel:+82-2-6200-2026" className="flex gap-2 hover:text-white">
                <Phone className="size-4 text-teal-300" />
                +82 2-6200-2026
              </a>
              <a href="mailto:care@globalpatienthub.com" className="flex gap-2 hover:text-white">
                <Mail className="size-4 text-teal-300" />
                care@globalpatienthub.com
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col gap-3 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {internalMode ? `${new Date().getFullYear()} 글로벌 환자 허브. 모든 권리 보유.` : `Copyright ${new Date().getFullYear()} Global Patient Hub. ${t("footer.rights")}`}
          </p>
          <p>{internalMode ? "내부 운영 자료는 환자 동의와 접근 권한 범위 안에서만 사용해야 합니다." : t("common.medicalDisclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
