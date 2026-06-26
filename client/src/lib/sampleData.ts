export type Specialty =
  | "plastic_surgery"
  | "dermatology"
  | "dental"
  | "hair"
  | "wellness";
export type Region =
  | "gangnam"
  | "seongsu"
  | "hongdae"
  | "sinchon"
  | "bundang"
  | "other";
export type LanguageCode =
  | "en"
  | "ko"
  | "zh"
  | "ja"
  | "ar"
  | "th"
  | "vi"
  | "ru";

export interface Hospital {
  id: number | string;
  slug: string;
  nameEn: string;
  nameKo: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descriptionEn: string;
  descriptionKo: string;
  descriptionZh: string;
  descriptionJa: string;
  descriptionAr: string;
  specialty: Specialty;
  region: Region;
  addressEn: string;
  phone: string;
  website?: string;
  rating: number;
  reviewCount: number;
  coverImage: string;
  images: string[];
  languages: LanguageCode[];
  certifications: string[];
  featured: boolean;
  latitude: number;
  longitude: number;
  specialties: string[];
  highlights: string[];
  priceTier: "$" | "$$" | "$$$";
  registrationStatus: "verified" | "pending" | "expired";
  registrationLabel: string;
  insuranceVerified: boolean;
  responseSlaHours: number;
  packagePriceMinUsd: number;
  packagePriceMaxUsd: number;
  internationalPatientReady: boolean;
}

export interface Treatment {
  id: number;
  slug: string;
  category: Specialty;
  nameEn: string;
  nameKo: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descriptionEn: string;
  descriptionKo: string;
  descriptionZh: string;
  descriptionJa: string;
  descriptionAr: string;
  priceMin: number;
  priceMax: number;
  currency: "KRW";
  recoveryDays: number;
  durationMinutes: number;
  precautionsEn: string;
  coverImage: string;
  popular: boolean;
}

export interface Doctor {
  id: number;
  hospitalId: number | string;
  nameEn: string;
  nameKo: string;
  titleEn: string;
  specialtyEn: string;
  bioEn: string;
  photo?: string;
  yearsExperience: number;
}

export interface HospitalTreatment {
  id: number;
  hospitalId: number | string;
  treatmentId: number;
  priceKrw: number;
  notes: string;
  available: boolean;
}

export const SPECIALTY_LABELS: Record<
  Specialty,
  { en: string; short: string; color: string }
> = {
  plastic_surgery: {
    en: "Plastic Surgery",
    short: "Surgery",
    color: "bg-coral-50 text-coral-800 border-coral-200",
  },
  dermatology: {
    en: "Dermatology",
    short: "Skin",
    color: "bg-teal-50 text-teal-800 border-teal-200",
  },
  dental: {
    en: "Dental",
    short: "Dental",
    color: "bg-ink-50 text-ink-700 border-ink-200",
  },
  hair: {
    en: "Hair Restoration",
    short: "Hair",
    color: "bg-coral-50 text-coral-800 border-coral-200",
  },
  wellness: {
    en: "Wellness Checkup",
    short: "Wellness",
    color: "bg-teal-50 text-teal-800 border-teal-200",
  },
};

export const REGION_LABELS: Record<Region, string> = {
  gangnam: "Gangnam",
  seongsu: "Seongsu",
  hongdae: "Hongdae",
  sinchon: "Sinchon",
  bundang: "Bundang",
  other: "Other Seoul",
};

export const LANGUAGE_LABELS: Record<
  LanguageCode,
  { label: string; flag: string }
> = {
  en: { label: "English", flag: "EN" },
  ko: { label: "Korean", flag: "KO" },
  zh: { label: "Chinese", flag: "ZH" },
  ja: { label: "Japanese", flag: "JA" },
  ar: { label: "Arabic", flag: "AR" },
  th: { label: "Thai", flag: "TH" },
  vi: { label: "Vietnamese", flag: "VI" },
  ru: { label: "Russian", flag: "RU" },
};

export const SPECIALTY_TRANSLATION_KEYS: Record<Specialty, string> = {
  plastic_surgery: "cat.plastic",
  dermatology: "cat.dermatology",
  dental: "cat.dental",
  hair: "cat.hair",
  wellness: "cat.wellness",
};

const clinicExterior =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=85&auto=format&fit=crop";
const doctorConsult =
  "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=85&auto=format&fit=crop";
