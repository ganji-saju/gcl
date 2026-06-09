export type Specialty = "plastic_surgery" | "dermatology" | "dental" | "hair" | "wellness";
export type Region = "gangnam" | "seongsu" | "hongdae" | "sinchon" | "bundang" | "other";
export type LanguageCode = "en" | "ko" | "zh" | "ja" | "ar" | "th" | "vi" | "ru";

export interface Hospital {
  id: number;
  slug: string;
  nameEn: string;
  nameKo: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descriptionEn: string;
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
}

export interface Treatment {
  id: number;
  slug: string;
  category: Specialty;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descriptionEn: string;
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
  hospitalId: number;
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
  hospitalId: number;
  treatmentId: number;
  priceKrw: number;
  notes: string;
  available: boolean;
}

export const SPECIALTY_LABELS: Record<Specialty, { en: string; short: string; color: string }> = {
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

export const LANGUAGE_LABELS: Record<LanguageCode, { label: string; flag: string }> = {
  en: { label: "English", flag: "EN" },
  ko: { label: "Korean", flag: "KO" },
  zh: { label: "Chinese", flag: "ZH" },
  ja: { label: "Japanese", flag: "JA" },
  ar: { label: "Arabic", flag: "AR" },
  th: { label: "Thai", flag: "TH" },
  vi: { label: "Vietnamese", flag: "VI" },
  ru: { label: "Russian", flag: "RU" },
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
      "A Seoul-based facial surgery center focused on rhinoplasty, eyelid surgery, and facial contouring for international patients. Coordinators prepare translation, imaging, and quote comparisons before arrival.",
    descriptionZh: "首尔面部手术中心，专注鼻整形、眼部手术和面部轮廓，为海外患者提供翻译、影像和报价协调。",
    descriptionJa: "ソウルの顔専門外科センター。鼻整形、目元手術、輪郭手術を中心に、渡航前の通訳、画像確認、見積もりを支援します。",
    descriptionAr: "مركز جراحة وجه في سيول يركز على تجميل الأنف والجفون وتنسيق الوجه مع دعم ترجمة وعروض أسعار للمرضى الدوليين.",
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
    certifications: ["KAHF foreign patient care", "Board-certified surgeons", "Dedicated interpreter desk"],
    featured: true,
    latitude: 37.5244,
    longitude: 127.0415,
    specialties: ["Rhinoplasty", "Double eyelid", "Facial contouring", "Revision surgery"],
    highlights: ["3D imaging review", "Airport pickup option", "Post-op hotel nurse visit"],
    priceTier: "$$$",
  },
  {
    id: 2,
    slug: "lumen-skin-center",
    nameEn: "Lumen Skin Center",
    nameKo: "루멘 스킨센터",
    nameZh: "Lumen皮肤中心",
    nameJa: "Lumenスキンセンター",
    nameAr: "مركز لومين للبشرة",
    descriptionEn:
      "A dermatology and aesthetic medicine center known for laser toning, acne scar programs, injectables, and recovery-light treatments designed for short-stay visitors.",
    descriptionZh: "皮肤科与美容医学中心，提供激光、痘疤、注射与短停留访客可安排的低恢复期项目。",
    descriptionJa: "レーザー、ニキビ跡、注入治療、短期滞在向けのダウンタイムが少ない施術に強い美容皮膚科です。",
    descriptionAr: "مركز جلدية وتجميل يقدم الليزر وآثار حب الشباب والحقن وبرامج مناسبة للزيارات القصيرة.",
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
    certifications: ["Korean Dermatological Association", "Laser safety protocol", "Medical-grade skincare"],
    featured: true,
    latitude: 37.5065,
    longitude: 127.0495,
    specialties: ["Laser toning", "Skin booster", "Acne scar", "Botox and filler"],
    highlights: ["Same-day consult", "Low downtime plans", "Aftercare kit included"],
    priceTier: "$$",
  },
  {
    id: 3,
    slug: "seoul-dental-design",
    nameEn: "Seoul Dental Design",
    nameKo: "서울 덴탈 디자인",
    nameZh: "首尔牙科设计",
    nameJa: "ソウルデンタルデザイン",
    nameAr: "تصميم سيول لطب الأسنان",
    descriptionEn:
      "A cosmetic and restorative dental clinic offering veneers, implants, whitening, and smile-design packages for patients who need predictable timelines.",
    descriptionZh: "美容修复牙科，提供贴面、种植、美白和微笑设计，适合需要明确行程的海外患者。",
    descriptionJa: "ベニア、インプラント、ホワイトニング、スマイルデザインを行う審美修復歯科です。",
    descriptionAr: "عيادة أسنان تجميلية وترميمية تقدم القشور والزراعة والتبييض وتصميم الابتسامة.",
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
    certifications: ["Korean Dental Association", "Digital smile design", "Implant planning lab"],
    featured: true,
    latitude: 37.5596,
    longitude: 126.9368,
    specialties: ["Porcelain veneers", "Dental implants", "Whitening", "Invisalign"],
    highlights: ["Digital preview", "Multi-visit scheduling", "Warranty documentation"],
    priceTier: "$$",
  },
  {
    id: 4,
    slug: "rootline-hair-clinic",
    nameEn: "Rootline Hair Clinic",
    nameKo: "루트라인 헤어클리닉",
    nameZh: "Rootline植发中心",
    nameJa: "Rootline毛髪クリニック",
    nameAr: "عيادة روتلاين للشعر",
    descriptionEn:
      "A hair restoration clinic providing FUE, DHI, scalp care, and PRP programs with multilingual pre-screening for international patients.",
    descriptionZh: "植发与头皮护理中心，提供FUE、DHI、PRP和多语言术前筛查。",
    descriptionJa: "FUE、DHI、頭皮ケア、PRPを提供し、多言語で事前スクリーニングを行う毛髪クリニックです。",
    descriptionAr: "عيادة ترميم شعر تقدم FUE وDHI وعناية بفروة الرأس وPRP مع فحص أولي متعدد اللغات.",
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
    certifications: ["Hair restoration society member", "Microscope graft audit", "Remote follow-up"],
    featured: false,
    latitude: 37.5446,
    longitude: 127.0557,
    specialties: ["FUE transplant", "DHI method", "Scalp treatment", "PRP hair program"],
    highlights: ["Graft estimate review", "Photo follow-up", "Medication guidance"],
    priceTier: "$$",
  },
  {
    id: 5,
    slug: "han-river-checkup",
    nameEn: "Han River Checkup Lounge",
    nameKo: "한강 검진 라운지",
    nameZh: "汉江体检中心",
    nameJa: "漢江健診ラウンジ",
    nameAr: "صالة هان ريفر للفحوصات",
    descriptionEn:
      "A preventive health and executive checkup center bundling imaging, lab tests, digestive endoscopy, and physician summaries for travel-friendly schedules.",
    descriptionZh: "预防医学与高端体检中心，结合影像、检验、内镜和医生总结，适合旅行行程。",
    descriptionJa: "画像検査、血液検査、内視鏡、医師サマリーを旅行日程に合わせて提供する健診センターです。",
    descriptionAr: "مركز فحوصات وقائية وتنفيذية يجمع التصوير والتحاليل والمناظير وملخص الطبيب ضمن جدول مناسب للسفر.",
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
    certifications: ["International checkup desk", "Digital report package", "Dietary translation"],
    featured: false,
    latitude: 37.5037,
    longitude: 127.0447,
    specialties: ["Executive checkup", "Digestive endoscopy", "Cancer screening", "Imaging"],
    highlights: ["One-day itinerary", "English summary", "Hotel report delivery"],
    priceTier: "$$$",
  },
  {
    id: 6,
    slug: "atelier-recovery-clinic",
    nameEn: "Atelier Recovery Clinic",
    nameKo: "아뜰리에 회복 클리닉",
    nameZh: "Atelier恢复护理中心",
    nameJa: "Atelierリカバリークリニック",
    nameAr: "عيادة أتيليه للتعافي",
    descriptionEn:
      "A post-procedure recovery and aesthetic wellness clinic supporting swelling care, lymphatic therapy, IV nutrition, and wound-care coordination.",
    descriptionZh: "术后恢复与美容健康中心，提供消肿、淋巴护理、营养点滴和伤口护理协调。",
    descriptionJa: "術後の腫れケア、リンパケア、点滴栄養、創傷ケアを支援するリカバリークリニックです。",
    descriptionAr: "عيادة تعاف وعافية تجميلية تدعم تقليل التورم والعلاج اللمفاوي والتغذية الوريدية وتنسيق الجروح.",
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
    certifications: ["Recovery nurse network", "Post-op transport option", "Partner hotel visits"],
    featured: false,
    latitude: 37.5551,
    longitude: 126.9226,
    specialties: ["Swelling care", "Lymphatic therapy", "IV nutrition", "Scar management"],
    highlights: ["Post-op route planning", "Hotel visit option", "Daily recovery log"],
    priceTier: "$",
  },
];

