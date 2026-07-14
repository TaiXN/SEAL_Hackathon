import { useState, useEffect } from "react";
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
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../lib/api/apiClient";
import { eventApi } from "../../lib/api/eventApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { roundApi } from "../../lib/api/roundApi";

import {
  getList,
  extractSetList,
  itemCriteriaId,
  itemScore,
  toPayloadList,
  getServerMsg,
  grabSetId,
  sumWeight,
  buildCriteriaMap,
  loadSetsWithItems,
  DEFAULT_CRITERIA_DESCRIPTION,
} from "../../lib/utils/criteriaHelpers";

// ====================================================
// [FIX] Helper dùng chung để xử lý các lỗi "xóa xong vẫn hiện lại"
// ====================================================

// Kiểm tra 1 record (track / topic / tiêu chí / bộ tiêu chí) đã bị xóa mềm
// hay chưa. Check nhiều tên field & kiểu casing khác nhau (camelCase lẫn
// PascalCase mà backend .NET hay trả về) để tránh trường hợp field check bị
// sai tên khiến item đã xóa vẫn lọt qua filter và hiện lại sau khi reload.
const isInactiveRecord = (obj: any): boolean => {
  if (!obj) return false;
  if (
    obj.isDeleted === true ||
    obj.IsDeleted === true ||
    obj.deleted === true ||
    obj.Deleted === true
  ) {
    return true;
  }
  if (
    obj.isActive === false ||
    obj.IsActive === false ||
    obj.status === false ||
    obj.Status === false
  ) {
    return true;
  }
  const statusStr = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (statusStr === "deleted" || statusStr === "inactive") return true;
  return false;
};