const skinCare =
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=85&auto=format&fit=crop";
const dentalCare =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=85&auto=format&fit=crop";
const hairCare =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=85&auto=format&fit=crop";
const checkupCare =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=85&auto=format&fit=crop";

export const SAMPLE_HOSPITALS: Hospital[] = [
  {
    id: 1,
    slug: "aura-facial-institute",
    nameEn: "Aura Facial Institute",
    nameKo: "아우라 페이셜 인스티튜트",
    nameZh: "Aura面部研究院",
    nameJa: "Auraフェイシャル研究院",
    nameAr: "معهد أورا للوجه",
    descriptionEn:
      "A Seoul facial surgery center focused on rhinoplasty, eyelid surgery, and facial contouring for international patients. Coordinators prepare translation, imaging, and quote comparisons before arrival.",
    descriptionKo:
      "서울 강남의 안면 성형 센터로 코성형, 눈성형, 윤곽 수술 상담에 강점이 있습니다. 해외 환자 방문 전 번역, 영상 자료, 견적 비교를 코디네이터가 준비합니다.",
    descriptionZh:
      "位于首尔的面部整形中心，重点提供隆鼻、眼部手术和面部轮廓咨询。协调员会在患者抵达前准备翻译、影像资料和报价比较。",
    descriptionJa:
      "ソウルの顔専門美容外科センターです。鼻整形、目元手術、輪郭形成を中心に、渡航前から翻訳、画像資料、見積もり比較をコーディネーターが準備します。",
    descriptionAr:
      "مركز جراحة وجه في سيول يركز على تجميل الأنف وجراحة الجفون وتحديد ملامح الوجه للمرضى الدوليين. يجهز المنسقون الترجمة والصور ومقارنات الأسعار قبل الوصول.",
    specialty: "plastic_surgery",
    region: "gangnam",
    addressEn: "92 Apgujeong-ro, Gangnam-gu, Seoul",
    phone: "+82-2-3496-9900",
    website: "https://example.com/aura",
    rating: 4.9,
    reviewCount: 2847,
    coverImage: clinicExterior,
    images: [clinicExterior, doctorConsult, checkupCare],
    languages: ["en", "ko", "zh", "ja", "ar", "th"],
    certifications: [
      "KAHF foreign patient care",
      "Board-certified surgeons",
      "Dedicated interpreter desk",
    ],
    featured: true,
    latitude: 37.5244,
    longitude: 127.0415,
    specialties: [
      "Rhinoplasty",
      "Double eyelid",
      "Facial contouring",
      "Revision surgery",
    ],
    highlights: [
      "3D imaging review",
      "Airport pickup option",
      "Post-op hotel nurse visit",
    ],
    priceTier: "$$$",
    registrationStatus: "verified",
    registrationLabel: "Foreign-patient registration checked",
    insuranceVerified: true,
    responseSlaHours: 12,
    packagePriceMinUsd: 2800,
    packagePriceMaxUsd: 9000,
    internationalPatientReady: true,
  },
  {
    id: 2,
    slug: "lumen-skin-center",
    nameEn: "Lumen Skin Center",
    nameKo: "루멘 스킨 센터",
    nameZh: "Lumen皮肤中心",
    nameJa: "ルーメン皮膚センター",
    nameAr: "مركز لومين للبشرة",
    descriptionEn:
      "A dermatology and aesthetic medicine center known for laser toning, acne scar programs, injectables, and recovery-light treatments designed for short-stay visitors.",
    descriptionKo:
      "레이저 토닝, 여드름 흉터, 주사 시술, 회복 부담이 낮은 피부 프로그램을 제공하는 피부·에스테틱 센터입니다. 짧은 체류 일정에 맞춘 패키지 상담이 가능합니다.",
    descriptionZh:
      "皮肤科与医美中心，擅长激光调色、痘疤项目、注射类治疗和低恢复期方案，适合短暂停留的访韩患者。",
    descriptionJa:
      "レーザートーニング、ニキビ跡、注入治療、ダウンタイムの少ない皮膚プログラムに強い皮膚・美容医療センターです。短期滞在に合わせた相談が可能です。",
    descriptionAr:
      "مركز جلدية وتجميل معروف بتوحيد لون البشرة بالليزر وبرامج آثار حب الشباب والحقن والعلاجات الخفيفة التعافي المناسبة للزيارات القصيرة.",
    specialty: "dermatology",
    region: "gangnam",
    addressEn: "521 Gangnam-daero, Gangnam-gu, Seoul",
    phone: "+82-2-511-7007",
    website: "https://example.com/lumen",
    rating: 4.8,
    reviewCount: 1562,
    coverImage: skinCare,
    images: [skinCare, checkupCare],
    languages: ["en", "ko", "zh", "ja", "vi"],
    certifications: [
      "Korean Dermatological Association",
      "Laser safety protocol",
      "Medical-grade skincare",
    ],
    featured: true,
    latitude: 37.5065,
    longitude: 127.0495,
    specialties: [
      "Laser toning",
      "Skin booster",
      "Acne scar",
      "Botox and filler",
    ],
    highlights: [
      "Same-day consult",
      "Low downtime plans",
      "Aftercare kit included",
    ],
    priceTier: "$$",
    registrationStatus: "verified",
    registrationLabel: "Foreign-patient registration checked",
    insuranceVerified: true,
    responseSlaHours: 6,
    packagePriceMinUsd: 700,
    packagePriceMaxUsd: 2600,
    internationalPatientReady: true,
  },
  {
    id: 3,
    slug: "seoul-dental-design",
    nameEn: "Seoul Dental Design",
    nameKo: "서울 덴탈 디자인",
    nameZh: "首尔牙科设计",
    nameJa: "ソウルデンタルデザイン",
    nameAr: "سيول لتصميم الأسنان",
    descriptionEn:
      "A cosmetic and restorative dental clinic offering veneers, implants, whitening, and smile-design packages for patients who need predictable timelines.",
    descriptionKo:
      "라미네이트, 임플란트, 미백, 스마일 디자인 패키지를 제공하는 심미·보철 치과입니다. 방문 횟수와 치료 일정을 예측해야 하는 해외 환자에게 적합합니다.",
    descriptionZh:
      "提供贴面、种植、牙齿美白和微笑设计套餐的美容修复牙科，适合需要明确就诊时间线的海外患者。",
    descriptionJa:
      "ベニア、インプラント、ホワイトニング、スマイルデザインを提供する審美・補綴歯科です。通院回数と日程を事前に把握したい海外患者に適しています。",
    descriptionAr:
      "عيادة أسنان تجميلية وترميمية تقدم القشور والزراعة والتبييض وباقات تصميم الابتسامة للمرضى الذين يحتاجون إلى جدول زمني واضح.",
    specialty: "dental",
    region: "sinchon",
    addressEn: "55 Yonsei-ro, Seodaemun-gu, Seoul",
    phone: "+82-2-333-2882",
    website: "https://example.com/dental-design",
    rating: 4.7,
    reviewCount: 987,
    coverImage: dentalCare,
    images: [dentalCare, doctorConsult],
    languages: ["en", "ko", "zh", "ja"],
    certifications: [
      "Korean Dental Association",
      "Digital smile design",
      "Implant planning lab",
    ],
    featured: true,
    latitude: 37.5596,
    longitude: 126.9368,
    specialties: [
      "Porcelain veneers",
      "Dental implants",
      "Whitening",
      "Invisalign",
    ],
    highlights: [
      "Digital preview",
      "Multi-visit scheduling",
      "Warranty documentation",
    ],
    priceTier: "$$",
    registrationStatus: "verified",
    registrationLabel: "Foreign-patient registration checked",
    insuranceVerified: true,
    responseSlaHours: 18,
    packagePriceMinUsd: 900,
    packagePriceMaxUsd: 4200,
    internationalPatientReady: true,
  },
  {
    id: 4,
    slug: "rootline-hair-clinic",
    nameEn: "Rootline Hair Clinic",
    nameKo: "루트라인 헤어 클리닉",
    nameZh: "Rootline植发中心",
    nameJa: "ルートライン植毛クリニック",
    nameAr: "عيادة روتلاين للشعر",
    descriptionEn:
      "A hair restoration clinic providing FUE, DHI, scalp care, and PRP programs with multilingual pre-screening for international patients.",
    descriptionKo:
      "FUE, DHI, 두피 케어, PRP 프로그램을 제공하는 모발이식 클리닉입니다. 해외 환자를 위해 다국어 사전 사진 검토와 이식 모수 상담을 진행합니다.",
    descriptionZh:
      "提供FUE、DHI、头皮护理和PRP项目的植发诊所，为国际患者提供多语言术前照片评估。",
    descriptionJa:
      "FUE、DHI、頭皮ケア、PRPを提供する植毛クリニックです。海外患者向けに多言語で事前写真レビューと株数相談を行います。",
    descriptionAr:
      "عيادة لاستعادة الشعر تقدم FUE وDHI وعناية بفروة الرأس وبرامج PRP مع فرز أولي متعدد اللغات للمرضى الدوليين.",
    specialty: "hair",
    region: "seongsu",
    addressEn: "212 Seongsui-ro, Seongdong-gu, Seoul",
    phone: "+82-2-555-7979",
    website: "https://example.com/rootline",
    rating: 4.8,
    reviewCount: 1234,
    coverImage: hairCare,
    images: [hairCare, clinicExterior],
    languages: ["en", "ko", "ar", "zh", "ru"],
    certifications: [
      "Hair restoration society member",
      "Microscope graft audit",
      "Remote follow-up",
    ],
    featured: false,
    latitude: 37.5446,
    longitude: 127.0557,
    specialties: [
      "FUE transplant",
      "DHI method",
      "Scalp treatment",
      "PRP hair program",
    ],
    highlights: [
      "Graft estimate review",
      "Photo follow-up",
      "Medication guidance",
    ],
    priceTier: "$$",
    registrationStatus: "pending",
    registrationLabel: "Registration evidence under review",
    insuranceVerified: true,
    responseSlaHours: 24,
    packagePriceMinUsd: 2500,
    packagePriceMaxUsd: 7800,
    internationalPatientReady: false,
  },
  {
    id: 5,
    slug: "han-river-checkup",
    nameEn: "Han River Checkup Lounge",
    nameKo: "한강 검진 라운지",
    nameZh: "汉江体检中心",
    nameJa: "漢江健診ラウンジ",
    nameAr: "صالة فحص نهر هان",
    descriptionEn:
      "A preventive health and executive checkup center bundling imaging, lab tests, digestive endoscopy, and physician summaries for travel-friendly schedules.",
    descriptionKo:
      "영상검사, 혈액검사, 소화기 내시경, 의사 소견 요약을 여행 일정에 맞춰 구성하는 예방 검진·프리미엄 건강검진 센터입니다.",
    descriptionZh:
      "预防医学与高端体检中心，将影像、实验室检查、消化内镜和医生摘要整合为适合旅行日程的套餐。",
    descriptionJa:
      "画像検査、血液検査、消化器内視鏡、医師サマリーを旅行日程に合わせて組み合わせる予防医療・エグゼクティブ健診センターです。",
    descriptionAr:
      "مركز فحوصات وقائية وتنفيذية يجمع التصوير والتحاليل ومناظير الجهاز الهضمي وملخصات الطبيب ضمن جدول مناسب للسفر.",
    specialty: "wellness",
    region: "gangnam",
    addressEn: "317 Teheran-ro, Gangnam-gu, Seoul",
    phone: "+82-2-6200-4000",
    website: "https://example.com/checkup",
    rating: 4.9,
    reviewCount: 842,
    coverImage: checkupCare,
    images: [checkupCare, clinicExterior],
    languages: ["en", "ko", "zh", "ja", "ar"],
    certifications: [
      "International checkup desk",
      "Digital report package",
      "Dietary translation",
    ],
    featured: false,
    latitude: 37.5037,
    longitude: 127.0447,
    specialties: [
      "Executive checkup",
      "Digestive endoscopy",
      "Cancer screening",
      "Imaging",
    ],
    highlights: [
      "One-day itinerary",
      "English summary",
      "Hotel report delivery",
    ],
    priceTier: "$$$",
    registrationStatus: "verified",
    registrationLabel: "Foreign-patient registration checked",
    insuranceVerified: true,
    responseSlaHours: 12,
    packagePriceMinUsd: 600,
    packagePriceMaxUsd: 2800,
    internationalPatientReady: true,
  },
  {
    id: 6,
    slug: "atelier-recovery-clinic",
    nameEn: "Atelier Recovery Clinic",
    nameKo: "아틀리에 회복 클리닉",
    nameZh: "Atelier恢复护理中心",
    nameJa: "アトリエ回復クリニック",
    nameAr: "عيادة أتيليه للتعافي",
    descriptionEn:
      "A post-procedure recovery and aesthetic wellness clinic supporting swelling care, lymphatic therapy, IV nutrition, and wound-care coordination.",
    descriptionKo:
      "시술 후 부기 관리, 림프 테라피, IV 영양, 상처 관리 코디네이션을 지원하는 회복·웰니스 클리닉입니다.",
    descriptionZh:
      "术后恢复与医美康养中心，支持消肿护理、淋巴疗法、静脉营养和伤口护理协调。",
    descriptionJa:
      "施術後の腫れケア、リンパセラピー、点滴栄養、創傷ケア調整を支援する回復・ウェルネスクリニックです。",
    descriptionAr:
      "عيادة للتعافي والعافية الجمالية بعد الإجراءات، تدعم العناية بالتورم والعلاج اللمفاوي والتغذية الوريدية وتنسيق رعاية الجروح.",
    specialty: "wellness",
    region: "hongdae",
    addressEn: "144 Yanghwa-ro, Mapo-gu, Seoul",
    phone: "+82-2-338-3002",
    website: "https://example.com/recovery",
    rating: 4.6,
    reviewCount: 615,
    coverImage: doctorConsult,
    images: [doctorConsult, skinCare],
    languages: ["en", "ko", "zh", "ja", "th", "vi"],
    certifications: [
      "Recovery nurse network",
      "Post-op transport option",
      "Partner hotel visits",
    ],
    featured: false,
    latitude: 37.5551,
    longitude: 126.9226,
    specialties: [
      "Swelling care",
      "Lymphatic therapy",
      "IV nutrition",
      "Scar management",
    ],
    highlights: [
      "Post-op route planning",
      "Hotel visit option",
      "Daily recovery log",
    ],
    priceTier: "$",
    registrationStatus: "verified",
    registrationLabel: "Foreign-patient registration checked",
    insuranceVerified: true,
    responseSlaHours: 8,
    packagePriceMinUsd: 180,
    packagePriceMaxUsd: 1200,
    internationalPatientReady: true,
  },
];

