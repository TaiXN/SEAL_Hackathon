import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Edit3,
  Users,
  Lock,
  FastForward,
  Trash2,
  RotateCcw,
  Pencil,
  ListChecks,
  Scale,
  Plus,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { trackTopicApi, type Track } from "../../lib/api/trackTopicApi";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { roundApi } from "../../lib/api/roundApi";

export function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tracks, setTracks] = useState<any[]>([]); // Lưu track kèm topic bên trong
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ===== #3: Bộ tiêu chí của sự kiện =====
  const [criteriaSets, setCriteriaSets] = useState<any[]>([]);
  const [deletedCriteria, setDeletedCriteria] = useState<any[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  // ===== #6: Round phụ =====
  const [eventRounds, setEventRounds] = useState<any[]>([]); // các round đã sort
  const [showAddRound, setShowAddRound] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [extraSets, setExtraSets] = useState<any[]>([]); // bộ tiêu chí có sẵn để chọn
  const [extraForm, setExtraForm] = useState<any>({
    roundName: "Vòng phụ",
    startDate: "",
    endDate: "",
    maxTeam: 5,
    topN: 1,
    critMode: "new", // 'new' | 'reuse'
    reuseSetId: "",
    rows: [{ name: "", score: 100 }],
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        if (id) {
          // 1. Lấy thông tin Event
          const eventData = await eventApi.getEventById(id);
          setEvent(eventData);

          // 2. Lấy tất cả Tracks và Topics
          const allTracks = await trackTopicApi.getAllTracks();
          const allTopics = await trackTopicApi.getAllTopics();

          // 3. Lọc Track thuộc về sự kiện này và map Topic vào
          const eventTracks = allTracks
            .filter((t: any) => String(t.eventId || t.eventID) === String(id))
            .map((t: any) => ({
              ...t,
              // Lọc topic có trackID trùng với track hiện tại
              topics: allTopics.filter(
                (top: any) =>
                  String(top.trackID || top.trackId) ===
                  String(t.trackID || t.trackId),
              ),
            }));

          setTracks(eventTracks);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sự kiện:", error);
        Swal.fire("Lỗi", "Không tải được thông tin từ máy chủ.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);
  const handleSave = async () => {
    if (!id || !event) return;
    if (!event.semester) {
      Swal.fire("Ê khoan!", "Bà quên chọn Học kỳ (Season) rồi kìa!", "warning");
      return;
    }
    try {
      setIsLoading(true);
      const roundBefore = Number(event.currentRound);
      const payload = {
        eventName: event.name,
        season: event.semester,
        year: Number(event.year),
        // 🔒 GIỮ NGUYÊN vòng hiện tại — nếu không backend sẽ reset về 0 (Sơ khảo)
        currentRound: event.currentRound,
      };
      console.log("🟦 [SAVE] currentRound TRƯỚC khi lưu:", roundBefore);
      console.log("🟦 [SAVE] Payload PUT gửi lên:", payload);

      const updRes = await eventApi.updateEvent(id, payload);
      console.log("🟦 [SAVE] Response updateEvent:", updRes);

      // Lấy lại từ server để biết SỰ THẬT round sau khi lưu, rồi đồng bộ UI
      const after = await eventApi.getEventById(id);
      const roundAfter = Number(after.currentRound);
      console.log(
        "🟥 [SAVE] currentRound SAU khi lưu (server thật):",
        roundAfter,
      );
      setEvent(after);

      if (roundAfter !== roundBefore) {
        // Backend đã NUỐT mất currentRound => đây là lỗi phía backend (DTO update)
        Swal.fire(
          "Đã lưu, nhưng backend tự đổi vòng!",
          `Bạn gửi currentRound = ${roundBefore} nhưng server trả về ${roundAfter}. ` +
            `Tức là API PUT /api/Event không nhận field currentRound từ payload — cần sửa ở backend.`,
          "warning",
        );
      } else {
        Swal.fire({
          icon: "success",
          title: "Đã lưu!",
          text: "Thông tin sự kiện đã được cập nhật thành công (vòng thi giữ nguyên).",
          confirmButtonColor: "#0f172a",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire("Lỗi", "Cập nhật thất bại. Vui lòng thử lại!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!id) return;

    const result = await Swal.fire({
      title: "Chuyển sang vòng tiếp theo?",
      text: "Hành động này sẽ đóng vòng thi hiện tại và chuyển sự kiện sang vòng mới. Không thể hoàn tác đâu nhé!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Chuyển vòng ngay!",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await eventApi.nextRound(id);
        Swal.fire("Thành công!", "Sự kiện đã chuyển trạng thái.", "success");

        // Tự động fetch lại để cập nhật UI
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error) {
        Swal.fire("Lỗi", "Không thể chuyển vòng!", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ===== #3: Tải bộ tiêu chí của sự kiện (qua các round -> criteriaSetId) =====
  // ===== #3: helper đọc criteriaList của 1 set (backend đặt nhiều tên khác nhau) =====
  const extractSetList = (setData: any): any[] => {
    const s = setData?.data || setData || {};
    if (Array.isArray(s)) return s;
    if (Array.isArray(s.criteriaList)) return s.criteriaList;
    if (Array.isArray(s.CriteriaList)) return s.CriteriaList;
    if (Array.isArray(s.criteriaMappingItemViewModels))
      return s.criteriaMappingItemViewModels;
    for (const k in s) if (Array.isArray(s[k])) return s[k];
    return [];
  };
  const itemCriteriaId = (it: any) =>
    it.criteriaId || it.criteriaID || it.CriteriaId || it.CriteriaID || it.id;
  const itemScore = (it: any) =>
    Number(it.score ?? it.Score ?? it.weight ?? it.Weight ?? 0);
  // Chuẩn hóa list để gửi lên updateSet (gửi cả 2 cách viết cho chắc)
  const toPayloadList = (items: any[]) =>
    items.map((it: any) => {
      const cid = it.criteriaId ?? itemCriteriaId(it);
      const sc = Number(it.score ?? itemScore(it));
      return { criteriaId: cid, CriteriaId: cid, score: sc, Score: sc };
    });

  // Lấy đúng câu báo lỗi backend trả về (thay vì câu chung chung)
  const getServerMsg = (e: any): string =>
    e?.response?.data?.message ||
    e?.response?.data?.title ||
    (typeof e?.response?.data === "string" ? e.response.data : "") ||
    e?.message ||
    "Không rõ nguyên nhân";

  const loadCriteria = async () => {
    if (!id) return;
    try {
      setLoadingCriteria(true);

      // 1. Lấy các round của sự kiện -> gom các criteriaSetId
      const allRounds = await roundApi.getAllRounds();
      const eventRounds = (allRounds || []).filter(
        (r: any) => String(r.eventID || r.eventId) === String(id),
      );
      // Sắp xếp theo thứ tự vòng để biết số vòng & vòng cuối (phục vụ #6)
      const sortedRounds = [...eventRounds].sort((a: any, b: any) => {
        const ai = Number(a.roundIndex ?? a.RoundIndex ?? 0);
        const bi = Number(b.roundIndex ?? b.RoundIndex ?? 0);
        if (ai !== bi) return ai - bi;
        return (
          new Date(a.startDate || a.StartDate || 0).getTime() -
          new Date(b.startDate || b.StartDate || 0).getTime()
        );
      });
      setEventRounds(sortedRounds);

      // 2. Lấy toàn bộ criteria để map id -> tên/mô tả; đồng thời lọc cái đã xóa (để restore)
      const allCrit = await criteriaApi.getAllCriteria();
      const critMap: Record<string, any> = {};
      (allCrit || []).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) critMap[String(cid)] = c;
      });
      setDeletedCriteria(
        (allCrit || []).filter(
          (c: any) => c.isActive === false || c.isDeleted === true,
        ),
      );

      // 3. Mỗi criteriaSet -> getSetById rồi gắn tên tiêu chí
      const sets: any[] = [];
      const seen = new Set<string>();
      for (const r of eventRounds) {
        const setId =
          (r as any).criteriaSetID ||
          (r as any).criteriaSetId ||
          (r as any).CriteriaSetID ||
          (r as any).CriteriaSetId;
        if (!setId || seen.has(String(setId))) continue;
        seen.add(String(setId));
        try {
          const setRes: any = await criteriaApi.getSetById(setId);
          const s = setRes?.data || setRes;
          const rawList = extractSetList(setRes);
          const items = rawList.map((it: any) => {
            const cid = itemCriteriaId(it);
            const info = critMap[String(cid)] || {};
            return {
              criteriaId: cid,
              name:
                info.criteriaName ||
                info.name ||
                it.criteriaName ||
                it.name ||
                "(không rõ tên)",
              description: info.description || it.description || "",
              score: itemScore(it),
              isActive: info.isActive !== false,
            };
          });
          sets.push({
            setId,
            setName: s.setName || s.SetName || "Bộ tiêu chí",
            isDefault: s.isDefault ?? s.IsDefault ?? false,
            roundName: r.roundName || "",
            items,
          });
        } catch (e) {
          console.warn("Không tải được set", setId, e);
        }
      }
      setCriteriaSets(sets);
    } catch (e) {
      console.error("Lỗi tải bộ tiêu chí:", e);
    } finally {
      setLoadingCriteria(false);
    }
  };

  useEffect(() => {
    loadCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sửa tên + mô tả tiêu chí (PUT /criterion/{id})
  const handleEditCriterion = async (crit: any) => {
    const esc = (s: string) => (s || "").replace(/"/g, "&quot;");
    const { value } = await Swal.fire({
      title: "Sửa tiêu chí",
      html:
        `<input id="sw-name" class="swal2-input" placeholder="Tên tiêu chí" value="${esc(crit.name)}">` +
        `<input id="sw-desc" class="swal2-input" placeholder="Mô tả" value="${esc(crit.description)}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const name = (
          document.getElementById("sw-name") as HTMLInputElement
        )?.value?.trim();
        const description = (
          document.getElementById("sw-desc") as HTMLInputElement
        )?.value?.trim();
        if (!name) {
          Swal.showValidationMessage("Tên tiêu chí không được để trống");
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
        description: value.description || "Tiêu chí Hackathon",
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã cập nhật!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      console.error(
        "🟥 updateCriterion lỗi:",
        e?.response?.status,
        e?.response?.data,
      );
      Swal.fire(
        "Cập nhật tiêu chí thất bại",
        `Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  // Xóa mềm tiêu chí (DELETE /criterion/{id})
  const handleDeleteCriterion = async (crit: any) => {
    const ok = await Swal.fire({
      title: "Xóa tiêu chí?",
      html: `Xóa tiêu chí <b>${crit.name}</b>? Bạn có thể khôi phục lại sau.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteCriterion(crit.criteriaId);
      Swal.fire({
        icon: "success",
        title: "Đã xóa!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e) {
      Swal.fire("Lỗi", "Xóa tiêu chí thất bại.", "error");
    }
  };

  // Khôi phục tiêu chí đã xóa (PUT /criterion/{id}/restore)
  const handleRestoreCriterion = async (crit: any) => {
    const cid = crit.criteriaID || crit.criteriaId || crit.id;
    try {
      await criteriaApi.restoreCriterion(cid);
      await loadCriteria();
      Swal.fire(
        "Đã khôi phục tiêu chí!",
        "Tiêu chí đã được bật lại trong hệ thống. Lưu ý: nó KHÔNG tự động quay vào bộ tiêu chí cũ — nếu muốn dùng, hãy thêm nó vào một bộ.",
        "success",
      );
    } catch (e) {
      Swal.fire("Lỗi", "Khôi phục thất bại.", "error");
    }
  };

  // Sửa trọng số các tiêu chí trong 1 bộ (PUT /set/{id})
  const handleSaveSetScores = async (set: any) => {
    // 🛡️ CHẶN GHI ĐÈ RỖNG: nếu bộ không có tiêu chí nào thì KHÔNG gửi updateSet
    if (!set.items || set.items.length === 0) {
      return Swal.fire(
        "Không thể lưu",
        "Bộ này hiện không có tiêu chí nào. Việc lưu sẽ ghi đè rỗng và làm hỏng bộ, nên đã chặn lại.",
        "warning",
      );
    }
    const total = set.items.reduce(
      (s: number, it: any) => s + Number(it.score || 0),
      0,
    );
    if (total !== 100) {
      const go = await Swal.fire({
        title: "Tổng trọng số chưa = 100%",
        text: `Hiện tại tổng là ${total}%. Vẫn lưu chứ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Vẫn lưu",
        cancelButtonText: "Để tôi sửa lại",
      });
      if (!go.isConfirmed) return;
    }
    try {
      const list = toPayloadList(set.items);
      await criteriaApi.updateSet(set.setId, {
        setName: set.setName,
        isDefault: set.isDefault,
        criteriaList: list,
        CriteriaList: list,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã lưu trọng số!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      console.error(
        "🟥 updateSet (trọng số) lỗi:",
        e?.response?.status,
        e?.response?.data,
      );
      Swal.fire(
        "Lưu trọng số thất bại",
        `Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  // Sửa tên bộ tiêu chí (PUT /set/{id}) — FETCH LẠI SET TƯƠI ĐỂ GIỮ NGUYÊN TIÊU CHÍ
  const handleEditSetName = async (set: any) => {
    const { value } = await Swal.fire({
      title: "Đổi tên bộ tiêu chí",
      input: "text",
      inputValue: set.setName,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      inputValidator: (v) => (!v?.trim() ? "Tên không được trống" : undefined),
    });
    if (!value) return;
    try {
      // Lấy lại danh sách tiêu chí HIỆN TẠI của bộ từ server, để KHÔNG bao giờ ghi đè rỗng
      const fresh: any = await criteriaApi.getSetById(set.setId);
      const freshRaw = extractSetList(fresh);
      const list = toPayloadList(freshRaw);
      const isDefault =
        (fresh?.data || fresh)?.isDefault ?? set.isDefault ?? false;

      // 🛡️ Nếu fetch lại mà list rỗng -> KHÔNG đổi tên (tránh ghi đè rỗng làm hỏng bộ)
      if (list.length === 0) {
        return Swal.fire(
          "Không thể đổi tên",
          "Không đọc được tiêu chí của bộ này nên tạm dừng để tránh làm hỏng dữ liệu. Hãy tải lại trang rồi thử lại.",
          "warning",
        );
      }

      console.log("🟦 updateSet (đổi tên) -> PUT /set/" + set.setId, {
        setName: value.trim(),
        isDefault,
        criteriaList: list,
      });

      await criteriaApi.updateSet(set.setId, {
        setName: value.trim(),
        isDefault,
        criteriaList: list,
        CriteriaList: list,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã đổi tên!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      console.error(
        "🟥 updateSet (đổi tên) lỗi:",
        e?.response?.status,
        e?.response?.data,
      );
      Swal.fire(
        "Đổi tên bộ thất bại",
        `Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  // Xóa cả bộ tiêu chí (DELETE /set/{id})
  const handleDeleteSet = async (set: any) => {
    const ok = await Swal.fire({
      title: "Xóa cả bộ tiêu chí?",
      html: `Xóa bộ <b>${set.setName}</b>? Việc này có thể ảnh hưởng tới vòng thi đang dùng bộ này.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Xóa bộ",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;
    try {
      await criteriaApi.deleteSet(set.setId);
      Swal.fire({
        icon: "success",
        title: "Đã xóa bộ!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e) {
      Swal.fire("Lỗi", "Xóa bộ thất bại.", "error");
    }
  };

  // Cập nhật trọng số trong state (input inline)
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

  // ===== #6: Round phụ =====
  const asArr = (x: any): any[] =>
    Array.isArray(x) ? x : x?.data || x?.items || [];
  const grabSetId = (s: any): string | null =>
    s?.setID ||
    s?.setId ||
    s?.criteriaSetId ||
    s?.criteriaSetID ||
    s?.id ||
    null;

  // Mở form thêm vòng phụ + nạp danh sách bộ tiêu chí có sẵn (để chọn lại nếu muốn)
  const openAddRound = async () => {
    setShowAddRound(true);
    try {
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const cMap: Record<string, string> = {};
      asArr(critRaw).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) cMap[String(cid)] = c.criteriaName || c.name || "(?)";
      });
      const sets = asArr(setsRaw)
        .map((s: any) => ({
          setId: grabSetId(s),
          setName: s.setName || s.SetName || "Bộ tiêu chí",
          items: (
            s.criteriaList ||
            s.CriteriaList ||
            s.criteriaMappingItemViewModels ||
            []
          ).map((it: any) => ({
            name:
              cMap[String(it.criteriaId || it.criteriaID || it.id)] || "(?)",
            score: it.score ?? it.Score ?? 0,
          })),
        }))
        .filter((s: any) => !!s.setId);
      setExtraSets(sets);
    } catch (e) {
      console.warn("Không tải được bộ tiêu chí có sẵn:", e);
    }
  };

  // Tạo 1 bộ tiêu chí mới từ các dòng nhập -> trả về setId
  const createSetFromRows = async (
    rows: any[],
    setName: string,
  ): Promise<string | null> => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return null;

    const allCrit = asArr(await criteriaApi.getAllCriteria());
    const findByName = (name: string) =>
      allCrit.find(
        (c: any) =>
          (c.criteriaName || c.name || "").trim().toLowerCase() ===
          name.trim().toLowerCase(),
      );

    const criteriaList: any[] = [];
    for (const r of valid) {
      let cid: any;
      const existed = findByName(r.name);
      if (existed) {
        cid = existed.criteriaID || existed.criteriaId || existed.id;
      } else {
        try {
          const res: any = await criteriaApi.createCriterion({
            criteriaName: r.name.trim(),
            description: "Tiêu chí vòng phụ",
          } as any);
          cid = res?.criteriaID || res?.criteriaId || res?.id;
        } catch {
          const again = asArr(await criteriaApi.getAllCriteria()).find(
            (c: any) =>
              (c.criteriaName || c.name || "").trim().toLowerCase() ===
              r.name.trim().toLowerCase(),
          );
          cid = again?.criteriaID || again?.criteriaId || again?.id;
        }
      }
      if (cid)
        criteriaList.push({ criteriaId: cid, score: Number(r.score) || 0 });
    }
    if (criteriaList.length === 0) return null;

    const setRes: any = await criteriaApi.createSet({
      setName,
      isDefault: false,
      criteriaList,
    } as any);
    let sid = grabSetId(setRes);
    if (!sid) {
      const found = [...asArr(await criteriaApi.getAllSet())]
        .reverse()
        .find((s: any) => (s.setName || s.SetName || "") === setName);
      sid = grabSetId(found);
    }
    return sid;
  };

  const handleAddExtraRound = async () => {
    const f = extraForm;
    if (!id) return;
    if (!f.roundName.trim())
      return Swal.fire("Thiếu", "Nhập tên vòng phụ.", "warning");
    if (!f.startDate || !f.endDate)
      return Swal.fire("Thiếu", "Nhập đủ ngày mở/đóng cổng.", "warning");
    const dS = new Date(f.startDate);
    const dE = new Date(f.endDate);
    if (isNaN(dS.getTime()) || isNaN(dE.getTime()) || dE <= dS)
      return Swal.fire(
        "Sai mốc thời gian",
        "Ngày đóng cổng phải SAU ngày mở cổng.",
        "warning",
      );
    // Vòng phụ nên bắt đầu SAU khi vòng cuối hiện tại kết thúc
    const lastRound = eventRounds[eventRounds.length - 1];
    if (lastRound) {
      const lastEnd = new Date(lastRound.endDate || lastRound.EndDate || 0);
      if (!isNaN(lastEnd.getTime()) && dS < lastEnd) {
        const go = await Swal.fire({
          title: "Mốc thời gian hơi sớm",
          text: "Vòng phụ đang bắt đầu trước khi vòng cuối hiện tại kết thúc. Vẫn tạo chứ?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Vẫn tạo",
          cancelButtonText: "Để sửa lại",
        });
        if (!go.isConfirmed) return;
      }
    }

    if (f.critMode === "reuse" && !f.reuseSetId)
      return Swal.fire("Thiếu", "Hãy chọn bộ tiêu chí có sẵn.", "warning");
    if (f.critMode === "new") {
      const total = f.rows.reduce(
        (s: number, r: any) => s + Number(r.score || 0),
        0,
      );
      if (!f.rows.some((r: any) => r.name.trim()))
        return Swal.fire("Thiếu", "Nhập ít nhất 1 tiêu chí.", "warning");
      if (total !== 100) {
        const go = await Swal.fire({
          title: "Tổng trọng số chưa = 100%",
          text: `Hiện là ${total}%. Vẫn tạo chứ?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Vẫn tạo",
          cancelButtonText: "Sửa lại",
        });
        if (!go.isConfirmed) return;
      }
    }

    try {
      setSavingRound(true);
      // 1. Bộ tiêu chí riêng cho vòng phụ
      let setId: string | null = null;
      if (f.critMode === "reuse") {
        setId = f.reuseSetId;
      } else {
        setId = await createSetFromRows(
          f.rows,
          `${event?.name || "Sự kiện"} - ${f.roundName.trim()} Set`,
        );
      }
      if (!setId) {
        setSavingRound(false);
        return Swal.fire(
          "Lỗi",
          "Không tạo/được bộ tiêu chí cho vòng phụ.",
          "error",
        );
      }

      // 2. roundIndex = lớn nhất hiện có + 1
      const maxIdx = eventRounds.reduce(
        (m: number, r: any) =>
          Math.max(m, Number(r.roundIndex ?? r.RoundIndex ?? 0)),
        -1,
      );

      // 3. Tạo round
      await roundApi.createRound({
        eventID: id,
        roundName: f.roundName.trim(),
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString(),
        topNPromotion: Number(f.topN) || 1,
        maxTeam: Number(f.maxTeam) || 1,
        roundIndex: maxIdx + 1,
        criteriaSetID: setId,
      } as any);

      Swal.fire({
        icon: "success",
        title: "Đã thêm vòng phụ!",
        text: "Sự kiện giờ có thêm một vòng để xử lý trùng điểm.",
        confirmButtonColor: "#0f172a",
      });
      setShowAddRound(false);
      setExtraForm({
        roundName: "Vòng phụ",
        startDate: "",
        endDate: "",
        maxTeam: 5,
        topN: 1,
        critMode: "new",
        reuseSetId: "",
        rows: [{ name: "", score: 100 }],
      });
      await loadCriteria();
    } catch (e: any) {
      console.error(
        "🟥 Tạo vòng phụ lỗi:",
        e?.response?.status,
        e?.response?.data,
      );
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.title ||
        (typeof e?.response?.data === "string" ? e.response.data : "") ||
        e?.message ||
        "Không rõ nguyên nhân";
      Swal.fire("Tạo vòng phụ thất bại", `Backend báo: ${msg}`, "error");
    } finally {
      setSavingRound(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-10 text-center font-medium text-slate-500">
        Đang tải thông tin...
      </div>
    );
  if (!event)
    return (
      <div className="p-10 text-center font-medium text-red-500">
        Không tìm thấy sự kiện!
      </div>
    );

  // 🚨 CHỐT CHẶN ĐỘNG: số round thực tế của sự kiện (mặc định 2 nếu chưa tải kịp)
  const numRounds = eventRounds.length || 2;
  const curRound = Number(event?.currentRound);
  const isEnded = curRound >= numRounds;
  // Tên vòng hiện tại lấy từ danh sách round (đúng cả khi có vòng phụ)
  const currentRoundName =
    curRound < 0
      ? "Sắp diễn ra"
      : curRound >= numRounds
        ? "Đã kết thúc"
        : eventRounds[curRound]?.roundName ||
          (curRound === 0
            ? "Vòng Sơ khảo"
            : curRound === 1
              ? "Vòng Chung kết"
              : `Vòng ${curRound + 1}`);

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate("/admin/events")}
                className="text-slate-400 hover:text-black transition-colors p-1"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Chi tiết & Chỉnh sửa
              </h2>
            </div>
          </div>

          {!isEnded && (
            <div className="flex items-center gap-3">
              <button
                onClick={openAddRound}
                disabled={isLoading}
                title="Tạo thêm 1 vòng (vd: vòng phụ xử lý trùng điểm)"
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Plus size={18} /> Thêm vòng phụ
              </button>

              <button
                onClick={handleNextRound}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FastForward size={18} /> Chuyển vòng thi
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save size={18} />{" "}
                {isLoading ? "Đang lưu..." : "Lưu các thay đổi"}
              </button>
            </div>
          )}
        </div>

        {isEnded && (
          <div className="bg-slate-100 border border-slate-200 text-slate-600 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <Lock size={20} className="text-slate-500" />
            <p className="text-sm font-medium">
              Sự kiện này đã kết thúc. Toàn bộ thông tin chỉ được xem lại và
              không thể chỉnh sửa.
            </p>
          </div>
        )}

        {/* ===== #6: FORM THÊM VÒNG PHỤ ===== */}
        {showAddRound && !isEnded && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> Tạo vòng phụ mới
              </h3>
              <button
                onClick={() => setShowAddRound(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tên vòng
                </label>
                <input
                  type="text"
                  value={extraForm.roundName}
                  onChange={(e) =>
                    setExtraForm((p: any) => ({
                      ...p,
                      roundName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg mt-1 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Giới hạn đội
                  </label>
                  <input
                    type="number"
                    value={extraForm.maxTeam}
                    onChange={(e) =>
                      setExtraForm((p: any) => ({
                        ...p,
                        maxTeam: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg mt-1 outline-none font-semibold focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Top N qua vòng
                  </label>
                  <input
                    type="number"
                    value={extraForm.topN}
                    onChange={(e) =>
                      setExtraForm((p: any) => ({ ...p, topN: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg mt-1 outline-none font-semibold focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mở cổng
                </label>
                <input
                  type="datetime-local"
                  value={extraForm.startDate}
                  onChange={(e) =>
                    setExtraForm((p: any) => ({
                      ...p,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg mt-1 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Đóng cổng
                </label>
                <input
                  type="datetime-local"
                  value={extraForm.endDate}
                  onChange={(e) =>
                    setExtraForm((p: any) => ({
                      ...p,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg mt-1 outline-none font-semibold focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bộ tiêu chí riêng cho vòng phụ */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bộ tiêu chí cho vòng phụ
                </span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() =>
                      setExtraForm((p: any) => ({ ...p, critMode: "new" }))
                    }
                    className={`px-3 py-1 text-xs font-bold rounded-md border ${
                      extraForm.critMode === "new"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    Tạo mới
                  </button>
                  <button
                    onClick={() =>
                      setExtraForm((p: any) => ({ ...p, critMode: "reuse" }))
                    }
                    className={`px-3 py-1 text-xs font-bold rounded-md border ${
                      extraForm.critMode === "reuse"
                        ? "bg-black text-white border-black"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    Dùng có sẵn
                  </button>
                </div>
              </div>

              {extraForm.critMode === "reuse" ? (
                <select
                  value={extraForm.reuseSetId}
                  onChange={(e) =>
                    setExtraForm((p: any) => ({
                      ...p,
                      reuseSetId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:border-blue-500"
                >
                  <option value="">-- Chọn bộ tiêu chí có sẵn --</option>
                  {extraSets.map((s: any) => (
                    <option key={s.setId} value={s.setId}>
                      {s.setName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  {extraForm.rows.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tên tiêu chí"
                        value={r.name}
                        onChange={(e) =>
                          setExtraForm((p: any) => ({
                            ...p,
                            rows: p.rows.map((x: any, xi: number) =>
                              xi === i ? { ...x, name: e.target.value } : x,
                            ),
                          }))
                        }
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-semibold focus:border-blue-500"
                      />
                      <input
                        type="number"
                        value={r.score}
                        onChange={(e) =>
                          setExtraForm((p: any) => ({
                            ...p,
                            rows: p.rows.map((x: any, xi: number) =>
                              xi === i
                                ? { ...x, score: Number(e.target.value) }
                                : x,
                            ),
                          }))
                        }
                        className="w-20 px-2 py-2 text-right bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">
                        %
                      </span>
                      <button
                        onClick={() =>
                          setExtraForm((p: any) => ({
                            ...p,
                            rows: p.rows.filter(
                              (_: any, xi: number) => xi !== i,
                            ),
                          }))
                        }
                        className="text-slate-400 hover:text-red-500 p-1.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setExtraForm((p: any) => ({
                        ...p,
                        rows: [...p.rows, { name: "", score: 0 }],
                      }))
                    }
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    + Thêm tiêu chí
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowAddRound(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddExtraRound}
                disabled={savingRound}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {savingRound ? "Đang tạo..." : "Tạo vòng phụ"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-500" /> Thông tin cơ bản
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tên sự kiện
                </label>
                <input
                  disabled={isEnded}
                  type="text"
                  value={event.name || ""}
                  onChange={(e) => setEvent({ ...event, name: e.target.value })}
                  className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl mt-1 outline-none font-bold text-slate-900 ${isEnded ? "opacity-70 cursor-not-allowed bg-slate-50" : "focus:border-blue-500"}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* 🚨 CHUẨN HÓA 4 TRẠNG THÁI HIỂN THỊ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Trạng thái hiện tại
                  </label>
                  <div
                    className={`w-full px-4 py-3 border rounded-lg font-bold flex items-center justify-between ${
                      curRound < 0
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : isEnded
                          ? "bg-slate-100 border-slate-200 text-slate-500"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}
                  >
                    <span>{currentRoundName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        curRound < 0
                          ? "bg-amber-200 text-amber-800"
                          : isEnded
                            ? "bg-slate-200 text-slate-400"
                            : "bg-blue-200 text-blue-600"
                      }`}
                    >
                      Round {curRound < 0 ? 0 : curRound}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Học kỳ
                  </label>
                  <select
                    disabled={isEnded}
                    value={event.semester || ""}
                    onChange={(e) =>
                      setEvent({ ...event, semester: e.target.value })
                    }
                    className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-900 ${isEnded ? "opacity-70 cursor-not-allowed bg-slate-50" : "focus:border-blue-500"}`}
                  >
                    <option value="" disabled>
                      Chọn học kỳ
                    </option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Năm
                  </label>
                  <input
                    disabled={isEnded}
                    type="number"
                    value={event.year || ""}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        year: parseInt(e.target.value) || 2026,
                      })
                    }
                    className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-900 ${isEnded ? "opacity-70 cursor-not-allowed bg-slate-50" : "focus:border-blue-500"}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thay thế phần map event.tracks cũ bằng đoạn này */}
          {tracks.length > 0 ? (
            tracks.map((track: any, idx: number) => (
              <div
                key={track.trackID || idx}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tên Hạng mục
                    </label>
                    <div className="font-bold text-sm text-slate-800">
                      {track.trackName}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Các chủ đề:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {track.topics.length > 0 ? (
                      track.topics.map((topic: any, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-bold"
                        >
                          {topic.topicDetail}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Chưa có chủ đề.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-4">
              Sự kiện này chưa có hạng mục nào.
            </p>
          )}

          {/* ===== #3: BỘ TIÊU CHÍ ĐÁNH GIÁ ===== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ListChecks size={18} className="text-blue-500" /> Bộ tiêu chí
              đánh giá
            </h3>

            {loadingCriteria ? (
              <p className="text-sm text-slate-400 italic py-3">
                Đang tải bộ tiêu chí...
              </p>
            ) : criteriaSets.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-3">
                Sự kiện này chưa có bộ tiêu chí nào.
              </p>
            ) : (
              <div className="space-y-5">
                {criteriaSets.map((set: any, setIdx: number) => {
                  const total = set.items.reduce(
                    (s: number, it: any) => s + Number(it.score || 0),
                    0,
                  );
                  return (
                    <div
                      key={set.setId}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-sm text-slate-800 truncate">
                            {set.setName}
                          </span>
                          {set.roundName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold uppercase tracking-wider shrink-0">
                              {set.roundName}
                            </span>
                          )}
                        </div>
                        {!isEnded && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleEditSetName(set)}
                              title="Đổi tên bộ"
                              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSet(set)}
                              title="Xóa cả bộ"
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="divide-y divide-slate-50">
                        {set.items.length === 0 ? (
                          <p className="text-xs text-slate-400 italic px-4 py-3">
                            Bộ này chưa có tiêu chí.
                          </p>
                        ) : (
                          set.items.map((it: any, itemIdx: number) => (
                            <div
                              key={it.criteriaId || itemIdx}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-slate-800">
                                  {it.name}
                                </div>
                                {it.description && (
                                  <div className="text-xs text-slate-400 truncate">
                                    {it.description}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  disabled={isEnded}
                                  value={it.score}
                                  onChange={(e) =>
                                    updateScoreLocal(
                                      setIdx,
                                      itemIdx,
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-16 px-2 py-1.5 text-right border border-slate-200 rounded-md text-sm font-bold outline-none ${
                                    isEnded
                                      ? "bg-slate-50 cursor-not-allowed"
                                      : "focus:border-blue-500"
                                  }`}
                                />
                                <span className="text-xs text-slate-400 font-bold w-4">
                                  %
                                </span>
                              </div>

                              {!isEnded && (
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button
                                    onClick={() => handleEditCriterion(it)}
                                    title="Sửa tên/mô tả"
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCriterion(it)}
                                    title="Xóa tiêu chí"
                                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-t border-slate-100">
                        <span
                          className={`text-xs font-bold ${
                            total === 100
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          <Scale size={12} className="inline mr-1" />
                          Tổng trọng số: {total}%
                        </span>
                        {!isEnded && (
                          <button
                            onClick={() => handleSaveSetScores(set)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <Save size={13} /> Lưu trọng số
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Thùng rác tiêu chí: khôi phục các tiêu chí đã xóa */}
            {deletedCriteria.length > 0 && (
              <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <RotateCcw size={13} /> Tiêu chí đã xóa (có thể khôi phục)
                </p>
                <div className="flex flex-wrap gap-2">
                  {deletedCriteria.map((c: any, i: number) => (
                    <div
                      key={c.criteriaID || c.criteriaId || i}
                      className="flex items-center gap-2 pl-3 pr-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="text-xs font-semibold text-slate-500 line-through">
                        {c.criteriaName || c.name}
                      </span>
                      <button
                        onClick={() => handleRestoreCriterion(c)}
                        title="Khôi phục"
                        className="text-emerald-500 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
