import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Target,
  Activity,
  Clock,
  ListChecks,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// IMPORT API INSTANCES
import { roundApi } from "../../lib/api/roundApi";
import { criteriaApi } from "../../lib/api/criteriaApi";
import { eventApi } from "../../lib/api/eventApi";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

export function Dashboard() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [eventName, setEventName] = useState<string>("");

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      let targetEventId = urlId;
      let actualCurrentRoundIndex = 0;

      // ==========================================
      // [BẢN VÁ LỖI]: KÉO CẢ ALL ROUNDS LÊN ĐẦU ĐỂ ĐẾM SỐ VÒNG
      // ==========================================
      const allRounds = await roundApi.getAllRounds().catch(() => []);
      const allEvents = await eventApi.getAllEvents();

      // ==========================================
      // BƯỚC 1: LẤY ID VÀ TRẠNG THÁI SỰ KIỆN TỪ DATABASE
      // ==========================================
      if (!targetEventId) {
        // Lọc TÌM ĐÚNG sự kiện ĐANG DIỄN RA (Round hiện tại < Số vòng thực tế)
        const ongoingEvents = allEvents.filter((e: any) => {
          // Lọc các vòng thi thuộc về sự kiện này
          const evRounds = allRounds.filter(
            (r: any) => String(r.eventID || r.eventId) === String(e.id),
          );
          // Đếm linh hoạt: sự kiện có bao nhiêu vòng thì max bấy nhiêu (mặc định 2)
          const maxRounds = evRounds.length > 0 ? evRounds.length : 2;

          return (
            e.currentRound !== undefined &&
            e.currentRound >= 0 &&
            e.currentRound < maxRounds
          );
        });

        if (ongoingEvents && ongoingEvents.length > 0) {
          const latestActiveEvent = ongoingEvents[ongoingEvents.length - 1];
          targetEventId = latestActiveEvent.id;
          setEventName(latestActiveEvent.name || "");
          actualCurrentRoundIndex = latestActiveEvent.currentRound || 0;
        }
      } else {
        try {
          const eventData = allEvents.find(
            (e: any) => String(e.id) === String(targetEventId),
          );
          if (eventData) {
            setEventName(eventData.name || eventData.EventName || "");
            actualCurrentRoundIndex = eventData.currentRound || 0;
          }
        } catch (err) {
          console.warn("Không lấy được tên Event", err);
        }
      }

      if (!targetEventId) {
        setActiveEventId(null);
        setCurrentRound(null);
        setCriteriaList([]);
        setEventName("");
        if (isManualRefresh) setIsRefreshing(false);
        else setIsLoading(false);
        return;
      }

      setActiveEventId(targetEventId);

      // ==========================================
      // BƯỚC 2: TẢI DỮ LIỆU ROUND VÀ CRITERIA (ĐÃ BỌC THÉP)
      // ==========================================
      const eventRounds = allRounds.filter(
        (r: any) => String(r.eventID || r.eventId) === String(targetEventId),
      );

      // (Từ đây trở xuống bà giữ nguyên y chang code cũ của bà nha)
      if (eventRounds.length > 0) {
        const currentEventRound = Number(actualCurrentRoundIndex);

        // Chuẩn hóa field round (backend đặt tên lẫn lộn hoa/thường: topNpromotion vs topNPromotion...)
        const safeRounds = eventRounds.map((r: any) => ({
          ...r,
          safeRoundIndex: Number(
            r.roundIndex ?? r.RoundIndex ?? r.roundindex ?? 0,
          ),
          safeTopN: Number(
            r.topNpromotion ??
              r.topNPromotion ??
              r.TopNPromotion ??
              r.topN ??
              0,
          ),
          safeStart: r.startDate ?? r.StartDate ?? "",
        }));

        // Sắp xếp theo thứ tự vòng (roundIndex tăng dần; startDate là tiêu chí phụ)
        safeRounds.sort((a, b) => {
          if (a.safeRoundIndex !== b.safeRoundIndex)
            return a.safeRoundIndex - b.safeRoundIndex;
          return (
            new Date(a.safeStart).getTime() - new Date(b.safeStart).getTime()
          );
        });

        console.log("🚀 ROUNDS (đã sort):", safeRounds);
        console.log("🚀 event.currentRound =", currentEventRound);

        // ⭐ KHỚP THEO VỊ TRÍ, KHÔNG theo roundIndex tuyệt đối.
        // currentRound là bộ đếm 0-based theo thứ tự vòng: 0=vòng đầu, 1=vòng kế tiếp...
        // (Backend gán roundIndex không khớp currentRound, nên match tuyệt đối sẽ sai.)
        let pickedPos: number;
        if (currentEventRound < 0) {
          pickedPos = 0; // chưa bắt đầu -> hiển thị vòng đầu
        } else if (currentEventRound >= safeRounds.length) {
          pickedPos = safeRounds.length - 1; // đã kết thúc -> hiển thị vòng cuối
        } else {
          pickedPos = currentEventRound;
        }

        const activeRound = {
          ...safeRounds[pickedPos],
          displayIndex: pickedPos, // số vòng để HIỂN THỊ, khớp với currentRound
        };

        console.log("🚀 => Chọn vòng ở vị trí:", pickedPos, activeRound);

        setCurrentRound(activeRound);

        // Tải bộ tiêu chí của đúng cái Vòng thi vừa chốt
        const criteriaSetId =
          activeRound.criteriaSetID ||
          activeRound.criteriaSetId ||
          activeRound.CriteriaSetID ||
          activeRound.CriteriaSetId;

        if (criteriaSetId) {
          try {
            const criteriaRes = await criteriaApi.getSetById(criteriaSetId);
            const setData = (criteriaRes as any)?.data || criteriaRes;

            let list: any[] = [];
            if (Array.isArray(setData)) list = setData;
            else if (Array.isArray(setData.criteriaList))
              list = setData.criteriaList;
            else if (Array.isArray(setData.CriteriaList))
              list = setData.CriteriaList;
            else if (Array.isArray(setData.criteriaMappingItemViewModels))
              list = setData.criteriaMappingItemViewModels;
            else {
              for (const key in setData) {
                if (Array.isArray(setData[key])) {
                  list = setData[key];
                  break;
                }
              }
            }

            const allCriteria = await criteriaApi.getAllCriteria();
            const allCriteriaList = getList(allCriteria);

            const enrichedList = list.map((item) => {
              const cId =
                item.criteriaId ||
                item.criteriaID ||
                item.CriteriaId ||
                item.CriteriaID;
              const matched = allCriteriaList.find((c) => {
                const rawId =
                  c.criteriaId ||
                  c.criteriaID ||
                  c.id ||
                  c.CriteriaId ||
                  c.CriteriaID;
                return String(rawId) === String(cId);
              });

              return {
                ...item,
                resolvedName:
                  matched?.criteriaName ||
                  matched?.name ||
                  item.criteria?.criteriaName ||
                  item.criteriaName ||
                  item.name ||
                  "Tiêu chí (Chưa map được tên)",
                resolvedScore:
                  item.score || item.Score || item.weight || item.Weight || 0,
              };
            });

            setCriteriaList(enrichedList);
          } catch (err) {
            console.warn("Lỗi khi kéo Criteria Set:", err);
            setCriteriaList([]);
          }
        } else {
          setCriteriaList([]);
        }
      } else {
        setCurrentRound(null);
        setCriteriaList([]);
      }
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu Dashboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [urlId, location.key]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "--/--/----";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-slate-500">
        <Activity className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="font-bold">Đang đồng bộ dữ liệu sự kiện...</p>
      </div>
    );
  }

  if (!isLoading && !activeEventId) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-slate-500 animate-in fade-in">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">
          Không có Sự kiện Đang diễn ra
        </h2>
        <p className="mt-2 text-center max-w-md">
          Hệ thống hiện tại không có sự kiện nào đang diễn ra (Các sự kiện trước
          đó đều đã kết thúc). Hãy tạo một sự kiện mới để bắt đầu.
        </p>

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-blue-600" : ""}
            />{" "}
            Làm mới
          </button>
          <button
            onClick={() => navigate(`/admin/events/create`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold rounded-xl shadow-sm hover:bg-slate-800"
          >
            Khởi tạo Sự kiện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Tổng quan:{" "}
            <span className="text-blue-600">{eventName || "Hackathon"}</span>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              title="Làm mới dữ liệu"
              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full shadow-sm hover:shadow transition-all"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin text-blue-600" : ""}
              />
            </button>
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700">
            <Download size={16} /> Xuất Báo Cáo
          </button>
          <button
            onClick={() => navigate(`/admin/events/${activeEventId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-800"
          >
            Chỉnh sửa Sự kiện <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {currentRound ? (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-xl">
                <Activity size={32} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Trạng thái hiện tại
                </h2>
                <div className="text-2xl font-black">
                  {/* Số vòng hiển thị theo VỊ TRÍ, khớp với currentRound của sự kiện */}
                  {currentRound.roundName} (Round{" "}
                  {currentRound.displayIndex ?? 0})
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-400 flex items-center gap-2 justify-end mb-1">
                <Clock size={16} /> Thời gian mở / đóng cổng
              </div>
              <div className="font-bold text-emerald-400 bg-white/10 px-4 py-2 rounded-lg inline-block">
                {formatDate(currentRound.startDate)} -{" "}
                {formatDate(currentRound.endDate)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Giới hạn đội tham gia
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {currentRound.maxTeam}{" "}
                  <span className="text-base font-semibold text-slate-500">
                    đội thi
                  </span>
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Target size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Chỉ tiêu vào vòng sau
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  Top {currentRound.safeTopN}{" "}
                  <span className="text-base font-semibold text-slate-500">
                    đội xuất sắc
                  </span>
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <ListChecks size={20} className="text-slate-700" />
              <h3 className="text-lg font-black text-slate-900">
                Bộ tiêu chí đánh giá ({currentRound.roundName})
              </h3>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">STT</th>
                  <th className="px-6 py-4">Tên Tiêu Chí (Criteria)</th>
                  <th className="px-6 py-4 text-right w-40">
                    Trọng số (Score)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {criteriaList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      <AlertCircle
                        className="mx-auto mb-2 opacity-50"
                        size={24}
                      />
                      Chưa có dữ liệu tiêu chí đánh giá cho vòng này. (Bấm F12
                      xem log để kiểm tra API)
                    </td>
                  </tr>
                ) : (
                  criteriaList.map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.resolvedName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-black text-sm">
                          {item.resolvedScore}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">
            Chưa tìm thấy dữ liệu Vòng thi
          </h3>
          <p className="text-slate-500 mt-2">
            Sự kiện này hiện chưa có vòng thi nào được thiết lập trên hệ thống.
          </p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin text-blue-600" : ""}
            />{" "}
            Thử tải lại
          </button>
        </div>
      )}
    </div>
  );
}