export const SAMPLE_TREATMENTS: Treatment[] = [
  {
    id: 1,
    slug: "rhinoplasty",
    category: "plastic_surgery",
    nameEn: "Rhinoplasty",
    nameKo: "코성형",
    nameZh: "隆鼻术",
    nameJa: "鼻整形",
    nameAr: "تجميل الأنف",
    descriptionEn:
      "Korean rhinoplasty focuses on balanced, natural-looking changes using implant, cartilage, or revision techniques depending on anatomy and goals.",
    descriptionKo:
      "한국 코성형은 얼굴 균형과 자연스러운 변화를 중시합니다. 해부학적 조건과 목표에 따라 보형물, 자가연골, 재수술 기법을 조합합니다.",
    descriptionZh:
      "韩国隆鼻强调面部平衡与自然变化，会根据鼻部结构和目标选择假体、软骨或修复技术。",
    descriptionJa:
      "韓国の鼻整形は顔全体のバランスと自然な変化を重視します。解剖学的条件と目的に応じてプロテーゼ、軟骨、修正術を組み合わせます。",
    descriptionAr:
      "يركز تجميل الأنف الكوري على التوازن والتغيير الطبيعي باستخدام الغرسات أو الغضاريف أو تقنيات المراجعة حسب البنية والأهداف.",
    priceMin: 3200000,
    priceMax: 9200000,
    currency: "KRW",
    recoveryDays: 14,
    durationMinutes: 150,
    precautionsEn:
      "Avoid heavy exercise for 3 weeks. Do not wear glasses for 6 weeks. Final swelling can take several months.",
    coverImage: doctorConsult,
    popular: true,
  },
  {
    id: 2,
    slug: "double-eyelid",
    category: "plastic_surgery",
    nameEn: "Double Eyelid Surgery",
    nameKo: "쌍꺼풀 수술",
    nameZh: "双眼皮手术",
    nameJa: "二重まぶた手術",
    nameAr: "جراحة الجفن المزدوج",
    descriptionEn:
      "Creates or refines an upper-eyelid crease with incisional or non-incisional approaches, often planned with ptosis or under-eye concerns.",
    descriptionKo:
      "절개 또는 비절개 방식으로 윗눈꺼풀 라인을 만들거나 개선합니다. 눈매교정, 처짐, 눈 밑 고민과 함께 계획되는 경우가 많습니다.",
    descriptionZh:
      "通过切开或非切开方式形成或改善上眼睑褶皱，常与上睑下垂或眼下问题一起规划。",
    descriptionJa:
      "切開または非切開で上まぶたのラインを作成・改善します。眼瞼下垂や目元の悩みと合わせて計画されることがあります。",
    descriptionAr:
      "ينشئ أو يحسن ثنية الجفن العلوي بطرق جراحية أو غير جراحية، وغالبا يخطط مع مشاكل تدلي الجفن أو أسفل العين.",
    priceMin: 900000,
    priceMax: 3600000,
    currency: "KRW",
    recoveryDays: 7,
    durationMinutes: 70,
    precautionsEn:
      "Avoid rubbing eyes for 2 weeks. Stitches are usually removed after 5 to 7 days.",
    coverImage: clinicExterior,
    popular: true,
  },
  {
    id: 3,
    slug: "laser-toning",
    category: "dermatology",
    nameEn: "Laser Toning",
    nameKo: "레이저 토닝",
    nameZh: "激光调色",
    nameJa: "レーザートーニング",
    nameAr: "توحيد لون البشرة بالليزر",
    descriptionEn:
      "A low-downtime laser program for pigmentation, melasma, and overall tone. Multiple sessions are commonly recommended.",
    descriptionKo:
      "색소, 기미, 전체 피부 톤 개선을 목표로 하는 낮은 회복 부담의 레이저 프로그램입니다. 보통 여러 회차가 권장됩니다.",
    descriptionZh:
      "低恢复期激光项目，用于色素、黄褐斑和整体肤色改善。通常建议进行多次治疗。",
    descriptionJa:
      "色素、肝斑、肌全体のトーン改善を目的としたダウンタイムの少ないレーザープログラムです。複数回の施術が一般的です。",
    descriptionAr:
      "برنامج ليزر بفترة تعاف قصيرة للتصبغات والكلف وتوحيد لون البشرة. غالبا ما يوصى بعدة جلسات.",
    priceMin: 160000,
    priceMax: 620000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 35,
    precautionsEn:
      "Use SPF 50+ daily. Avoid direct sun exposure for 1 week after each session.",
    coverImage: skinCare,
    popular: true,
  },
  {
    id: 4,
    slug: "skin-booster",
    category: "dermatology",
    nameEn: "Skin Booster",
    nameKo: "스킨부스터",
    nameZh: "皮肤水光针",
    nameJa: "スキンブースター",
    nameAr: "معزز البشرة",
    descriptionEn:
      "Injectable hydration and skin-quality treatment using HA, PDRN, or collagen-stimulating formulas selected by skin condition.",
    descriptionKo:
      "피부 상태에 따라 HA, PDRN, 콜라겐 자극 성분을 선택해 수분감과 피부 질 개선을 돕는 주사 시술입니다.",
    descriptionZh:
      "根据皮肤状态选择HA、PDRN或胶原刺激配方，通过注射改善水润度和肤质。",
    descriptionJa:
      "肌状態に応じてHA、PDRN、コラーゲン刺激成分を選び、保湿感と肌質改善を目指す注入治療です。",
    descriptionAr:
      "علاج حقن للترطيب وتحسين جودة البشرة باستخدام HA أو PDRN أو تركيبات تحفز الكولاجين حسب حالة الجلد.",
    priceMin: 240000,
    priceMax: 980000,
    currency: "KRW",
    recoveryDays: 1,
    durationMinutes: 40,
    precautionsEn:
      "Small bumps or redness can last 1 to 3 days. Avoid sauna and alcohol for 48 hours.",
    coverImage: skinCare,
    popular: true,
  },
  {
    id: 5,
    slug: "porcelain-veneers",
    category: "dental",
    nameEn: "Porcelain Veneers",
    nameKo: "세라믹 베니어",
    nameZh: "瓷贴面",
    nameJa: "セラミックベニア",
    nameAr: "قشور خزفية",
    descriptionEn:
      "A cosmetic dental treatment that redesigns tooth shape and shade using custom ceramic veneers planned from digital previews.",
    descriptionKo:
      "디지털 미리보기를 바탕으로 맞춤 세라믹 베니어를 제작해 치아 형태와 색상을 개선하는 심미 치과 시술입니다.",
    descriptionZh:
      "基于数字预览定制陶瓷贴面，改善牙齿形态和颜色的美容牙科项目。",
    descriptionJa:
      "デジタルプレビューをもとにカスタムセラミックベニアを作成し、歯の形と色を整える審美歯科治療です。",
    descriptionAr:
      "علاج أسنان تجميلي يعيد تصميم شكل الأسنان ولونها باستخدام قشور خزفية مخصصة مخططة عبر معاينة رقمية.",
    priceMin: 600000,
    priceMax: 1400000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 90,
    precautionsEn:
      "Usually requires 2 visits. Avoid hard biting until final bonding is complete.",
    coverImage: dentalCare,
    popular: true,
  },
  {
    id: 6,
    slug: "hair-transplant",
    category: "hair",
    nameEn: "FUE Hair Transplant",
    nameKo: "FUE 모발이식",
    nameZh: "FUE植发",
    nameJa: "FUE自毛植毛",
    nameAr: "زراعة الشعر FUE",
    descriptionEn:
      "Follicular unit extraction using graft planning, donor-area review, and post-travel medication guidance.",
    descriptionKo:
      "모낭 단위 채취 방식으로 이식 모수 계획, 공여부 상태 검토, 귀국 후 복약 안내까지 포함해 상담합니다.",
    descriptionZh:
      "采用毛囊单位提取方式，包含移植单位规划、供区评估和旅行后用药指导。",
    descriptionJa:
      "毛包単位採取による植毛で、株数計画、ドナー部位の確認、帰国後の服薬案内まで相談します。",
    descriptionAr:
      "استخراج وحدات البصيلات مع تخطيط الطعوم ومراجعة منطقة التبرع وإرشاد الدواء بعد السفر.",
    priceMin: 3800000,
    priceMax: 9800000,
    currency: "KRW",
    recoveryDays: 10,
    durationMinutes: 360,
    precautionsEn:
      "Avoid hats and heavy sweating during the first week. Follow wash instructions carefully.",
    coverImage: hairCare,
    popular: false,
  },
  {
    id: 7,
    slug: "executive-checkup",
    category: "wellness",
    nameEn: "Executive Checkup",
    nameKo: "프리미엄 건강검진",
    nameZh: "高端体检",
    nameJa: "エグゼクティブ健診",
    nameAr: "فحص تنفيذي شامل",
    descriptionEn:
      "A travel-friendly preventive screening package with labs, imaging, endoscopy options, and translated physician summaries.",
    descriptionKo:
      "혈액검사, 영상검사, 내시경 옵션, 번역된 의사 소견서를 여행 일정에 맞춰 제공하는 예방 검진 패키지입니다.",
    descriptionZh:
      "适合旅行日程的预防筛查套餐，包含实验室检查、影像、内镜选项和翻译后的医生摘要。",
    descriptionJa:
      "検体検査、画像検査、内視鏡オプション、翻訳付き医師サマリーを含む、旅行しやすい予防健診パッケージです。",
    descriptionAr:
      "باقة فحص وقائي مناسبة للسفر تشمل التحاليل والتصوير وخيارات المنظار وملخصات طبيب مترجمة.",
    priceMin: 1200000,
    priceMax: 3600000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 240,
    precautionsEn:
      "Fasting may be required. Bring medication history and previous test results if available.",
    coverImage: checkupCare,
    popular: false,
  },
  {
    id: 8,
    slug: "recovery-care",
    category: "wellness",
    nameEn: "Post-Procedure Recovery Care",
    nameKo: "시술 후 회복 케어",
    nameZh: "术后恢复护理",
    nameJa: "術後回復ケア",
    nameAr: "رعاية التعافي بعد الإجراء",
    descriptionEn:
      "Swelling care, lymphatic therapy, nutrition support, and recovery check-ins for patients staying in Korea after treatment.",
    descriptionKo:
      "시술 후 한국에 체류하는 환자를 위한 부기 관리, 림프 테라피, 영양 지원, 회복 체크인 프로그램입니다.",
    descriptionZh:
      "面向术后留在韩国的患者，提供消肿护理、淋巴疗法、营养支持和恢复跟进。",
    descriptionJa:
      "施術後に韓国へ滞在する患者向けの腫れケア、リンパセラピー、栄養サポート、回復チェックインです。",
    descriptionAr:
      "رعاية للتورم وعلاج لمفاوي ودعم تغذوي ومتابعة تعاف للمرضى المقيمين في كوريا بعد العلاج.",
    priceMin: 120000,
    priceMax: 780000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 60,
    precautionsEn:
      "Follow the operating doctor's restrictions. Recovery programs do not replace medical emergency care.",
    coverImage: doctorConsult,
    popular: false,
  },
];

