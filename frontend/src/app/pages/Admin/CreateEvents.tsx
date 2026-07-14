import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// IMPORT API INSTANCES
import { criteriaApi } from "../../lib/api/criteriaApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";

// HÀM DÙNG CHUNG (dùng chung với EventDetailsPage — xem lib/utils/criteriaHelpers.ts)
import {
  getList,
  extractId,
  pickTrackId,
  grabSetId,
  sumWeight,
  buildCriteriaMap,
  loadSetsWithItems,
  DEFAULT_CRITERIA_DESCRIPTION,
} from "../../lib/utils/criteriaHelpers";

interface RubricItem {
  id: number;
  name: string;
  description: string;
  weight: number;
}

/**
 * Một khối chỉnh sửa tiêu chí (tên + mô tả + trọng số) cho một vòng thi.
 * Dùng chung cho Sơ khảo & Chung kết để tránh lặp code.
 */
function RubricPanel({
  title,
  items,
  onChange,
}: {
  title: string;
  items: RubricItem[];
  onChange: (items: RubricItem[]) => void;
}) {
  const total = sumWeight(items);
  const isValid = total === 100;

  const addItem = () =>
    onChange([
      ...items,
      { id: Date.now(), name: "", description: "", weight: 0 },
    ]);
  const removeItem = (id: number) => onChange(items.filter((i) => i.id !== id));
  const updateItem = (id: number, patch: Partial<RubricItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h4 className="font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">
        {title}
      </h4>
      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r.id}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
          >
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateItem(r.id, { name: e.target.value })}
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-semibold focus:border-black"
                placeholder="Tên tiêu chí"
              />
              <div className="relative w-20">
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) =>
                    updateItem(r.id, { weight: Number(e.target.value) })
                  }
                  className="w-full px-2 py-2 pr-6 text-sm text-center bg-white border border-slate-200 rounded-lg font-black outline-none focus:border-black"
                />
                <span className="absolute right-2 top-2 text-slate-400 text-sm font-bold">
                  %
                </span>
              </div>
              <button
                onClick={() => removeItem(r.id)}
                className="text-slate-300 hover:text-red-500 p-1"
                title="Xóa tiêu chí"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              type="text"
              value={r.description}
              onChange={(e) =>
                updateItem(r.id, { description: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-600 focus:border-black"
              placeholder="Mô tả tiêu chí (không bắt buộc)"
            />
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-xs font-bold text-slate-500 hover:text-black mt-2 flex items-center gap-1"
        >
          <Plus size={12} /> Thêm tiêu chí
        </button>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between font-bold text-sm">
        <span className="text-slate-500">Tổng trọng số:</span>
        <span className={isValid ? "text-emerald-600" : "text-red-500"}>
          {total}%
        </span>
      </div>
      {!isValid && (
        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> Tổng trọng số phải đúng 100% mới lưu được.
        </p>
      )}
    </div>
  );
}

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

  const [rubrics, setRubrics] = useState<{
    prelim: RubricItem[];
    final: RubricItem[];
  }>({
    prelim: [
      { id: 1, name: "Tính sáng tạo", description: "", weight: 50 },
      { id: 2, name: "Tính thực tế", description: "", weight: 50 },
    ],
    final: [{ id: 3, name: "Tính hoàn thiện", description: "", weight: 100 }],
  });
  const [isSavingRubrics, setIsSavingRubrics] = useState(false);

  // ===== #3A: Tạo mới HAY dùng lại bộ tiêu chí có sẵn =====
  const [rubricMode, setRubricMode] = useState<"new" | "reuse">("new");
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadSetsError, setLoadSetsError] = useState<string | null>(null);
  const [reusePrelimSetId, setReusePrelimSetId] = useState<string>("");
  const [reuseFinalSetId, setReuseFinalSetId] = useState<string>("");

  // Nạp danh sách bộ tiêu chí có sẵn (kèm tên + mô tả tiêu chí để xem trước)
  const loadAvailableSets = async () => {
    try {
      setLoadingSets(true);
      setLoadSetsError(null);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap = buildCriteriaMap(critRaw);

      const baseSets = getList(setsRaw)
        .map((s: any) => ({
          // ⚠️ Backend trả ID set dưới nhiều tên; phải lấy đúng GUID, KHÔNG được để undefined
          setId: grabSetId(s),
          setName: s.setName || s.SetName || "Bộ tiêu chí",
        }))
        // Bỏ những set không lấy được ID (tránh dùng nhầm tên bộ làm value)
        .filter((s): s is { setId: string; setName: string } => !!s.setId);

      // ⚠️ QUAN TRỌNG: getAllSet() chỉ trả danh sách rút gọn, KHÔNG kèm chi tiết
      // tiêu chí bên trong từng bộ — đây chính là lý do trước đây luôn hiện
      // "Bộ này chưa có tiêu chí" dù bộ thực sự có tiêu chí. Phải gọi chi tiết
      // từng bộ (getSetById) mới lấy đúng criteriaList, giống cách trang Chi
      // tiết sự kiện đang làm.
      const enriched = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setAvailableSets(enriched);
    } catch (e) {
      console.error("Lỗi tải bộ tiêu chí có sẵn:", e);
      setLoadSetsError("Không tải được danh sách bộ tiêu chí có sẵn.");
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
  const [isSavingRounds, setIsSavingRounds] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingTracks, setIsSavingTracks] = useState(false);

  // ==========================================
  // HÀM XỬ LÝ LƯU TỪNG TAB (ROBUST UPSERT LÝ TƯỞNG)
  // ==========================================

  // TAB 1: SỰ KIỆN
  const handleSaveEvent = async () => {
    if (!eventForm.eventName.trim())
      return Swal.fire("Lỗi", "Vui lòng nhập tên sự kiện!", "warning");

    setIsSavingEvent(true);
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
    } finally {
      setIsSavingEvent(false);
    }
  };

  // TAB 2: HẠNG MỤC (TRACKS & TOPICS)
  const handleSaveTracks = async () => {
    if (!savedEventId)
      return Swal.fire("Lỗi", "Vui lòng lưu Sự kiện ở Tab 1 trước!", "error");

    setIsSavingTracks(true);
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
            "Không lấy được trackId hợp lệ cho track:",
            track.name,
            "-> bỏ qua topic.",
          );
          continue;
        }

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
              "POST topic lỗi:",
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
    } finally {
      setIsSavingTracks(false);
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
      // 🔒 ÉP BUỘC: dù là bộ có sẵn, tổng trọng số bên trong vẫn phải đúng 100%
      const prelimSet = availableSets.find(
        (s) => String(s.setId) === String(reusePrelimSetId),
      );
      const finalSet = availableSets.find(
        (s) => String(s.setId) === String(reuseFinalSetId),
      );
      const prelimTotal = sumWeight(prelimSet?.items || []);
      const finalTotal = sumWeight(finalSet?.items || []);
      if (prelimTotal !== 100 || finalTotal !== 100)
        return Swal.fire(
          "Chưa đủ 100%",
          `Bộ Sơ khảo đang là ${prelimTotal}% và bộ Chung kết đang là ${finalTotal}%. ` +
            `Hãy vào trang "Chi tiết sự kiện" của bộ tương ứng để chỉnh trọng số đủ 100% trước, hoặc chọn bộ khác.`,
          "error",
        );
    } else {
      if (
        rubrics.prelim.some((r) => !r.name.trim()) ||
        rubrics.final.some((r) => !r.name.trim())
      )
        return Swal.fire(
          "Lỗi",
          "Vui lòng nhập đầy đủ tên cho tất cả tiêu chí!",
          "warning",
        );
      const prelimTotal = sumWeight(rubrics.prelim);
      const finalTotal = sumWeight(rubrics.final);
      if (prelimTotal !== 100 || finalTotal !== 100)
        return Swal.fire(
          "Chưa đủ 100%",
          `Tổng trọng số Sơ khảo đang là ${prelimTotal}% và Chung kết đang là ${finalTotal}%. ` +
            `Tổng trọng số mỗi vòng phải đúng 100% mới lưu được.`,
          "error",
        );
    }

    setIsSavingRubrics(true);
    try {
      Swal.fire({
        title: "Đang lưu Bộ Tiêu Chí...",
        didOpen: () => Swal.showLoading(),
      });

      const syncSet = async (
        rubricList: RubricItem[],
        setName: string,
        existingSetId: string | null,
      ) => {
        const criteriaMap = await Promise.all(
          rubricList.map(async (r) => {
            let cId = null;
            const description =
              r.description.trim() || DEFAULT_CRITERIA_DESCRIPTION;
            try {
              const res = await criteriaApi.createCriterion({
                criteriaName: r.name.trim(),
                description,
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

              // ⚠️ QUAN TRỌNG: nếu createCriterion thất bại vì TRÙNG TÊN (tiêu
              // chí đã tồn tại từ sự kiện trước — rất hay gặp với các tên mặc
              // định như "Tính sáng tạo"), thì tiêu chí cũ đó vẫn đang giữ mô
              // tả CŨ. Nếu không cập nhật lại, mô tả người dùng vừa gõ ở bước
              // này sẽ bị "nuốt mất", giao diện vẫn hiện mô tả cũ dù đã nhập
              // mô tả mới. Nên phải PUT lại để đồng bộ mô tả mới nhất.
              if (cId) {
                try {
                  await criteriaApi.updateCriterion(cId, {
                    criteriaID: cId,
                    criteriaId: cId,
                    criteriaName: r.name.trim(),
                    description,
                  } as any);
                } catch (e) {
                  console.warn(
                    "Không đồng bộ được mô tả cho tiêu chí trùng tên:",
                    r.name,
                    e,
                  );
                }
              }
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
    } finally {
      setIsSavingRubrics(false);
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

    setIsSavingRounds(true);
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

      await roundApi.createRound(prelimPayload as any);
      await roundApi.createRound(finalPayload as any);

      Swal.fire({
        icon: "success",
        title: "Hoàn tất Mỹ mãn!",
        text: "Hệ thống sự kiện đã lên sóng thành công 100%.",
        confirmButtonColor: "#0f172a",
      }).then(() => navigate("/admin/events"));
    } catch (error: any) {
      // Hiện ĐÚNG lỗi backend thay vì câu "lỗi ngày giờ" gây hiểu lầm
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : "") ||
        error?.message ||
        "Không rõ nguyên nhân";
      console.error(
        "Lỗi tạo Round - chi tiết backend:",
        error?.response?.status,
        error?.response?.data || error,
      );
      Swal.fire("Lỗi tạo Vòng thi", `Backend báo: ${serverMsg}`, "error");
    } finally {
      setIsSavingRounds(false);
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
                    disabled={isSavingEvent}
                    className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingEvent ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSavingEvent ? "Đang lưu..." : "Lưu & Đi tiếp"}
                    {!isSavingEvent && <ArrowRight size={16} />}
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
                  disabled={isSavingTracks}
                  className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingTracks ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSavingTracks ? "Đang lưu..." : "Lưu Hạng mục & Đi tiếp"}
                  {!isSavingTracks && <ArrowRight size={16} />}
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
                  <RubricPanel
                    title="Sơ Khảo (Prelim)"
                    items={rubrics.prelim}
                    onChange={(items) =>
                      setRubrics((prev) => ({ ...prev, prelim: items }))
                    }
                  />
                  <RubricPanel
                    title="Chung Kết (Final)"
                    items={rubrics.final}
                    onChange={(items) =>
                      setRubrics((prev) => ({ ...prev, final: items }))
                    }
                  />
                </div>
              )}

              {rubricMode === "reuse" && (
                <>
                  {/* Trạng thái LOADING */}
                  {loadingSets && (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải danh sách bộ tiêu chí...
                    </div>
                  )}

                  {/* Trạng thái LỖI */}
                  {!loadingSets && loadSetsError && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <AlertCircle size={24} className="text-red-500" />
                      <p className="text-sm text-red-500 font-semibold">
                        {loadSetsError}
                      </p>
                      <button
                        onClick={loadAvailableSets}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                      >
                        <RefreshCw size={13} /> Thử lại
                      </button>
                    </div>
                  )}

                  {/* Trạng thái RỖNG */}
                  {!loadingSets &&
                    !loadSetsError &&
                    availableSets.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm text-slate-400 italic">
                          Chưa có bộ tiêu chí nào trong hệ thống. Hãy chuyển
                          sang "Tạo bộ tiêu chí mới" ở trên.
                        </p>
                      </div>
                    )}

                  {/* DỮ LIỆU */}
                  {!loadingSets &&
                    !loadSetsError &&
                    availableSets.length > 0 && (
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
                          const pickedTotal = picked
                            ? sumWeight(picked.items)
                            : 0;
                          return (
                            <div
                              key={slot}
                              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
                            >
                              <h4 className="font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">
                                {isPrelim
                                  ? "Sơ Khảo (Prelim)"
                                  : "Chung Kết (Final)"}
                              </h4>
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
                                <>
                                  <div className="mt-4 space-y-2">
                                    {picked.items.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic">
                                        Bộ này chưa có tiêu chí.
                                      </p>
                                    ) : (
                                      picked.items.map((it: any, i: number) => (
                                        <div
                                          key={it.criteriaId || i}
                                          className="text-sm px-3 py-2 bg-slate-50 rounded-lg"
                                        >
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold text-slate-700">
                                              {it.name}
                                            </span>
                                            <span className="font-black text-slate-500">
                                              {it.score}%
                                            </span>
                                          </div>
                                          {it.description && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                              {it.description}
                                            </p>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  {picked.items.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-bold text-sm">
                                      <span className="text-slate-500">
                                        Tổng trọng số:
                                      </span>
                                      <span
                                        className={
                                          pickedTotal === 100
                                            ? "text-emerald-600"
                                            : "text-red-500"
                                        }
                                      >
                                        {pickedTotal}%
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </>
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
                  disabled={isSavingRubrics}
                  className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingRubrics ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSavingRubrics ? "Đang lưu..." : "Lưu Tiêu chí & Đi tiếp"}
                  {!isSavingRubrics && <ArrowRight size={16} />}
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
                    disabled={isSavingRounds}
                    className="px-8 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl shadow-md hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingRounds ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {isSavingRounds
                      ? "Đang khởi chạy..."
                      : "Hoàn tất & Khởi chạy Hệ thống"}
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