export const SAMPLE_TREATMENTS: Treatment[] = [
  {
    id: 1,
    slug: "rhinoplasty",
    category: "plastic_surgery",
    nameEn: "Rhinoplasty",
    nameZh: "鼻整形",
    nameJa: "鼻整形",
    nameAr: "تجميل الأنف",
    descriptionEn:
      "Korean rhinoplasty focuses on balanced, natural-looking changes using implant, cartilage, or revision techniques depending on anatomy and goals.",
    descriptionZh: "韩国鼻整形重视自然比例，可根据鼻部结构和目标选择假体、软骨或修复方案。",
    descriptionJa: "韓国の鼻整形は自然なバランスを重視し、骨格や希望に合わせてプロテーゼ、軟骨、修正術を選びます。",
    descriptionAr: "يركز تجميل الأنف الكوري على نتائج طبيعية ومتوازنة باستخدام الغرسات أو الغضروف أو تقنيات المراجعة حسب الحالة.",
    priceMin: 3200000,
    priceMax: 9200000,
    currency: "KRW",
    recoveryDays: 14,
    durationMinutes: 150,
    precautionsEn: "Avoid heavy exercise for 3 weeks. Do not wear glasses for 6 weeks. Final swelling can take several months.",
    coverImage: doctorConsult,
    popular: true,
  },
  {
    id: 2,
    slug: "double-eyelid",
    category: "plastic_surgery",
    nameEn: "Double Eyelid Surgery",
    nameZh: "双眼皮手术",
    nameJa: "二重まぶた手術",
    nameAr: "جراحة الجفن المزدوج",
    descriptionEn:
      "Creates or refines an upper-eyelid crease with incisional or non-incisional approaches, often planned with ptosis or under-eye concerns.",
    descriptionZh: "通过切开或非切开方式塑造上眼睑褶皱，也可结合上睑下垂或眼下问题评估。",
    descriptionJa: "切開または非切開で上まぶたのラインを整え、眼瞼下垂や目の下の悩みも含めて計画します。",
    descriptionAr: "تشكيل أو تحسين ثنية الجفن العلوي بطرق جراحية أو غير جراحية مع تقييم تدلي الجفن أو منطقة تحت العين.",
    priceMin: 900000,
    priceMax: 3600000,
    currency: "KRW",
    recoveryDays: 7,
    durationMinutes: 70,
    precautionsEn: "Avoid rubbing eyes for 2 weeks. Stitches are usually removed after 5 to 7 days.",
    coverImage: clinicExterior,
    popular: true,
  },
  {
    id: 3,
    slug: "laser-toning",
    category: "dermatology",
    nameEn: "Laser Toning",
    nameZh: "激光嫩肤",
    nameJa: "レーザートーニング",
    nameAr: "ليزر توحيد البشرة",
    descriptionEn:
      "A low-downtime laser program for pigmentation, melasma, and overall tone. Multiple sessions are commonly recommended.",
    descriptionZh: "低恢复期激光项目，用于色沉、黄褐斑和肤色改善，通常建议多次治疗。",
    descriptionJa: "色素沈着、肝斑、肌トーンを整えるダウンタイムの少ないレーザー治療です。",
    descriptionAr: "برنامج ليزر قليل التعافي للتصبغات والكلف وتوحيد لون البشرة، وغالبا يحتاج إلى عدة جلسات.",
    priceMin: 160000,
    priceMax: 620000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 35,
    precautionsEn: "Use SPF 50+ daily. Avoid direct sun exposure for 1 week after each session.",
    coverImage: skinCare,
    popular: true,
  },
  {
    id: 4,
    slug: "skin-booster",
    category: "dermatology",
    nameEn: "Skin Booster",
    nameZh: "水光/丽珠兰",
    nameJa: "スキンブースター",
    nameAr: "معزز البشرة",
    descriptionEn:
      "Injectable hydration and skin-quality treatment using HA, PDRN, or collagen-stimulating formulas selected by skin condition.",
    descriptionZh: "通过HA、PDRN或胶原刺激配方改善水分、弹性和肤质，由医生根据肤况选择。",
    descriptionJa: "HA、PDRN、コラーゲン刺激製剤などを肌状態に合わせて選ぶ注入系スキンケアです。",
    descriptionAr: "علاج حقني لتحسين الترطيب وجودة البشرة باستخدام HA أو PDRN أو محفزات الكولاجين حسب الحالة.",
    priceMin: 240000,
    priceMax: 980000,
    currency: "KRW",
    recoveryDays: 1,
    durationMinutes: 40,
    precautionsEn: "Small bumps or redness can last 1 to 3 days. Avoid sauna and alcohol for 48 hours.",
    coverImage: skinCare,
    popular: true,
  },
  {
    id: 5,
    slug: "porcelain-veneers",
    category: "dental",
    nameEn: "Porcelain Veneers",
    nameZh: "瓷贴面",
    nameJa: "ポーセレンベニア",
    nameAr: "قشور خزفية",
    descriptionEn:
      "A cosmetic dental treatment that redesigns tooth shape and shade using custom ceramic veneers planned from digital previews.",
    descriptionZh: "通过数字预览设计牙齿形态和色泽，并制作个性化瓷贴面。",
    descriptionJa: "デジタルプレビューをもとに歯の形と色を設計する審美歯科治療です。",
    descriptionAr: "علاج أسنان تجميلي يعيد تصميم شكل ولون الأسنان بقشور خزفية مخصصة بناء على معاينة رقمية.",
    priceMin: 600000,
    priceMax: 1400000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 90,
    precautionsEn: "Usually requires 2 visits. Avoid hard biting until final bonding is complete.",
    coverImage: dentalCare,
    popular: true,
  },
  {
    id: 6,
    slug: "hair-transplant",
    category: "hair",
    nameEn: "FUE Hair Transplant",
    nameZh: "FUE植发",
    nameJa: "FUE自毛植毛",
    nameAr: "زراعة الشعر FUE",
    descriptionEn:
      "Follicular unit extraction using graft planning, donor-area review, and post-travel medication guidance.",
    descriptionZh: "通过毛囊单位提取进行植发，包括毛囊数量规划、供区评估和回国后用药指导。",
    descriptionJa: "グラフト計画、ドナー部位確認、帰国後の薬剤案内まで含むFUE植毛です。",
    descriptionAr: "زراعة شعر بتقنية اقتطاف الوحدات مع تخطيط البصيلات ومراجعة المنطقة المانحة وإرشادات الدواء بعد السفر.",
    priceMin: 3800000,
    priceMax: 9800000,
    currency: "KRW",
    recoveryDays: 10,
    durationMinutes: 360,
    precautionsEn: "Avoid hats and heavy sweating during the first week. Follow wash instructions carefully.",
    coverImage: hairCare,
    popular: false,
  },
  {
    id: 7,
    slug: "executive-checkup",
    category: "wellness",
    nameEn: "Executive Checkup",
    nameZh: "高端体检",
    nameJa: "エグゼクティブ健診",
    nameAr: "فحص تنفيذي شامل",
    descriptionEn:
      "A travel-friendly preventive screening package with labs, imaging, endoscopy options, and translated physician summaries.",
    descriptionZh: "适合旅行日程的预防筛查套餐，包括检验、影像、内镜选项和翻译版医生总结。",
    descriptionJa: "検査、画像、内視鏡オプション、翻訳済み医師サマリーを含む旅行者向け健診です。",
    descriptionAr: "حزمة فحوصات وقائية مناسبة للسفر تشمل التحاليل والتصوير وخيارات المنظار وملخص الطبيب المترجم.",
    priceMin: 1200000,
    priceMax: 3600000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 240,
    precautionsEn: "Fasting may be required. Bring medication history and previous test results if available.",
    coverImage: checkupCare,
    popular: false,
  },
  {
    id: 8,
    slug: "recovery-care",
    category: "wellness",
    nameEn: "Post-Procedure Recovery Care",
    nameZh: "术后恢复护理",
    nameJa: "術後リカバリーケア",
    nameAr: "رعاية التعافي بعد الإجراء",
    descriptionEn:
      "Swelling care, lymphatic therapy, nutrition support, and recovery check-ins for patients staying in Korea after treatment.",
    descriptionZh: "为术后留韩患者提供消肿、淋巴护理、营养支持和恢复跟进。",
    descriptionJa: "韓国滞在中の術後患者向けに腫れケア、リンパケア、栄養サポート、回復確認を行います。",
    descriptionAr: "رعاية للتورم والعلاج اللمفاوي والدعم الغذائي ومتابعة التعافي للمرضى المقيمين في كوريا بعد العلاج.",
    priceMin: 120000,
    priceMax: 780000,
    currency: "KRW",
    recoveryDays: 0,
    durationMinutes: 60,
    precautionsEn: "Follow the operating doctor's restrictions. Recovery programs do not replace medical emergency care.",
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
    bioEn: "Board-certified surgeon focused on balanced facial planning for international cases.",
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
    bioEn: "Creates graft plans using donor-density review and long-term follow-up.",
    yearsExperience: 12,
  },
];

