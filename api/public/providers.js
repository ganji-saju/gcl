const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
};
const SUPABASE_TIMEOUT_MS = 10000;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=85&auto=format&fit=crop";
const PUBLIC_LANGUAGE_CODES = new Set([
  "en",
  "ko",
  "zh",
  "ja",
  "ar",
  "th",
  "vi",
  "ru",
]);

function json(res, status, payload) {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function inFilter(values) {
  return `in.(${values.join(",")})`;
}

function publicConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

async function supabaseFetch(config, path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      signal: controller.signal,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : [];
    if (!response.ok)
      throw new Error(body?.message || "Supabase request failed.");
    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}

function publicStorageUrl(config, media) {
  if (media.public_url) return media.public_url;
  if (!media.storage_path) return "";
  return `${config.supabaseUrl}/storage/v1/object/public/provider-public-media/${media.storage_path}`;
}

function firstI18n(i18nRows, locale) {
  return (
    i18nRows.find(row => row.locale === locale) ||
    i18nRows.find(row => row.locale === "en") ||
    i18nRows.find(row => row.locale === "ko") ||
    i18nRows[0] ||
    {}
  );
}

function localized(rowMap, locale, key, fallback = "") {
  return firstI18n(rowMap, locale)?.[key] || fallback;
}

function normalizeSpecialty(value) {
  const specialty = String(value || "").toLowerCase();
  if (
    ["plastic_surgery", "dermatology", "dental", "hair", "wellness"].includes(
      specialty
    )
  ) {
    return specialty;
  }
  if (specialty.includes("dental")) return "dental";
  if (specialty.includes("hair")) return "hair";
  if (specialty.includes("wellness") || specialty.includes("checkup"))
    return "wellness";
  if (specialty.includes("surgery")) return "plastic_surgery";
  return "dermatology";
}

function normalizeRegion(value) {
  const region = String(value || "").toLowerCase();
  if (
    ["gangnam", "seongsu", "hongdae", "sinchon", "bundang", "other"].includes(
      region
    )
  ) {
    return region;
  }
  if (region.includes("gangnam")) return "gangnam";
  if (region.includes("seongsu")) return "seongsu";
  if (region.includes("hongdae") || region.includes("mapo")) return "hongdae";
  if (region.includes("sinchon")) return "sinchon";
  if (region.includes("bundang")) return "bundang";
  return "other";
}

function usdFromKrw(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number / 1300);
}

