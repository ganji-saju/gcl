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
    bestFor: "Short Seoul beauty trips and first-time Korea skin clinic visitors from Japan.",
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
    bestFor: "Japanese patients comparing hydration, texture, and early anti-aging options.",
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
    title: "Taiwan Traveler Premium Skin Package",
    shortTitle: "Premium skin",
    market: "taiwan",
    treatmentSlug: "skin-booster",
    priceMinUsd: 900,
    priceMaxUsd: 1800,
    durationDays: 2,
    recoveryWindow: "1-3 days",
    coordinatorLanguages: ["en", "zh"],
    bestFor: "Taiwan travelers comparing premium Korean dermatology programs through an English quote flow.",
    includes: ["Clinic shortlist", "Skin booster or toning quote", "Travel-window matching", "English coordinator"],
    complianceNote: "Traditional Chinese support is captured as an operating requirement, not a live landing locale in v1.",
  },
  {
    id: "tw-skin-02",
    title: "Taiwan 3-Day Skin and Recovery Add-On",
    shortTitle: "3-day recovery",
    market: "taiwan",
    treatmentSlug: "recovery-care",
    priceMinUsd: 1500,
    priceMaxUsd: 3000,
    durationDays: 3,
    recoveryWindow: "0-3 days",
    coordinatorLanguages: ["en", "zh"],
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
      "A coordinator-led quote flow for Japan and Taiwan patients seeking transparent skin package estimates in Seoul.",
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
    intent: "韓国 江南 皮膚科 比較",
    title: "渡航前に江南の認証済み皮膚科を比較",
    subtitle:
      "日本在住の患者向けに、価格帯、対応言語、予約可能日、登録状況を確認してから見積もりへ進める相談フローです。",
    searchTheme: "江南クリニック比較",
    cta: "皮膚科見積もりを依頼",
    secondaryCta: "パッケージを見る",
    packageIds: ["jp-skin-01", "jp-skin-02", "jp-skin-03"],
  },
  {
    locale: "jp",
    slug: "korea-laser-toning-package",
    market: "japan",
    intent: "韓国 レーザートーニング パッケージ",
    title: "韓国レーザートーニングを短期滞在向けに比較",
    subtitle:
      "ダウンタイム、概算価格、対応言語、見積もり返信SLAを確認し、コーディネーターが候補クリニックを整理します。",
    searchTheme: "レーザートーニング",
    cta: "レーザー見積もりを依頼",
    secondaryCta: "医院を比較",
    packageIds: ["jp-skin-01"],
  },
  {
    locale: "jp",
    slug: "korea-skin-booster-package",
    market: "japan",
    intent: "韓国 スキンブースター 価格",
    title: "スキンブースターの概算価格と予約条件を確認",
    subtitle:
      "施術適合性は医療機関の確認が必要です。まずは予算、日程、希望内容をもとに候補と見積もり条件を整理します。",
    searchTheme: "スキンブースター見積もり",
    cta: "ブースター見積もりを依頼",
    secondaryCta: "パッケージを見る",
    packageIds: ["jp-skin-02"],
  },
  {
    locale: "jp",
    slug: "seoul-anti-aging-skin-package",
    market: "japan",
    intent: "ソウル アンチエイジング 皮膚科",
    title: "週末ソウル滞在に合わせたアンチエイジング肌管理",
    subtitle:
      "短期滞在でも比較しやすいように、医療費と非医療費を分けて提示し、予約前にキャンセル条件を確認します。",
    searchTheme: "週末アンチエイジング",
    cta: "ソウル肌管理を相談",
    secondaryCta: "相談を開始",
    packageIds: ["jp-skin-02"],
  },
  {
    locale: "jp",
    slug: "korea-acne-scar-laser-package",
    market: "japan",
    intent: "韓国 ニキビ跡 レーザー",
    title: "ニキビ跡レーザーの計画を価格不透明なまま進めない",
    subtitle:
      "写真や詳細情報は必要段階で確認します。効果を保証せず、候補医院の見積もり、通院回数、ダウンタイムを整理します。",
    searchTheme: "ニキビ跡レーザー",
    cta: "コーディネーターに相談",
    secondaryCta: "パッケージを確認",
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
