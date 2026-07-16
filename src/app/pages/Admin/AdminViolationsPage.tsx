import { useState, useEffect } from "react";
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

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

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

export function AdminViolationsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [violationReason, setViolationReason] = useState("");

  // 1. Lấy danh sách vòng thi (đổ vào dropdown)
  useEffect(() => {
    apiClient
      .get("/api/Round")
      .then((res) => setRounds(getList(res.data)))
      .catch((err) => console.error("Lỗi lấy danh sách Vòng thi", err));
  }, []);

  // 2. Khi chọn vòng thi -> lấy danh sách đội trong vòng
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
      console.log("🟦 TeamInRound detail (mẫu 1 dòng):", list[0]);

      const mappedTeams = list.map((t: any) => ({
        // id này là teamInRoundID -> dùng cho approve/ban/unban
        id: t.teamInRoundID || t.teamInRoundId || t.id,
        name: t.teamName || t.name || `Đội ${t.teamId || ""}`,
        status: deriveStatus(t),
        reason: t.banReason || t.reason || t.note || "-",
      }));

      setTeams(mappedTeams);
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

  const filteredTeams = teams.filter((team) => {
    const matchSearch = team.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "All Statuses" ||
      (statusFilter === "Pending" && team.status === "pending") ||
      (statusFilter === "Approved" && team.status === "approved") ||
      (statusFilter === "Banned" && team.status === "banned");
    return matchSearch && matchStatus;
  });

  const counts = {
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    banned: teams.filter((t) => t.status === "banned").length,
  };

  // 3. DUYỆT ĐỘI -> đội được phép nộp bài
  const handleApprove = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Approve this team?",
      text: `After approval, team "${name}" will be allowed to submit.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve Now",
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
        error?.response?.data || "Cannot approve this team right now!",
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
        "Missing Information",
        "Please enter a reason for disqualifying the team!",
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
        title: "Done!",
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
      title: "Lift the ban?",
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

  const statusBadge = (status: string) => {
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

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Submissions & Discipline
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Approve team submissions for Judges to grade, and handle rule violations.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {/* DROPDOWN CHỌN VÒNG THI */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Select Round to Monitor
          </label>
          <div className="flex items-center gap-6 flex-wrap">
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-1/2 min-w-[260px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
            >
              <option value="">-- Select Round --</option>
              {rounds.map((r: any) => (
                <option key={r.id || r.roundId} value={r.id || r.roundId}>
                  {r.roundName || r.name}
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
              <option value="All Statuses">All Statuses</option>
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
                      {!selectedRoundId
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
                        {statusBadge(team.status)}
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
                                <CheckCircle2 size={14} /> Approve
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
                  Confirm Disqualification of {selectedTeam?.name}
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
                This action will ban team <b>{selectedTeam?.name}</b> from continuing
                to compete.
              </p>
              <div>
                <label className="text-sm font-bold text-slate-900 flex gap-1 items-center">
                  Disqualification Reason <span className="text-red-500">*</span>
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
