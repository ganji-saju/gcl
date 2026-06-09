import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "ko" | "zh" | "ja" | "ar";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", shortLabel: "EN", dir: "ltr" },
  { code: "ko", label: "Korean", nativeLabel: "한국어", shortLabel: "KO", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", shortLabel: "ZH", dir: "ltr" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", shortLabel: "JA", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", shortLabel: "AR", dir: "rtl" },
];

type TranslationMap = Record<string, Record<Language, string>>;

export const T: TranslationMap = {
  "nav.hospitals": { en: "Hospitals", ko: "병원", zh: "医院", ja: "病院", ar: "المستشفيات" },
  "nav.treatments": { en: "Treatments", ko: "시술", zh: "项目", ja: "施術", ar: "العلاجات" },
  "nav.compare": { en: "Compare", ko: "비교", zh: "比较", ja: "比較", ar: "مقارنة" },
  "nav.process": { en: "Process", ko: "진행 방식", zh: "流程", ja: "流れ", ar: "الخطوات" },
  "nav.consultation": { en: "Consultation", ko: "상담", zh: "咨询", ja: "相談", ar: "استشارة" },
  "nav.cta": { en: "Start consultation", ko: "상담 시작", zh: "开始咨询", ja: "相談を開始", ar: "ابدأ الاستشارة" },

  "hero.title": {
    en: "Find trusted Korean care before you fly",
    ko: "출국 전 신뢰할 수 있는 한국 진료를 찾으세요",
    zh: "出发前找到可信赖的韩国医疗服务",
    ja: "渡航前に信頼できる韓国医療を見つける",
    ar: "اعثر على رعاية كورية موثوقة قبل السفر",
  },
  "hero.copy": {
    en: "Compare vetted hospitals, treatment prices, languages, recovery support, and coordinator notes in one independent patient hub.",
    ko: "검증된 병원, 시술 가격, 언어 지원, 회복 케어, 코디네이터 메모를 독립 허브에서 한 번에 비교하세요.",
    zh: "在独立患者平台中比较已审核医院、治疗价格、语言支持、恢复服务和协调员备注。",
    ja: "審査済み病院、施術価格、言語対応、回復サポート、コーディネーターメモを一つの独立ハブで比較できます。",
    ar: "قارن المستشفيات المعتمدة والأسعار واللغات ودعم التعافي وملاحظات المنسق في منصة مستقلة واحدة.",
  },
  "hero.primary": { en: "Start consultation", ko: "무료 상담 시작", zh: "开始免费咨询", ja: "無料相談を始める", ar: "ابدأ استشارة مجانية" },
  "hero.secondary": { en: "Compare hospitals", ko: "병원 비교", zh: "比较医院", ja: "病院を比較", ar: "قارن المستشفيات" },

  "cat.title": { en: "Choose the right care path", ko: "필요한 진료 경로 선택", zh: "选择合适的医疗路径", ja: "適切なケアを選ぶ", ar: "اختر مسار الرعاية المناسب" },
  "cat.subtitle": {
    en: "Start with a goal, then compare hospitals, prices, recovery time, and language support.",
    ko: "목표를 먼저 정하고 병원, 가격, 회복 기간, 언어 지원을 비교하세요.",
    zh: "先选择目标，再比较医院、价格、恢复时间和语言支持。",
    ja: "目的から始め、病院、価格、回復期間、言語対応を比較できます。",
    ar: "ابدأ بالهدف ثم قارن المستشفيات والأسعار ووقت التعافي واللغة.",
  },
  "cat.plastic": { en: "Plastic Surgery", ko: "성형외과", zh: "整形外科", ja: "美容外科", ar: "جراحة تجميلية" },
  "cat.dermatology": { en: "Dermatology", ko: "피부과", zh: "皮肤科", ja: "美容皮膚科", ar: "جلدية" },
  "cat.dental": { en: "Dental", ko: "치과", zh: "牙科", ja: "歯科", ar: "أسنان" },
  "cat.hair": { en: "Hair", ko: "모발", zh: "植发", ja: "毛髪", ar: "شعر" },
  "cat.wellness": { en: "Wellness", ko: "검진/회복", zh: "体检/恢复", ja: "健診/回復", ar: "عافية" },

  "hospitals.title": { en: "Featured hospital partners", ko: "추천 병원 파트너", zh: "精选医院伙伴", ja: "注目の提携病院", ar: "شركاء المستشفيات المختارون" },
  "hospitals.subtitle": {
    en: "Curated options for international patients, with visible prices, languages, and care logistics.",
    ko: "외국인 환자를 위한 병원, 가격, 언어, 진료 동선을 한눈에 확인하세요.",
    zh: "为海外患者精选医院，清晰展示价格、语言和护理安排。",
    ja: "海外患者向けに、価格、言語、ケア動線が見える病院を厳選しました。",
    ar: "خيارات مختارة للمرضى الدوليين مع الأسعار واللغات وترتيبات الرعاية.",
  },
  "hospitals.viewAll": { en: "View all hospitals", ko: "모든 병원 보기", zh: "查看全部医院", ja: "すべての病院", ar: "عرض كل المستشفيات" },
  "hospitals.filter.all": { en: "All", ko: "전체", zh: "全部", ja: "すべて", ar: "الكل" },
  "hospitals.region": { en: "Region", ko: "지역", zh: "地区", ja: "地域", ar: "المنطقة" },
  "hospitals.language": { en: "Language support", ko: "언어 지원", zh: "语言支持", ja: "言語対応", ar: "دعم اللغة" },
  "hospitals.reviews": { en: "reviews", ko: "후기", zh: "评价", ja: "レビュー", ar: "تقييمات" },

  "treatments.title": { en: "Popular treatment programs", ko: "인기 시술 프로그램", zh: "热门治疗项目", ja: "人気施術プログラム", ar: "برامج العلاج الشائعة" },
  "treatments.subtitle": {
    en: "Understand budget, recovery, visit length, and candidate hospitals before booking.",
    ko: "예약 전 예산, 회복 기간, 체류 일정, 후보 병원을 확인하세요.",
    zh: "预约前了解预算、恢复期、停留时间和候选医院。",
    ja: "予約前に予算、回復期間、滞在日数、候補病院を確認できます。",
    ar: "افهم الميزانية والتعافي ومدة الزيارة والمستشفيات المرشحة قبل الحجز.",
  },
  "treatments.priceFrom": { en: "From", ko: "시작가", zh: "起价", ja: "目安", ar: "ابتداء من" },
  "treatments.recovery": { en: "Recovery", ko: "회복", zh: "恢复", ja: "回復", ar: "تعاف" },
  "treatments.days": { en: "days", ko: "일", zh: "天", ja: "日", ar: "أيام" },
  "treatments.learnMore": { en: "Learn more", ko: "자세히", zh: "了解更多", ja: "詳しく", ar: "اعرف المزيد" },

  "compare.title": { en: "Compare hospitals side by side", ko: "병원을 나란히 비교", zh: "并排比较医院", ja: "病院を横並び比較", ar: "قارن المستشفيات جنبا إلى جنب" },
  "compare.subtitle": {
    en: "Shortlist up to three providers and compare prices, languages, certifications, and recovery support.",
    ko: "최대 3개 병원의 가격, 언어, 인증, 회복 지원을 비교하세요.",
    zh: "最多选择三家医院，比较价格、语言、认证和恢复支持。",
    ja: "最大3施設の価格、言語、認証、回復支援を比較できます。",
    ar: "اختر حتى ثلاثة مزودين وقارن الأسعار واللغات والاعتمادات ودعم التعافي.",
  },
  "compare.add": { en: "Add to compare", ko: "비교 담기", zh: "加入比较", ja: "比較に追加", ar: "أضف للمقارنة" },
  "compare.empty": { en: "Add hospitals to compare", ko: "비교할 병원을 추가하세요", zh: "添加医院进行比较", ja: "比較する病院を追加", ar: "أضف مستشفيات للمقارنة" },

  "consult.title": { en: "Free consultation", ko: "무료 상담", zh: "免费咨询", ja: "無料相談", ar: "استشارة مجانية" },
  "consult.subtitle": {
    en: "Tell us your goal, timeline, language, and budget. We will route your request to the right care coordinator.",
    ko: "목표, 일정, 언어, 예산을 남기면 적합한 코디네이터에게 연결합니다.",
    zh: "告诉我们目标、时间、语言和预算，我们会转给合适的协调员。",
    ja: "目的、日程、言語、予算を入力すると、適切なコーディネーターに連携します。",
    ar: "أخبرنا بهدفك وموعدك ولغتك وميزانيتك وسنوجه طلبك إلى المنسق المناسب.",
  },
  "consult.name": { en: "Full name", ko: "이름", zh: "姓名", ja: "氏名", ar: "الاسم الكامل" },
  "consult.email": { en: "Email", ko: "이메일", zh: "邮箱", ja: "メール", ar: "البريد الإلكتروني" },
  "consult.phone": { en: "Phone / WhatsApp", ko: "전화 / WhatsApp", zh: "电话 / WhatsApp", ja: "電話 / WhatsApp", ar: "الهاتف / واتساب" },
  "consult.nationality": { en: "Nationality", ko: "국적", zh: "国籍", ja: "国籍", ar: "الجنسية" },
  "consult.treatment": { en: "Treatment interest", ko: "관심 시술", zh: "感兴趣项目", ja: "希望施術", ar: "العلاج المطلوب" },
  "consult.date": { en: "Preferred travel date", ko: "희망 방문일", zh: "期望日期", ja: "希望日", ar: "التاريخ المفضل" },
  "consult.budget": { en: "Budget range", ko: "예산", zh: "预算范围", ja: "予算", ar: "نطاق الميزانية" },
  "consult.language": { en: "Preferred language", ko: "희망 언어", zh: "首选语言", ja: "希望言語", ar: "اللغة المفضلة" },
  "consult.message": { en: "Message", ko: "문의 내용", zh: "留言", ja: "メッセージ", ar: "الرسالة" },
  "consult.submit": { en: "Send request", ko: "상담 요청 보내기", zh: "提交咨询", ja: "相談を送信", ar: "إرسال الطلب" },
  "consult.success": {
    en: "Your request has been saved. A coordinator will follow up within 24 hours.",
    ko: "상담 요청이 저장되었습니다. 24시간 내 코디네이터가 연락드립니다.",
    zh: "您的咨询已保存，协调员将在24小时内联系您。",
    ja: "相談内容を保存しました。24時間以内にコーディネーターが連絡します。",
    ar: "تم حفظ طلبك. سيتواصل معك منسق خلال 24 ساعة.",
  },

  "common.loading": { en: "Loading...", ko: "불러오는 중...", zh: "加载中...", ja: "読み込み中...", ar: "جاري التحميل..." },
  "common.noResults": { en: "No results found", ko: "결과가 없습니다", zh: "没有结果", ja: "結果がありません", ar: "لا توجد نتائج" },
  "common.search": { en: "Search", ko: "검색", zh: "搜索", ja: "検索", ar: "بحث" },
  "common.filter": { en: "Filter", ko: "필터", zh: "筛选", ja: "絞り込み", ar: "تصفية" },
  "common.back": { en: "Back", ko: "뒤로", zh: "返回", ja: "戻る", ar: "رجوع" },
  "common.seeAll": { en: "See all", ko: "전체 보기", zh: "查看全部", ja: "すべて見る", ar: "عرض الكل" },

  "footer.tagline": {
    en: "Independent patient acquisition and care-coordination hub for Korean medical tourism.",
    ko: "한국 의료관광을 위한 독립 환자 유치 및 케어 코디네이션 허브.",
    zh: "面向韩国医疗旅游的独立患者获取与护理协调平台。",
    ja: "韓国医療ツーリズム向けの独立患者誘致・ケア調整ハブ。",
    ar: "منصة مستقلة لاكتساب المرضى وتنسيق الرعاية للسياحة الطبية الكورية.",
  },
  "footer.rights": { en: "All rights reserved.", ko: "All rights reserved.", zh: "All rights reserved.", ja: "All rights reserved.", ar: "All rights reserved." },
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  currentLang: LanguageOption;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("gph_lang") as Language | null;
    return stored && LANGUAGES.some((language) => language.code === stored) ? stored : "en";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("gph_lang", newLang);
  }, []);

  const currentLang = LANGUAGES.find((language) => language.code === lang) ?? LANGUAGES[0];
  const dir = currentLang.dir;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  const t = useCallback(
    (key: string): string => {
      return T[key]?.[lang] ?? T[key]?.en ?? key;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t, dir, currentLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
