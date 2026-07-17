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
  event?.eventName || event?.name || "Unnamed event";

const getRoundId = (round: any): string =>
  String(round?.roundId ?? round?.id ?? "");

const getRoundName = (round: any): string =>
  round?.roundName || round?.name || "Unnamed round";

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
        <Ban size={12} /> Banned
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
        <CheckCircle2 size={12} /> Approved
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-200">
        <Clock size={12} /> Pending
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
  const [statusFilter, setStatusFilter] = useState("All statuses");

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
              name: getEventName(sample?.event) || `Event #${id.slice(0, 8)}`,
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
          name: t.teamName || t.name || `Team ${t.teamId || ""}`,
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
        statusFilter === "All statuses" ||
        (statusFilter === "Pending" && team.status === "pending") ||
        (statusFilter === "Approved" && team.status === "approved") ||
        (statusFilter === "Banned" && team.status === "banned");
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
      title: "Approve this team?",
      text: `After approval, team "${name}" will be allowed to submit.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#059669",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: "Approving...", didOpen: () => Swal.showLoading() });
      await apiClient.put(`/api/TeamInRound/approve/${id}`);
      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: `Team "${name}" can now submit.`,
        timer: 1600,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data || "Cannot approve team at this time!",
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
        "Missing information",
        "Please enter a reason for disqualification!",
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
        title: "Processed!",
        text: `Team ${selectedTeam?.name} has been disqualified from the round.`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data || "Cannot disqualify this team!",
        "error",
      );
    }
  };

  // 5. GỠ CẤM (UNBAN)
  const handleUnbanTeam = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Lift ban?",
      text: `Team ${name} will be allowed to continue competing.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm Unban",
    });
    if (result.isConfirmed) {
      try {
        await apiClient.put(`/api/TeamInRound/unban/${id}`);
        Swal.fire({
          icon: "success",
          title: "Success!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTeams(selectedRoundId);
      } catch (error) {
        Swal.fire("Error", "Cannot unban this team!", "error");
      }
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Submissions & Discipline
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Approve team submissions to open for Judge grading, and handle rule violations.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {/* CHỌN THEO TẦNG: SỰ KIỆN -> VÒNG THI */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Select Event & Round to manage
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="w-[280px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
            >
              <option value="">-- Select Event --</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.roundCount} rounds)
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
                {selectedEventId ? "-- Select Round --" : "Select Event first"}
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
                  <Clock size={15} /> {counts.pending} pending
                </span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <ShieldCheck size={15} /> {counts.approved} approved
                </span>
                <span className="flex items-center gap-1.5 font-bold text-red-500">
                  <Ban size={15} /> {counts.banned} banned
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
                placeholder="Search team name..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="All statuses">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Banned">Banned</option>
            </select>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Team Name</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Violation Reason</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                      Loading data...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      {!selectedEventId
                        ? "Please select an Event."
                        : !selectedRoundId
                          ? "Please select a Round."
                          : "No matching teams found."}
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
                            <Unlock size={14} /> Unban
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
                                <CheckCircle2 size={14} /> Approve team
                              </button>
                            ) : (
                              <span className="px-3 py-2 text-emerald-600 text-xs font-bold flex items-center gap-1">
                                <ShieldCheck size={14} /> Approved
                              </span>
                            )}
                            <button
                              onClick={() =>
                                openDisqualifyModal(team.id, team.name)
                              }
                              className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1"
                            >
                              <Ban size={14} /> Disqualify
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
                  Confirm disqualify team {selectedTeam?.name}
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
                This action will ban team <b>{selectedTeam?.name}</b> from continuing to compete.
              </p>
              <div>
                <label className="text-sm font-bold text-slate-900 flex gap-1 items-center">
                  Reason for disqualification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full mt-2 border border-slate-200 rounded-xl p-4 text-sm focus:border-red-500 outline-none resize-none h-28"
                  placeholder="Enter reason for rule violation..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisqualify}
                className="px-5 py-2.5 bg-[#ef4444] text-white text-sm font-bold rounded-xl hover:bg-red-600"
              >
                Confirm Disqualify
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
