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
  event?.eventName || event?.name || "Unnamed Event";
const getRoundId = (round: any): string =>
  String(round?.roundId ?? round?.id ?? "");
const getRoundName = (round: any): string =>
  round?.roundName || round?.name || "Unnamed Round";

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
    t.isCheck === true ||
    t.isApproved === true ||
    t.approved === true ||
    raw.includes("approve") ||
    raw.includes("accept") ||
    raw.includes("duyệt");

  if (isBanned) return "banned";
  if (isApproved) return "approved";
  return "pending";
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "banned")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-extrabold border border-red-100 uppercase tracking-widest">
        <Ban size={12} strokeWidth={2.5} /> Disqualified
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-extrabold border border-emerald-100 uppercase tracking-widest">
        <CheckCircle2 size={12} strokeWidth={2.5} /> Approved
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[11px] font-extrabold border border-amber-200 uppercase tracking-widest">
        <Clock size={12} strokeWidth={2.5} /> Pending
      </span>
    );
  return null;
};

export function AdminViolationsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [violationReason, setViolationReason] = useState("");

  useEffect(() => {
    apiClient
      .get("/api/Event")
      .then((res) => setEvents(getList(res.data)))
      .catch(() => {});
    apiClient
      .get("/api/Round")
      .then((res) => setRounds(getList(res.data)))
      .catch(() => {});
  }, []);

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [events, rounds]);

  const roundsInSelectedEvent = useMemo(() => {
    return rounds
      .filter((r) => getEventId(r) === selectedEventId)
      .sort((a, b) => (a.roundIndex ?? 0) - (b.roundIndex ?? 0));
  }, [rounds, selectedEventId]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedRoundId("");
    setTeams([]);
  };

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
      setTeams(
        getList(res.data).map((t: any) => ({
          id: t.teamInRoundID || t.teamInRoundId || t.id,
          name: t.teamName || t.name || `Team ${t.teamId || ""}`,
          status: deriveStatus(t),
          reason: t.banReason || t.reason || t.note || "-",
        })),
      );
    } catch (error) {
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(selectedRoundId);
  }, [selectedRoundId]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchSearch = team.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "All Status" ||
        (statusFilter === "Pending" && team.status === "pending") ||
        (statusFilter === "Approved" && team.status === "approved") ||
        (statusFilter === "Disqualified" && team.status === "banned");
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

  const handleApprove = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Approve this team?",
      text: `Once approved, "${name}" will be allowed to submit their project.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#059669",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
    });
    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: "Approving...", didOpen: () => Swal.showLoading() });
      await apiClient.put(`/api/TeamInRound/approve/${id}`);
      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: `"${name}" can now submit.`,
        timer: 1600,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data || "Unable to approve team at this time!",
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

  const handleConfirmDisqualify = async () => {
    if (!violationReason.trim()) {
      return Swal.fire(
        "Required",
        "Please provide a reason for disqualification!",
        "warning",
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
        text: `${selectedTeam?.name} has been disqualified.`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchTeams(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data || "Unable to disqualify this team!",
        "error",
      );
    }
  };

  const handleUnbanTeam = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Revoke Disqualification?",
      text: `${name} will be allowed to continue competing.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Revoke",
      confirmButtonColor: "#0f172a",
      customClass: {
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
    });
    if (result.isConfirmed) {
      try {
        await apiClient.put(`/api/TeamInRound/unban/${id}`);
        Swal.fire({
          icon: "success",
          title: "Restored!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTeams(selectedRoundId);
      } catch (error) {
        Swal.fire("Error", "Unable to lift the ban on this team!", "error");
      }
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 relative font-sans selection:bg-slate-200">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight">
          Approvals & Disciplinary
        </h2>
        <p className="text-slate-500 font-medium text-base mt-2">
          Review team submissions to open grading access, and handle rule
          violations.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-8">
        <div className="mb-8 pb-8 border-b border-slate-100">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Filter by Event & Round
          </label>
          <div className="flex items-center gap-5 flex-wrap">
            <select
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="w-[300px] px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
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
              className="w-[300px] px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="">
                {selectedEventId
                  ? "-- Select Round --"
                  : "Select an Event first"}
              </option>
              {roundsInSelectedEvent.map((r) => (
                <option key={getRoundId(r)} value={getRoundId(r)}>
                  {getRoundName(r)}
                </option>
              ))}
            </select>

            {selectedRoundId && (
              <div className="flex items-center gap-5 ml-4 bg-slate-50 py-2.5 px-6 rounded-2xl border border-slate-100">
                <span className="flex items-center gap-2 text-[13px] font-bold text-amber-600 uppercase tracking-wide">
                  <Clock size={16} strokeWidth={2.5} /> {counts.pending} Pending
                </span>
                <div className="w-px h-4 bg-slate-300"></div>
                <span className="flex items-center gap-2 text-[13px] font-bold text-emerald-600 uppercase tracking-wide">
                  <ShieldCheck size={16} strokeWidth={2.5} /> {counts.approved}{" "}
                  Approved
                </span>
                <div className="w-px h-4 bg-slate-300"></div>
                <span className="flex items-center gap-2 text-[13px] font-bold text-red-500 uppercase tracking-wide">
                  <Ban size={16} strokeWidth={2.5} /> {counts.banned} Banned
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${!selectedRoundId ? "opacity-30 pointer-events-none" : ""}`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-[450px]">
              <Search
                size={18}
                className="absolute left-4 top-3 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team name..."
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Disqualified">Disqualified</option>
            </select>
          </div>

          <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Team Name</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5">Violation Reason</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs"
                    >
                      <Activity
                        className="animate-spin inline mr-2 text-[#0a192f]"
                        size={20}
                      />{" "}
                      Loading teams...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-slate-500 font-medium text-base"
                    >
                      {!selectedEventId
                        ? "Please select an Event."
                        : !selectedRoundId
                          ? "Please select a Round."
                          : "No teams found matching criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-8 py-6 font-extrabold text-[#0a192f] text-base">
                        {team.name}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <StatusBadge status={team.status} />
                      </td>
                      <td
                        className={`px-6 py-6 font-medium text-sm ${!team.reason || team.reason === "-" ? "text-slate-400 italic" : "text-slate-700"}`}
                      >
                        {team.reason || "-"}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {team.status === "banned" ? (
                          <button
                            onClick={() => handleUnbanTeam(team.id, team.name)}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-[#0a192f] text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 ml-auto transition-colors shadow-sm"
                          >
                            <Unlock size={16} strokeWidth={2.5} /> Revoke Ban
                          </button>
                        ) : (
                          <div className="flex justify-end gap-3">
                            {team.status === "pending" ? (
                              <button
                                onClick={() =>
                                  handleApprove(team.id, team.name)
                                }
                                className="px-5 py-2.5 bg-[#0a192f] text-white text-xs font-extrabold rounded-xl hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-md shadow-slate-900/10"
                              >
                                <CheckCircle2 size={16} strokeWidth={2.5} />{" "}
                                Approve
                              </button>
                            ) : (
                              <span className="px-5 py-2.5 text-emerald-600 text-xs font-extrabold flex items-center gap-1.5">
                                <ShieldCheck size={16} strokeWidth={2.5} />{" "}
                                Authorized
                              </span>
                            )}
                            <button
                              onClick={() =>
                                openDisqualifyModal(team.id, team.name)
                              }
                              className="px-5 py-2.5 bg-red-50 text-red-600 text-xs font-extrabold rounded-xl hover:bg-red-100 flex items-center gap-1.5 transition-colors"
                            >
                              <Ban size={16} strokeWidth={2.5} /> Disqualify
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 text-red-500">
                <div className="bg-red-100 p-2.5 rounded-xl">
                  <AlertTriangle
                    size={22}
                    className="text-red-600"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="font-extrabold text-[#0a192f] text-xl">
                  Confirm Disqualification
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 bg-white rounded-xl shadow-sm border border-slate-200"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-base text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                This action will permanently revoke submission access for{" "}
                <strong className="text-[#0a192f]">{selectedTeam?.name}</strong>
                .
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex gap-1 items-center mb-3">
                  Reason for Disqualification{" "}
                  <span className="text-red-500 text-lg leading-none">*</span>
                </label>
                <textarea
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-500/10 outline-none resize-none h-32 transition-all"
                  placeholder="Enter detailed reason here..."
                ></textarea>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisqualify}
                className="px-8 py-3 bg-red-600 text-white text-sm font-extrabold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
              >
                Confirm Disqualification
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