function composeHospital(
  config,
  provider,
  profile,
  i18nRows,
  mediaRows,
  treatmentRows,
  operatingProfile
) {
  const coverMedia =
    mediaRows.find(row => row.media_type === "cover" && row.active !== false) ||
    mediaRows.find(row => row.active !== false);
  const gallery = mediaRows
    .filter(row => row.active !== false)
    .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
    .map(row => publicStorageUrl(config, row))
    .filter(Boolean);
  const en = firstI18n(i18nRows, "en");
  const ko = firstI18n(i18nRows, "ko");
  const zh = firstI18n(i18nRows, "zh");
  const ja = firstI18n(i18nRows, "ja");
  const ar = firstI18n(i18nRows, "ar");
  const priceMins = treatmentRows
    .map(row => Number(row.price_min_krw || 0))
    .filter(value => value > 0);
  const priceMaxes = treatmentRows
    .map(row => Number(row.price_max_krw || 0))
    .filter(value => value > 0);
  const operatingLanguages = Array.isArray(
    operatingProfile?.supported_languages
  )
    ? operatingProfile.supported_languages
        .map(value => String(value || "").trim())
        .filter(value => PUBLIC_LANGUAGE_CODES.has(value))
    : [];
  const operatingPriceMinUsd = Number(
    operatingProfile?.price_range_usd_min || 0
  );
  const operatingPriceMaxUsd = Number(
    operatingProfile?.price_range_usd_max || 0
  );
  const treatmentPriceMinUsd = priceMins.length
    ? usdFromKrw(Math.min(...priceMins))
    : 0;
  const treatmentPriceMaxUsd = priceMaxes.length
    ? usdFromKrw(Math.max(...priceMaxes))
    : 0;

  return {
    id: provider.id,
    slug: profile.slug,
    nameEn: en.name || ko.name || provider.name_legal,
    nameKo: ko.name || en.name || provider.name_legal,
    nameZh: zh.name || en.name || provider.name_legal,
    nameJa: ja.name || en.name || provider.name_legal,
    nameAr: ar.name || en.name || provider.name_legal,
    descriptionEn: localized(i18nRows, "en", "description", en.summary || ""),
    descriptionKo: localized(i18nRows, "ko", "description", ko.summary || ""),
    descriptionZh: localized(i18nRows, "zh", "description", zh.summary || ""),
    descriptionJa: localized(i18nRows, "ja", "description", ja.summary || ""),
    descriptionAr: localized(i18nRows, "ar", "description", ar.summary || ""),
    specialty: normalizeSpecialty(profile.specialty),
    region: normalizeRegion(
      profile.region || provider.district || provider.city
    ),
    addressEn: en.address || ko.address || provider.address || "",
    phone: profile.phone_public || "",
    website: profile.website_url || "",
    rating: Number(profile.rating || 0),
    reviewCount: Number(profile.review_count || 0),
    coverImage: publicStorageUrl(config, coverMedia || {}) || FALLBACK_IMAGE,
    images: gallery.length ? gallery : [FALLBACK_IMAGE],
    languages: operatingLanguages.length ? operatingLanguages : ["en", "ko"],
    certifications: [],
    featured: Boolean(profile.featured),
    latitude: Number(profile.latitude || 0),
    longitude: Number(profile.longitude || 0),
    specialties: en.specialties || ko.specialties || [],
    highlights: en.highlights || ko.highlights || [],
    priceTier: profile.price_tier || "$$",
    registrationStatus: provider.medical_korea_registered
      ? "verified"
      : "pending",
    registrationLabel: provider.medical_korea_registered
      ? "Foreign-patient registration checked"
      : "Registration evidence under review",
    insuranceVerified: true,
    responseSlaHours: Math.max(
      1,
      Math.ceil(Number(provider.average_response_minutes || 1440) / 60)
    ),
    packagePriceMinUsd:
      treatmentPriceMinUsd ||
      (Number.isFinite(operatingPriceMinUsd) && operatingPriceMinUsd > 0
        ? operatingPriceMinUsd
        : 0),
    packagePriceMaxUsd:
      treatmentPriceMaxUsd ||
      (Number.isFinite(operatingPriceMaxUsd) && operatingPriceMaxUsd > 0
        ? operatingPriceMaxUsd
        : 0),
    internationalPatientReady: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed." });
  const config = publicConfig();
  if (!config) return json(res, 200, { hospitals: [] });

  try {
    const profiles = await supabaseFetch(
      config,
      "provider_public_profiles?select=provider_id,slug,status,specialty,region,phone_public,website_url,price_tier,rating,review_count,latitude,longitude,featured,published_at,updated_at&status=eq.published&order=featured.desc,updated_at.desc&limit=120"
    );
    const providerIds = profiles.map(row => row.provider_id).filter(Boolean);
    if (!providerIds.length) return json(res, 200, { hospitals: [] });

    const [providers, operatingProfiles, i18nRows, mediaRows, treatmentRows] =
      await Promise.all([
        supabaseFetch(
          config,
          `providers?select=id,name_legal,name_display,facility_type,address,city,district,country_code,medical_korea_registered,active,average_response_minutes&id=${inFilter(providerIds)}&active=eq.true`
        ),
        supabaseFetch(
          config,
          `provider_operating_profiles?select=provider_id,supported_languages,price_range_usd_min,price_range_usd_max&provider_id=${inFilter(providerIds)}`
        ),
        supabaseFetch(
          config,
          `provider_public_profile_i18n?select=provider_id,locale,name,summary,description,address,specialties,highlights&provider_id=${inFilter(providerIds)}`
        ),
        supabaseFetch(
          config,
          `provider_public_media?select=provider_id,media_type,storage_path,public_url,alt_text,display_order,active&provider_id=${inFilter(providerIds)}&active=eq.true&order=display_order.asc`
        ),
        supabaseFetch(
          config,
          `provider_public_treatments?select=provider_id,title,price_min_krw,price_max_krw,active&provider_id=${inFilter(providerIds)}&active=eq.true`
        ),
      ]);

    const providerMap = new Map(providers.map(row => [row.id, row]));
    const operatingProfileMap = new Map(
      operatingProfiles.map(row => [row.provider_id, row])
    );
    const hospitals = profiles
      .map(profile => {
        const provider = providerMap.get(profile.provider_id);
        if (!provider) return null;
        return composeHospital(
          config,
          provider,
          profile,
          i18nRows.filter(row => row.provider_id === profile.provider_id),
          mediaRows.filter(row => row.provider_id === profile.provider_id),
          treatmentRows.filter(row => row.provider_id === profile.provider_id),
          operatingProfileMap.get(profile.provider_id)
        );
      })
      .filter(Boolean);

    return json(res, 200, { hospitals });
  } catch (error) {
    console.warn("Published provider list failed.", error);
    return json(res, 200, { hospitals: [] });
  }
}
