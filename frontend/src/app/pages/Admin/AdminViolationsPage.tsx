import { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  X,
  Ban,
  Unlock,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

import apiClient from "../../lib/api/apiClient";

// ============================================================
// Helpers thuần (không phụ thuộc state của component)
// ============================================================

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

const getEventId = (round: any): string =>
  String(round?.eventId ?? round?.eventID ?? "");

const getEventName = (event: any): string =>
  event?.eventName || event?.name || "Sự kiện chưa đặt tên";

const getRoundId = (round: any): string =>
  String(round?.roundId ?? round?.id ?? "");

const getRoundName = (round: any): string =>
  round?.roundName || round?.name || "Vòng thi chưa đặt tên";

// Trạng thái đội trong vòng: banned | approved | pending
// - pending  = chưa duyệt (isCheck=false) -> admin cần DUYỆT để đội được nộp bài
// - approved = đã duyệt (isCheck=true)     -> đội được phép nộp bài
// - banned   = bị loại (isBanned=true)
const deriveStatus = (t: any): "banned" | "approved" | "pending" => {
  const raw = String(
    t.status || t.state || t.approvalStatus || t.teamStatus || "",
  ).toLowerCase();

  const isBanned =
    t.isBanned === true ||
    raw.includes("ban") ||
    raw.includes("loại") ||
    raw.includes("disqualif");

  const isApproved =
    t.isCheck === true || // field THẬT của backend: đội đã được duyệt
    t.isApproved === true ||
    t.approved === true ||
    raw.includes("approve") ||
    raw.includes("accept") ||
    raw.includes("duyệt");

  if (isBanned) return "banned";
  if (isApproved) return "approved";
  return "pending";
};

// Badge trạng thái đội — tách khỏi component vì không đụng tới state
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "banned")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-bold border border-red-100">
        <Ban size={12} /> Đã loại
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
        <CheckCircle2 size={12} /> Đã duyệt
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-200">
        <Clock size={12} /> Chờ duyệt
      </span>
    );
  return null;
};