export const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: 1,
    hospitalId: 1,
    nameEn: "Dr. Min Seo",
    nameKo: "서민 원장",
    titleEn: "Facial Plastic Surgeon",
    specialtyEn: "Rhinoplasty and facial contouring",
    bioEn:
      "Board-certified surgeon focused on balanced facial planning for international cases.",
    yearsExperience: 18,
  },
  {
    id: 2,
    hospitalId: 2,
    nameEn: "Dr. Hana Lee",
    nameKo: "이하나 원장",
    titleEn: "Dermatologist",
    specialtyEn: "Laser and injectable dermatology",
    bioEn: "Designs short-stay skin programs with careful downtime planning.",
    yearsExperience: 14,
  },
  {
    id: 3,
    hospitalId: 3,
    nameEn: "Dr. Daniel Park",
    nameKo: "박다니엘 원장",
    titleEn: "Cosmetic Dentist",
    specialtyEn: "Digital smile design",
    bioEn: "Plans veneer and implant cases with translated treatment reports.",
    yearsExperience: 16,
  },
  {
    id: 4,
    hospitalId: 4,
    nameEn: "Dr. Joon Kim",
    nameKo: "김준 원장",
    titleEn: "Hair Restoration Surgeon",
    specialtyEn: "FUE and DHI transplant",
    bioEn:
      "Creates graft plans using donor-density review and long-term follow-up.",
    yearsExperience: 12,
  },
];

