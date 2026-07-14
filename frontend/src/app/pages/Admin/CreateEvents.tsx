import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Lock,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// IMPORT API INSTANCES
import { criteriaApi } from "../../lib/api/criteriaApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";

// Helper lấy mảng an toàn
const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

// Hàm dò tìm ID bất chấp Backend đặt tên biến là gì
const extractId = (obj: any): string | null => {
  if (!obj) return null;
  return (
    obj.id ||
    obj.trackId ||
    obj.trackID ||
    obj.topicId ||
    obj.topicID ||
    obj.criteriaId ||
    obj.CriteriaId ||
    obj.criteriaID ||
    obj.setID ||
    obj.setId ||
    obj.criteriaSetId ||
    obj.criteriaSetID ||
    // ⚠️ Khóa ngoại để CUỐI cùng — nếu không sẽ che mất ID thật của track
    obj.eventId ||
    obj.eventID ||
    null
  );
};

// Lấy CHÍNH XÁC trackId của một track object (không bao giờ nhầm sang eventId)
const pickTrackId = (obj: any): string | null => {
  if (!obj) return null;
  return obj.trackId || obj.trackID || obj.id || null;
};

export function CreateEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);

  // ==========================================
  // STATE LƯU ID ĐỂ CHỐNG TRÙNG LẶP KHI QUAY LẠI TABS
  // ==========================================
  const [savedEventId, setSavedEventId] = useState<string | null>(null);
  const [savedPrelimSetId, setSavedPrelimSetId] = useState<string | null>(null);
  const [savedFinalSetId, setSavedFinalSetId] = useState<string | null>(null);

  // ==========================================
  // STATE DỮ LIỆU TỪNG TAB
  // ==========================================
  const [eventForm, setEventForm] = useState({
    eventName: "",
    season: "Fall",
    year: 2026,
  });

  const [tracks, setTracks] = useState<any[]>([
    { id: 1, name: "", topics: [] },
  ]);
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  const [rubrics, setRubrics] = useState({
    prelim: [
      { id: 1, name: "Tính sáng tạo", weight: 50 },
      { id: 2, name: "Tính thực tế", weight: 50 },
    ],
    final: [{ id: 3, name: "Tính hoàn thiện", weight: 100 }],
  });

  // ===== #3A: Tạo mới HAY dùng lại bộ tiêu chí có sẵn =====
  const [rubricMode, setRubricMode] = useState<"new" | "reuse">("new");
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [reusePrelimSetId, setReusePrelimSetId] = useState<string>("");
  const [reuseFinalSetId, setReuseFinalSetId] = useState<string>("");

  // Nạp danh sách bộ tiêu chí có sẵn (kèm tên tiêu chí để xem trước)
  const loadAvailableSets = async () => {
    try {
      setLoadingSets(true);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap: Record<string, string> = {};
      getList(critRaw).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) critMap[String(cid)] = c.criteriaName || c.name || "(?)";
      });
      const looksGuid = (v: any) =>
        typeof v === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          v,
        );
      const grabSetId = (s: any): string | null => {
        const direct =
          s.setID || s.setId || s.criteriaSetId || s.criteriaSetID || s.id;
        if (direct) return direct;
        // Dự phòng: quét bất kỳ field nào có giá trị dạng GUID (bỏ qua field event)
        for (const k of Object.keys(s)) {
          if (k.toLowerCase().includes("event")) continue;
          if (looksGuid(s[k])) return s[k];
        }
        return null;
      };
      const enriched = getList(setsRaw)
        .map((s: any) => {
          // ⚠️ Backend trả ID set dưới nhiều tên; phải lấy đúng GUID, KHÔNG được để undefined
          const sid = grabSetId(s);
          const rawList =
            s.criteriaList ||
            s.CriteriaList ||
            s.criteriaMappingItemViewModels ||
            [];
          const list = rawList.map((it: any) => {
            const cid =
              it.criteriaId || it.criteriaID || it.CriteriaId || it.id;
            return {
              name: critMap[String(cid)] || "(?)",
              score: it.score ?? it.Score ?? 0,
            };
          });
          return {
            setId: sid,
            setName: s.setName || s.SetName || "Bộ tiêu chí",
            items: list,
          };
        })
        // Bỏ những set không lấy được ID (tránh dùng nhầm tên bộ làm value)
        .filter((s: any) => !!s.setId);
      setAvailableSets(enriched);
    } catch (e) {
      console.error("Lỗi tải bộ tiêu chí có sẵn:", e);
      Swal.fire("Lỗi", "Không tải được danh sách bộ tiêu chí có sẵn.", "error");
    } finally {
      setLoadingSets(false);
    }
  };

  const switchRubricMode = (mode: "new" | "reuse") => {
    setRubricMode(mode);
    if (mode === "reuse" && availableSets.length === 0) loadAvailableSets();
  };

  const [rounds, setRounds] = useState({
    prelim: { startDate: "", endDate: "", maxTeams: 40, topAdvance: 10 },
    final: { endDate: "" },
  });

  // ==========================================
  // HÀM XỬ LÝ LƯU TỪNG TAB (ROBUST UPSERT LÝ TƯỞNG)
  // ==========================================

  // TAB 1: SỰ KIỆN
  const handleSaveEvent = async () => {
    if (!eventForm.eventName.trim())
      return Swal.fire("Lỗi", "Vui lòng nhập tên sự kiện!", "warning");

    try {
      Swal.fire({
        title: "Đang lưu Sự kiện...",
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        eventName: eventForm.eventName.trim(),
        season: eventForm.season,
        year: Number(eventForm.year),
      };

      if (savedEventId) {
        // Đã có ID -> Gọi PUT (Bọc try-catch lỡ Backend ko hỗ trợ PUT)
        try {
          await eventApi.updateEvent(savedEventId, payload);
        } catch (e) {
          console.warn("Lỗi update event, bỏ qua lỗi này");
        }
      } else {
        // Chưa có ID -> Gọi POST
        try {
          const res: any = await eventApi.createEvent(payload as any);
          let eventId = extractId(res);
          if (!eventId) throw new Error("Chưa lấy được ID");
          setSavedEventId(eventId);
        } catch (error) {
          // Bị lỗi (có thể do trùng tên) -> Gọi GET tìm lại
          const allEvents = getList(await eventApi.getAllEvents());
          const matchedEvent = [...allEvents]
            .reverse()
            .find((e: any) => (e.name || e.eventName) === payload.eventName);
          const foundId = extractId(matchedEvent);
          if (!foundId) throw error;
          setSavedEventId(foundId);
        }
      }

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(2);
    } catch (error) {
      Swal.fire("Lỗi", "Lỗi lưu sự kiện!", "error");
    }
  };

  // TAB 2: HẠNG MỤC (TRACKS & TOPICS)
  const handleSaveTracks = async () => {
    if (!savedEventId)
      return Swal.fire("Lỗi", "Vui lòng lưu Sự kiện ở Tab 1 trước!", "error");

    try {
      Swal.fire({
        title: "Đang đồng bộ Hạng mục...",
        didOpen: () => Swal.showLoading(),
      });
      const topicFails: string[] = [];
      const allTracksRaw = await trackTopicApi.getAllTracks();
      const existingTracks = getList(allTracksRaw).filter(
        (t) => String(t.eventId || t.eventID) === String(savedEventId),
      );

      for (const track of tracks) {
        if (!track.name.trim()) continue;

        // Dò tìm Track ID một cách CHÍNH XÁC (pickTrackId không bao giờ nhầm sang eventId)
        const matchedTrack = existingTracks.find(
          (t) =>
            (t.trackName || t.name || "")?.toLowerCase() ===
            track.name.trim().toLowerCase(),
        );
        let currentTrackId = pickTrackId(matchedTrack);

        if (currentTrackId) {
          try {
            await trackTopicApi.updateTrack(currentTrackId, {
              eventId: savedEventId,
              trackName: track.name.trim(),
            } as any);
          } catch (e) {
            console.warn("Lỗi update track", e);
          }
        } else {
          try {
            const trackRes: any = await trackTopicApi.createTrack({
              eventId: savedEventId,
              trackName: track.name.trim(),
            } as any);
            currentTrackId = pickTrackId(trackRes);
          } catch (e: any) {
            console.warn("createTrack lỗi (có thể trùng tên), GET lại:", e);
          }
        }

        // Nếu vẫn chưa có ID (POST trả body rỗng / trùng tên) -> GET lại dò theo tên
        if (!currentTrackId) {
          const refetchTracks = getList(await trackTopicApi.getAllTracks());
          const refetchMatch = [...refetchTracks]
            .reverse()
            .find(
              (t) =>
                (t.trackName || t.name || "")?.trim().toLowerCase() ===
                  track.name.trim().toLowerCase() &&
                String(t.eventId || t.eventID) === String(savedEventId),
            );
          currentTrackId = pickTrackId(refetchMatch);
        }

        // 🛡️ GUARD: chặn trường hợp ID bị nhầm sang eventId
        if (
          !currentTrackId ||
          String(currentTrackId) === String(savedEventId)
        ) {
          console.error(
            "🟥 Không lấy được trackId hợp lệ cho track:",
            track.name,
            "-> bỏ qua topic.",
          );
          continue;
        }
        console.log("🟩 Track OK:", track.name, "-> trackId =", currentTrackId);

        // Xử lý Topic
        let existingTopics: any[] = [];
        try {
          existingTopics = getList(await trackTopicApi.getAllTopics()).filter(
            (t) => String(t.trackID || t.trackId) === String(currentTrackId),
          );
        } catch (e) {
          console.warn("getAllTopics lỗi:", e);
        }

        for (const topic of track.topics) {
          const name = String(topic).trim();
          if (!name) continue;
          const isExist = existingTopics.some(
            (t) =>
              (t.topicDetail || t.name || "")?.trim().toLowerCase() ===
              name.toLowerCase(),
          );
          if (isExist) continue;
          try {
            console.log("🟦 POST topic:", name, "-> trackID:", currentTrackId);
            await trackTopicApi.createTopic({
              trackID: currentTrackId,
              topicDetail: name,
            } as any);
          } catch (e: any) {
            const msg =
              e?.response?.data?.message ||
              e?.response?.data?.title ||
              (typeof e?.response?.data === "string" ? e.response.data : "") ||
              e?.message ||
              "lỗi không rõ";
            console.error(
              "🟥 POST topic lỗi:",
              name,
              e?.response?.status,
              e?.response?.data,
            );
            topicFails.push(`"${name}" — ${msg}`);
          }
        }
      }

      if (topicFails.length > 0) {
        Swal.fire(
          "Một số chủ đề KHÔNG tạo được",
          `Backend từ chối ${topicFails.length} chủ đề (thường do trùng tên đã tồn tại trong hệ thống):<br><br>` +
            topicFails.join("<br>"),
          "warning",
        );
      } else {
        Swal.fire({
          icon: "success",
          title: "Đã lưu Hạng mục!",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      setActiveTab(3);
    } catch (error) {
      console.error(error);
      Swal.fire("Lỗi", "Quá trình lưu Hạng mục có lỗi!", "error");
    }
  };

  // TAB 3: TIÊU CHÍ (CRITERIA)
  const handleSaveRubrics = async () => {
    if (rubricMode === "reuse") {
      if (!reusePrelimSetId || !reuseFinalSetId)
        return Swal.fire(
          "Lỗi",
          "Hãy chọn bộ tiêu chí có sẵn cho cả Sơ khảo và Chung kết!",
          "warning",
        );
    } else {
      const prelimTotal = rubrics.prelim.reduce(
        (s, r) => s + Number(r.weight || 0),
        0,
      );
      const finalTotal = rubrics.final.reduce(
        (s, r) => s + Number(r.weight || 0),
        0,
      );
      if (prelimTotal !== 100 || finalTotal !== 100)
        return Swal.fire(
          "Lỗi",
          "Tổng trọng số mỗi vòng phải đúng 100%!",
          "warning",
        );
    }

    try {
      Swal.fire({
        title: "Đang lưu Bộ Tiêu Chí...",
        didOpen: () => Swal.showLoading(),
      });

      const syncSet = async (
        rubricList: any[],
        setName: string,
        existingSetId: string | null,
      ) => {
        const criteriaMap = await Promise.all(
          rubricList.map(async (r) => {
            let cId = null;
            try {
              const res = await criteriaApi.createCriterion({
                criteriaName: r.name.trim(),
                description: "Tiêu chí Hackathon",
              } as any);
              cId = extractId(res);
            } catch (e) {
              // Lỗi 400 do trùng tên -> Bỏ qua để dò ID
            }

            if (!cId) {
              const allC = getList(await criteriaApi.getAllCriteria());
              const found = [...allC]
                .reverse()
                .find(
                  (c: any) =>
                    (c.criteriaName || c.name || "").trim().toLowerCase() ===
                    r.name.trim().toLowerCase(),
                );
              cId = extractId(found);
            }
            // Chuẩn hóa Object gửi lên Set
            return {
              criteriaId: cId,
              CriteriaId: cId,
              score: Number(r.weight),
              Score: Number(r.weight),
            };
          }),
        );

        const payload = {
          setName: setName,
          isDefault: true,
          criteriaList: criteriaMap,
          CriteriaList: criteriaMap,
        };
        let setId = existingSetId;

        if (setId) {
          try {
            await criteriaApi.updateSet(setId, payload as any);
          } catch (e) {
            console.warn(e);
          }
        } else {
          try {
            const res = await criteriaApi.createSet(payload as any);
            setId = extractId(res);
          } catch (e) {
            /* Bỏ qua nếu lỗi */
          }

          if (!setId) {
            const allS = getList(await criteriaApi.getAllSet());
            const foundSet = [...allS]
              .reverse()
              .find(
                (s: any) =>
                  (s.setName || s.name || "").trim().toLowerCase() ===
                  setName.toLowerCase(),
              );
            setId = extractId(foundSet);
          }
        }
        return setId;
      };

      let pId: string | null;
      let fId: string | null;
      if (rubricMode === "reuse") {
        pId = reusePrelimSetId;
        fId = reuseFinalSetId;
      } else {
        pId = await syncSet(
          rubrics.prelim,
          `${eventForm.eventName} - Prelim Set`,
          savedPrelimSetId,
        );
        fId = await syncSet(
          rubrics.final,
          `${eventForm.eventName} - Final Set`,
          savedFinalSetId,
        );
      }

      setSavedPrelimSetId(pId);
      setSavedFinalSetId(fId);

      Swal.fire({
        icon: "success",
        title: "Đã lưu Tiêu chí!",
        showConfirmButton: false,
        timer: 1000,
      });
      setActiveTab(4);
    } catch (error) {
      Swal.fire("Lỗi", "Không thể lưu Bộ tiêu chí!", "error");
    }
  };

  // TAB 4: VÒNG THI (ROUNDS)
  const handleSaveRounds = async () => {
    if (!savedEventId || !savedPrelimSetId || !savedFinalSetId)
      return Swal.fire("Lỗi", "Bà chưa lưu các Tab trước kìa!", "error");
    if (
      !rounds.prelim.startDate ||
      !rounds.prelim.endDate ||
      !rounds.final.endDate
    )
      return Swal.fire("Lỗi", "Vui lòng nhập đầy đủ ngày giờ!", "warning");

    // 🚦 KIỂM TRA THỨ TỰ NGÀY GIỜ (nguyên nhân hay gặp khiến backend từ chối round)
    const dStart = new Date(rounds.prelim.startDate);
    const dPrelimEnd = new Date(rounds.prelim.endDate);
    const dFinalEnd = new Date(rounds.final.endDate);
    if (
      isNaN(dStart.getTime()) ||
      isNaN(dPrelimEnd.getTime()) ||
      isNaN(dFinalEnd.getTime())
    )
      return Swal.fire("Lỗi", "Ngày giờ không hợp lệ.", "warning");
    if (dPrelimEnd <= dStart)
      return Swal.fire(
        "Sai mốc thời gian",
        "Ngày ĐÓNG cổng Sơ khảo phải SAU ngày MỞ cổng Sơ khảo.",
        "warning",
      );
    if (dFinalEnd <= dPrelimEnd)
      return Swal.fire(
        "Sai mốc thời gian",
        "Ngày Công bố Quán quân (đóng Chung kết) phải SAU ngày đóng cổng Sơ khảo.",
        "warning",
      );

    try {
      Swal.fire({
        title: "Đang chốt Sổ Vòng Thi...",
        didOpen: () => Swal.showLoading(),
      });
      const toIso = (dateStr: string) => new Date(dateStr).toISOString();

      const prelimPayload = {
        eventID: savedEventId,
        roundName: "Vòng Sơ khảo",
        startDate: toIso(rounds.prelim.startDate),
        endDate: toIso(rounds.prelim.endDate),
        topNPromotion: Number(rounds.prelim.topAdvance),
        maxTeam: Number(rounds.prelim.maxTeams),
        roundIndex: 0,
        criteriaSetID: savedPrelimSetId,
      };
      const finalPayload = {
        eventID: savedEventId,
        roundName: "Vòng Chung kết",
        startDate: toIso(rounds.prelim.endDate),
        endDate: toIso(rounds.final.endDate),
        topNPromotion: 1,
        maxTeam: Number(rounds.prelim.topAdvance),
        roundIndex: 1,
        criteriaSetID: savedFinalSetId,
      };

      console.log("🟦 Payload round Sơ khảo:", prelimPayload);
      console.log("🟦 Payload round Chung kết:", finalPayload);

      await roundApi.createRound(prelimPayload as any);
      await roundApi.createRound(finalPayload as any);

      Swal.fire({
        icon: "success",
        title: "Hoàn tất Mỹ mãn!",
        text: "Hệ thống sự kiện đã lên sóng thành công 100%.",
        confirmButtonColor: "#0f172a",
      }).then(() => navigate("/admin/events"));
    } catch (error: any) {
      // 🟥 Hiện ĐÚNG lỗi backend thay vì câu "lỗi ngày giờ" gây hiểu lầm
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : "") ||
        error?.message ||
        "Không rõ nguyên nhân";
      console.error(
        "🟥 Lỗi tạo Round - chi tiết backend:",
        error?.response?.status,
        error?.response?.data || error,
      );
      Swal.fire("Lỗi tạo Vòng thi", `Backend báo: ${serverMsg}`, "error");
    }
  };

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Khởi tạo Sự kiện
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Thiết lập cấu trúc kỳ thi mới theo từng bước.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/events")}
          className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          Hủy & Quay lại
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6 min-h-[500px] flex flex-col">
        {/* THANH MENU TABS */}
        <div className="flex border-b border-slate-100 px-2 bg-slate-50/50">
          {[
            { id: 1, name: "1. Sự kiện", isSaved: !!savedEventId },
            { id: 2, name: "2. Hạng mục (Track)", isSaved: false },
            {
              id: 3,
              name: "3. Bộ tiêu chí (Rubric)",
              isSaved: !!savedPrelimSetId,
            },
            { id: 4, name: "4. Vòng thi (Round)", isSaved: false },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.id > 1 && !savedEventId} // KHÓA CÁC TAB NẾU CHƯA TẠO EVENT
              className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                ${
                  activeTab === tab.id
                    ? "border-black text-black bg-white"
                    : tab.isSaved
                      ? "border-transparent text-emerald-600 hover:text-emerald-700 hover:bg-white"
                      : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                }`}
            >
              {tab.isSaved && activeTab !== tab.id && (
                <CheckCircle2 size={16} />
              )}
              {tab.name}
              {tab.id > 1 && !savedEventId && (
                <Lock size={14} className="ml-1 opacity-50" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {/* TAB 1: SỰ KIỆN */}
          {activeTab === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  THÔNG TIN CƠ BẢN
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Tên hiển thị sự kiện
                    </label>
                    <input
                      type="text"
                      value={eventForm.eventName}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          eventName: e.target.value,
                        })
                      }
                      placeholder="VD: SEAL Hackathon Fall 2026..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Học kỳ (Season)
                      </label>
                      <select
                        value={eventForm.season}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, season: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black shadow-sm cursor-pointer"
                      >
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                        <option value="Winter">Winter</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Năm (Year)
                      </label>
                      <input
                        type="number"
                        value={eventForm.year}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            year: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-200 pt-6 mt-6">
                  <button
                    onClick={handleSaveEvent}
                    className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Save size={16} /> Lưu & Đi tiếp <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HẠNG MỤC */}
          {activeTab === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Thiết lập Hạng mục (Tracks)
                </h3>
                <button
                  onClick={() =>
                    setTracks([
                      ...tracks,
                      { id: Date.now(), name: "", topics: [] },
                    ])
                  }
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-200"
                >
                  <Plus size={14} /> Thêm Hạng mục
                </button>
              </div>

              <div className="space-y-4">
                {tracks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-xl relative group"
                  >
                    <button
                      onClick={() =>
                        setTracks(tracks.filter((tr) => tr.id !== t.id))
                      }
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="mb-4 w-2/3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Tên Hạng mục {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) =>
                          setTracks(
                            tracks.map((tr) =>
                              tr.id === t.id
                                ? { ...tr, name: e.target.value }
                                : tr,
                            ),
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black shadow-sm"
                        placeholder="VD: Web App, Data Science..."
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                        Các chủ đề con (Topics)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {t.topics.map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm"
                          >
                            {topic}{" "}
                            <button
                              onClick={() =>
                                setTracks(
                                  tracks.map((tr) =>
                                    tr.id === t.id
                                      ? {
                                          ...tr,
                                          topics: tr.topics.filter(
                                            (_: any, index: any) => index !== i,
                                          ),
                                        }
                                      : tr,
                                  ),
                                )
                              }
                              className="hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={topicInputs[t.id] || ""}
                          onChange={(e) =>
                            setTopicInputs({
                              ...topicInputs,
                              [t.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              topicInputs[t.id]?.trim()
                            ) {
                              setTracks(
                                tracks.map((tr) =>
                                  tr.id === t.id
                                    ? {
                                        ...tr,
                                        topics: [
                                          ...tr.topics,
                                          topicInputs[t.id].trim(),
                                        ],
                                      }
                                    : tr,
                                ),
                              );
                              setTopicInputs({ ...topicInputs, [t.id]: "" });
                            }
                          }}
                          placeholder="Nhập tên chủ đề con và ấn Enter..."
                          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-black shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab(1)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleSaveTracks}
                  className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save size={16} /> Lưu Hạng mục & Đi tiếp{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TIÊU CHÍ */}
          {activeTab === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 text-center mb-6">
                Trọng số Đánh giá (Rubric)
              </h3>

              {/* #3A: Chọn chế độ tạo mới / dùng bộ có sẵn */}
              <div className="flex justify-center gap-2 mb-2">
                <button
                  onClick={() => switchRubricMode("new")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                    rubricMode === "new"
                      ? "bg-black text-white border-black"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Tạo bộ tiêu chí mới
                </button>
                <button
                  onClick={() => switchRubricMode("reuse")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                    rubricMode === "reuse"
                      ? "bg-black text-white border-black"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Dùng bộ có sẵn
                </button>
              </div>

              {rubricMode === "new" && (
                <div className="grid grid-cols-2 gap-6">
                  {/* PRELIM */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">
                      Sơ Khảo (Prelim)
                    </h4>
                    <div className="space-y-3">
                      {rubrics.prelim.map((r) => (
                        <div key={r.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) =>
                              setRubrics({
                                ...rubrics,
                                prelim: rubrics.prelim.map((i) =>
                                  i.id === r.id
                                    ? { ...i, name: e.target.value }
                                    : i,
                                ),
                              })
                            }
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-black"
                            placeholder="Tên tiêu chí"
                          />
                          <div className="relative w-20">
                            <input
                              type="number"
                              value={r.weight}
                              onChange={(e) =>
                                setRubrics({
                                  ...rubrics,
                                  prelim: rubrics.prelim.map((i) =>
                                    i.id === r.id
                                      ? { ...i, weight: Number(e.target.value) }
                                      : i,
                                  ),
                                })
                              }
                              className="w-full px-2 py-2 pr-6 text-sm text-center bg-slate-50 border border-slate-200 rounded-lg font-black outline-none focus:border-black"
                            />
                            <span className="absolute right-2 top-2 text-slate-400 text-sm font-bold">
                              %
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setRubrics({
                                ...rubrics,
                                prelim: rubrics.prelim.filter(
                                  (i) => i.id !== r.id,
                                ),
                              })
                            }
                            className="text-slate-300 hover:text-red-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setRubrics({
                            ...rubrics,
                            prelim: [
                              ...rubrics.prelim,
                              { id: Date.now(), name: "", weight: 0 },
                            ],
                          })
                        }
                        className="text-xs font-bold text-slate-500 hover:text-black mt-2"
                      >
                        + Thêm tiêu chí
                      </button>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between font-bold text-sm">
                      <span className="text-slate-500">Tổng trọng số:</span>
                      <span
                        className={
                          rubrics.prelim.reduce(
                            (s, r) => s + Number(r.weight || 0),
                            0,
                          ) === 100
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {rubrics.prelim.reduce(
                          (s, r) => s + Number(r.weight || 0),
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  {/* FINAL */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">
                      Chung Kết (Final)
                    </h4>
                    <div className="space-y-3">
                      {rubrics.final.map((r) => (
                        <div key={r.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) =>
                              setRubrics({
                                ...rubrics,
                                final: rubrics.final.map((i) =>
                                  i.id === r.id
                                    ? { ...i, name: e.target.value }
                                    : i,
                                ),
                              })
                            }
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-black"
                            placeholder="Tên tiêu chí"
                          />
                          <div className="relative w-20">
                            <input
                              type="number"
                              value={r.weight}
                              onChange={(e) =>
                                setRubrics({
                                  ...rubrics,
                                  final: rubrics.final.map((i) =>
                                    i.id === r.id
                                      ? { ...i, weight: Number(e.target.value) }
                                      : i,
                                  ),
                                })
                              }
                              className="w-full px-2 py-2 pr-6 text-sm text-center bg-slate-50 border border-slate-200 rounded-lg font-black outline-none focus:border-black"
                            />
                            <span className="absolute right-2 top-2 text-slate-400 text-sm font-bold">
                              %
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setRubrics({
                                ...rubrics,
                                final: rubrics.final.filter(
                                  (i) => i.id !== r.id,
                                ),
                              })
                            }
                            className="text-slate-300 hover:text-red-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setRubrics({
                            ...rubrics,
                            final: [
                              ...rubrics.final,
                              { id: Date.now(), name: "", weight: 0 },
                            ],
                          })
                        }
                        className="text-xs font-bold text-slate-500 hover:text-black mt-2"
                      >
                        + Thêm tiêu chí
                      </button>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between font-bold text-sm">
                      <span className="text-slate-500">Tổng trọng số:</span>
                      <span
                        className={
                          rubrics.final.reduce(
                            (s, r) => s + Number(r.weight || 0),
                            0,
                          ) === 100
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {rubrics.final.reduce(
                          (s, r) => s + Number(r.weight || 0),
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {rubricMode === "reuse" && (
                <div className="grid grid-cols-2 gap-6">
                  {(["prelim", "final"] as const).map((slot) => {
                    const isPrelim = slot === "prelim";
                    const selectedId = isPrelim
                      ? reusePrelimSetId
                      : reuseFinalSetId;
                    const setSel = isPrelim
                      ? setReusePrelimSetId
                      : setReuseFinalSetId;
                    const picked = availableSets.find(
                      (s) => String(s.setId) === String(selectedId),
                    );
                    return (
                      <div
                        key={slot}
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
                      >
                        <h4 className="font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">
                          {isPrelim ? "Sơ Khảo (Prelim)" : "Chung Kết (Final)"}
                        </h4>
                        {loadingSets ? (
                          <p className="text-sm text-slate-400 italic">
                            Đang tải danh sách bộ tiêu chí...
                          </p>
                        ) : availableSets.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">
                            Chưa có bộ tiêu chí nào trong hệ thống.
                          </p>
                        ) : (
                          <>
                            <select
                              value={selectedId}
                              onChange={(e) => setSel(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-black"
                            >
                              <option value="">-- Chọn bộ tiêu chí --</option>
                              {availableSets.map((s) => (
                                <option key={s.setId} value={s.setId}>
                                  {s.setName}
                                </option>
                              ))}
                            </select>
                            {picked && (
                              <div className="mt-4 space-y-2">
                                {picked.items.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">
                                    Bộ này chưa có tiêu chí.
                                  </p>
                                ) : (
                                  picked.items.map((it: any, i: number) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center text-sm px-3 py-2 bg-slate-50 rounded-lg"
                                    >
                                      <span className="font-semibold text-slate-700">
                                        {it.name}
                                      </span>
                                      <span className="font-black text-slate-500">
                                        {it.score}%
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab(2)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleSaveRubrics}
                  className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save size={16} /> Lưu Tiêu chí & Đi tiếp{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ROUNDS */}
          {activeTab === 4 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-left-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  LỊCH TRÌNH VÒNG THI
                </h3>

                <div className="space-y-6">
                  {/* SƠ KHẢO */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                      Vòng Sơ Khảo (Round 0)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                          Mở cổng thi
                        </label>
                        <input
                          type="datetime-local"
                          value={rounds.prelim.startDate}
                          onChange={(e) =>
                            setRounds({
                              ...rounds,
                              prelim: {
                                ...rounds.prelim,
                                startDate: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                          Đóng cổng thi (Chấm điểm)
                        </label>
                        <input
                          type="datetime-local"
                          value={rounds.prelim.endDate}
                          onChange={(e) =>
                            setRounds({
                              ...rounds,
                              prelim: {
                                ...rounds.prelim,
                                endDate: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-black"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                          Giới hạn Đội đăng ký
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rounds.prelim.maxTeams}
                          onChange={(e) =>
                            setRounds({
                              ...rounds,
                              prelim: {
                                ...rounds.prelim,
                                maxTeams: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                          Chỉ tiêu vào Chung Kết (Top N)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rounds.prelim.topAdvance}
                          onChange={(e) =>
                            setRounds({
                              ...rounds,
                              prelim: {
                                ...rounds.prelim,
                                topAdvance: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHUNG KẾT */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                      Vòng Chung Kết (Round 1)
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 italic">
                      Vòng chung kết sẽ tự động bắt đầu ngay khi Vòng sơ khảo
                      kết thúc và kế thừa danh sách Top{" "}
                      {rounds.prelim.topAdvance} đội thi.
                    </p>
                    <div className="space-y-2 w-1/2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Đóng cổng & Công bố Quán quân
                      </label>
                      <input
                        type="datetime-local"
                        value={rounds.final.endDate}
                        onChange={(e) =>
                          setRounds({
                            ...rounds,
                            final: { ...rounds.final, endDate: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-200 mt-6">
                  <button
                    onClick={() => setActiveTab(3)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50"
                  >
                    ← Quay lại
                  </button>
                  <button
                    onClick={handleSaveRounds}
                    className="px-8 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl shadow-md hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Hoàn tất & Khởi chạy Hệ thống
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
