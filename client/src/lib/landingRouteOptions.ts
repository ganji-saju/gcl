export const LANDING_MARKET_OPTIONS = [
  {
    code: "global",
    labelKo: "글로벌",
    description: "국가 제한 없이 전 세계 검색 수요를 테스트합니다.",
  },
  {
    code: "anglophone",
    labelKo: "영미권",
    description: "미국, 캐나다, 영국, 호주 등 영어권 시장입니다.",
  },
  {
    code: "sinosphere",
    labelKo: "중화권",
    description: "중국어 사용자권, 화교권, 홍콩/마카오 수요를 포함합니다.",
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
    description: "태국, 베트남, 인도네시아, 말레이시아 등 동남아 시장입니다.",
  },
  {
    code: "middle_east",
    labelKo: "중동권",
    description: "아랍어권, 걸프, 터키, 페르시아어권 수요를 포함합니다.",
  },
  {
    code: "cis",
    labelKo: "러시아/CIS권",
    description: "러시아어권 및 CIS 국가 의료관광 수요입니다.",
  },
  {
    code: "europe",
    labelKo: "유럽권",
    description: "서유럽, 북유럽, 남유럽 언어권 테스트 시장입니다.",
  },
  {
    code: "latin_america",
    labelKo: "라틴아메리카권",
    description: "스페인어/포르투갈어권 미주 시장입니다.",
  },
  {
    code: "south_asia",
    labelKo: "남아시아권",
    description: "인도, 파키스탄, 방글라데시 등 남아시아권입니다.",
  },
  {
    code: "central_asia",
    labelKo: "중앙아시아권",
    description: "몽골, 카자흐스탄, 우즈베키스탄 등 중앙아시아 수요입니다.",
  },
  {
    code: "northeast_asia",
    labelKo: "동북아권",
    description: "한국어권과 동북아 인접 시장을 분리 테스트합니다.",
  },
  {
    code: "oceania",
    labelKo: "오세아니아권",
    description: "호주, 뉴질랜드 및 태평양 지역 영어권 수요입니다.",
  },
  {
    code: "africa",
    labelKo: "아프리카권",
    description: "아프리카 주요 도시권과 프랑스어/영어/아랍어권 수요입니다.",
  },
] as const;

export type WedgeMarket = (typeof LANDING_MARKET_OPTIONS)[number]["code"];

export const LANDING_LOCALE_OPTIONS = [
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
    code: "zh",
    labelKo: "중국어",
    nativeName: "中文",
    defaultMarket: "sinosphere",
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
    code: "ko",
    labelKo: "한국어",
    nativeName: "한국어",
    defaultMarket: "northeast_asia",
    direction: "ltr",
  },
  {
    code: "es",
    labelKo: "스페인어",
    nativeName: "Español",
    defaultMarket: "latin_america",
    direction: "ltr",
  },
  {
    code: "pt",
    labelKo: "포르투갈어",
    nativeName: "Português",
    defaultMarket: "latin_america",
    direction: "ltr",
  },
  {
    code: "fr",
    labelKo: "프랑스어",
    nativeName: "Français",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "de",
    labelKo: "독일어",
    nativeName: "Deutsch",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "it",
    labelKo: "이탈리아어",
    nativeName: "Italiano",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "nl",
    labelKo: "네덜란드어",
    nativeName: "Nederlands",
    defaultMarket: "europe",
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
    code: "hi",
    labelKo: "힌디어",
    nativeName: "हिन्दी",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "bn",
    labelKo: "벵골어",
    nativeName: "বাংলা",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "ur",
    labelKo: "우르두어",
    nativeName: "اردو",
    defaultMarket: "south_asia",
    direction: "rtl",
  },
  {
    code: "tr",
    labelKo: "튀르키예어",
    nativeName: "Türkçe",
    defaultMarket: "middle_east",
    direction: "ltr",
  },
  {
    code: "fa",
    labelKo: "페르시아어",
    nativeName: "فارسی",
    defaultMarket: "middle_east",
    direction: "rtl",
  },
  {
    code: "mn",
    labelKo: "몽골어",
    nativeName: "Монгол",
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
  {
    code: "uz",
    labelKo: "우즈베크어",
    nativeName: "Oʻzbekcha",
    defaultMarket: "central_asia",
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
    code: "my",
    labelKo: "미얀마어",
    nativeName: "မြန်မာစာ",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "km",
    labelKo: "크메르어",
    nativeName: "ភាសាខ្មែរ",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "lo",
    labelKo: "라오어",
    nativeName: "ພາສາລາວ",
    defaultMarket: "southeast_asia",
    direction: "ltr",
  },
  {
    code: "ne",
    labelKo: "네팔어",
    nativeName: "नेपाली",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "si",
    labelKo: "싱할라어",
    nativeName: "සිංහල",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "ta",
    labelKo: "타밀어",
    nativeName: "தமிழ்",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "te",
    labelKo: "텔루구어",
    nativeName: "తెలుగు",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "mr",
    labelKo: "마라티어",
    nativeName: "मराठी",
    defaultMarket: "south_asia",
    direction: "ltr",
  },
  {
    code: "he",
    labelKo: "히브리어",
    nativeName: "עברית",
    defaultMarket: "middle_east",
    direction: "rtl",
  },
  {
    code: "pl",
    labelKo: "폴란드어",
    nativeName: "Polski",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "uk",
    labelKo: "우크라이나어",
    nativeName: "Українська",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "ro",
    labelKo: "루마니아어",
    nativeName: "Română",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "cs",
    labelKo: "체코어",
    nativeName: "Čeština",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "sv",
    labelKo: "스웨덴어",
    nativeName: "Svenska",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "da",
    labelKo: "덴마크어",
    nativeName: "Dansk",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "fi",
    labelKo: "핀란드어",
    nativeName: "Suomi",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "no",
    labelKo: "노르웨이어",
    nativeName: "Norsk",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "el",
    labelKo: "그리스어",
    nativeName: "Ελληνικά",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "hu",
    labelKo: "헝가리어",
    nativeName: "Magyar",
    defaultMarket: "europe",
    direction: "ltr",
  },
  {
    code: "sw",
    labelKo: "스와힐리어",
    nativeName: "Kiswahili",
    defaultMarket: "africa",
    direction: "ltr",
  },
  {
    code: "am",
    labelKo: "암하라어",
    nativeName: "አማርኛ",
    defaultMarket: "africa",
    direction: "ltr",
  },
  {
    code: "ha",
    labelKo: "하우사어",
    nativeName: "Hausa",
    defaultMarket: "africa",
    direction: "ltr",
  },
  {
    code: "yo",
    labelKo: "요루바어",
    nativeName: "Yorùbá",
    defaultMarket: "africa",
    direction: "ltr",
  },
  {
    code: "zu",
    labelKo: "줄루어",
    nativeName: "IsiZulu",
    defaultMarket: "africa",
    direction: "ltr",
  },
  {
    code: "af",
    labelKo: "아프리칸스어",
    nativeName: "Afrikaans",
    defaultMarket: "africa",
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