export const SAMPLE_HOSPITAL_TREATMENTS: HospitalTreatment[] = [
  {
    id: 1,
    hospitalId: 1,
    treatmentId: 1,
    priceKrw: 5200000,
    notes: "Includes imaging consult",
    available: true,
  },
  {
    id: 2,
    hospitalId: 1,
    treatmentId: 2,
    priceKrw: 1800000,
    notes: "Incisional or non-incisional",
    available: true,
  },
  {
    id: 3,
    hospitalId: 2,
    treatmentId: 3,
    priceKrw: 220000,
    notes: "Per session",
    available: true,
  },
  {
    id: 4,
    hospitalId: 2,
    treatmentId: 4,
    priceKrw: 420000,
    notes: "HA or PDRN options",
    available: true,
  },
  {
    id: 5,
    hospitalId: 3,
    treatmentId: 5,
    priceKrw: 850000,
    notes: "Per tooth, digital preview",
    available: true,
  },
  {
    id: 6,
    hospitalId: 4,
    treatmentId: 6,
    priceKrw: 6200000,
    notes: "2,000 graft estimate",
    available: true,
  },
  {
    id: 7,
    hospitalId: 5,
    treatmentId: 7,
    priceKrw: 2100000,
    notes: "One-day package",
    available: true,
  },
  {
    id: 8,
    hospitalId: 6,
    treatmentId: 8,
    priceKrw: 180000,
    notes: "Per recovery session",
    available: true,
  },
  {
    id: 9,
    hospitalId: 6,
    treatmentId: 4,
    priceKrw: 360000,
    notes: "Recovery-light booster",
    available: true,
  },
  {
    id: 10,
    hospitalId: 2,
    treatmentId: 8,
    priceKrw: 240000,
    notes: "Swelling care add-on",
    available: true,
  },
  {
    id: 11,
    hospitalId: 5,
    treatmentId: 3,
    priceKrw: 260000,
    notes: "With physician review",
    available: true,
  },
];

