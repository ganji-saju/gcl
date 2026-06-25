import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Hourglass,
  Loader2,
  LockKeyhole,
  Plus,
  RotateCw,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  betaCases,
  betaProviders,
  betaQuotes,
  type BetaCase,
} from "@/lib/betaData";
import {
  caseStatusLabel,
  languageListLabel,
  statusLabel,
} from "@/lib/adminLabels";
import {
  confirmHeldBookingMvp,
  createAvailabilitySlotMvp,
  fetchPartnerMvpSnapshot,
  holdAvailabilitySlotMvp,
  readAdminApiToken,
  readOpsRole,
  releaseAvailabilitySlotMvp,
  type AvailabilitySlot,
  type BookingReservation,
  type NotificationResult,
  type ProviderQuote,
  type SlotStatus,
  type VisitType,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

const KST_TIME_ZONE = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;
const SLOT_HOLD_MINUTES = 15;

type ApiStatus = "demo" | "loading" | "live" | "saving" | "error";
type BusyAction = "refresh" | "create" | "hold" | "release" | "confirm" | null;
type QuoteOption = Pick<
  ProviderQuote,
  "id" | "caseId" | "providerId" | "depositAmountUsd" | "status" | "validUntil"
>;
type LocalNotification = {
  id: string;
  caseId: string;
  quoteId?: string;
  bookingId?: string;
  template: string;
  channel: string;
  status: NotificationResult["status"];
  sendAfter?: string;
};

function dateKeyFromParts(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find(part => part.type === "year")?.value ?? "2026";
  const month = parts.find(part => part.type === "month")?.value ?? "01";
  const day = parts.find(part => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number) {
  return dateKeyFromParts(
    new Date(new Date(`${dateKey}T00:00:00+09:00`).getTime() + days * DAY_MS)
  );
}

function weekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function makeKstIso(dateKey: string, time: string) {
  return `${dateKey}T${time}:00+09:00`;
}

function addMinutesIso(iso: string, minutes: number) {
  return new Date(Date.parse(iso) + minutes * 60 * 1000).toISOString();
}

function displayDate(dateKey: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateKey}T00:00:00+09:00`));
}

function displayLongDateTime(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function displayTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function slotDuration(slot: AvailabilitySlot) {
  return Math.max(
    0,
    Math.round((Date.parse(slot.endsAt) - Date.parse(slot.startsAt)) / 60000)
  );
}

function makeDemoSlot(
  id: string,
  providerId: string,
  dateKey: string,
  time: string,
  duration: number,
  status: SlotStatus,
  languageSupport: string[],
  holdCaseId?: string,
  holdQuoteId?: string
): AvailabilitySlot {
  const startsAt = makeKstIso(dateKey, time);
  const now = new Date();
  return {
    id,
    providerId,
    startsAt,
    endsAt: addMinutesIso(startsAt, duration),
    status,
    languageSupport,
    holdExpiresAt:
      status === "held"
        ? new Date(now.getTime() + 12 * 60 * 1000).toISOString()
        : null,
    holdCaseId: holdCaseId ?? null,
    holdQuoteId: holdQuoteId ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function buildDemoSlots() {
  return [
    makeDemoSlot(
      "demo-slot-001",
      "prov-001",
      "2026-07-06",
      "09:30",
      60,
      "available",
      ["ja", "en"]
    ),
    makeDemoSlot(
      "demo-slot-002",
      "prov-001",
      "2026-07-06",
      "10:45",
      75,
      "held",
      ["ja", "ko"],
      "case-0001",
      "quote-0001"
    ),
    makeDemoSlot(
      "demo-slot-003",
      "prov-001",
      "2026-07-07",
      "11:00",
      60,
      "booked",
      ["ja", "en"]
    ),
    makeDemoSlot(
      "demo-slot-004",
      "prov-001",
      "2026-07-08",
      "14:00",
      90,
      "available",
      ["ja", "zh", "en"]
    ),
    makeDemoSlot(
      "demo-slot-005",
      "prov-001",
      "2026-07-10",
      "16:00",
      60,
      "unavailable",
      ["ko"]
    ),
    makeDemoSlot(
      "demo-slot-006",
      "prov-002",
      "2026-07-06",
      "10:30",
      75,
      "booked",
      ["ja", "ko"]
    ),
    makeDemoSlot(
      "demo-slot-007",
      "prov-002",
      "2026-07-07",
      "13:00",
      60,
      "available",
      ["ja", "en"]
    ),
    makeDemoSlot(
      "demo-slot-008",
      "prov-002",
      "2026-07-08",
      "15:30",
      60,
      "available",
      ["ja", "ko"]
    ),
    makeDemoSlot(
      "demo-slot-009",
      "prov-005",
      "2026-07-22",
      "10:00",
      90,
      "held",
      ["zh", "en"],
      "case-0005"
    ),
    makeDemoSlot(
      "demo-slot-010",
      "prov-005",
      "2026-07-23",
      "14:30",
      60,
      "available",
      ["zh", "en", "ko"]
    ),
  ];
}

function statusClass(status: SlotStatus) {
  if (status === "available") return "border-teal-200 bg-teal-50 text-teal-900";
  if (status === "held") return "border-coral-200 bg-coral-50 text-coral-900";
  if (status === "booked") return "border-ink-300 bg-ink-100 text-ink-900";
  return "border-ink-200 bg-white text-ink-500";
}

function slotStatusLabel(status: SlotStatus) {
  if (status === "available") return "예약 가능";
  if (status === "held") return "임시 홀드";
  if (status === "booked") return "예약 확정";
  return "비활성";
}

function notificationLabel(template: string) {
  const labels: Record<string, string> = {
    slot_hold_created: "슬롯 홀드 안내",
    booking_confirmed_patient: "환자 예약 확정",
    booking_confirmed_provider: "병원 예약 확정",
    booking_reminder_24h: "24시간 전 리마인더",
  };
  return labels[template] ?? template;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "ok" && "border-teal-200 bg-teal-50",
        tone === "warn" && "border-coral-200 bg-coral-50",
        tone === "neutral" && "border-ink-200 bg-white"
      )}
    >
      <Icon
        className={cn(
          "mb-3 size-5",
          tone === "ok"
            ? "text-teal-700"
            : tone === "warn"
              ? "text-coral-700"
              : "text-ink-500"
        )}
      />
      <div className="font-serif text-2xl text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SlotStatus }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        statusClass(status)
      )}
    >
      {slotStatusLabel(status)}
    </span>
  );
}

export default function ReservationCalendar() {
  const [opsRole] = useState(() => readOpsRole());
  const [providers, setProviders] = useState(betaProviders);
  const [cases, setCases] = useState<BetaCase[]>(betaCases);
  const [quotes, setQuotes] = useState<QuoteOption[]>(betaQuotes);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() =>
    buildDemoSlots()
  );
  const [bookings, setBookings] = useState<BookingReservation[]>([]);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [providerId, setProviderId] = useState(betaProviders[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState("2026-07-06");
  const [selectedSlotId, setSelectedSlotId] = useState("demo-slot-002");
  const [selectedCaseId, setSelectedCaseId] = useState("case-0001");
  const [selectedQuoteId, setSelectedQuoteId] = useState("quote-0001");
  const [holdMinutes, setHoldMinutes] = useState(SLOT_HOLD_MINUTES);
  const [visitType, setVisitType] = useState<VisitType>("procedure");
  const [channel, setChannel] = useState<
    "email" | "whatsapp" | "kakao" | "line" | "sms"
  >("email");
  const [adminToken] = useState(() => readAdminApiToken());
  const [apiStatus, setApiStatus] = useState<ApiStatus>(
    adminToken ? "loading" : "demo"
  );
  const [apiMessage, setApiMessage] = useState(
    adminToken ? "Supabase 예약 캘린더 연결 중..." : "데모 예약 캘린더"
  );
  const [busy, setBusy] = useState<BusyAction>(adminToken ? "refresh" : null);
  const [newSlotDate, setNewSlotDate] = useState("2026-07-06");
  const [newSlotTime, setNewSlotTime] = useState("09:00");
  const [newSlotDuration, setNewSlotDuration] = useState(60);
  const [newSlotLanguages, setNewSlotLanguages] = useState("ja,en,ko");
  const canCreateSlots = opsRole === "admin" || opsRole === "provider";
  const canManageReservations = opsRole === "admin";

  const providerById = useMemo(
    () => new Map(providers.map(provider => [provider.id, provider])),
    [providers]
  );
  const selectedProvider = providerById.get(providerId) ?? providers[0];
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const liveMode = Boolean(adminToken && apiStatus === "live");

  const slotsForProvider = useMemo(
    () => slots.filter(slot => slot.providerId === providerId),
    [providerId, slots]
  );
  const slotsByDay = useMemo(() => {
    const daySet = new Set(days);
    const map = new Map<string, AvailabilitySlot[]>();
    for (const day of days) map.set(day, []);
    for (const slot of slotsForProvider) {
      const key = dateKeyFromParts(slot.startsAt);
      if (daySet.has(key)) map.get(key)?.push(slot);
    }
    Array.from(map.values()).forEach((list: AvailabilitySlot[]) => {
      list.sort(
        (a: AvailabilitySlot, b: AvailabilitySlot) =>
          Date.parse(a.startsAt) - Date.parse(b.startsAt)
      );
    });
    return map;
  }, [days, slotsForProvider]);

  const selectedSlot =
    slots.find(slot => slot.id === selectedSlotId) ?? slotsForProvider[0];
  const quoteCaseIdsForProvider = useMemo(
    () =>
      new Set(
        quotes
          .filter(quote => quote.providerId === providerId)
          .map(quote => quote.caseId)
      ),
    [providerId, quotes]
  );
  const eligibleCases = useMemo(() => {
    const filtered = cases.filter(
      row =>
        row.matchedProviderId === providerId ||
        quoteCaseIdsForProvider.has(row.id)
    );
    return filtered.length ? filtered : cases;
  }, [cases, providerId, quoteCaseIdsForProvider]);
  const quoteOptions = useMemo(() => {
    const filtered = quotes.filter(
      quote =>
        quote.caseId === selectedCaseId && quote.providerId === providerId
    );
    return filtered.length
      ? filtered
      : quotes.filter(quote => quote.caseId === selectedCaseId);
  }, [providerId, quotes, selectedCaseId]);
  const selectedCase =
    cases.find(row => row.id === selectedCaseId) ?? eligibleCases[0];
  const selectedQuote =
    quoteOptions.find(quote => quote.id === selectedQuoteId) ?? quoteOptions[0];

  const metrics = useMemo(() => {
    const providerSlots = slots.filter(slot => slot.providerId === providerId);
    const holdExpiring = providerSlots.filter(
      slot =>
        slot.status === "held" &&
        slot.holdExpiresAt &&
        Date.parse(slot.holdExpiresAt) - Date.now() <= 20 * 60 * 1000
    ).length;
    return {
      available: providerSlots.filter(slot => slot.status === "available")
        .length,
      held: providerSlots.filter(slot => slot.status === "held").length,
      booked: providerSlots.filter(slot => slot.status === "booked").length,
      holdExpiring,
    };
  }, [providerId, slots]);

  function appendNotifications(results?: NotificationResult[]) {
    if (!results?.length) return;
    setNotifications(current => [
      ...results.map(result => ({
        id: result.notificationId,
        caseId: selectedCaseId,
        quoteId: selectedQuoteId,
        bookingId: undefined,
        template: "api_notification",
        channel,
        status: result.status,
      })),
      ...current,
    ]);
  }

  function addLocalNotification(
    template: string,
    status: NotificationResult["status"] = "queued",
    bookingId?: string,
    sendAfter?: string
  ) {
    setNotifications(current => [
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        caseId: selectedCaseId,
        quoteId: selectedQuoteId,
        bookingId,
        template,
        channel,
        status,
        sendAfter,
      },
      ...current,
    ]);
  }

  function upsertSlot(slot: AvailabilitySlot) {
    setSlots(current => {
      const exists = current.some(item => item.id === slot.id);
      if (exists)
        return current.map(item => (item.id === slot.id ? slot : item));
      return [slot, ...current];
    });
    setSelectedSlotId(slot.id);
  }

  function applySnapshot(
    snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>
  ) {
    if (snapshot.providers.length) {
      setProviders(snapshot.providers);
      setProviderId(current =>
        snapshot.providers.some(provider => provider.id === current)
          ? current
          : (snapshot.providers[0]?.id ?? "")
      );
    }
    if (snapshot.cases.length) setCases(snapshot.cases);
    if (snapshot.quotes) setQuotes(snapshot.quotes);
    setSlots(snapshot.availabilitySlots ?? []);
    setBookings(snapshot.bookings ?? []);
    setApiStatus("live");
    setApiMessage(
      `Supabase 연결됨: 슬롯 ${snapshot.availabilitySlots?.length ?? 0}개 / 예약 ${snapshot.bookings?.length ?? 0}건`
    );
    setBusy(null);
  }

  async function refreshOps(token = adminToken) {
    if (!token) return;
    setBusy("refresh");
    setApiStatus("loading");
    setApiMessage("예약 슬롯과 예약 목록을 불러오는 중...");
    try {
      applySnapshot(await fetchPartnerMvpSnapshot(token));
    } catch (error) {
      setApiStatus("error");
      setApiMessage(
        error instanceof Error ? error.message : "예약 캘린더 연결 실패"
      );
      setBusy(null);
    }
  }

  useEffect(() => {
    if (adminToken) void refreshOps(adminToken);
  }, [adminToken]);

  useEffect(() => {
    if (selectedProvider && selectedProvider.id !== providerId)
      setProviderId(selectedProvider.id);
  }, [providerId, selectedProvider]);

  useEffect(() => {
    if (
      eligibleCases.length &&
      !eligibleCases.some(row => row.id === selectedCaseId)
    ) {
      setSelectedCaseId(eligibleCases[0].id);
    }
  }, [eligibleCases, selectedCaseId]);

  useEffect(() => {
    if (
      quoteOptions.length &&
      !quoteOptions.some(quote => quote.id === selectedQuoteId)
    ) {
      setSelectedQuoteId(quoteOptions[0].id);
    }
  }, [quoteOptions, selectedQuoteId]);

  async function createSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateSlots || !selectedProvider) return;

    const startsAt = makeKstIso(newSlotDate, newSlotTime);
    const endsAt = addMinutesIso(startsAt, newSlotDuration);
    const languageSupport = newSlotLanguages
      .split(",")
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);

    setBusy("create");
    try {
      if (liveMode) {
        const result = await createAvailabilitySlotMvp(adminToken, {
          providerId,
          startsAt,
          endsAt,
          languageSupport,
          status: "available",
        });
        if (result.slot) upsertSlot(result.slot);
        setApiMessage("예약 슬롯이 생성되었습니다.");
      } else {
        const slot = makeDemoSlot(
          `demo-slot-${Date.now()}`,
          providerId,
          newSlotDate,
          newSlotTime,
          newSlotDuration,
          "available",
          languageSupport
        );
        upsertSlot(slot);
        setApiMessage("데모 슬롯이 생성되었습니다.");
      }
      setWeekStart(newSlotDate);
    } catch (error) {
      setApiStatus(liveMode ? "error" : "demo");
      setApiMessage(error instanceof Error ? error.message : "슬롯 생성 실패");
    } finally {
      setBusy(null);
    }
  }

  async function holdSelectedSlot() {
    if (!canManageReservations) return;
    if (!selectedSlot || !selectedCase) return;
    setBusy("hold");
    try {
      if (liveMode) {
        const result = await holdAvailabilitySlotMvp(adminToken, {
          slotId: selectedSlot.id,
          caseId: selectedCase.id,
          quoteId: selectedQuote?.id,
          holdMinutes,
          channel,
        });
        if (result.slot) upsertSlot(result.slot);
        appendNotifications(result.notifications);
      } else {
        upsertSlot({
          ...selectedSlot,
          status: "held",
          holdCaseId: selectedCase.id,
          holdQuoteId: selectedQuote?.id ?? null,
          holdExpiresAt: new Date(
            Date.now() + holdMinutes * 60 * 1000
          ).toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addLocalNotification("slot_hold_created", "queued");
      }
      setApiMessage(`${holdMinutes}분 임시 홀드가 걸렸습니다.`);
    } catch (error) {
      setApiStatus(liveMode ? "error" : "demo");
      setApiMessage(error instanceof Error ? error.message : "임시 홀드 실패");
    } finally {
      setBusy(null);
    }
  }

  async function releaseSelectedSlot() {
    if (!canManageReservations) return;
    if (!selectedSlot) return;
    setBusy("release");
    try {
      if (liveMode) {
        const result = await releaseAvailabilitySlotMvp(adminToken, {
          slotId: selectedSlot.id,
          caseId: selectedCase?.id,
          quoteId: selectedQuote?.id,
        });
        if (result.slot) upsertSlot(result.slot);
      } else {
        upsertSlot({
          ...selectedSlot,
          status: "available",
          holdCaseId: null,
          holdQuoteId: null,
          holdExpiresAt: null,
          updatedAt: new Date().toISOString(),
        });
      }
      setApiMessage("임시 홀드가 해제되었습니다.");
    } catch (error) {
      setApiStatus(liveMode ? "error" : "demo");
      setApiMessage(error instanceof Error ? error.message : "홀드 해제 실패");
    } finally {
      setBusy(null);
    }
  }

  async function confirmSelectedBooking() {
    if (!canManageReservations) return;
    if (!selectedSlot || !selectedCase || !selectedQuote) return;
    setBusy("confirm");
    try {
      if (liveMode) {
        const result = await confirmHeldBookingMvp(adminToken, {
          slotId: selectedSlot.id,
          caseId: selectedCase.id,
          quoteId: selectedQuote.id,
          visitType,
          channel,
        });
        if (result.slot) upsertSlot(result.slot);
        if (result.booking)
          setBookings(current => [
            result.booking!,
            ...current.filter(item => item.id !== result.booking!.id),
          ]);
        appendNotifications(result.notifications);
      } else {
        const booking: BookingReservation = {
          id: `demo-booking-${Date.now()}`,
          caseId: selectedCase.id,
          quoteId: selectedQuote.id,
          providerId,
          scheduledAt: selectedSlot.startsAt,
          visitType,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBookings(current => [booking, ...current]);
        upsertSlot({
          ...selectedSlot,
          status: "booked",
          holdCaseId: null,
          holdQuoteId: null,
          holdExpiresAt: null,
          updatedAt: new Date().toISOString(),
        });
        addLocalNotification("booking_confirmed_patient", "queued", booking.id);
        addLocalNotification(
          "booking_confirmed_provider",
          "queued",
          booking.id
        );
        const reminderAt = new Date(
          Date.parse(selectedSlot.startsAt) - DAY_MS
        ).toISOString();
        if (Date.parse(reminderAt) > Date.now())
          addLocalNotification(
            "booking_reminder_24h",
            "queued",
            booking.id,
            reminderAt
          );
      }
      setApiMessage("예약이 확정되고 자동 알림이 큐에 등록되었습니다.");
    } catch (error) {
      setApiStatus(liveMode ? "error" : "demo");
      setApiMessage(error instanceof Error ? error.message : "예약 확정 실패");
    } finally {
      setBusy(null);
    }
  }

  const canHold =
    canManageReservations &&
    (selectedSlot?.status === "available" || selectedSlot?.status === "held");
  const canRelease = canManageReservations && selectedSlot?.status === "held";
  const canConfirm =
    canManageReservations &&
    Boolean(
      selectedSlot &&
      selectedCase &&
      selectedQuote &&
      selectedSlot.status !== "booked" &&
      selectedSlot.status !== "unavailable"
    );

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-8">
          <Link
            href="/admin/quote-booking"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
          >
            <ArrowLeft className="size-4" />
            견적/예약 관리
          </Link>
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <CalendarClock className="size-4" />
                슬롯 캘린더
              </div>
              <h1 className="font-serif text-5xl text-ink-950">
                예약 슬롯 / 임시 홀드 / 자동 알림
              </h1>
              <p className="mt-3 max-w-3xl text-ink-600">
                병원별 가능 시간을 캘린더로 열고, 환자 케이스에 15분 홀드를 건
                뒤, 예약 확정과 리마인더 알림까지 한 흐름으로 처리합니다.
              </p>
            </div>
            <div className="rounded-lg border border-ink-200 bg-white p-3 sm:min-w-[420px]">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-ink-500">
                <Database className="size-3.5" />
                운영 데이터
              </div>
              <div className="flex items-center justify-between gap-3">
                <div
                  className={cn(
                    "text-xs font-semibold",
                    apiStatus === "error"
                      ? "text-coral-700"
                      : liveMode
                        ? "text-teal-700"
                        : "text-ink-500"
                  )}
                >
                  {apiMessage}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshOps()}
                  disabled={!adminToken || busy === "refresh"}
                  className="border-ink-300 text-ink-800"
                >
                  {busy === "refresh" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RotateCw className="size-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 text-xs font-semibold text-ink-500">
                이메일 인증 세션으로 예약 API에 연결합니다.
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard
              icon={CalendarDays}
              label="예약 가능 슬롯"
              value={String(metrics.available)}
              tone="ok"
            />
            <MetricCard
              icon={Hourglass}
              label="임시 홀드"
              value={String(metrics.held)}
              tone={metrics.held ? "warn" : "neutral"}
            />
            <MetricCard
              icon={CalendarCheck}
              label="확정 예약"
              value={String(metrics.booked)}
              tone="ok"
            />
            <MetricCard
              icon={BellRing}
              label="만료 임박 홀드"
              value={String(metrics.holdExpiring)}
              tone={metrics.holdExpiring ? "warn" : "neutral"}
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-8 md:py-10">
        <div className="container-wide grid gap-6 xl:grid-cols-[1fr_430px]">
          <div className="grid gap-5">
            <div className="rounded-lg border border-ink-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700 lg:min-w-[320px]">
                  병원
                  <select
                    value={providerId}
                    onChange={event => setProviderId(event.target.value)}
                    className="h-11 rounded-md border border-ink-200 bg-white px-3"
                  >
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWeekStart(addDays(weekStart, -7))}
                    className="border-ink-300 text-ink-800"
                  >
                    이전 주
                  </Button>
                  <div className="rounded-md border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-800">
                    {displayDate(days[0])} - {displayDate(days[6])}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWeekStart(addDays(weekStart, 7))}
                    className="border-ink-300 text-ink-800"
                  >
                    다음 주
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-sm text-ink-500">
                {selectedProvider?.region} / {selectedProvider?.specialty} /{" "}
                {languageListLabel(selectedProvider?.languages ?? [])}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-ink-200">
              <div className="grid border-b border-ink-200 bg-ink-50 md:grid-cols-7">
                {days.map(day => (
                  <div
                    key={day}
                    className="border-b border-ink-100 px-3 py-3 text-sm font-semibold text-ink-800 md:border-b-0 md:border-r last:border-r-0"
                  >
                    {displayDate(day)}
                  </div>
                ))}
              </div>
              <div className="grid bg-white md:grid-cols-7">
                {days.map(day => {
                  const daySlots = slotsByDay.get(day) ?? [];
                  return (
                    <div
                      key={day}
                      className="min-h-[280px] border-b border-ink-100 p-3 md:border-b-0 md:border-r last:border-r-0"
                    >
                      <div className="grid gap-2">
                        {daySlots.length ? (
                          daySlots.map(slot => {
                            const selected = selectedSlot?.id === slot.id;
                            const holdLeft =
                              slot.status === "held" && slot.holdExpiresAt
                                ? Math.max(
                                    0,
                                    Math.ceil(
                                      (Date.parse(slot.holdExpiresAt) -
                                        Date.now()) /
                                        60000
                                    )
                                  )
                                : null;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={cn(
                                  "min-h-[104px] rounded-lg border p-3 text-left transition-colors",
                                  statusClass(slot.status),
                                  selected &&
                                    "ring-2 ring-teal-500 ring-offset-2"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-ink-950">
                                    {displayTime(slot.startsAt)}
                                  </div>
                                  <StatusBadge status={slot.status} />
                                </div>
                                <div className="mt-2 text-xs text-ink-600">
                                  {slotDuration(slot)}분 /{" "}
                                  {slot.languageSupport.join(", ") ||
                                    "언어 미정"}
                                </div>
                                {holdLeft !== null && (
                                  <div className="mt-2 text-xs font-semibold text-coral-800">
                                    홀드 {holdLeft}분 남음
                                  </div>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
                            슬롯 없음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={createSlot}
              className={cn(
                "rounded-lg border border-ink-200 bg-ink-50 p-4",
                !canCreateSlots && "hidden"
              )}
            >
              <div className="mb-4 flex items-center gap-2">
                <Plus className="size-4 text-teal-700" />
                <h2 className="font-serif text-2xl text-ink-950">슬롯 생성</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.8fr_1fr_auto] md:items-end">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  날짜
                  <input
                    type="date"
                    value={newSlotDate}
                    onChange={event => setNewSlotDate(event.target.value)}
                    className="h-10 rounded-md border border-ink-200 bg-white px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  시작
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={event => setNewSlotTime(event.target.value)}
                    className="h-10 rounded-md border border-ink-200 bg-white px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  길이
                  <select
                    value={newSlotDuration}
                    onChange={event =>
                      setNewSlotDuration(Number(event.target.value))
                    }
                    className="h-10 rounded-md border border-ink-200 bg-white px-3"
                  >
                    <option value={30}>30분</option>
                    <option value={45}>45분</option>
                    <option value={60}>60분</option>
                    <option value={90}>90분</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  언어
                  <input
                    value={newSlotLanguages}
                    onChange={event => setNewSlotLanguages(event.target.value)}
                    className="h-10 rounded-md border border-ink-200 bg-white px-3"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={busy === "create" || !canCreateSlots}
                  className="bg-teal-700 text-white hover:bg-teal-800"
                >
                  {busy === "create" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  생성
                </Button>
              </div>
            </form>
          </div>

          <aside className="grid gap-5 self-start">
            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl text-ink-950">
                    선택 슬롯
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    {selectedSlot
                      ? displayLongDateTime(selectedSlot.startsAt)
                      : "슬롯을 선택하세요"}
                  </p>
                </div>
                {selectedSlot && <StatusBadge status={selectedSlot.status} />}
              </div>

              {selectedSlot ? (
                <div className="grid gap-4">
                  <div className="rounded-md bg-ink-50 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-ink-950">
                      <Clock3 className="size-4 text-teal-700" />
                      {displayTime(selectedSlot.startsAt)} -{" "}
                      {displayTime(selectedSlot.endsAt)}
                    </div>
                    <div className="mt-1 text-ink-500">
                      {slotDuration(selectedSlot)}분 /{" "}
                      {selectedSlot.languageSupport.join(", ") || "언어 미정"}
                    </div>
                    {selectedSlot.holdExpiresAt && (
                      <div className="mt-2 text-xs font-semibold text-coral-700">
                        홀드 만료{" "}
                        {displayLongDateTime(selectedSlot.holdExpiresAt)}
                      </div>
                    )}
                  </div>

                  <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                    케이스
                    <select
                      value={selectedCaseId}
                      onChange={event => setSelectedCaseId(event.target.value)}
                      className="h-11 rounded-md border border-ink-200 bg-white px-3"
                    >
                      {eligibleCases.map(row => (
                        <option key={row.id} value={row.id}>
                          {row.id} / {row.patientAlias} /{" "}
                          {caseStatusLabel(row.status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                    견적
                    <select
                      value={selectedQuoteId}
                      onChange={event => setSelectedQuoteId(event.target.value)}
                      className="h-11 rounded-md border border-ink-200 bg-white px-3"
                    >
                      {quoteOptions.length ? (
                        quoteOptions.map(quote => (
                          <option key={quote.id} value={quote.id}>
                            {quote.id} / {statusLabel(quote.status)} / 보증금 $
                            {quote.depositAmountUsd}
                          </option>
                        ))
                      ) : (
                        <option value="">견적 없음</option>
                      )}
                    </select>
                  </label>

                  <div
                    className={cn(
                      "grid grid-cols-2 gap-3",
                      !canManageReservations && "hidden"
                    )}
                  >
                    <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                      홀드 시간
                      <select
                        value={holdMinutes}
                        onChange={event =>
                          setHoldMinutes(Number(event.target.value))
                        }
                        className="h-11 rounded-md border border-ink-200 bg-white px-3"
                      >
                        <option value={10}>10분</option>
                        <option value={15}>15분</option>
                        <option value={30}>30분</option>
                        <option value={60}>60분</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                      방문 유형
                      <select
                        value={visitType}
                        onChange={event =>
                          setVisitType(event.target.value as VisitType)
                        }
                        className="h-11 rounded-md border border-ink-200 bg-white px-3"
                      >
                        <option value="consultation">상담</option>
                        <option value="procedure">시술</option>
                        <option value="surgery">수술</option>
                        <option value="checkup">검진</option>
                      </select>
                    </label>
                  </div>

                  <label
                    className={cn(
                      "grid gap-1.5 text-sm font-medium text-ink-700",
                      !canManageReservations && "hidden"
                    )}
                  >
                    알림 채널
                    <select
                      value={channel}
                      onChange={event =>
                        setChannel(event.target.value as typeof channel)
                      }
                      className="h-11 rounded-md border border-ink-200 bg-white px-3"
                    >
                      <option value="email">Email</option>
                      <option value="line">LINE</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="kakao">Kakao</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>

                  <div
                    className={cn(
                      "grid gap-2",
                      !canManageReservations && "hidden"
                    )}
                  >
                    <Button
                      type="button"
                      onClick={holdSelectedSlot}
                      disabled={!canHold || busy === "hold"}
                      className="bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300"
                    >
                      {busy === "hold" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="size-4" />
                      )}
                      임시 홀드
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={releaseSelectedSlot}
                        disabled={!canRelease || busy === "release"}
                        className="border-ink-300 text-ink-800"
                      >
                        {busy === "release" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <UnlockKeyhole className="size-4" />
                        )}
                        홀드 해제
                      </Button>
                      <Button
                        type="button"
                        onClick={confirmSelectedBooking}
                        disabled={!canConfirm || busy === "confirm"}
                        className="bg-ink-950 text-white hover:bg-ink-800 disabled:bg-ink-300"
                      >
                        {busy === "confirm" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        예약 확정
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
                  선택 가능한 슬롯이 없습니다.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5 text-teal-700" />
                <h2 className="font-serif text-2xl text-ink-950">예약 체인</h2>
              </div>
              <div className="grid gap-3">
                {bookings
                  .filter(booking => booking.providerId === providerId)
                  .slice(0, 5)
                  .map(booking => (
                    <div
                      key={booking.id}
                      className="rounded-md border border-ink-200 bg-ink-50 p-3 text-sm"
                    >
                      <div className="font-semibold text-ink-950">
                        {displayLongDateTime(booking.scheduledAt)}
                      </div>
                      <div className="mt-1 text-ink-500">
                        {booking.caseId} / {booking.visitType} /{" "}
                        {statusLabel(booking.status)}
                      </div>
                    </div>
                  ))}
                {!bookings.filter(booking => booking.providerId === providerId)
                  .length && (
                  <div className="rounded-md border border-dashed border-ink-200 p-4 text-sm text-ink-400">
                    확정 예약 없음
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BellRing className="size-5 text-coral-700" />
                <h2 className="font-serif text-2xl text-ink-950">알림 큐</h2>
              </div>
              <div className="grid gap-3">
                {notifications.slice(0, 6).map(notification => (
                  <div
                    key={notification.id}
                    className="rounded-md border border-ink-200 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-ink-950">
                        {notificationLabel(notification.template)}
                      </div>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-semibold",
                          notification.status === "sent"
                            ? "border-teal-200 bg-teal-50 text-teal-800"
                            : "border-coral-200 bg-coral-50 text-coral-800"
                        )}
                      >
                        {statusLabel(notification.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      {notification.caseId} / {notification.channel}
                    </div>
                    {notification.sendAfter && (
                      <div className="mt-1 text-xs text-coral-700">
                        예약 발송 {displayLongDateTime(notification.sendAfter)}
                      </div>
                    )}
                  </div>
                ))}
                {!notifications.length && (
                  <div className="rounded-md border border-dashed border-ink-200 p-4 text-sm text-ink-400">
                    알림 이벤트 없음
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
