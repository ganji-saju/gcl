import type { LanguageCode } from "./sampleData";

export type WedgeMarket = "japan" | "taiwan";
export type LandingLocale = "en" | "jp";

export interface SkinPackageSku {
  id: string;
  title: string;
  shortTitle: string;
  market: WedgeMarket | "both";
  treatmentSlug: string;
  priceMinUsd: number;
  priceMaxUsd: number;
  durationDays: number;
  recoveryWindow: string;
  coordinatorLanguages: LanguageCode[];
  includes: string[];
  bestFor: string;
  complianceNote: string;
}

export interface SkinLandingPage {
  locale: LandingLocale;
  slug: string;
  market: WedgeMarket;
  intent: string;
  title: string;
  subtitle: string;
  searchTheme: string;
  cta: string;
  secondaryCta: string;
  packageIds: string[];
}

export const SKIN_PACKAGE_SKUS: SkinPackageSku[] = [
  {
    id: "jp-skin-01",
    title: "Gangnam Laser Toning Starter",
    shortTitle: "Laser toning",
    market: "japan",
    treatmentSlug: "laser-toning",
    priceMinUsd: 700,
    priceMaxUsd: 1200,
    durationDays: 1,
    recoveryWindow: "0-2 days",
    coordinatorLanguages: ["ja", "en"],
    bestFor: "Short Seoul beauty trips and first-time Korea skin clinic visitors.",
    includes: ["Skin analysis", "Laser toning estimate", "Low-downtime schedule", "Aftercare checklist"],
    complianceNote: "Final treatment plan and price must be confirmed after provider consultation.",
  },
  {
    id: "jp-skin-02",
    title: "Weekend Anti-Aging Skin Booster",
    shortTitle: "Skin booster",
    market: "japan",
    treatmentSlug: "skin-booster",
    priceMinUsd: 1200,
    priceMaxUsd: 2200,
    durationDays: 2,
    recoveryWindow: "1-3 days",
    coordinatorLanguages: ["ja", "en"],
    bestFor: "Patients comparing hydration, texture, and early anti-aging options.",
    includes: ["Doctor review", "Booster estimate", "Recovery-light scheduling", "Japanese follow-up notes"],
    complianceNote: "Injectable suitability depends on medical review and provider protocol.",
  },
  {
    id: "jp-skin-03",
    title: "Acne Scar Laser Planning Package",
    shortTitle: "Acne scar plan",
    market: "japan",
    treatmentSlug: "acne-scar-laser",
    priceMinUsd: 1500,
    priceMaxUsd: 3000,
    durationDays: 3,
    recoveryWindow: "3-7 days",
    coordinatorLanguages: ["ja", "en"],
    bestFor: "Patients who need structured expectations before booking a laser program.",
    includes: ["Photo-based pre-screen", "Laser plan estimate", "Downtime guidance", "Provider quote comparison"],
    complianceNote: "Improvement level cannot be guaranteed; provider review is required.",
  },
  {
    id: "tw-skin-01",
    title: "K-Beauty Premium Skin Package",
    shortTitle: "Premium skin",
    market: "taiwan",
    treatmentSlug: "skin-booster",
    priceMinUsd: 900,
    priceMaxUsd: 1800,
    durationDays: 2,
    recoveryWindow: "1-3 days",
    coordinatorLanguages: ["en", "ja", "zh"],
    bestFor: "Taiwan travelers comparing premium Korean dermatology programs.",
    includes: ["Clinic shortlist", "Skin booster or toning quote", "Travel-window matching", "English coordinator"],
    complianceNote: "Traditional Chinese content support should be confirmed during consultation.",
  },
  {
    id: "tw-skin-02",
    title: "3-Day Skin and Recovery Add-On",
    shortTitle: "3-day recovery",
    market: "taiwan",
    treatmentSlug: "recovery-care",
    priceMinUsd: 1500,
    priceMaxUsd: 3000,
    durationDays: 3,
    recoveryWindow: "0-3 days",
    coordinatorLanguages: ["en", "ja", "zh"],
    bestFor: "Patients who want treatment scheduling plus recovery and concierge options.",
    includes: ["Skin treatment estimate", "Recovery care option", "Non-medical fee separation", "Deposit-ready schedule"],
    complianceNote: "Medical and non-medical fees are quoted separately before deposit.",
  },
];