// Đoán xem lỗi trả về từ backend có phải dạng "không tìm thấy" hay không
// (record đã bị xóa từ trước) để tự dọn lại UI thay vì chỉ hiện lỗi mơ hồ.
const isNotFoundError = (e: any): boolean => {
  if (e?.response?.status === 404) return true;
  const msg = getServerMsg(e).toLowerCase();
  return msg.includes("not found") || msg.includes("không tìm thấy");
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

  const [eventRounds, setEventRounds] = useState<any[]>([]);
  const [showAddRound, setShowAddRound] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [extraSets, setExtraSets] = useState<any[]>([]);
  const [extraForm, setExtraForm] = useState<any>({
    roundName: "Vòng phụ",
    startDate: "",
    endDate: "",
    maxTeam: 5,
    topN: 1,
    critMode: "new",
    reuseSetId: "",
    rows: [{ name: "", description: "", score: 100 }],
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        if (id) {
          const eventData = await eventApi.getEventById(id);
          setEvent(eventData);

          const allTracks = await trackTopicApi.getAllTracks();
          const allTopics = await trackTopicApi.getAllTopics();

          const eventTracks = allTracks
            .filter(
              (t: any) =>
                String(t.eventId || t.eventID) === String(id) &&
                !isInactiveRecord(t), // Loại bỏ track đã xóa mềm
            )
            .map((t: any) => ({
              ...t,
              topics: allTopics.filter(
                (top: any) =>
                  String(top.trackID || top.trackId) ===
                    String(t.trackID || t.trackId) && !isInactiveRecord(top), // Loại bỏ topic đã xóa mềm
              ),
            }));

          setTracks(eventTracks);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sự kiện:", error);
        setLoadError("Không tải được thông tin từ máy chủ. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, reloadKey]);

  // ====================================================
  // [CẬP NHẬT] XỬ LÝ SỬA/XÓA CẬP NHẬT THẲNG LÊN GIAO DIỆN (OPTIMISTIC UI)
  // ====================================================

  const handleEditTrack = async (track: any) => {
    const { value: newName } = await Swal.fire({
      title: "Đổi tên Hạng mục",
      input: "text",
      inputValue: track.trackName || track.name,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      inputValidator: (value) => {
        if (!value.trim()) return "Tên Hạng mục không được để trống!";
      },
    });

    if (newName) {
      const trackId = track.trackID || track.trackId || track.id;
      try {
        await apiClient.put(`/api/Track/${trackId}`, {
          trackName: newName.trim(),
          eventID: id,
        });

        // Cập nhật UI ngay lập tức
        setTracks((prev) =>
          prev.map((t) =>
            (t.trackID || t.trackId || t.id) === trackId
              ? { ...t, trackName: newName.trim() }
              : t,
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Đã cập nhật!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          // Hạng mục này thực ra đã bị xóa từ trước (chỉ còn "sót" trên UI) -> dọn lại
          setTracks((prev) =>
            prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
          );
          Swal.fire(
            "Hạng mục đã bị xóa",
            "Mục này đã bị xóa trước đó nên không thể sửa. Danh sách vừa được cập nhật lại.",
            "info",
          );
        } else {
          Swal.fire(
            "Lỗi",
            `Không thể cập nhật Hạng mục này. Backend báo: ${getServerMsg(error)}`,
            "error",
          );
        }
      }
    }
  };

  const handleDeleteTrack = async (track: any) => {
    const result = await Swal.fire({
      title: "Xóa Hạng mục?",
      text: `Bạn có chắc muốn xóa Hạng mục "${track.trackName}" không? Các chủ đề bên trong cũng sẽ bị ảnh hưởng.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Track/${trackId}`);

        // Gỡ bỏ track khỏi UI lập tức
        setTracks((prev) =>
          prev.filter((t) => (t.trackID || t.trackId || t.id) !== trackId),
        );
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          `Không thể xóa Hạng mục này. Backend báo: ${getServerMsg(error)}`,
          "error",
        );
      }
    }
  };

  const handleEditTopic = async (topic: any, track: any) => {
    const { value: newDetail } = await Swal.fire({
      title: "Đổi tên Chủ đề",
      input: "text",
      inputValue: topic.topicDetail,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#0f172a",
      inputValidator: (value) => {
        if (!value.trim()) return "Chủ đề không được để trống!";
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

        // Cập nhật UI ngay lập tức
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
          title: "Đã cập nhật!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        if (isNotFoundError(error)) {
          // Chủ đề này thực ra đã bị xóa từ trước -> dọn lại UI cho khớp thực tế
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
            "Chủ đề đã bị xóa",
            "Chủ đề này đã bị xóa trước đó nên không thể sửa. Danh sách vừa được cập nhật lại.",
            "info",
          );
        } else {
          Swal.fire(
            "Lỗi",
            `Không thể cập nhật chủ đề. Backend báo: ${getServerMsg(error)}`,
            "error",
          );
        }
      }
    }
  };

  const handleDeleteTopic = async (topic: any, track: any) => {
    const result = await Swal.fire({
      title: "Xóa Chủ đề?",
      text: `Bạn có chắc muốn xóa chủ đề "${topic.topicDetail}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const topicId = topic.topicID || topic.topicId || topic.id;
        const trackId = track.trackID || track.trackId || track.id;
        await apiClient.delete(`/api/Topic/topic/${topicId}`);

        // Xóa thẳng chủ đề đó khỏi mảng UI
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
          title: "Đã xóa!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          `Không thể xóa chủ đề này. Backend báo: ${getServerMsg(error)}`,
          "error",
        );
      }
    }
  };

  const handleSave = async () => {
    if (!id || !event) return;
    if (!event.semester) {
      Swal.fire(
        "Ê khoan!",
        "Bạn quên chọn Học kỳ (Season) rồi kìa!",
        "warning",
      );
      return;
    }
    try {
      setIsLoading(true);
      const roundBefore = Number(event.currentRound);
      const payload = {
        eventName: event.name,
        season: event.semester,
        year: Number(event.year),
        currentRound: event.currentRound,
      };

      await eventApi.updateEvent(id, payload);
      const after = await eventApi.getEventById(id);
      const roundAfter = Number(after.currentRound);
      setEvent(after);

      if (roundAfter !== roundBefore) {
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
          text: "Thông tin sự kiện đã được cập nhật thành công.",
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
        const updatedData = await eventApi.getEventById(id);
        setEvent(updatedData);
      } catch (error) {
        Swal.fire("Lỗi", "Không thể chuyển vòng!", "error");
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
      const eventRounds = (allRounds || []).filter(
        (r: any) => String(r.eventID || r.eventId) === String(id),
      );
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

      const allCrit = await criteriaApi.getAllCriteria();
      const critMap: Record<string, any> = {};
      (allCrit || []).forEach((c: any) => {
        const cid = c.criteriaID || c.criteriaId || c.id;
        if (cid) critMap[String(cid)] = c;
      });
      setDeletedCriteria(
        (allCrit || []).filter((c: any) => isInactiveRecord(c)),
      );

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

          // Bộ tiêu chí này đã bị xóa (deleteSet) nhưng round vẫn còn trỏ tới id
          // cũ -> bỏ qua, không hiện lại nữa (kể cả sau khi reload trang).
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
                  "(không rõ tên)",
                description: info.description || it.description || "",
                score: itemScore(it),
                isActive: !isInactiveRecord(info),
              };
            })
            // [FIX] Trước đây field isActive được tính ra nhưng KHÔNG hề được
            // dùng để lọc -> tiêu chí đã xóa vẫn hiện trong bộ. Giờ lọc bỏ hẳn,
            // tiêu chí đã xóa sẽ rời khỏi bộ ngay và chỉ quay lại khi restore.
            .filter((it: any) => it.isActive);

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
      setCriteriaError("Không tải được bộ tiêu chí. Vui lòng thử lại.");
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
        description: value.description || DEFAULT_CRITERIA_DESCRIPTION,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã cập nhật!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Cập nhật tiêu chí thất bại",
        `Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

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

      // Gỡ tiêu chí này khỏi bộ đang hiển thị ngay lập tức, không cần đợi reload
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
        title: "Đã xóa!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Lỗi",
        `Xóa tiêu chí thất bại. Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const handleRestoreCriterion = async (crit: any) => {
    const cid = crit.criteriaID || crit.criteriaId || crit.id;

    // Gỡ khỏi danh sách "đã xóa" ngay lập tức
    setDeletedCriteria((prev) =>
      prev.filter(
        (c: any) =>
          String(c.criteriaID || c.criteriaId || c.id) !== String(cid),
      ),
    );

    try {
      await criteriaApi.restoreCriterion(cid);
      // loadCriteria() sẽ đưa tiêu chí này quay lại đúng bộ tiêu chí của nó,
      // vì liên kết Set-Criteria vẫn còn, chỉ có cờ isActive đổi lại thành true.
      await loadCriteria();
      Swal.fire(
        "Đã khôi phục!",
        "Tiêu chí đã được bật lại và quay về bộ tiêu chí của nó.",
        "success",
      );
    } catch (e: any) {
      // Restore thất bại -> load lại để item quay về đúng danh sách "đã xóa"
      await loadCriteria();
      Swal.fire(
        "Lỗi",
        `Khôi phục thất bại. Backend báo: ${getServerMsg(e)}`,
        "error",
      );
    }
  };

  const handleSaveSetScores = async (set: any) => {
    if (!set.items || set.items.length === 0) {
      return Swal.fire("Lỗi", "Bộ này hiện không có tiêu chí nào.", "warning");
    }
    const total = sumWeight(set.items);
    if (total !== 100) {
      return Swal.fire(
        "Chưa đủ 100%",
        `Tổng trọng số hiện tại là ${total}%.`,
        "error",
      );
    }
    try {
      const list = toPayloadList(set.items);
      await criteriaApi.updateSet(set.setId, {
        setName: set.setName,
        isDefault: set.isDefault,
        criteriaList: list,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã lưu trọng số!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire("Lỗi", `Backend báo: ${getServerMsg(e)}`, "error");
    }
  };

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
      const fresh: any = await criteriaApi.getSetById(set.setId);
      const freshRaw = extractSetList(fresh);
      const list = toPayloadList(freshRaw);
      const isDefault =
        (fresh?.data || fresh)?.isDefault ?? set.isDefault ?? false;

      if (list.length === 0) {
        return Swal.fire(
          "Lỗi",
          "Không đọc được tiêu chí của bộ này.",
          "warning",
        );
      }

      await criteriaApi.updateSet(set.setId, {
        setName: value.trim(),
        isDefault,
        criteriaList: list,
      } as any);
      Swal.fire({
        icon: "success",
        title: "Đã đổi tên!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire("Lỗi", `Backend báo: ${getServerMsg(e)}`, "error");
    }
  };

  const handleDeleteSet = async (set: any) => {
    const ok = await Swal.fire({
      title: "Xóa cả bộ tiêu chí?",
      html: `Xóa bộ <b>${set.setName}</b>?`,
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

      // Gỡ cả bộ khỏi UI ngay lập tức
      setCriteriaSets((prev) =>
        prev.filter((s) => String(s.setId) !== String(set.setId)),
      );

      Swal.fire({
        icon: "success",
        title: "Đã xóa bộ!",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire(
        "Lỗi",
        `Xóa bộ thất bại. Backend báo: ${getServerMsg(e)}`,
        "error",
      );
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

  // ===== #6: Round phụ =====
  const [loadingExtraSets, setLoadingExtraSets] = useState(false);
  const [extraSetsError, setExtraSetsError] = useState<string | null>(null);

  const openAddRound = async () => {
    setShowAddRound(true);
    try {
      setLoadingExtraSets(true);
      setExtraSetsError(null);
      const [setsRaw, critRaw] = await Promise.all([
        criteriaApi.getAllSet(),
        criteriaApi.getAllCriteria(),
      ]);
      const critMap = buildCriteriaMap(critRaw);
      const baseSets = getList(setsRaw)
        .map((s: any) => ({
          setId: grabSetId(s),
          setName: s.setName || s.SetName || "Bộ tiêu chí",
        }))
        .filter((s): s is { setId: string; setName: string } => !!s.setId);

      const sets = await loadSetsWithItems(baseSets, critMap, (setId) =>
        criteriaApi.getSetById(setId),
      );
      setExtraSets(sets);
    } catch (e) {
      setExtraSetsError("Không tải được danh sách bộ tiêu chí có sẵn.");
    } finally {
      setLoadingExtraSets(false);
    }
  };

  const createSetFromRows = async (
    rows: { name: string; description?: string; score: number }[],
    setName: string,
  ): Promise<string | null> => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return null;

    const allCrit = getList(await criteriaApi.getAllCriteria());
    const findByName = (name: string) =>
      allCrit.find(
        (c: any) =>
          (c.criteriaName || c.name || "").trim().toLowerCase() ===
          name.trim().toLowerCase(),
      );

    const criteriaList: any[] = [];
    for (const r of valid) {
      let cid: any;
      const description = (r.description || "").trim() || "Tiêu chí vòng phụ";
      const existed = findByName(r.name);
      if (existed) {
        cid = existed.criteriaID || existed.criteriaId || existed.id;
        try {
          await criteriaApi.updateCriterion(cid, {
            criteriaID: cid,
            criteriaId: cid,
            criteriaName: r.name.trim(),
            description,
          } as any);
        } catch (e) {}
      } else {
        try {
          const res: any = await criteriaApi.createCriterion({
            criteriaName: r.name.trim(),
            description,
          } as any);
          cid = res?.criteriaID || res?.criteriaId || res?.id;
        } catch {
          const again = getList(await criteriaApi.getAllCriteria()).find(
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
      const found = [...getList(await criteriaApi.getAllSet())]
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
      return Swal.fire("Lỗi", "Ngày đóng cổng phải SAU ngày mở.", "warning");
    const lastRound = eventRounds[eventRounds.length - 1];
    if (lastRound) {
      const lastEnd = new Date(lastRound.endDate || lastRound.EndDate || 0);
      if (!isNaN(lastEnd.getTime()) && dS < lastEnd) {
        const go = await Swal.fire({
          title: "Mốc thời gian hơi sớm",
          text: "Vòng phụ bắt đầu trước khi vòng cuối kết thúc. Vẫn tạo?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Vẫn tạo",
        });
        if (!go.isConfirmed) return;
      }
    }

    if (f.critMode === "reuse") {
      if (!f.reuseSetId)
        return Swal.fire("Thiếu", "Hãy chọn bộ tiêu chí.", "warning");
      const reuseTotal = sumWeight(
        extraSets.find((s) => String(s.setId) === String(f.reuseSetId))
          ?.items || [],
      );
      if (reuseTotal !== 100)
        return Swal.fire(
          "Lỗi",
          `Bộ này đang có ${reuseTotal}%. Phải đúng 100%.`,
          "error",
        );
    }
    if (f.critMode === "new") {
      if (!f.rows.some((r: any) => r.name.trim()))
        return Swal.fire("Thiếu", "Nhập ít nhất 1 tiêu chí.", "warning");
      const total = sumWeight(f.rows.map((r: any) => ({ weight: r.score })));
      if (total !== 100)
        return Swal.fire(
          "Lỗi",
          `Tổng hiện tại là ${total}%. Phải chỉnh cho đủ 100%.`,
          "error",
        );
    }

    try {
      setSavingRound(true);
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
        return Swal.fire("Lỗi", "Không tạo/được bộ tiêu chí.", "error");
      }

      const maxIdx = eventRounds.reduce(
        (m: number, r: any) =>
          Math.max(m, Number(r.roundIndex ?? r.RoundIndex ?? 0)),
        -1,
      );

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
        rows: [{ name: "", description: "", score: 100 }],
      });
      await loadCriteria();
    } catch (e: any) {
      Swal.fire("Lỗi", `Backend báo: ${e?.message || "Lỗi tạo vòng"}`, "error");
    } finally {
      setSavingRound(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm font-medium text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        Đang tải thông tin sự kiện...
      </div>
    );
  if (loadError)
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <AlertCircle size={28} className="text-red-500" />
        <p className="text-sm font-medium text-red-500">{loadError}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          <RefreshCw size={13} /> Thử lại
        </button>
      </div>
    );
  if (!event)
    return (
      <div className="p-16 text-center font-medium text-slate-500">
        Không tìm thấy sự kiện!
      </div>
    );

  // [FIX #2] Tổng trọng số tính real-time cho form tạo vòng phụ, dùng để hiện
  // cảnh báo nhỏ và khóa nút tạo nếu chưa đúng 100%.
  const newRowsTotal = sumWeight(
    extraForm.rows.map((r: any) => ({ weight: r.score })),
  );
  const reuseSetTotal =
    extraForm.critMode === "reuse" && extraForm.reuseSetId
      ? sumWeight(
          extraSets.find(
            (s: any) => String(s.setId) === String(extraForm.reuseSetId),
          )?.items || [],
        )
      : null;
  const canSubmitRound =
    extraForm.critMode === "new"
      ? extraForm.rows.some((r: any) => r.name.trim()) && newRowsTotal === 100
      : extraForm.critMode === "reuse"
        ? !!extraForm.reuseSetId && reuseSetTotal === 100
        : false;

  const numRounds = eventRounds.length || 2;
  const curRound = Number(event?.currentRound);
  const isEnded = curRound >= numRounds;
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
            {/* CÁC FIELD NHẬP DỮ LIỆU VÒNG PHỤ Ở ĐÂY */}
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
              ) : null}
              {extraForm.critMode === "reuse" && extraForm.reuseSetId && (
                <p
                  className={`text-xs font-bold mt-2 flex items-center gap-1 ${
                    reuseSetTotal === 100 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  <Scale size={12} />
                  Tổng trọng số của bộ này: {reuseSetTotal}%
                  {reuseSetTotal !== 100 && " (phải đúng 100% mới dùng được)"}
                </p>
              )}
              {extraForm.critMode === "new" ? (
                <div className="space-y-3">
                  {extraForm.rows.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tên tiêu chí (*)"
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
                          placeholder="Trọng số"
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
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* TRƯỜNG DESCRIPTION MỚI THÊM NÈ */}
                      <input
                        type="text"
                        placeholder="Mô tả tiêu chí (không bắt buộc)"
                        value={r.description || ""}
                        onChange={(e) =>
                          setExtraForm((p: any) => ({
                            ...p,
                            rows: p.rows.map((x: any, xi: number) =>
                              xi === i
                                ? { ...x, description: e.target.value }
                                : x,
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setExtraForm((p: any) => ({
                        ...p,
                        rows: [
                          ...p.rows,
                          { name: "", description: "", score: 0 },
                        ],
                      }))
                    }
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-1 inline-block"
                  >
                    + Thêm tiêu chí
                  </button>

                  {/* [FIX #2] Cảnh báo trọng số real-time + chặn tạo nếu chưa đủ 100% */}
                  <p
                    className={`text-xs font-bold flex items-center gap-1 ${
                      newRowsTotal === 100 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    <Scale size={12} />
                    Tổng trọng số: {newRowsTotal}%
                    {newRowsTotal !== 100 && " (phải đúng 100% mới được tạo)"}
                  </p>
                </div>
              ) : null}
            </div>
            {/* NÚT CHỐT TẠO VÒNG PHỤ NẰM Ở ĐÂY NÈ!! */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddRound(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddExtraRound}
                disabled={savingRound || !canSubmitRound}
                title={
                  !canSubmitRound
                    ? "Tổng trọng số của bộ tiêu chí phải đúng 100%"
                    : undefined
                }
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingRound ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingRound ? "Đang tạo..." : "Xác nhận tạo vòng phụ"}
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

          {/* ========================================================= */}
          {/* MAP DANH SÁCH TRACKS VÀ TOPICS (CÓ KÈM EDIT & DELETE) */}
          {/* ========================================================= */}
          {tracks.length > 0 ? (
            tracks.map((track: any, idx: number) => (
              <div
                key={track.trackID || track.trackId || idx}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4"
              >
                <div className="flex gap-4 items-center justify-between">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tên Hạng mục
                    </label>
                    <div className="font-bold text-sm text-slate-800">
                      {track.trackName}
                    </div>
                  </div>

                  {/* NÚT EDIT VÀ DELETE TRACK */}
                  {!isEnded && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTrack(track)}
                        title="Sửa Hạng mục"
                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTrack(track)}
                        title="Xóa Hạng mục"
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Các chủ đề:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {track.topics.length > 0 ? (
                      track.topics.map((topic: any, i: number) => (
                        <div
                          key={i}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-bold transition-all"
                        >
                          <span>{topic.topicDetail}</span>

                          {/* NÚT EDIT VÀ DELETE TOPIC (Hiển thị khi Hover) */}
                          {!isEnded && (
                            <div className="flex items-center gap-1 border-l border-blue-200 pl-1.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditTopic(topic, track)}
                                className="text-blue-400 hover:text-blue-700 p-0.5"
                                title="Sửa chủ đề"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(topic, track)}
                                className="text-blue-400 hover:text-red-600 p-0.5"
                                title="Xóa chủ đề"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Chưa có chủ đề nào được thêm.
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
              <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
                <Loader2 size={15} className="animate-spin" />
                Đang tải bộ tiêu chí...
              </div>
            ) : criteriaError ? (
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
                  <AlertCircle size={15} /> {criteriaError}
                </span>
                <button
                  onClick={loadCriteria}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 shrink-0"
                >
                  <RefreshCw size={12} /> Thử lại
                </button>
              </div>
            ) : criteriaSets.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-3">
                Sự kiện này chưa có bộ tiêu chí nào.
              </p>
            ) : (
              <div className="space-y-5">
                {criteriaSets.map((set: any, setIdx: number) => {
                  const total = sumWeight(set.items);
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
                            total === 100 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          <Scale size={12} className="inline mr-1" />
                          Tổng trọng số: {total}%
                          {total !== 100 && " (phải đúng 100% mới lưu được)"}
                        </span>
                        {!isEnded && (
                          <button
                            onClick={() => handleSaveSetScores(set)}
                            disabled={total !== 100}
                            title={
                              total !== 100
                                ? "Tổng trọng số phải đúng 100%"
                                : undefined
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
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
