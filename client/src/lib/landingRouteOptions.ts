export const LANDING_MARKET_OPTIONS = [
  {
    code: "global",
    labelKo: "글로벌",
    description: "특정 국가 제한 없이 공통 수요를 테스트합니다.",
  },
  {
    code: "anglophone",
    labelKo: "영미권",
    description:
      "미국, 캐나다, 호주, 싱가포르, 필리핀 등 영어 상담 수요입니다.",
  },
  {
    code: "sinosphere",
    labelKo: "중화권",
    description: "중국 본토, 홍콩, 마카오, 화교권 수요를 포함합니다.",
  },
  {
    code: "japan",
    labelKo: "일어권",
    description: "일본어 검색 수요와 일본 환자 여정을 대상으로 합니다.",
  },
  {
    code: "taiwan",
    labelKo: "대만",
    description: "대만 번체 중국어 및 대만 여행 환자 수요입니다.",
  },
  {
    code: "southeast_asia",
    labelKo: "동남아권",
    description: "태국, 베트남, 인도네시아, 말레이시아, 필리핀 수요입니다.",
  },
  {
    code: "middle_east",
    labelKo: "중동권",
    description: "아랍어권과 걸프 지역 의료관광 수요를 포함합니다.",
  },
  {
    code: "cis",
    labelKo: "러시아/CIS권",
    description: "러시아어권 및 CIS 국가 의료관광 수요입니다.",
  },
  {
    code: "central_asia",
    labelKo: "중앙아시아/몽골권",
    description: "몽골, 우즈베키스탄, 카자흐스탄 등 한국 방문 수요입니다.",
  },
] as const;

export type WedgeMarket = (typeof LANDING_MARKET_OPTIONS)[number]["code"];

export const LANDING_LOCALE_OPTIONS = [
  {
    code: "ko",
    labelKo: "한국어",
    nativeName: "한국어",
    defaultMarket: "global",
    direction: "ltr",
  },
  {
    code: "en",
    labelKo: "영어",
    nativeName: "English",
    defaultMarket: "anglophone",
    direction: "ltr",
  },
  {
    code: "jp",
    labelKo: "일본어",
    nativeName: "日本語",
    defaultMarket: "japan",
    direction: "ltr",
  },
  {
    code: "zh-cn",
    labelKo: "중국어 간체",
    nativeName: "简体中文",
    defaultMarket: "sinosphere",
    direction: "ltr",
  },
  {
    code: "zh-tw",
    labelKo: "중국어 번체",
    nativeName: "繁體中文",
    defaultMarket: "taiwan",
    direction: "ltr",
  },
  {
    code: "th",
    labelKo: "태국어",
    nativeName: "ไทย",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "vi",
    labelKo: "베트남어",
    nativeName: "Tiếng Việt",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "id",
    labelKo: "인도네시아어",
    nativeName: "Bahasa Indonesia",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "ms",
    labelKo: "말레이어",
    nativeName: "Bahasa Melayu",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "fil",
    labelKo: "필리핀어",
    nativeName: "Filipino",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "ar",
    labelKo: "아랍어",
    nativeName: "العربية",
    defaultMarket: "middle_east",
    direction: "rtl",
  },
  {
    code: "ru",
    labelKo: "러시아어",
    nativeName: "Русский",
    defaultMarket: "cis",
    direction: "ltr",
  },
  {
    code: "mn",
    labelKo: "몽골어",
    nativeName: "Монгол",
    defaultMarket: "central_asia",
    direction: "ltr",
  },
  {
    code: "uz",
    labelKo: "우즈베크어",
    nativeName: "Oʻzbekcha",
    defaultMarket: "central_asia",
    direction: "ltr",
  },
  {
    code: "kk",
    labelKo: "카자흐어",
    nativeName: "Қазақша",
    defaultMarket: "central_asia",
    direction: "ltr",
  },
] as const satisfies readonly {
  code: string;
  labelKo: string;
  nativeName: string;
  defaultMarket: WedgeMarket;
  direction: "ltr" | "rtl";
}[];

export type LandingLocale = (typeof LANDING_LOCALE_OPTIONS)[number]["code"];

export function getDefaultMarketForLocale(locale: string): WedgeMarket {
  return (
    LANDING_LOCALE_OPTIONS.find(option => option.code === locale)
      ?.defaultMarket ?? "global"
  );
}

export function getLandingLocaleOption(locale: string) {
  return LANDING_LOCALE_OPTIONS.find(option => option.code === locale);
}

export function getLandingMarketOption(market: string) {
  return LANDING_MARKET_OPTIONS.find(option => option.code === market);
}