export const SAMPLE_HOSPITAL_TREATMENTS: HospitalTreatment[] = [
  { id: 1, hospitalId: 1, treatmentId: 1, priceKrw: 5200000, notes: "Includes imaging consult", available: true },
  { id: 2, hospitalId: 1, treatmentId: 2, priceKrw: 1800000, notes: "Incisional or non-incisional", available: true },
  { id: 3, hospitalId: 2, treatmentId: 3, priceKrw: 220000, notes: "Per session", available: true },
  { id: 4, hospitalId: 2, treatmentId: 4, priceKrw: 420000, notes: "HA or PDRN options", available: true },
  { id: 5, hospitalId: 3, treatmentId: 5, priceKrw: 850000, notes: "Per tooth, digital preview", available: true },
  { id: 6, hospitalId: 4, treatmentId: 6, priceKrw: 6200000, notes: "2,000 graft estimate", available: true },
  { id: 7, hospitalId: 5, treatmentId: 7, priceKrw: 2100000, notes: "One-day package", available: true },
  { id: 8, hospitalId: 6, treatmentId: 8, priceKrw: 180000, notes: "Per recovery session", available: true },
  { id: 9, hospitalId: 6, treatmentId: 4, priceKrw: 360000, notes: "Recovery-light booster", available: true },
  { id: 10, hospitalId: 2, treatmentId: 8, priceKrw: 240000, notes: "Swelling care add-on", available: true },
  { id: 11, hospitalId: 5, treatmentId: 3, priceKrw: 260000, notes: "With physician review", available: true },
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
  if (lang === "zh") return hospital.nameZh;
  if (lang === "ja") return hospital.nameJa;
  if (lang === "ar") return hospital.nameAr;
  if (lang === "ko") return hospital.nameKo;
  return hospital.nameEn;
}

export function getLocalizedTreatmentName(treatment: Treatment, lang: string) {
  if (lang === "zh") return treatment.nameZh;
  if (lang === "ja") return treatment.nameJa;
  if (lang === "ar") return treatment.nameAr;
  return treatment.nameEn;
}

export function getLocalizedHospitalDescription(hospital: Hospital, lang: string) {
  if (lang === "zh") return hospital.descriptionZh;
  if (lang === "ja") return hospital.descriptionJa;
  if (lang === "ar") return hospital.descriptionAr;
  return hospital.descriptionEn;
}

export function getLocalizedTreatmentDescription(treatment: Treatment, lang: string) {
  if (lang === "zh") return treatment.descriptionZh;
  if (lang === "ja") return treatment.descriptionJa;
  if (lang === "ar") return treatment.descriptionAr;
  return treatment.descriptionEn;
}
