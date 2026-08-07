import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Edit3,
  Lock,
  FastForward,
  Trash2,
  RotateCcw,
  Pencil,
  ListChecks,
  Scale,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trophy,
  Medal,
  Users,
  Plus,
  Calendar,
  Rocket,
  PlayCircle,
  Info,
  Layers,
  History,
  CalendarClock,
  UserMinus,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../lib/api/apiClient";
import { eventApi, pickId } from "../../lib/api/eventApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { roundApi } from "../../lib/api/roundApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";

import {
  extractSetList,
  itemCriteriaId,
  itemScore,
  getServerMsg,
  sumWeight,
  DEFAULT_CRITERIA_DESCRIPTION,
  getList,
  grabSetId,
} from "../../lib/utils/criteriaHelpers";
import {
  getEventPhase,
  canEditStructure,
  canPublish,
  isPublishingEarly,
  isRegistrationOverdue,
  getRegistrationWindow,
  PHASE_LABEL,
  type EventPhase,
} from "../../lib/utils/eventLifecycle";
import { showApiError } from "../../lib/utils/apiError";
import { isInactiveRecord, sameRecordId } from "../../lib/utils/softDelete";
import { PrizesSection } from "./eventDetails/PrizesSection";
import { AuditLogsSection } from "./eventDetails/AuditLogsSection";
import { TeamsSection } from "./eventDetails/TeamsSection";
import { StaffSection } from "./eventDetails/StaffSection";

const isNotFoundError = (e: any): boolean => {
  if (e?.response?.status === 404) return true;
  const msg = getServerMsg(e).toLowerCase();
  return msg.includes("not found") || msg.includes("không tìm thấy");
};