export function AdminViolationsPage() {
  // Dữ liệu gốc: TOÀN BỘ Sự kiện + Vòng thi trong hệ thống (lấy 1 lần khi vào trang)
  const [events, setEvents] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);

  // Lựa chọn theo tầng: chọn Sự kiện trước, rồi mới chọn Vòng thi trong Sự kiện đó
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả tình trạng");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [violationReason, setViolationReason] = useState("");

  // 1. Lấy toàn bộ Sự kiện + Vòng thi ngay khi vào trang
  useEffect(() => {
    apiClient
      .get("/api/Event")
      .then((res) => setEvents(getList(res.data)))
      .catch((err) => console.error("Lỗi lấy danh sách Sự kiện:", err));

    apiClient
      .get("/api/Round")
      .then((res) => setRounds(getList(res.data)))
      .catch((err) => console.error("Lỗi lấy danh sách Vòng thi:", err));
  }, []);

  // Danh sách Sự kiện đổ vào dropdown tầng 1 — chỉ hiện Sự kiện nào thật sự có Vòng thi,
  // kèm số vòng thi để admin hình dung trước khi bấm vào
  const eventOptions = useMemo(() => {
    const roundCountByEvent = new Map<string, number>();
    rounds.forEach((r) => {
      const id = getEventId(r);
      if (!id) return;
      roundCountByEvent.set(id, (roundCountByEvent.get(id) || 0) + 1);
    });

    const fromEventApi = events
      .map((e) => ({
        id: String(e.id ?? e.eventId ?? e.eventID ?? ""),
        name: getEventName(e),
      }))
      .filter((e) => e.id && roundCountByEvent.has(e.id));

    // Fallback: nếu /api/Event chưa trả về đủ, tự suy Sự kiện từ chính Vòng thi
    const list =
      fromEventApi.length > 0
        ? fromEventApi
        : Array.from(roundCountByEvent.keys()).map((id) => {
            const sample = rounds.find((r) => getEventId(r) === id);
            return {
              id,
              name: getEventName(sample?.event) || `Sự kiện #${id.slice(0, 8)}`,
            };
          });

    return list
      .map((e) => ({ ...e, roundCount: roundCountByEvent.get(e.id) || 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [events, rounds]);

  // Danh sách Vòng thi đổ vào dropdown tầng 2 — chỉ những vòng thuộc Sự kiện đang chọn
  const roundsInSelectedEvent = useMemo(() => {
    return rounds
      .filter((r) => getEventId(r) === selectedEventId)
      .sort((a, b) => (a.roundIndex ?? 0) - (b.roundIndex ?? 0));
  }, [rounds, selectedEventId]);

  // Đổi Sự kiện -> reset Vòng thi + danh sách đội đang hiển thị
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedRoundId("");
    setTeams([]);
  };

  // 2. Khi chọn Vòng thi -> lấy danh sách đội trong vòng đó
  const fetchTeams = async (roundId: string) => {
    if (!roundId) {
      setTeams([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get(
        `/api/TeamInRound/details/round/${roundId}`,
      );
      const list = getList(res.data);

      setTeams(
        list.map((t: any) => ({
          // id này là teamInRoundID -> dùng cho approve/ban/unban
          id: t.teamInRoundID || t.teamInRoundId || t.id,
          name: t.teamName || t.name || `Đội ${t.teamId || ""}`,
          status: deriveStatus(t),
          reason: t.banReason || t.reason || t.note || "-",
        })),
      );
    } catch (error) {
      console.error("Lỗi lấy danh sách đội:", error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(selectedRoundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchSearch = team.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "Tất cả tình trạng" ||
        (statusFilter === "Chờ duyệt" && team.status === "pending") ||
        (statusFilter === "Đã duyệt" && team.status === "approved") ||
        (statusFilter === "Đã loại" && team.status === "banned");
      return matchSearch && matchStatus;
    });
  }, [teams, searchTerm, statusFilter]);

  const counts = useMemo(
    () => ({
      pending: teams.filter((t) => t.status === "pending").length,
      approved: teams.filter((t) => t.status === "approved").length,
      banned: teams.filter((t) => t.status === "banned").length,
    }),
    [teams],
  );

  // 3. DUYỆT ĐỘI -> đội được phép nộp bài
  const handleApprove = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Duyệt đội này?",
      text: `Sau khi duyệt, đội "${name}" mới được phép nộp bài.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt ngay",
      confirmButtonColor: "#059669",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: "Đang duyệt...", didOpen: () => Swal.showLoading() });
      await apiClient.put(`/api/TeamInRound/approve/${id}`);
      Swal.fire({
        icon: "success",
        title: "Đã duyệt!",
        text: `Đội "${name}" giờ đã có thể nộp bài.`,
        timer: 1600,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error?.response?.data || "Không thể duyệt đội lúc này!",
        "error",
      );
    }
  };

  const openDisqualifyModal = (id: string, name: string) => {
    setSelectedTeam({ id, name });
    setViolationReason("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(null);
  };

  // 4. LOẠI (BAN)
  const handleConfirmDisqualify = async () => {
    if (!violationReason.trim()) {
      return Swal.fire(
        "Thiếu thông tin",
        "Vui lòng nhập lý do loại đội thi!",
        "error",
      );
    }
    try {
      await apiClient.put(`/api/TeamInRound/ban/${selectedTeam?.id}`, {
        reason: violationReason,
      });
      closeModal();
      Swal.fire({
        icon: "success",
        title: "Đã xử lý!",
        text: `Đội ${selectedTeam?.name} đã bị loại khỏi vòng thi.`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error?.response?.data || "Không thể loại đội thi này!",
        "error",
      );
    }
  };

  // 5. GỠ CẤM (UNBAN)
  const handleUnbanTeam = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Gỡ lệnh cấm?",
      text: `Đội ${name} sẽ được phép tiếp tục thi đấu.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý Gỡ cấm",
    });
    if (result.isConfirmed) {
      try {
        await apiClient.put(`/api/TeamInRound/unban/${id}`);
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTeams(selectedRoundId);
      } catch (error) {
        Swal.fire("Lỗi", "Không thể gỡ cấm đội thi này!", "error");
      }
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Duyệt bài & Kỷ luật
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Duyệt bài nộp của đội để mở cho Giám khảo chấm, và xử lý vi phạm quy
          chế.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {/* CHỌN THEO TẦNG: SỰ KIỆN -> VÒNG THI */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Chọn Sự kiện & Vòng thi để kiểm soát
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="w-[280px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
            >
              <option value="">-- Chọn Sự kiện --</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.roundCount} vòng)
                </option>
              ))}
            </select>

            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedEventId}
              className="w-[280px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedEventId ? "-- Chọn Vòng thi --" : "Chọn Sự kiện trước"}
              </option>
              {roundsInSelectedEvent.map((r) => (
                <option key={getRoundId(r)} value={getRoundId(r)}>
                  {getRoundName(r)}
                </option>
              ))}
            </select>

            {selectedRoundId && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 font-bold text-amber-600">
                  <Clock size={15} /> {counts.pending} chờ duyệt
                </span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <ShieldCheck size={15} /> {counts.approved} đã duyệt
                </span>
                <span className="flex items-center gap-1.5 font-bold text-red-500">
                  <Ban size={15} /> {counts.banned} đã loại
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${!selectedRoundId ? "opacity-30 pointer-events-none" : ""}`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-[400px]">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên đội thi..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="Tất cả tình trạng">Tất cả tình trạng</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Đã loại">Đã loại</option>
            </select>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tên Đội</th>
                  <th className="px-6 py-4 text-center">Tình trạng</th>
                  <th className="px-6 py-4">Lý do vi phạm</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <Activity
                        className="animate-spin inline mr-2 mb-1"
                        size={18}
                      />{" "}
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      {!selectedEventId
                        ? "Vui lòng chọn Sự kiện."
                        : !selectedRoundId
                          ? "Vui lòng chọn Vòng thi."
                          : "Không tìm thấy đội thi nào phù hợp."}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 font-bold text-slate-900">
                        {team.name}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={team.status} />
                      </td>
                      <td
                        className={`px-6 py-5 font-medium text-xs ${!team.reason || team.reason === "-" ? "text-slate-400" : "text-slate-700"}`}
                      >
                        {team.reason || "-"}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {team.status === "banned" ? (
                          <button
                            onClick={() => handleUnbanTeam(team.id, team.name)}
                            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black flex items-center gap-1 ml-auto"
                          >
                            <Unlock size={14} /> Gỡ cấm
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {team.status === "pending" ? (
                              <button
                                onClick={() =>
                                  handleApprove(team.id, team.name)
                                }
                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                              >
                                <CheckCircle2 size={14} /> Duyệt đội
                              </button>
                            ) : (
                              <span className="px-3 py-2 text-emerald-600 text-xs font-bold flex items-center gap-1">
                                <ShieldCheck size={14} /> Đã duyệt
                              </span>
                            )}
                            <button
                              onClick={() =>
                                openDisqualifyModal(team.id, team.name)
                              }
                              className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1"
                            >
                              <Ban size={14} /> Loại
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 text-red-500">
                <div className="bg-red-50 p-2 rounded-full">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Xác nhận loại đội thi {selectedTeam?.name}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Hành động này sẽ cấm đội <b>{selectedTeam?.name}</b> tiếp tục
                thi đấu.
              </p>
              <div>
                <label className="text-sm font-bold text-slate-900 flex gap-1 items-center">
                  Lý do loại <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full mt-2 border border-slate-200 rounded-xl p-4 text-sm focus:border-red-500 outline-none resize-none h-28"
                  placeholder="Nhập lý do vi phạm quy chế..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDisqualify}
                className="px-5 py-2.5 bg-[#ef4444] text-white text-sm font-bold rounded-xl hover:bg-red-600"
              >
                Xác nhận Loại
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
