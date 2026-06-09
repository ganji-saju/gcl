import { Link } from "wouter";
import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-ink-200 bg-ink-950 text-white">
      <div className="container-wide py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-white text-sm font-semibold text-ink-950">
                GP
              </div>
              <div>
                <div className="font-serif text-xl">Global Patient Hub</div>
                <div className="text-sm text-teal-200">Independent Korea care network</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-ink-300">{t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Explore</h4>
            <div className="grid gap-2 text-sm">
              <Link href="/hospitals" className="text-ink-300 hover:text-white">
                {t("nav.hospitals")}
              </Link>
              <Link href="/treatments" className="text-ink-300 hover:text-white">
                {t("nav.treatments")}
              </Link>
              <Link href="/compare" className="text-ink-300 hover:text-white">
                {t("nav.compare")}
              </Link>
              <Link href="/consultation" className="text-ink-300 hover:text-white">
                {t("nav.consultation")}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Contact</h4>
            <div className="grid gap-3 text-sm text-ink-300">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 text-teal-300" />
                Seoul, South Korea
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
            Copyright {new Date().getFullYear()} Global Patient Hub. {t("footer.rights")}
          </p>
          <p>Medical decisions are made directly with licensed providers.</p>
        </div>
      </div>
    </footer>
  );
}