const toDatetimeLocalValue = (isoStr: string): string => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDateTime = (isoStr: string): string => {
  if (!isoStr) return "N/A";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "N/A";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toDateInput = (d: Date | null) =>
  d ? toDatetimeLocalValue(d.toISOString()) : "";

type TabId =
  | "overview"
  | "tracks"
  | "rounds"
  | "rubrics"
  | "teams"
  | "staff"
  | "leaderboard"
  | "prizes"
  | "audit";

/**
 * Giá trị `min` cho mọi ô datetime-local: không cho chọn thời điểm trong quá khứ.
 * Trình duyệt chỉ chặn được ở mức stepper/validation nên chỗ nào quan trọng vẫn
 * phải kiểm lại trong preConfirm.
 */
const nowForInput = () => toDatetimeLocalValue(new Date().toISOString());

const isPastInput = (value: string) =>
  !!value && new Date(value).getTime() < Date.now();

/**
 * Đổi `event.currentRound` sang vị trí trong mảng `eventRounds`.
 *
 * ⚠️ currentRound VÀ roundIndex đều đánh số TỪ 1 (xem đầu file eventLifecycle.ts
 * và CreateEvents.tsx:1684), nên KHÔNG được dùng thẳng currentRound làm index.
 * loadTeamsAndScores trước đây làm đúng như vậy nên lệch một vòng: leaderboard
 * liệt kê đội của vòng SAU vòng đang thi. Vòng đó chưa có đội nào (auto-transition
 * mới là thứ tạo ra chúng) nên bảng rỗng, mà nút chuyển vòng lại tự tắt khi bảng
 * rỗng — admin kẹt luôn, không qua vòng được.
 *
 * Cả ba chỗ cần quy đổi đều phải đi qua hàm này; tự tính lại là lệch tiếp.
 * Trả -1 khi sự kiện chưa vào vòng nào (draft/đang mở đăng ký).
 */
const findCurrentRoundIndex = (rounds: any[], currentRound: any): number => {
  if (rounds.length === 0) return -1;
  const raw = Number(currentRound);
  if (!Number.isFinite(raw)) return -1;

  const matched = rounds.findIndex(
    (r: any) => Number(r.roundIndex ?? r.RoundIndex) === raw,
  );
  if (matched !== -1) return matched;

  // Không khớp roundIndex nào: lùi về quy ước, và kẹp lại cho sự kiện đã qua
  // vòng cuối (currentRound lúc đó vượt tổng số vòng) để vẫn ra vòng chung kết.
  const fallback = raw - 1;
  if (fallback < 0) return -1;
  return Math.min(fallback, rounds.length - 1);
};

export function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tracks, setTracks] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [criteriaSets, setCriteriaSets] = useState<any[]>([]);
  const [deletedCriteria, setDeletedCriteria] = useState<any[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const deletedSetIdsRef = useRef<Set<string>>(new Set());
  // Mốc đăng ký ĐANG lưu trên server. Ràng buộc "không được chọn quá khứ" chỉ áp
  // cho giá trị admin vừa đổi — chặn cả mốc cũ thì sự kiện tạo lâu rồi không sao
  // bấm Save nổi nữa.
  const serverRegRef = useRef<{ start?: string; end?: string }>({});

  const [eventRounds, setEventRounds] = useState<any[]>([]);
  // Toàn bộ vòng của hệ thống — audit log dùng làm phương án cuối để tra tên vòng.
  const [systemRounds, setSystemRounds] = useState<any[]>([]);
  const [roundTeams, setRoundTeams] = useState<any[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  // Danh sách đội gộp từ MỌI vòng — audit log cần cả những đội đã bị loại ở
  // vòng trước, không chỉ đội của vòng hiện tại.
  const [allTeams, setAllTeams] = useState<
    { teamId: string; teamName: string; trackId: string }[]
  >([]);
  /**
   * Từng bản ghi TeamInRound của sự kiện, KHÔNG khử trùng theo đội.
   * Bài nộp trả về chỉ mang teamInRoundId; audit log cần bảng tra này để đổi nó
   * ra đội/vòng/bảng, nếu không thì không biết bài nộp nào thuộc sự kiện nào.
   */
  const [teamInRounds, setTeamInRounds] = useState<
    {
      teamInRoundId: string;
      teamId: string;
      teamName: string;
      roundId: string;
      trackId: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        if (id) {
          const eventData = await eventApi.getEventById(id);
          setEvent(eventData);
          const serverWindow = getRegistrationWindow(eventData);
          serverRegRef.current = {
            start: serverWindow.start?.toISOString(),
            end: serverWindow.end?.toISOString(),
          };

          const allTracks = await trackTopicApi.getAllTracks();
          const allTopics = await trackTopicApi.getAllTopics();

          const eventTracks = allTracks
            .filter(
              (t: any) =>
                String(t.eventId || t.eventID) === String(id) &&
                !isInactiveRecord(t),
            )
            .map((t: any) => ({
              ...t,
              topics: allTopics.filter(
                (top: any) =>
                  String(top.trackID || top.trackId) ===
                    String(t.trackID || t.trackId) && !isInactiveRecord(top),
              ),
            }));
          setTracks(eventTracks);
        }
      } catch (error) {
        setLoadError(
          "Unable to load event details from the server. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventDetails();
  }, [id, reloadKey]);

  useEffect(() => {
    const loadTeamsAndScores = async () => {
      if (!event || eventRounds.length === 0) return;

      const targetRoundIndex = findCurrentRoundIndex(
        eventRounds,
        event.currentRound,
      );
      if (targetRoundIndex < 0) return;

      const currentRoundObj = eventRounds[targetRoundIndex];
      const roundId =
        currentRoundObj.roundID ||
        currentRoundObj.roundId ||
        currentRoundObj.id;

      setIsLoadingTeams(true);
      try {
        const res = await apiClient.get(
          `/api/TeamInRound/details/round/${roundId}`,
        );
        const teams = getList(res.data);

        const trackIds = Array.from(
          new Set(
            teams
              .map((t) => String(t.trackId || t.trackID))
              .filter((id) => id && id !== "undefined"),
          ),
        );

        const leaderboards = await Promise.all(
          trackIds.map((tid) =>
            leaderboardApi
              .getLeaderboardByRoundAndTrack(roundId, tid)
              .catch(() => []),
          ),
        );

        const allScores = leaderboards.flat();

        const enrichedTeams = teams.map((t: any) => {
          const scoreData = allScores.find((s: any) => {
            const sInRoundId = String(
              s.teamInRoundId || s.teamInRoundID || s.id || "",
            ).toLowerCase();
            const tInRoundId = String(
              t.teamInRoundId || t.teamInRoundID || t.id || "",
            ).toLowerCase();

            const sTeamId = String(s.teamId || s.teamID || "").toLowerCase();
            const tTeamId = String(t.teamId || t.teamID || "").toLowerCase();

            const matchInRoundId =
              sInRoundId &&
              sInRoundId !== "undefined" &&
              sInRoundId === tInRoundId;
            const matchTeamId =
              sTeamId && sTeamId !== "undefined" && sTeamId === tTeamId;
            const matchName =
              s.teamName && s.teamName === (t.teamName || t.name);

            return matchInRoundId || matchTeamId || matchName;
          });

          return {
            ...t,
            score: Number(t.score ?? scoreData?.score ?? 0),
          };
        });

        enrichedTeams.sort((a, b) => b.score - a.score);
        setRoundTeams(enrichedTeams);
      } catch (error) {
        console.error("Error fetching teams and scores", error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    loadTeamsAndScores();
  }, [event, eventRounds, reloadKey]);

  // Gom danh sách đội của tất cả các vòng, khử trùng theo teamId.
  useEffect(() => {
    const loadAllTeams = async () => {
      if (eventRounds.length === 0) {
        setAllTeams([]);
        setTeamInRounds([]);
        return;
      }
      const roundIds = eventRounds.map((r) =>
        String(r.roundID || r.roundId || r.id || ""),
      );
      const results = await Promise.allSettled(
        roundIds.map((rid) =>
          apiClient.get(`/api/TeamInRound/details/round/${rid}`),
        ),
      );
      // Giữ luôn trackId: audit log chỉ mang roundId, còn bảng thi của một đội
      // thì TeamInRound mới biết — đây là chỗ duy nhất ghép được hai thứ đó.
      const seen = new Map<string, { teamName: string; trackId: string }>();
      const rows: {
        teamInRoundId: string;
        teamId: string;
        teamName: string;
        roundId: string;
        trackId: string;
      }[] = [];
      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return;
        getList(res.value.data).forEach((t: any) => {
          const tid = String(t.teamId ?? t.teamID ?? "");
          if (!tid || tid === "undefined") return;
          const trackId = String(t.trackId ?? t.trackID ?? "");
          const cleanTrackId = trackId === "undefined" ? "" : trackId;
          const teamName = t.teamName ?? t.name ?? `Team ${tid.slice(0, 6)}`;
          const teamInRoundId = String(
            t.teamInRoundID ?? t.teamInRoundId ?? t.id ?? "",
          );
          if (teamInRoundId && teamInRoundId !== "undefined") {
            rows.push({
              teamInRoundId,
              teamId: tid,
              teamName,
              // roundId lấy từ chính vòng vừa hỏi: payload TeamInRound không
              // chắc có trả lại roundId.
              roundId: String(t.roundId ?? t.roundID ?? roundIds[i] ?? ""),
              trackId: cleanTrackId,
            });
          }
          const prev = seen.get(tid);
          if (!prev) {
            seen.set(tid, { teamName, trackId: cleanTrackId });
          } else if (!prev.trackId && cleanTrackId) {
            prev.trackId = cleanTrackId;
          }
        });
      });
      setAllTeams(
        Array.from(seen, ([teamId, info]) => ({ teamId, ...info })),
      );
      setTeamInRounds(rows);
    };
    loadAllTeams();
  }, [eventRounds, reloadKey]);

  // --- API LÀM VIỆC VỚI LIFECYCLE MỚI ---
  const handlePublishEvent = async () => {
    const { start } = getRegistrationWindow(event);
    const early = isPublishingEarly(event);
    const result = await Swal.fire({
      title: "Publish & Open Registration?",
      html:
        "This will officially open the registration form for participants. <br/><br/><b>WARNING:</b> This will lock all Structural Configurations (Tracks, Rounds, Rubrics). You will not be able to edit them afterward." +
        (early && start
          ? `<br/><br/><span style="color:#b45309;font-weight:700;">Heads up: registration was announced to open ${formatDisplayDateTime(start.toISOString())}. Publishing now opens it earlier than announced.</span>`
          : ""),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Publish Event",
      confirmButtonColor: "#10b981",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200",
      },
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await eventApi.publish(id!);
        Swal.fire({
          title: "Published!",
          text: "Registration is now open.",
          icon: "success",
          confirmButtonColor: "#f26f21",
        });
        setReloadKey((k) => k + 1);
      } catch (e) {
        showApiError(e, { action: "publish this event" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStartRound1 = async () => {
    const result = await Swal.fire({
      title: "Close Reg & Start Round 1?",
      html: "This will <b>permanently close the registration form</b> and lock the participant list. The competition will officially begin.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Start Competition",
      confirmButtonColor: "#f26f21",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200",
      },
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await eventApi.startRound1(id!);
        Swal.fire({
          title: "Started!",
          text: "Round 1 has officially begun.",
          icon: "success",
          confirmButtonColor: "#f26f21",
        });
        setReloadKey((k) => k + 1);
      } catch (e) {
        showApiError(e, { action: "start Round 1" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * PUT /api/Event/{id} nhận nguyên UpdateEventAPIViewModel. Gửi thiếu field nào
   * là field đó bị ghi đè rỗng, nên mọi lần cập nhật đều phải dựng lại đầy đủ
   * hồ sơ sự kiện từ state rồi mới chồng phần thay đổi lên.
   */
  const buildEventPayload = (patch: Record<string, any> = {}) => {
    const { start, end } = getRegistrationWindow(event);
    return {
      eventName: event.name,
      season: event.semester,
      year: Number(event.year),
      // ⚠️ Giữ nguyên currentRound đang có. Rơi về 0 là vô tình publish sự kiện
      // (0 = form đăng ký đang mở) chỉ vì admin bấm Save ở tab Overview.
      currentRound: Number(event.currentRound ?? -1),
      registrationStartDate: start ? start.toISOString() : undefined,
      registrationEndDate: end ? end.toISOString() : undefined,
      minTeamMember: Number(event.minTeamMember ?? 0) || undefined,
      maxTeamMember: Number(event.maxTeamMember ?? 0) || undefined,
      ...patch,
    };
  };

  const applyEventPatch = async (
    patch: Record<string, any>,
    successText: string,
  ) => {
    setIsLoading(true);
    try {
      await eventApi.updateEvent(id!, buildEventPayload(patch) as any);
      setEvent(await eventApi.getEventById(id!));
      Swal.fire({
        icon: "success",
        title: successText,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, { action: "save this change" });
    } finally {
      setIsLoading(false);
    }
  };

  // Cứu vãn #1 khi hết hạn đăng ký mà chưa đủ đội: dời hạn.
  const handleExtendRegistration = async () => {
    const { end } = getRegistrationWindow(event);
    const { value } = await Swal.fire({
      title: "Extend registration deadline",
      html: `<div style="text-align:left;padding:0 8px;">
        <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">New closing date &amp; time</label>
        <input id="ev-regend" type="datetime-local" min="${nowForInput()}" class="swal2-input" style="width:100%;margin-top:6px;border-radius:12px;" value="${toDateInput(end)}">
      </div>`,
      showCancelButton: true,
      confirmButtonText: "Extend",
      confirmButtonColor: "#f26f21",
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () => {
        const v = (document.getElementById("ev-regend") as HTMLInputElement)
          .value;
        if (!v) {
          Swal.showValidationMessage("Please pick a new deadline");
          return false;
        }
        if (new Date(v) <= new Date()) {
          Swal.showValidationMessage("The new deadline must be in the future");
          return false;
        }
        return new Date(v).toISOString();
      },
    });
    if (!value) return;
    await applyEventPatch(
      { registrationEndDate: value },
      "Registration extended!",
    );
  };

  // Cứu vãn #2: hạ số thành viên tối thiểu của một team.
  const handleRelaxTeamRequirement = async () => {
    const current = Number(event.minTeamMember ?? 1);
    const { value } = await Swal.fire({
      title: "Lower the team size requirement",
      html: `<div style="text-align:left;padding:0 8px;">
        <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Minimum members per team</label>
        <input id="ev-min" type="number" min="1" max="${Number(event.maxTeamMember ?? 99)}" class="swal2-input" style="width:100%;margin-top:6px;border-radius:12px;" value="${current}">
        <p style="font-size:11px;color:#94a3b8;margin-top:8px;">Currently ${current} — maximum is ${event.maxTeamMember ?? "—"}.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: "#f26f21",
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () => {
        const v = Number(
          (document.getElementById("ev-min") as HTMLInputElement).value,
        );
        if (!v || v < 1) {
          Swal.showValidationMessage("Minimum must be at least 1");
          return false;
        }
        if (v > Number(event.maxTeamMember ?? 99)) {
          Swal.showValidationMessage("Minimum cannot exceed the maximum");
          return false;
        }
        return v;
      },
    });
    if (!value) return;
    await applyEventPatch({ minTeamMember: value }, "Requirement updated!");
  };

  // Cứu vãn #3: hủy hẳn sự kiện (DELETE /api/Event/{id}).
  const handleDeleteEvent = async () => {
    // Nêu thẳng con số đội đang thiếu — đó là lý do admin bấm nút này.
    const shortfallNote = isShortOnTeams
      ? `<p style="margin-top:10px;color:#dc2626;font-weight:700;">Only ${teamsJoined} of the ${minTeamRequired} required teams have registered.</p>`
      : "";
    const ok = await Swal.fire({
      title: "Cancel this event?",
      html: `This deletes <b>${event.name}</b> along with its rounds and tracks. Participants will lose access immediately.${shortfallNote}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete event",
      customClass: { popup: "rounded-[2rem]" },
    });
    if (!ok.isConfirmed) return;
    try {
      setIsLoading(true);
      await eventApi.deleteEvent(id!);
      Swal.fire({
        icon: "success",
        title: "Event deleted",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/admin/events");
    } catch (e) {
      showApiError(e, { action: "delete this event" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRound = async (round: any) => {
    const startVal = toDatetimeLocalValue(round.startDate || round.StartDate);
    const endVal = toDatetimeLocalValue(round.endDate || round.EndDate);
    // Cửa sổ chấm điểm là field bắt buộc của UpdateRoundAPIViewModel. Vòng cũ
    // (tạo trước khi backend thêm field này) có thể chưa có giá trị, nên lùi về
    // hạn nộp bài để form không gửi lên chuỗi rỗng và ăn 400.
    const scoreStartVal =
      toDatetimeLocalValue(
        round.scoringStartDate || round.ScoringStartDate || "",
      ) || endVal;
    const scoreEndVal =
      toDatetimeLocalValue(round.scoringEndDate || round.ScoringEndDate || "") ||
      endVal;
    const minTeamVal = round.minTeam ?? round.MinTeam ?? 1;

    // min của mỗi ô = giá trị đang lưu nếu nó đã ở quá khứ, ngược lại là bây giờ.
    // Vòng đã diễn ra vẫn sửa được các field khác mà không bị trình duyệt bắt lỗi
    // ngay trên mốc admin không hề đụng tới.
    const now = nowForInput();
    const minFor = (current: string) =>
      current && current < now ? current : now;

    const { value: formValues } = await Swal.fire({
      title: "Edit Round Details",
      html: `
        <div style="text-align: left;">
          <label style="font-size: 11px; font-weight: bold; color: #64748b;">ROUND NAME</label>
          <input id="sw-rname" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${round.roundName}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">TOP N PROMOTION</label>
          <input id="sw-topn" type="number" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${round.topNPromotion ?? round.TopNPromotion ?? 0}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">START DATE &amp; TIME</label>
          <input id="sw-start" type="datetime-local" min="${minFor(startVal)}" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${startVal}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">SUBMISSION DEADLINE</label>
          <input id="sw-end" type="datetime-local" min="${minFor(endVal)}" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${endVal}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">JUDGING OPENS AT</label>
          <input id="sw-score-start" type="datetime-local" min="${minFor(scoreStartVal)}" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${scoreStartVal}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">JUDGING CLOSES AT</label>
          <input id="sw-score-end" type="datetime-local" min="${minFor(scoreEndVal)}" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${scoreEndVal}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 15px; display:block;">MIN TEAM</label>
          <input id="sw-minteam" type="number" min="1" class="swal2-input" style="width: 90%; margin-top: 5px;" value="${minTeamVal}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      preConfirm: () => {
        const startInput = (
          document.getElementById("sw-start") as HTMLInputElement
        ).value;
        const endInput = (document.getElementById("sw-end") as HTMLInputElement)
          .value;
        const scoreStartInput = (
          document.getElementById("sw-score-start") as HTMLInputElement
        ).value;
        const scoreEndInput = (
          document.getElementById("sw-score-end") as HTMLInputElement
        ).value;
        const minTeamInput = Number(
          (document.getElementById("sw-minteam") as HTMLInputElement).value,
        );

        if (!startInput || !endInput) {
          Swal.showValidationMessage(
            "Please select both start and end date/time",
          );
          return false;
        }
        // Chỉ chặn mốc vừa bị đổi sang quá khứ; mốc cũ giữ nguyên thì bỏ qua.
        const movedToPast = ([input, original]: [string, string]) =>
          input !== original && isPastInput(input);
        if (
          (
            [
              [startInput, startVal],
              [endInput, endVal],
              [scoreStartInput, scoreStartVal],
              [scoreEndInput, scoreEndVal],
            ] as [string, string][]
          ).some(movedToPast)
        ) {
          Swal.showValidationMessage("You cannot pick a date in the past");
          return false;
        }
        if (new Date(endInput) <= new Date(startInput)) {
          Swal.showValidationMessage(
            "End date/time must be after start date/time",
          );
          return false;
        }
        if (!scoreStartInput || !scoreEndInput) {
          Swal.showValidationMessage(
            "Please select when judging opens and closes",
          );
          return false;
        }
        if (new Date(scoreEndInput) <= new Date(scoreStartInput)) {
          Swal.showValidationMessage("Judging must close after it opens");
          return false;
        }
        if (new Date(scoreStartInput) < new Date(endInput)) {
          Swal.showValidationMessage(
            "Judging cannot start before the submission deadline",
          );
          return false;
        }
        if (!minTeamInput || minTeamInput < 1) {
          Swal.showValidationMessage("Min team must be at least 1");
          return false;
        }

        return {
          roundName: (document.getElementById("sw-rname") as HTMLInputElement)
            .value,
          topNPromotion: Number(
            (document.getElementById("sw-topn") as HTMLInputElement).value,
          ),
          startDate: new Date(startInput).toISOString(),
          endDate: new Date(endInput).toISOString(),
          scoringStartDate: new Date(scoreStartInput).toISOString(),
          scoringEndDate: new Date(scoreEndInput).toISOString(),
          minTeam: minTeamInput,
        };
      },
    });

    if (formValues) {
      try {
        const roundId = round.roundID || round.roundId || round.id;
        await apiClient.put(`/api/Round`, {
          roundID: roundId,
          eventID: id,
          roundName: formValues.roundName,
          topNPromotion: formValues.topNPromotion,
          // Không để rơi về 0: maxTeam < minTeam là cấu hình vô nghĩa và backend
          // sẽ từ chối.
          maxTeam: Number(
            round.maxTeam ?? round.MaxTeam ?? formValues.minTeam,
          ),
          roundIndex: round.roundIndex ?? round.RoundIndex,
          startDate: formValues.startDate,
          endDate: formValues.endDate,
          criteriaSetID: round.criteriaSetID || round.criteriaSetId,
          // Bắt buộc trong UpdateRoundAPIViewModel — thiếu là 400.
          minTeam: formValues.minTeam,
          scoringStartDate: formValues.scoringStartDate,
          scoringEndDate: formValues.scoringEndDate,
        });

        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1200,
          showConfirmButton: false,
        });
        loadCriteria();
      } catch (e: any) {
        showApiError(e, { action: "update this round" });
      }
    }
  };

  /**
   * Thêm một vòng mới vào sự kiện đang draft.
   *
   * ⚠️ CreateRoundAPIViewModel bắt buộc criteriaSetID, mà backend chưa có API
   * tạo bộ tiêu chí rỗng, nên vòng mới phải mượn một rubric set đã có của sự
   * kiện. Sự kiện nào cũng được tạo kèm ít nhất một set ở CreateEvents, còn nếu
   * lỡ không có thì chặn từ đây cho rõ ràng thay vì để backend trả 400 chung
   * chung.
   */
  const handleAddRound = async () => {
    if (criteriaSets.length === 0) {
      return Swal.fire(
        "No rubric available",
        "A round must point at a rubric set, and this event has none yet. Create the event's rubric first.",
        "warning",
      );
    }

    const nextIndex =
      eventRounds.reduce(
        (max, r) => Math.max(max, Number(r.roundIndex ?? r.RoundIndex ?? 0)),
        0,
      ) + 1;
    const lastRound = eventRounds[eventRounds.length - 1];
    const defaultStart = toDatetimeLocalValue(
      lastRound?.scoringEndDate ||
        lastRound?.ScoringEndDate ||
        lastRound?.endDate ||
        lastRound?.EndDate ||
        "",
    );

    const setOptions = criteriaSets
      .map(
        (s) =>
          `<option value="${s.setId}">${(s.setName || "Rubric Set").replace(/"/g, "&quot;")}</option>`,
      )
      .join("");

    // Vòng mới thì mọi mốc đều do admin nhập lần đầu — chặn quá khứ không nhân nhượng.
    const minNew = nowForInput();

    const { value: form } = await Swal.fire({
      title: `Add Round ${nextIndex}`,
      html: `
        <div style="text-align:left;">
          <label style="font-size:11px;font-weight:bold;color:#64748b;">ROUND NAME</label>
          <input id="ar-name" class="swal2-input" style="width:90%;margin-top:5px;" value="Round ${nextIndex}">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">RUBRIC SET</label>
          <select id="ar-set" class="swal2-select" style="width:90%;margin-top:5px;border-radius:12px;">${setOptions}</select>
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">TOP N PROMOTION</label>
          <input id="ar-topn" type="number" min="0" class="swal2-input" style="width:90%;margin-top:5px;" value="0">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">MIN TEAM</label>
          <input id="ar-minteam" type="number" min="1" class="swal2-input" style="width:90%;margin-top:5px;" value="1">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">MAX TEAM</label>
          <input id="ar-maxteam" type="number" min="1" class="swal2-input" style="width:90%;margin-top:5px;" value="${Number(lastRound?.maxTeam ?? lastRound?.MaxTeam ?? 10)}">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">START DATE &amp; TIME</label>
          <input id="ar-start" type="datetime-local" min="${minNew}" class="swal2-input" style="width:90%;margin-top:5px;" value="${defaultStart}">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">SUBMISSION DEADLINE</label>
          <input id="ar-end" type="datetime-local" min="${minNew}" class="swal2-input" style="width:90%;margin-top:5px;">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">JUDGING OPENS AT</label>
          <input id="ar-score-start" type="datetime-local" min="${minNew}" class="swal2-input" style="width:90%;margin-top:5px;">
          <label style="font-size:11px;font-weight:bold;color:#64748b;margin-top:15px;display:block;">JUDGING CLOSES AT</label>
          <input id="ar-score-end" type="datetime-local" min="${minNew}" class="swal2-input" style="width:90%;margin-top:5px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create Round",
      confirmButtonColor: "#f26f21",
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () => {
        const val = (elId: string) =>
          (document.getElementById(elId) as HTMLInputElement).value;
        const roundName = val("ar-name").trim();
        const start = val("ar-start");
        const end = val("ar-end");
        const scoreStart = val("ar-score-start");
        const scoreEnd = val("ar-score-end");
        const minTeam = Number(val("ar-minteam"));
        const maxTeam = Number(val("ar-maxteam"));

        if (!roundName) {
          Swal.showValidationMessage("Round name cannot be empty");
          return false;
        }
        if (!start || !end || !scoreStart || !scoreEnd) {
          Swal.showValidationMessage("All four date/time fields are required");
          return false;
        }
        if ([start, end, scoreStart, scoreEnd].some(isPastInput)) {
          Swal.showValidationMessage("You cannot pick a date in the past");
          return false;
        }
        if (new Date(end) <= new Date(start)) {
          Swal.showValidationMessage("Deadline must be after the start");
          return false;
        }
        if (new Date(scoreStart) < new Date(end)) {
          Swal.showValidationMessage(
            "Judging cannot start before the submission deadline",
          );
          return false;
        }
        if (new Date(scoreEnd) <= new Date(scoreStart)) {
          Swal.showValidationMessage("Judging must close after it opens");
          return false;
        }
        if (!minTeam || minTeam < 1) {
          Swal.showValidationMessage("Min team must be at least 1");
          return false;
        }
        if (maxTeam < minTeam) {
          Swal.showValidationMessage("Max team cannot be lower than min team");
          return false;
        }

        return {
          roundName,
          criteriaSetID: (
            document.getElementById("ar-set") as HTMLSelectElement
          ).value,
          topNPromotion: Number(val("ar-topn")) || 0,
          minTeam,
          maxTeam,
          startDate: new Date(start).toISOString(),
          endDate: new Date(end).toISOString(),
          scoringStartDate: new Date(scoreStart).toISOString(),
          scoringEndDate: new Date(scoreEnd).toISOString(),
        };
      },
    });

    if (!form) return;

    try {
      await roundApi.createRound({
        eventID: id!,
        roundIndex: nextIndex,
        ...form,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Round added!",
        timer: 1200,
        showConfirmButton: false,
      });
      loadCriteria();
    } catch (e: any) {
      showApiError(e, { action: "add this round" });
    }
  };

  const handleDeleteRound = async (round: any) => {
    const roundId = round.roundID || round.roundId || round.id;
    const ok = await Swal.fire({
      title: "Delete Round?",
      text: `Are you sure you want to delete ${round.roundName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });

    if (ok.isConfirmed) {
      try {
        await apiClient.delete(`/api/Round/${roundId}`);
        // Bỏ khỏi UI ngay, không đợi refetch — giống handleDeleteTrack.
        setEventRounds((prev) =>
          prev.filter(
            (x: any) => !sameRecordId(x.roundID || x.roundId || x.id, roundId),
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1200,
          showConfirmButton: false,
        });
        loadCriteria();
      } catch (e: any) {
        showApiError(e, { action: "delete this round" });
      }
    }
  };

  const handleEditTrack = async (track: any) => {
    const { value: newName } = await Swal.fire({
      title: "Rename Track",
      input: "text",
      inputValue: track.trackName || track.name,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
      inputValidator: (value) => {
        if (!value.trim()) return "Track name cannot be empty!";
      },
    });

    if (newName) {
      const trackId = track.trackID || track.trackId || track.id;
      try {
        await apiClient.put(`/api/Track/${trackId}`, {
          trackName: newName.trim(),
          eventID: id,
        });
        setTracks((prev) =>
          prev.map((t) =>
            (t.trackID || t.trackId || t.id) === trackId
              ? { ...t, trackName: newName.trim() }
              : t,
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          setTracks((prev) =>
            prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
          );
          Swal.fire(
            "Already Deleted",
            "This track was already deleted by another admin. The list has been refreshed.",
            "info",
          );
        } else {
          showApiError(error, { action: "rename this track" });
        }
      }
    }
  };

  const handleDeleteTrack = async (track: any) => {
    const result = await Swal.fire({
      title: "Delete Track?",
      text: `Are you sure you want to delete the track "${track.trackName}"? Associated topics will also be affected.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Track/${trackId}`);
        setTracks((prev) =>
          prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        showApiError(error, {
          action: "delete this track",
          hint: "Tracks that still have topics or registered teams may need those removed first.",
        });
      }
    }
  };

  const handleEditTopic = async (topic: any, track: any) => {
    const { value: newDetail } = await Swal.fire({
      title: "Rename Topic",
      input: "text",
      inputValue: topic.topicDetail,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
      inputValidator: (value) => {
        if (!value.trim()) return "Topic cannot be empty!";
      },
    });

    if (newDetail) {
      const topicId = topic.topicID || topic.topicId || topic.id;
      const trackId = track.trackID || track.trackId || track.id;
      try {
        await apiClient.put(`/api/Topic/topic/${topicId}`, {
          trackID: trackId,
          topicDetail: newDetail.trim(),
        });
        setTracks((prev) =>
          prev.map((t) => {
            if ((t.trackID || t.trackId || t.id) === trackId) {
              return {
                ...t,
                topics: t.topics.map((top: any) =>
                  (top.topicID || top.topicId || top.id) === topicId
                    ? { ...top, topicDetail: newDetail.trim() }
                    : top,
                ),
              };
            }
            return t;
          }),
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          setTracks((prev) =>
            prev.map((t) => {
              if ((t.trackID || t.trackId || t.id) === trackId) {
                return {
                  ...t,
                  topics: t.topics.filter(
                    (top: any) =>
                      (top.topicID || top.topicId || top.id) !== topicId,
                  ),
                };
              }
              return t;
            }),
          );
          Swal.fire(
            "Already Deleted",
            "This topic was already deleted by another admin. The list has been refreshed.",
            "info",
          );
        } else {
          showApiError(error, { action: "rename this topic" });
        }
      }
    }
  };

  const handleDeleteTopic = async (topic: any, track: any) => {
    const result = await Swal.fire({
      title: "Delete Topic?",
      text: `Are you sure you want to delete the topic "${topic.topicDetail}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        const topicId = topic.topicID || topic.topicId || topic.id;
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Topic/topic/${topicId}`);
        setTracks((prev) =>
          prev.map((t) => {
            if ((t.trackID || t.trackId || t.id) === trackId) {
              return {
                ...t,
                topics: t.topics.filter(
                  (top: any) =>
                    (top.topicID || top.topicId || top.id) !== topicId,
                ),
              };
            }
            return t;
          }),
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        showApiError(error, { action: "delete this topic" });
      }
    }
  };

  const handleAddTrack = async () => {
    const { value: trackName } = await Swal.fire({
      title: "Add New Track",
      input: "text",
      inputPlaceholder: "Enter track name...",
      showCancelButton: true,
      confirmButtonText: "Add Track",
      confirmButtonColor: "#f26f21",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2",
      },
    });

    if (trackName) {
      try {
        await apiClient.post("/api/Track", {
          eventId: id,
          trackName: trackName.trim(),
        });
        Swal.fire({
          icon: "success",
          title: "Added!",
          timer: 1000,
          showConfirmButton: false,
        });
        setReloadKey((k) => k + 1);
      } catch (error) {
        showApiError(error, { action: "add this track" });
      }
    }
  };

  const handleAddTopic = async (track: any) => {
    const { value: topicName } = await Swal.fire({
      title: "Add Topic",
      input: "text",
      inputPlaceholder: "Enter topic name...",
      showCancelButton: true,
      confirmButtonText: "Add Topic",
      confirmButtonColor: "#f26f21",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2",
      },
    });

    if (topicName) {
      try {
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.post("/api/Topic/topic", {
          trackID: trackId,
          topicDetail: topicName.trim(),
        });
        Swal.fire({
          icon: "success",
          title: "Added!",
          timer: 1000,
          showConfirmButton: false,
        });
        setReloadKey((k) => k + 1);
      } catch (error) {
        showApiError(error, { action: "add this topic" });
      }
    }
  };

  const handleSave = async () => {
    if (!id || !event) return;
    if (!event.semester) {
      Swal.fire(
        "Hold on!",
        "You forgot to select the Season (Semester)!",
        "warning",
      );
      return;
    }
    const { start: regStart, end: regEnd } = getRegistrationWindow(event);

    // Không cho đặt mốc đăng ký vào quá khứ. Chỉ xét mốc vừa bị đổi — giữ nguyên
    // mốc cũ đã trôi qua thì vẫn lưu được bình thường.
    const movedIntoPast = (d: Date | null, serverValue?: string) =>
      !!d && d.getTime() < Date.now() && d.toISOString() !== serverValue;
    if (
      movedIntoPast(regStart, serverRegRef.current.start) ||
      movedIntoPast(regEnd, serverRegRef.current.end)
    ) {
      Swal.fire(
        "Date is in the past",
        "Registration dates must be set in the future.",
        "warning",
      );
      return;
    }

    if (regStart && regEnd && regEnd <= regStart) {
      Swal.fire(
        "Invalid registration window",
        "Registration must close after it opens.",
        "warning",
      );
      return;
    }
    const minMembers = Number(event.minTeamMember ?? 0);
    const maxMembers = Number(event.maxTeamMember ?? 0);
    if (minMembers && maxMembers && maxMembers < minMembers) {
      Swal.fire(
        "Invalid team size",
        "Max members per team cannot be lower than the minimum.",
        "warning",
      );
      return;
    }
    try {
      setIsLoading(true);
      const roundBefore = Number(event.currentRound);
      const payload = buildEventPayload();

      await eventApi.updateEvent(id, payload as any);
      const after = await eventApi.getEventById(id);
      const roundAfter = Number(after.currentRound);
      setEvent(after);

      if (roundAfter !== roundBefore) {
        Swal.fire(
          "Saved",
          `Information saved successfully, but server adjusted the current round.`,
          "warning",
        );
      } else {
        Swal.fire({
          icon: "success",
          title: "Saved Successfully!",
          confirmButtonColor: "#f26f21",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      showApiError(error, { action: "save the event details" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!id || eventRounds.length === 0) return;

    const rawCurrentRound = Number(event?.currentRound);
    const foundIndex = findCurrentRoundIndex(eventRounds, rawCurrentRound);
    const curRoundIndex = foundIndex === -1 ? 0 : foundIndex;

    const currentRoundObj = eventRounds[curRoundIndex];

    if (!currentRoundObj) {
      return Swal.fire(
        "Error",
        "Could not find current round information in the system!",
        "error",
      );
    }

    const roundId =
      currentRoundObj.roundID || currentRoundObj.roundId || currentRoundObj.id;
    const topN =
      currentRoundObj.topNPromotion ??
      currentRoundObj.topNpromotion ??
      currentRoundObj.TopNPromotion ??
      0;
    const isLastRound = curRoundIndex === eventRounds.length - 1;

    if (isLastRound) {
      const lastRoundIndex = Number(
        currentRoundObj.roundIndex ??
          currentRoundObj.RoundIndex ??
          rawCurrentRound,
      );

      const result = await Swal.fire({
        title: "Conclude Tournament?",
        html: 'The server has no automated "conclude" step yet, so this will <b>manually mark the event as ended</b> and lock all further editing. The current leaderboard of the final round becomes the official final result. This cannot be undone from this screen.',
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f26f21",
        cancelButtonColor: "#cbd5e1",
        confirmButtonText: "Yes, Force Conclude",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2",
          cancelButton: "rounded-xl font-bold px-6 py-2 text-slate-700",
        },
      });

      if (!result.isConfirmed) return;

      try {
        setIsLoading(true);
        await eventApi.updateEvent(
          id,
          buildEventPayload({ currentRound: lastRoundIndex + 1 }) as any,
        );
        Swal.fire({
          icon: "success",
          title: "Concluded!",
          text: "The event has been marked as ended.",
          confirmButtonColor: "#f26f21",
          customClass: { confirmButton: "rounded-xl font-bold px-6 py-2" },
        });
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error: any) {
        showApiError(error, { action: "conclude this event" });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const actionText = `The system will automatically advance the Top ${topN} teams with the highest scores to the next round.`;

    const result = await Swal.fire({
      title: "Advance to Next Round?",
      text: `${actionText} This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f26f21",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Yes, Advance Teams!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton: "rounded-xl font-bold px-6 py-2 text-slate-700",
      },
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await roundApi.autoTransition(roundId);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Event status updated successfully.",
          confirmButtonColor: "#f26f21",
          customClass: { confirmButton: "rounded-xl font-bold px-6 py-2" },
        });
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error: any) {
        showApiError(error, {
          action: "advance to the next round",
          hint: "Make sure every team in the current round has been scored first.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadCriteria = async () => {
    if (!id) return;
    try {
      setLoadingCriteria(true);
      setCriteriaError(null);

      const allRounds = await roundApi.getAllRounds();
      setSystemRounds(allRounds || []);
      // GET /api/Round trả về CẢ vòng đã xóa mềm, phải tự lọc theo cờ đã xóa —
      // giống cách tracks/topics lọc ở fetchEventDetails.
      const matchedRounds = (allRounds || []).filter(
        (r: any) =>
          sameRecordId(r.eventID || r.eventId, id) && !isInactiveRecord(r),
      );
      const sortedRounds = [...matchedRounds].sort((a: any, b: any) => {
        const ai = Number(a.roundIndex ?? a.RoundIndex ?? 0);
        const bi = Number(b.roundIndex ?? b.RoundIndex ?? 0);
        if (ai !== bi) return ai - bi;
        return (
          new Date(a.startDate || a.StartDate || 0).getTime() -
          new Date(b.startDate || b.StartDate || 0).getTime()
        );
      });
      setEventRounds(sortedRounds);

      const allCrit = await criteriaApi.getAllCriteria();
      const critMap: Record<string, any> = {};
      (allCrit || []).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) critMap[String(cid)] = c;
      });
      setDeletedCriteria(
        (allCrit || []).filter((c: any) => isInactiveRecord(c)),
      );

      let allSetsRaw: any[] = [];
      try {
        const res = await criteriaApi.getAllSet();
        allSetsRaw = getList(res);
      } catch (e) {}

      const setNameDictionary: Record<string, string> = {};
      // GET /api/Criteria/set cũng trả về bộ tiêu chí đã xóa mềm. Chỉ dựa vào
      // getSetById bên dưới là không đủ — endpoint chi tiết không phải lúc nào
      // cũng kèm cờ đã xóa, nên chốt danh sách id đã xóa ngay từ danh sách này.
      const inactiveSetIds = new Set<string>();
      allSetsRaw.forEach((st: any) => {
        const sId = String(grabSetId(st));
        if (!sId || sId === "undefined" || sId === "null") return;
        if (isInactiveRecord(st)) {
          inactiveSetIds.add(sId.toLowerCase());
          return;
        }
        const validName = st.setName || st.SetName || st.name;
        if (validName) {
          setNameDictionary[sId] = validName;
        }
      });

      const sets: any[] = [];
      const seen = new Set<string>();
      for (const r of sortedRounds) {
        const setId =
          (r as any).criteriaSetID ||
          (r as any).criteriaSetId ||
          (r as any).CriteriaSetID ||
          (r as any).CriteriaSetId;
        if (!setId || seen.has(String(setId))) continue;
        if (deletedSetIdsRef.current.has(String(setId))) continue;
        if (inactiveSetIds.has(String(setId).toLowerCase())) continue;
        seen.add(String(setId));
        try {
          const setRes: any = await criteriaApi.getSetById(setId);
          const s = setRes?.data || setRes;

          if (isInactiveRecord(s)) continue;

          const rawList = extractSetList(setRes);
          const items = rawList
            .map((it: any) => {
              const cid = itemCriteriaId(it);
              const info = critMap[String(cid)] || {};
              return {
                criteriaId: cid,
                name:
                  info.criteriaName ||
                  info.name ||
                  it.criteriaName ||
                  it.name ||
                  "(Unknown)",
                description: info.description || it.description || "",
                score: itemScore(it),
                isActive: !isInactiveRecord(info),
              };
            })
            .filter((it: any) => it.isActive);

          const dictName = setNameDictionary[String(setId)];
          const serverName = s.setName || s.SetName;
          const finalName = dictName || serverName || "Rubric Set";

          sets.push({
            setId,
            setName: finalName,
            isDefault: s.isDefault ?? s.IsDefault ?? false,
            roundName: r.roundName || "",
            items,
          });
        } catch (e) {}
      }
      setCriteriaSets(sets);
    } catch (e) {
      setCriteriaError("Failed to load rubrics. Please try again.");
    } finally {
      setLoadingCriteria(false);
    }
  };

  useEffect(() => {
    loadCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditCriterion = async (crit: any) => {
    const esc = (s: string) => (s || "").replace(/"/g, "&quot;");
    const { value } = await Swal.fire({
      title: "Edit Criterion",
      html: `<div style="text-align:left; padding: 0 10px;"><label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Criterion Name</label><input id="sw-name" class="swal2-input" style="width:100%; max-width: 100%; border-radius: 12px; margin: 5px 0 20px; font-size:14px;" placeholder="Criterion name" value="${esc(crit.name)}"><label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Description</label><input id="sw-desc" class="swal2-input" style="width:100%; max-width: 100%; border-radius: 12px; margin: 5px 0 10px; font-size:14px;" placeholder="Description" value="${esc(crit.description)}"></div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5 bg-fpt-orange",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700",
      },
      preConfirm: () => {
        const name = (
          document.getElementById("sw-name") as HTMLInputElement
        )?.value?.trim();
        const description = (
          document.getElementById("sw-desc") as HTMLInputElement
        )?.value?.trim();
        if (!name) {
          Swal.showValidationMessage("Criterion name cannot be empty");
          return false;
        }
        return { name, description };
      },
    });
    if (!value) return;
    try {
      await criteriaApi.updateCriterion(crit.criteriaId, {
        criteriaID: crit.criteriaId,
        criteriaId: crit.criteriaId,
        criteriaName: value.name,
        description: value.description || DEFAULT_CRITERIA_DESCRIPTION,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      showApiError(e, { action: "update this criterion" });
    }
  };

  /**
   * Thêm tiêu chí vào một rubric set.
   *
   * Tiêu chí được tạo thật trên server ngay (để có criteriaId), nhưng chỉ được
   * GẮN vào set ở state với trọng số 0 — admin chỉnh lại tỉ lệ rồi bấm "Save
   * Updates". Nếu đẩy updateSet ngay tại đây thì tổng trọng số đang khác 100% và
   * backend sẽ từ chối.
   */
  const handleAddCriterion = async (setIdx: number) => {
    const { value } = await Swal.fire({
      title: "Add Criterion",
      html: `<div style="text-align:left;padding:0 10px;">
        <label style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;">Criterion Name</label>
        <input id="sw-new-name" class="swal2-input" style="width:100%;border-radius:12px;margin:5px 0 20px;font-size:14px;" placeholder="Innovation, Feasibility...">
        <label style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;">Description</label>
        <input id="sw-new-desc" class="swal2-input" style="width:100%;border-radius:12px;margin:5px 0 10px;font-size:14px;" placeholder="What judges look for">
        <p style="font-size:11px;color:#94a3b8;margin:0;">It is added with 0% weight — rebalance the set to 100% and save.</p>
      </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      confirmButtonColor: "#f26f21",
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () => {
        const name = (
          document.getElementById("sw-new-name") as HTMLInputElement
        ).value.trim();
        const description = (
          document.getElementById("sw-new-desc") as HTMLInputElement
        ).value.trim();
        if (!name) {
          Swal.showValidationMessage("Criterion name cannot be empty");
          return false;
        }
        return { name, description };
      },
    });
    if (!value) return;

    try {
      const created: any = await criteriaApi.createCriterion({
        criteriaName: value.name,
        description: value.description || DEFAULT_CRITERIA_DESCRIPTION,
      } as any);
      const newId = pickId(created);
      if (!newId) throw new Error("Server did not return the criterion id.");

      setCriteriaSets((prev) =>
        prev.map((s, si) =>
          si !== setIdx
            ? s
            : {
                ...s,
                items: [
                  ...s.items,
                  {
                    criteriaId: newId,
                    name: value.name,
                    description: value.description,
                    score: 0,
                    isActive: true,
                  },
                ],
              },
        ),
      );
      Swal.fire({
        icon: "success",
        title: "Criterion added",
        text: "Set its weight, then press Save Updates.",
        confirmButtonColor: "#f26f21",
      });
    } catch (e: any) {
      showApiError(e, { action: "add this criterion" });
    }
  };

  const handleDeleteCriterion = async (crit: any) => {
    const ok = await Swal.fire({
      title: "Delete Criterion?",
      html: `Delete criterion <b>${crit.name}</b>? You can restore it later.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteCriterion(crit.criteriaId);
      setCriteriaSets((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.filter(
            (it: any) => String(it.criteriaId) !== String(crit.criteriaId),
          ),
        })),
      );
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      showApiError(e, {
        action: "delete this criterion",
        hint: "Criteria already used for scoring in a past round cannot be removed.",
      });
    }
  };

  const handleRestoreCriterion = async (crit: any) => {
    const cid = crit.criteriaID || crit.criteriaId || crit.id;
    setDeletedCriteria((prev) =>
      prev.filter(
        (c: any) =>
          String(c.criteriaID || c.criteriaId || c.id) !== String(cid),
      ),
    );
    try {
      await criteriaApi.restoreCriterion(cid);
      await loadCriteria();
      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Criterion has been reactivated.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (e: any) {
      await loadCriteria();
      showApiError(e, { action: "restore this criterion" });
    }
  };

  const handleSaveSet = async (set: any) => {
    if (!set.setName || !set.setName.trim()) {
      return Swal.fire("Required", "Set name cannot be empty.", "warning");
    }
    if (!set.items || set.items.length === 0) {
      return Swal.fire("Error", "This set has no criteria.", "warning");
    }
    const total = sumWeight(set.items);
    if (total !== 100) {
      return Swal.fire(
        "Invalid Weight",
        `Total weight is currently ${total}%. Must be exactly 100%.`,
        "error",
      );
    }
    try {
      const mappedCriteriaList = set.items.map((it: any) => ({
        criteriaId: String(it.criteriaId || it.criteriaID || it.id),
        criteriaID: String(it.criteriaId || it.criteriaID || it.id),
        score: Number(it.score || 0),
      }));

      await criteriaApi.updateSet(set.setId, {
        setID: set.setId,
        setId: set.setId,
        eventID: id,
        eventId: id,
        setName: set.setName.trim(),
        isDefault: set.isDefault ?? false,
        criteriaList: mappedCriteriaList,
      } as any);

      Swal.fire({
        icon: "success",
        title: "Saved Successfully!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      showApiError(e, {
        action: "save this rubric set",
        hint: "A rubric set with this name may already exist — try a different name.",
      });
    }
  };

  const handleDeleteSet = async (set: any) => {
    const ok = await Swal.fire({
      title: "Delete Rubric Set?",
      html: `Delete entire set <b>${set.setName}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete Set",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2",
        cancelButton:
          "rounded-xl font-bold px-6 py-2 bg-slate-100 text-slate-700",
      },
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteSet(set.setId);
      deletedSetIdsRef.current.add(String(set.setId));
      setCriteriaSets((prev) =>
        prev.filter((s) => String(s.setId) !== String(set.setId)),
      );
      Swal.fire({
        icon: "success",
        title: "Set Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      showApiError(e, {
        action: "delete this rubric set",
        hint: "A rubric set already used by a round cannot be deleted.",
      });
    }
  };

  const updateScoreLocal = (setIdx: number, itemIdx: number, val: number) => {
    setCriteriaSets((prev) =>
      prev.map((s, si) =>
        si !== setIdx
          ? s
          : {
              ...s,
              items: s.items.map((it: any, ii: number) =>
                ii !== itemIdx ? it : { ...it, score: val },
              ),
            },
      ),
    );
  };

  const updateSetNameLocal = (setIdx: number, val: string) => {
    setCriteriaSets((prev) =>
      prev.map((s, si) => (si !== setIdx ? s : { ...s, setName: val })),
    );
  };

  if (isLoading && !event)
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20 text-slate-400">
        <Loader2 size={36} className="animate-spin text-[#f26f21]" />
        <span className="text-sm font-bold uppercase tracking-widest">
          Loading Event details...
        </span>
      </div>
    );
  if (loadError)
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20 text-center bg-white m-10 rounded-[2rem] shadow-sm">
        <AlertCircle size={40} className="text-red-500" strokeWidth={1.5} />
        <p className="text-base font-medium text-red-500">{loadError}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  if (!event)
    return (
      <div className="p-20 text-center font-medium text-slate-500">
        Event not found!
      </div>
    );

  const numRounds = eventRounds.length || 2;
  const rawCurrentRound = Number(event?.currentRound);

  // Chưa vào vòng nào thì trỏ về vòng đầu — chỉ dùng để hiển thị tên vòng khi
  // sự kiện đang chạy, nên giá trị này vô hại ở draft/đăng ký.
  const curRound = Math.max(
    0,
    findCurrentRoundIndex(eventRounds, rawCurrentRound),
  );

  // --- VÒNG ĐỜI SỰ KIỆN: draft -> registration -> running -> ended ---
  // Toàn bộ quyền sửa và mọi nút hành động đều rẽ nhánh từ đây.
  const phase: EventPhase = getEventPhase(event, eventRounds.length);
  const isLocked = !canEditStructure(phase);
  const isEnded = phase === "ended";
  const isRegistrationPhase = phase === "registration";
  const regWindow = getRegistrationWindow(event);
  const publishReady = canPublish(phase);
  const publishEarly = isPublishingEarly(event);
  const regOverdue = isRegistrationOverdue(event, phase);

  /**
   * Chỉ tiêu số ĐỘI của vòng 1 (minTeam) — khác minTeamMember là số thành viên
   * trong một đội. Không gom đủ chừng này đội thì sự kiện không mở nổi, và đó
   * chính là lúc admin cần tới các phương án cứu vãn, kể cả hủy sự kiện.
   */
  const firstRound = [...eventRounds].sort(
    (a, b) => Number(a.roundIndex ?? 0) - Number(b.roundIndex ?? 0),
  )[0];
  const minTeamRequired = Number(
    firstRound?.minTeam ?? firstRound?.MinTeam ?? 0,
  );
  const teamsJoined = allTeams.length;
  const isShortOnTeams =
    isRegistrationPhase && minTeamRequired > 0 && teamsJoined < minTeamRequired;
  // Hiện phương án cứu vãn khi hết hạn, HOẶC khi còn hạn nhưng chưa gom đủ đội.
  const showRescueOptions = regOverdue || isShortOnTeams;

  const currentRoundName =
    phase === "running"
      ? eventRounds[curRound]?.roundName || `Round ${curRound + 1}`
      : PHASE_LABEL[phase];

  const displayRoundIndex = isEnded ? numRounds - 1 : curRound;
  // Bảng leader board chỉ có nghĩa khi giải đã bắt đầu diễn ra hoặc đã kết thúc
  const canShowLeaderboard =
    (phase === "running" || phase === "ended") &&
    displayRoundIndex >= 0 &&
    eventRounds.length > 0;

  const displayRoundObj = canShowLeaderboard
    ? eventRounds[displayRoundIndex]
    : null;
  const advanceTopN =
    displayRoundObj?.topNPromotion ??
    displayRoundObj?.topNpromotion ??
    displayRoundObj?.TopNPromotion ??
    0;
  const isLastRound = displayRoundIndex === numRounds - 1;

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => navigate("/admin/events")}
                className="text-slate-400 hover:text-fpt-orange transition-colors p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-slate-300"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-4xl font-black text-[#f26f21] tracking-tight">
                {event.name || "Event Configuration"}
              </h2>
              <span
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  phase === "draft"
                    ? "bg-slate-100 border-slate-200 text-slate-500"
                    : phase === "registration"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : phase === "running"
                        ? "bg-fpt-orange-soft border-fpt-orange/30 text-fpt-orange-dark"
                        : "bg-slate-100 border-slate-300 text-slate-600"
                }`}
              >
                {currentRoundName}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-base ml-[3.25rem]">
              {event.semester} {event.year} • {eventRounds.length} round
              {eventRounds.length === 1 ? "" : "s"} • {tracks.length} track
              {tracks.length === 1 ? "" : "s"}
            </p>
          </div>

          {!isLocked && activeTab === "overview" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white text-sm font-extrabold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Save size={18} strokeWidth={2.5} />{" "}
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* BANNER ĐIỀU KHIỂN LIFECYCLE ĐẶC BIỆT */}
        {/* ========================================================= */}
        {phase === "draft" && (
          <div className="bg-slate-800 text-white p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-slate-800/10">
            <div>
              <h4 className="text-lg font-black flex items-center gap-2 mb-1">
                <Rocket size={20} className="text-fpt-orange" /> Event is in
                Draft Mode
              </h4>
              <p className="text-slate-300 text-sm font-medium">
                Nobody outside this page can see it yet. Edit tracks, rounds,
                rubrics and prizes freely — publishing locks them.
              </p>
              {regWindow.start && (
                <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1.5">
                  <Clock size={13} strokeWidth={2.5} />
                  Registration is scheduled to open{" "}
                  {formatDisplayDateTime(regWindow.start.toISOString())}
                </p>
              )}
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={handlePublishEvent}
                disabled={!publishReady || isLoading}
                title="Publish the event and open the registration form"
                className="w-full md:w-auto bg-fpt-orange hover:bg-fpt-orange-dark text-white px-8 py-3.5 rounded-xl font-black transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-fpt-orange"
              >
                <Rocket size={18} strokeWidth={2.5} /> Publish & Open
                Registration
              </button>
              {publishEarly && (
                <p className="text-[11px] text-slate-400 font-bold mt-2 text-center md:text-right">
                  Earlier than the announced opening date
                </p>
              )}
              <button
                onClick={handleDeleteEvent}
                className="w-full md:w-auto mt-3 text-[11px] font-extrabold text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} strokeWidth={2.5} /> Discard this draft
              </button>
            </div>
          </div>
        )}

        {phase === "registration" && (
          <div
            className={`p-6 rounded-[2rem] border-2 shadow-sm space-y-5 ${regOverdue ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="text-lg font-black flex items-center gap-2 mb-1">
                  <Users size={20} />{" "}
                  {regOverdue
                    ? "Registration deadline has passed"
                    : "Registration is Open"}
                </h4>
                <p
                  className={`text-sm font-medium ${regOverdue ? "text-amber-700" : "text-emerald-700"}`}
                >
                  {regOverdue
                    ? "Round 1 should have started automatically. If the event is still stuck here, start it manually — or use one of the options below if you are short on teams."
                    : "Students are joining teams. Structural configuration is locked while the form is open."}
                </p>
                {regWindow.end && !regOverdue && (
                  <p className="text-xs font-bold mt-2 flex items-center gap-1.5 opacity-80">
                    <Clock size={13} strokeWidth={2.5} /> Closes{" "}
                    {formatDisplayDateTime(regWindow.end.toISOString())} — Round
                    1 starts automatically at that point
                  </p>
                )}
                {minTeamRequired > 0 && (
                  <p
                    className={`text-xs font-bold mt-2 flex items-center gap-1.5 ${isShortOnTeams ? "text-red-600" : "opacity-80"}`}
                  >
                    <Users size={13} strokeWidth={2.5} />
                    {teamsJoined} of {minTeamRequired} required team
                    {minTeamRequired === 1 ? "" : "s"} registered
                    {isShortOnTeams
                      ? ` — ${minTeamRequired - teamsJoined} short of the minimum to run this event`
                      : " — minimum reached"}
                  </p>
                )}
              </div>
              {/* Bố cục giống hệt khối draft: nút chính, dưới là link hủy mờ. */}
              <div className="shrink-0 w-full md:w-auto">
                <button
                  onClick={handleStartRound1}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-black transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <PlayCircle size={18} strokeWidth={2.5} /> Close Reg & Start
                  Round 1
                </button>
                <button
                  onClick={handleDeleteEvent}
                  title="Delete this event — use it when registration closes without enough teams"
                  className="w-full md:w-auto mt-3 text-[11px] font-extrabold text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} strokeWidth={2.5} /> Cancel this event
                </button>
              </div>
            </div>

            {/* Không đủ chỉ tiêu: dời hạn, hạ tiêu chí, hoặc hủy hẳn sự kiện. */}
            {showRescueOptions && (
              <div
                className={`border-t pt-4 flex flex-wrap items-center gap-3 ${regOverdue ? "border-amber-200" : "border-emerald-200"}`}
              >
                {isShortOnTeams && !regOverdue && (
                  <p className="w-full text-xs font-bold text-slate-500 -mb-1">
                    Not enough teams to run this event yet. If it stays this way,
                    you can extend the deadline or cancel the event entirely.
                  </p>
                )}
                <button
                  onClick={handleExtendRegistration}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-white text-xs font-extrabold rounded-xl border transition-colors ${
                    regOverdue
                      ? "border-amber-200 text-amber-800 hover:bg-amber-100"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CalendarClock size={15} strokeWidth={2.5} /> Extend deadline
                </button>
                <button
                  onClick={handleRelaxTeamRequirement}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-white text-xs font-extrabold rounded-xl border transition-colors ${
                    regOverdue
                      ? "border-amber-200 text-amber-800 hover:bg-amber-100"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <UserMinus size={15} strokeWidth={2.5} /> Lower min team size
                </button>
              </div>
            )}
          </div>
        )}

        {isEnded && (
          <div className="bg-slate-100/80 border border-slate-200 text-slate-600 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm mb-6">
            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <p className="text-base font-medium">
              This event has concluded. All configurations are locked and
              provided for historical reference only.
            </p>
          </div>
        )}

        {/* SUB-MENU: mỗi mảng cấu hình của sự kiện là một tab riêng */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-1 overflow-x-auto">
          {(
            [
              { id: "overview", label: "Overview", icon: <Info size={16} /> },
              {
                id: "tracks",
                label: "Tracks & Topics",
                icon: <Layers size={16} />,
              },
              {
                id: "rounds",
                label: "Rounds",
                icon: <FastForward size={16} />,
              },
              {
                id: "rubrics",
                label: "Rubrics",
                icon: <ListChecks size={16} />,
              },
              { id: "teams", label: "Teams", icon: <Users size={16} /> },
              {
                id: "staff",
                label: "Judges & Mentors",
                icon: <Scale size={16} />,
              },
              {
                id: "leaderboard",
                label: "Leaderboard",
                icon: <Trophy size={16} />,
              },
              { id: "prizes", label: "Prizes", icon: <Medal size={16} /> },
              { id: "audit", label: "Audit Logs", icon: <History size={16} /> },
            ] as { id: TabId; label: string; icon: any }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-[1.25rem] text-[13px] font-extrabold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? "bg-fpt-orange text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {activeTab === "overview" && (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-extrabold text-[#f26f21] mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Edit3 size={20} strokeWidth={2.5} />
              </div>
              Basic Information
            </h3>
            <div className="space-y-6">
              {/* Tên và trạng thái nằm chung một hàng, chia đôi đều nhau —
                  hai ô ngắn xếp chồng nhau chỉ tổ kéo dài trang. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Event Display Name
                  </label>
                  <input
                    disabled={isLocked}
                    type="text"
                    value={event.name || ""}
                    onChange={(e) =>
                      setEvent({ ...event, name: e.target.value })
                    }
                    className={`w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none font-bold text-[#f26f21] text-base ${isLocked ? "opacity-60 cursor-not-allowed" : "focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Current Status
                  </label>
                  <div
                    className={`w-full px-5 py-3.5 border rounded-2xl font-bold flex items-center justify-center shadow-sm ${phase === "draft" ? "bg-slate-50 border-slate-200 text-slate-500" : isRegistrationPhase ? "bg-emerald-50 border-emerald-200 text-emerald-700" : isEnded ? "bg-slate-100 border-slate-300 text-slate-600" : "bg-fpt-orange-soft border-fpt-orange/30 text-fpt-orange-dark"}`}
                  >
                    <span className="text-sm uppercase tracking-widest">
                      {currentRoundName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Điều kiện đăng ký — quyết định lúc nào được bấm Publish.
                  Ở draft admin sửa được hết; publish xong thì chỉ còn đọc. */}
              {isLocked ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                  <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Registration window
                    </span>
                    <p className="text-sm font-extrabold text-slate-700">
                      {regWindow.start
                        ? formatDisplayDateTime(regWindow.start.toISOString())
                        : "Not set"}
                    </p>
                    <p className="text-xs font-bold text-slate-400 my-1">
                      &darr; until
                    </p>
                    <p className="text-sm font-extrabold text-slate-700">
                      {regWindow.end
                        ? formatDisplayDateTime(regWindow.end.toISOString())
                        : "Not set"}
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Team size
                    </span>
                    <p className="text-2xl font-black text-[#f26f21]">
                      {event.minTeamMember ?? "—"} – {event.maxTeamMember ?? "—"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      members allowed per team
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Season
                      </label>
                      <select
                        value={event.semester || ""}
                        onChange={(e) =>
                          setEvent({ ...event, semester: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm cursor-pointer focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      >
                        <option value="">Select a season…</option>
                        {["Spring", "Summer", "Fall", "Winter"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={event.year ?? ""}
                        onChange={(e) =>
                          setEvent({ ...event, year: Number(e.target.value) })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Registration opens
                      </label>
                      <input
                        type="datetime-local"
                        // Mốc đã lưu có thể nằm trong quá khứ; ép min = now thì
                        // trình duyệt gạch đỏ luôn giá trị admin chưa hề đụng tới.
                        min={
                          toDateInput(regWindow.start) &&
                          toDateInput(regWindow.start) < nowForInput()
                            ? toDateInput(regWindow.start)
                            : nowForInput()
                        }
                        value={toDateInput(regWindow.start)}
                        onChange={(e) =>
                          setEvent({
                            ...event,
                            registrationStartDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Registration closes
                      </label>
                      <input
                        type="datetime-local"
                        min={
                          toDateInput(regWindow.end) &&
                          toDateInput(regWindow.end) < nowForInput()
                            ? toDateInput(regWindow.end)
                            : nowForInput()
                        }
                        value={toDateInput(regWindow.end)}
                        onChange={(e) =>
                          setEvent({
                            ...event,
                            registrationEndDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Min members per team
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={event.minTeamMember ?? ""}
                        onChange={(e) =>
                          setEvent({
                            ...event,
                            minTeamMember: Number(e.target.value),
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Max members per team
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={event.maxTeamMember ?? ""}
                        onChange={(e) =>
                          setEvent({
                            ...event,
                            maxTeamMember: Number(e.target.value),
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl mt-2 outline-none font-bold text-slate-700 text-sm focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Rounds", value: eventRounds.length },
                  { label: "Tracks", value: tracks.length },
                  { label: "Teams joined", value: allTeams.length },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-5 bg-white border border-slate-200 rounded-2xl text-center"
                  >
                    <p className="text-3xl font-black text-slate-700">
                      {s.value}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {activeTab === "rounds" && (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FastForward size={20} strokeWidth={2.5} />
                </div>
                Tournament Rounds
              </h3>
              {!isLocked && (
                <button
                  onClick={handleAddRound}
                  className="px-5 py-2.5 bg-fpt-orange-soft text-fpt-orange-dark text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-fpt-orange/15 transition-colors"
                >
                  <Plus size={16} strokeWidth={3} /> Add Round
                </button>
              )}
            </div>

            <div
              className={`grid grid-cols-1 gap-6 ${
                eventRounds.length >= 3
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : eventRounds.length === 2
                    ? "md:grid-cols-2"
                    : "max-w-md mx-auto w-full"
              }`}
            >
              {eventRounds.map((r) => (
                <div
                  key={r.roundID || r.roundId || r.id}
                  className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Index: {r.roundIndex ?? r.RoundIndex}
                      </span>
                      <h4 className="font-extrabold text-[#f26f21] text-lg">
                        {r.roundName}
                      </h4>
                    </div>
                    {!isLocked && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRound(r)}
                          className="p-2 text-slate-400 hover:text-fpt-orange bg-white border border-slate-100 rounded-lg shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRound(r)}
                          className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm font-semibold text-slate-600">
                    <p className="flex justify-between">
                      <span>Advance Top N:</span>
                      <span className="text-fpt-blue">
                        {r.topNPromotion ??
                          r.topNpromotion ??
                          r.TopNPromotion ??
                          0}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Max Teams:</span>{" "}
                      <span className="text-[#f26f21]">{r.maxTeam ?? 0}</span>
                    </p>
                    <div className="pt-2 mt-2 border-t border-slate-200 space-y-1.5">
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} strokeWidth={2.5} /> Start:
                        </span>
                        <span className="text-[#f26f21] text-xs font-bold">
                          {formatDisplayDateTime(r.startDate || r.StartDate)}
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} strokeWidth={2.5} /> Submit by:
                        </span>
                        <span className="text-[#f26f21] text-xs font-bold">
                          {formatDisplayDateTime(r.endDate || r.EndDate)}
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Scale size={13} strokeWidth={2.5} /> Judging:
                        </span>
                        <span className="text-slate-600 text-xs font-bold">
                          {formatDisplayDateTime(
                            r.scoringStartDate || r.ScoringStartDate,
                          )}{" "}
                          &rarr;{" "}
                          {formatDisplayDateTime(
                            r.scoringEndDate || r.ScoringEndDate,
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {eventRounds.length === 0 && (
                <div className="col-span-full p-10 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
                  No rounds configured for this event.
                </div>
              )}
            </div>
          </div>
          )}

          {activeTab === "tracks" && (
          <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-extrabold text-[#f26f21] ml-2">
              Event Tracks
            </h3>
            {!isLocked && (
              <button
                onClick={handleAddTrack}
                className="px-5 py-2.5 bg-fpt-orange-soft text-fpt-orange-dark text-xs font-extrabold rounded-xl flex items-center gap-2 hover:bg-fpt-orange/15 transition-colors"
              >
                <Plus size={16} strokeWidth={3} /> Add Track
              </button>
            )}
          </div>
          <div
            className={`grid grid-cols-1 gap-6 ${tracks.length > 1 ? "md:grid-cols-2" : tracks.length === 1 ? "max-w-xl mx-auto w-full" : ""}`}
          >
            {tracks.length > 0 ? (
              tracks.map((track: any, idx: number) => (
                <div
                  key={track.trackID || track.trackId || idx}
                  className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5 hover:border-fpt-orange/30 transition-colors"
                >
                  <div className="flex gap-4 items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Track #{idx + 1}
                      </label>
                      <div className="font-extrabold text-lg text-[#f26f21] mt-0.5">
                        {track.trackName}
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTrack(track)}
                          title="Rename Track"
                          className="text-slate-400 hover:text-fpt-orange p-2 rounded-xl hover:bg-fpt-orange-soft transition-colors bg-slate-50"
                        >
                          <Pencil size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track)}
                          title="Delete Track"
                          className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors bg-slate-50"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                      Sub-Topics
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {track.topics.length > 0 ? (
                        track.topics.map((topic: any, i: number) => (
                          <div
                            key={i}
                            className="group inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all hover:bg-white hover:border-slate-300"
                          >
                            <span>{topic.topicDetail}</span>
                            {!isLocked && (
                              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditTopic(topic, track)}
                                  className="text-slate-400 hover:text-fpt-orange"
                                  title="Edit Topic"
                                >
                                  <Pencil size={12} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTopic(topic, track)
                                  }
                                  className="text-slate-400 hover:text-red-500"
                                  title="Delete Topic"
                                >
                                  <X size={14} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          No topics added yet.
                        </span>
                      )}
                      {!isLocked && (
                        <button
                          onClick={() => handleAddTopic(track)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 text-slate-400 rounded-xl text-xs font-bold hover:border-fpt-orange hover:text-fpt-orange transition-colors"
                        >
                          <Plus size={14} strokeWidth={3} /> Add Topic
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-center bg-white text-slate-500 font-medium">
                No tracks configured for this event.
              </div>
            )}
          </div>
          </div>
          )}

          {activeTab === "rubrics" && (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-extrabold text-[#f26f21] mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ListChecks size={20} strokeWidth={2.5} />
              </div>
              Grading Rubrics
            </h3>

            {loadingCriteria ? (
              <div className="flex items-center gap-3 text-sm text-slate-400 py-10 justify-center font-bold tracking-widest uppercase">
                <Loader2 size={20} className="animate-spin text-[#f26f21]" />{" "}
                Loading rubrics...
              </div>
            ) : criteriaError ? (
              <div className="flex items-center justify-center gap-3 py-10 bg-red-50 rounded-2xl">
                <span className="flex items-center gap-2 text-sm text-red-600 font-bold">
                  <AlertCircle size={18} strokeWidth={2.5} /> {criteriaError}
                </span>
                <button
                  onClick={loadCriteria}
                  className="px-4 py-2 text-xs font-bold bg-white text-slate-700 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  <RefreshCw size={12} className="inline mr-1" /> Retry
                </button>
              </div>
            ) : criteriaSets.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-10">
                No rubric sets linked to this event.
              </p>
            ) : (
              <div
                className={`grid grid-cols-1 gap-6 ${criteriaSets.length > 1 ? "md:grid-cols-2" : "max-w-2xl mx-auto w-full"}`}
              >
                {criteriaSets.map((set: any, setIdx: number) => {
                  const total = sumWeight(set.items);
                  return (
                    <div
                      key={set.setId}
                      className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex flex-col"
                    >
                      <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="text"
                            value={set.setName}
                            onChange={(e) =>
                              updateSetNameLocal(setIdx, e.target.value)
                            }
                            disabled={isLocked}
                            className={`font-extrabold text-base px-3 py-1.5 rounded-lg outline-none w-full max-w-[300px] ${isLocked ? "bg-transparent text-[#f26f21] cursor-not-allowed" : "bg-white border border-slate-200 text-[#f26f21] focus:border-fpt-orange focus:ring-2 focus:ring-fpt-orange/10 transition-all shadow-sm"}`}
                          />
                          {set.roundName && (
                            <span className="text-[9px] px-2.5 py-1 rounded-md bg-fpt-orange text-white font-bold uppercase tracking-widest shrink-0 shadow-sm">
                              {set.roundName}
                            </span>
                          )}
                        </div>
                        {!isLocked && (
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              onClick={() => handleAddCriterion(setIdx)}
                              title="Add Criterion"
                              className="text-slate-400 hover:text-fpt-orange p-2 rounded-xl hover:bg-fpt-orange-soft transition-colors bg-white shadow-sm border border-slate-100"
                            >
                              <Plus size={14} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleDeleteSet(set)}
                              title="Delete Set"
                              className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors bg-white shadow-sm border border-slate-100"
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="divide-y divide-slate-50 flex-1">
                        {set.items.length === 0 ? (
                          <p className="text-sm text-slate-400 font-medium px-6 py-8 text-center">
                            This set is empty.
                          </p>
                        ) : (
                          set.items.map((it: any, itemIdx: number) => (
                            <div
                              key={it.criteriaId || itemIdx}
                              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-800">
                                  {it.name}
                                </div>
                                {it.description && (
                                  <div className="text-xs text-slate-500 font-medium mt-1 truncate">
                                    {it.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={it.score}
                                  onChange={(e) =>
                                    updateScoreLocal(
                                      setIdx,
                                      itemIdx,
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-16 px-3 py-2 text-center border border-slate-200 rounded-xl text-sm font-extrabold outline-none transition-all ${isLocked ? "bg-slate-50 cursor-not-allowed text-slate-500" : "text-[#f26f21] focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10"}`}
                                />
                                <span className="text-xs text-slate-400 font-bold">
                                  %
                                </span>
                              </div>
                              {!isLocked && (
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <button
                                    onClick={() => handleEditCriterion(it)}
                                    className="text-slate-300 hover:text-fpt-orange p-2 rounded-xl hover:bg-fpt-orange-soft transition-colors"
                                  >
                                    <Pencil size={14} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCriterion(it)}
                                    className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-6 py-4 border-t border-slate-100">
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 ${total === 100 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          <Scale size={14} strokeWidth={2.5} /> Total Weight:{" "}
                          {total}%
                        </span>
                        {!isLocked && (
                          <button
                            onClick={() => handleSaveSet(set)}
                            disabled={total !== 100 || !set.setName.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-fpt-orange text-white text-xs font-bold rounded-xl hover:bg-fpt-orange-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Save size={14} strokeWidth={2.5} /> Save Updates
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {deletedCriteria.length > 0 && !isLocked && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <RotateCcw size={14} strokeWidth={2.5} /> Recover Deleted
                  Criteria
                </p>
                <div className="flex flex-wrap gap-3">
                  {deletedCriteria.map((c: any, i: number) => (
                    <div
                      key={c.criteriaID || c.criteriaId || i}
                      className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs font-bold text-slate-500 line-through">
                        {c.criteriaName || c.name}
                      </span>
                      <button
                        onClick={() => handleRestoreCriterion(c)}
                        className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {activeTab === "leaderboard" && !canShowLeaderboard && (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
              <Trophy
                size={40}
                className="text-slate-300 mx-auto mb-4"
                strokeWidth={1.5}
              />
              <p className="text-slate-500 font-medium">
                The leaderboard appears once Round 1 has started and teams have
                been scored.
              </p>
            </div>
          )}

          {activeTab === "leaderboard" && canShowLeaderboard && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                  Live Leaderboard & Round Transition
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-2 ml-[3.25rem]">
                  Review the standings across all tracks.
                </p>
              </div>

              <div className="flex-1 bg-slate-50/30">
                {isLoadingTeams ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                    <Loader2
                      size={36}
                      className="animate-spin text-[#f26f21] mb-4"
                    />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      Aggregating Scores...
                    </span>
                  </div>
                ) : roundTeams.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-medium text-base">
                    No teams found in this round yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 w-24 text-center">Rank</th>
                          <th className="px-6 py-5">Team Name</th>
                          <th className="px-6 py-5">Track Category</th>
                          <th className="px-8 py-5 text-center w-36">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50/80 bg-white">
                        {roundTeams.map((team, index) => {
                          let rankIcon = null;
                          let rankTextClass = "text-slate-400 font-extrabold";
                          let scoreClass = "text-slate-600 font-extrabold";

                          if (index === 0) {
                            rankIcon = (
                              <Trophy
                                size={24}
                                className="text-amber-400 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-amber-600 font-extrabold";
                            scoreClass = "text-amber-600 font-black";
                          } else if (index === 1) {
                            rankIcon = (
                              <Medal
                                size={24}
                                className="text-slate-400 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-slate-500 font-extrabold";
                            scoreClass = "text-slate-600 font-black";
                          } else if (index === 2) {
                            rankIcon = (
                              <Medal
                                size={24}
                                className="text-amber-700/70 drop-shadow-sm mb-1"
                                strokeWidth={2}
                              />
                            );
                            rankTextClass = "text-amber-800 font-extrabold";
                            scoreClass = "text-amber-700 font-black";
                          }

                          const trackName =
                            tracks.find(
                              (tr) =>
                                String(tr.trackID || tr.trackId || tr.id) ===
                                String(team.trackId || team.trackID),
                            )?.trackName || "Unassigned";

                          return (
                            <tr
                              key={team.teamId || index}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-8 py-4">
                                <div className="flex flex-col items-center justify-center">
                                  {rankIcon ? (
                                    <>
                                      {rankIcon}
                                      <span
                                        className={`text-[9px] tracking-widest uppercase ${rankTextClass}`}
                                      >
                                        TOP {index + 1}
                                      </span>
                                    </>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-extrabold text-xs shadow-sm">
                                      {index + 1}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-base font-extrabold ${index < 3 ? "text-[#f26f21]" : "text-slate-700"}`}
                                >
                                  {team.teamName ||
                                    team.name ||
                                    "Anonymous Team"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold">
                                  {trackName}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className={`text-xl ${scoreClass}`}>
                                  {Number(team.score || 0).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!isEnded && !isRegistrationPhase && (
                <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[#f26f21]">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">
                        Total Teams
                      </span>
                      <span className="font-extrabold text-[#f26f21] text-base">
                        {roundTeams.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleNextRound}
                      disabled={
                        isLoading || isLoadingTeams || roundTeams.length === 0
                      }
                      className="w-full sm:w-auto px-8 py-4 bg-fpt-orange text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-fpt-orange-dark hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FastForward size={18} strokeWidth={2.5} />
                      {isLastRound
                        ? "Conclude Event"
                        : `Advance Top ${advanceTopN} Teams to Next Round`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "prizes" && (
            <PrizesSection
              eventId={String(id)}
              phase={phase}
              canEdit={!isLocked}
              finalStandings={roundTeams}
            />
          )}

          {activeTab === "teams" && <TeamsSection eventId={String(id)} />}

          {activeTab === "staff" && (
            <StaffSection tracks={tracks} canEdit={!isLocked} />
          )}

          {activeTab === "audit" && (
            <AuditLogsSection
              eventId={String(id)}
              rounds={eventRounds}
              allRounds={systemRounds}
              tracks={tracks}
              teams={allTeams}
              teamInRounds={teamInRounds}
            />
          )}
        </div>
      </div>
    </main>
  );
}
