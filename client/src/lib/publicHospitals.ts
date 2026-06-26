import { SAMPLE_HOSPITALS, type Hospital } from "@/lib/sampleData";

let publishedHospitalCache: Hospital[] | null = null;

export async function fetchPublishedHospitals() {
  if (publishedHospitalCache) return publishedHospitalCache;
  if (import.meta.env.DEV && window.location.port === "5173") {
    publishedHospitalCache = [];
    return publishedHospitalCache;
  }

  const response = await fetch("/api/public/providers");
  if (!response.ok) throw new Error("Published hospital API failed.");
  const payload = (await response.json()) as { hospitals?: Hospital[] };
  publishedHospitalCache = Array.isArray(payload.hospitals)
    ? payload.hospitals
    : [];
  return publishedHospitalCache;
}

export function mergePublishedHospitals(publishedHospitals: Hospital[] | null) {
  if (!publishedHospitals?.length) return SAMPLE_HOSPITALS;
  const publishedSlugs = new Set(
    publishedHospitals.map(hospital => hospital.slug)
  );
  return [
    ...publishedHospitals,
    ...SAMPLE_HOSPITALS.filter(hospital => !publishedSlugs.has(hospital.slug)),
  ];
}