export const SKIN_LANDING_PAGES: SkinLandingPage[] = [
  {
    locale: "en",
    slug: "korea-skin-clinic-gangnam",
    market: "japan",
    intent: "Korea skin clinic Gangnam",
    title: "Compare verified Gangnam skin clinics before you fly",
    subtitle:
      "A coordinator-led quote flow for Japanese and Taiwan patients seeking transparent skin package estimates in Seoul.",
    searchTheme: "Gangnam clinic comparison",
    cta: "Get matched skin quotes",
    secondaryCta: "View skin packages",
    packageIds: ["jp-skin-01", "jp-skin-02", "tw-skin-01"],
  },
  {
    locale: "en",
    slug: "korea-laser-toning-package",
    market: "japan",
    intent: "Korea laser toning package",
    title: "Laser toning packages with language-supported coordination",
    subtitle: "Compare low-downtime laser toning estimates, provider response times, and travel windows.",
    searchTheme: "Laser toning package",
    cta: "Request laser quote",
    secondaryCta: "Compare providers",
    packageIds: ["jp-skin-01", "tw-skin-01"],
  },
  {
    locale: "en",
    slug: "korea-skin-booster-package",
    market: "taiwan",
    intent: "Korea skin booster price",
    title: "Skin booster quote matching for Seoul visits",
    subtitle: "See price ranges, recovery windows, verified provider signals, and coordinator next steps.",
    searchTheme: "Skin booster estimate",
    cta: "Request booster estimate",
    secondaryCta: "See packages",
    packageIds: ["jp-skin-02", "tw-skin-01"],
  },
  {
    locale: "en",
    slug: "seoul-anti-aging-skin-package",
    market: "japan",
    intent: "Seoul anti-aging treatment",
    title: "Anti-aging skin packages planned around short Seoul stays",
    subtitle: "Match your dates, budget, and language needs with provider quote options before booking.",
    searchTheme: "Anti-aging weekend",
    cta: "Plan my Seoul skin trip",
    secondaryCta: "Start consultation",
    packageIds: ["jp-skin-02", "tw-skin-02"],
  },
  {
    locale: "en",
    slug: "korea-acne-scar-laser-package",
    market: "japan",
    intent: "Korea acne scar laser",
    title: "Acne scar laser planning without unclear price surprises",
    subtitle: "Submit goals and photos later; receive structured provider estimates and downtime guidance.",
    searchTheme: "Acne scar laser",
    cta: "Ask a coordinator",
    secondaryCta: "Review package",
    packageIds: ["jp-skin-03"],
  },
  {
    locale: "jp",
    slug: "korea-skin-clinic-gangnam",
    market: "japan",
    intent: "韓国 皮膚科 江南",
    title: "渡航前に江南の皮膚科パッケージを比較",
    subtitle: "登録・確認済みの医療機関、価格帯、言語対応、日程をコーディネーターが整理します。",
    searchTheme: "江南皮膚科比較",
    cta: "見積もり相談",
    secondaryCta: "パッケージを見る",
    packageIds: ["jp-skin-01", "jp-skin-02", "jp-skin-03"],
  },
  {
    locale: "jp",
    slug: "korea-laser-toning-package",
    market: "japan",
    intent: "韓国 レーザートーニング",
    title: "韓国レーザートーニングの価格帯と日程を確認",
    subtitle: "短期滞在向けに、回復期間・対応言語・見積もり条件を事前に比較できます。",
    searchTheme: "レーザートーニング",
    cta: "料金相談",
    secondaryCta: "医療機関を比較",
    packageIds: ["jp-skin-01"],
  },
  {
    locale: "jp",
    slug: "korea-skin-booster-package",
    market: "japan",
    intent: "韓国 スキンブースター",
    title: "スキンブースターの見積もりを渡航前に整理",
    subtitle: "医師確認が必要な施術は、適応・価格・注意事項を確認してから予約へ進みます。",
    searchTheme: "スキンブースター",
    cta: "相談する",
    secondaryCta: "流れを見る",
    packageIds: ["jp-skin-02", "tw-skin-01"],
  },
  {
    locale: "jp",
    slug: "seoul-anti-aging-skin-package",
    market: "japan",
    intent: "ソウル アンチエイジング",
    title: "週末ソウル滞在に合わせたアンチエイジング肌治療",
    subtitle: "予算、希望日、言語、回復期間をもとに候補医療機関を絞り込みます。",
    searchTheme: "アンチエイジング",
    cta: "日程相談",
    secondaryCta: "無料相談へ",
    packageIds: ["jp-skin-02", "tw-skin-02"],
  },
  {
    locale: "jp",
    slug: "korea-acne-scar-laser-package",
    market: "japan",
    intent: "韓国 ニキビ跡 レーザー",
    title: "ニキビ跡レーザー治療の候補を比較",
    subtitle: "効果を保証する表現ではなく、医療機関ごとの見積もりと回復目安を確認します。",
    searchTheme: "ニキビ跡レーザー",
    cta: "クリニック比較",
    secondaryCta: "相談フォーム",
    packageIds: ["jp-skin-03"],
  },
];

export function getSkinPackageById(id: string) {
  return SKIN_PACKAGE_SKUS.find((item) => item.id === id);
}

export function getSkinLandingPage(locale: string | undefined, slug: string | undefined) {
  return SKIN_LANDING_PAGES.find((page) => page.locale === locale && page.slug === slug);
}

export function formatUsdRange(min: number, max: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} - ${formatter.format(max)}`;
}