export function formatKRW(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 1300);
}

export function getLocalizedHospitalName(hospital: Hospital, lang: string) {
  if (lang === "ko") return hospital.nameKo;
  if (lang === "zh") return hospital.nameZh;
  if (lang === "ja") return hospital.nameJa;
  if (lang === "ar") return hospital.nameAr;
  return hospital.nameEn;
}

export function getLocalizedTreatmentName(treatment: Treatment, lang: string) {
  if (lang === "ko") return treatment.nameKo;
  if (lang === "zh") return treatment.nameZh;
  if (lang === "ja") return treatment.nameJa;
  if (lang === "ar") return treatment.nameAr;
  return treatment.nameEn;
}

export function getLocalizedHospitalDescription(
  hospital: Hospital,
  lang: string
) {
  if (lang === "ko") return hospital.descriptionKo;
  if (lang === "zh") return hospital.descriptionZh;
  if (lang === "ja") return hospital.descriptionJa;
  if (lang === "ar") return hospital.descriptionAr;
  return hospital.descriptionEn;
}

export function getLocalizedTreatmentDescription(
  treatment: Treatment,
  lang: string
) {
  if (lang === "ko") return treatment.descriptionKo;
  if (lang === "zh") return treatment.descriptionZh;
  if (lang === "ja") return treatment.descriptionJa;
  if (lang === "ar") return treatment.descriptionAr;
  return treatment.descriptionEn;
}
