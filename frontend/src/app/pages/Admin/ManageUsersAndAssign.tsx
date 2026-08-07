import { useState, useEffect } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  UserPlus,
  UserCheck,
  Eye,
  Search,
  Ban,
  RotateCcw,
} from "lucide-react";
import Swal from "sweetalert2";

import apiClient from "../../lib/api/apiClient";
import { playerApi } from "../../lib/api/playerApi";
import { showApiError } from "../../lib/utils/apiError";

const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

const studentKey = (s: any): string =>
  s?.studentId ||
  s?.studentID ||
  s?.id ||
  s?.Id ||
  s?.playerId ||
  s?.playerID ||
  s?.studentCode ||
  "";

const playerName = (p: any): string =>
  p?.fullName || p?.name || p?.studentName || "—";

// /api/Player/all-players trả về cờ `isActive`: false = đang bị ban.
// So sánh === false chứ không !p.isActive — field thiếu/undefined thì mặc định là
// đang hoạt động, chứ không phải bị ban.
const isPlayerBanned = (p: any): boolean =>
  (p?.isActive ?? p?.IsActive) === false;

export function ManageUsersAndAssign() {
  const [activeTab, setActiveTab] = useState("approve");

  // ==========================================
  // TAB 1: APPROVE STUDENTS
  // ==========================================
  const [students, setStudents] = useState<any[]>([]);

  const fetchPendingStudents = async () => {
    try {
      const res = await apiClient.get("/api/Player/pending");
      setStudents(getList(res.data));
    } catch (error) {
      setStudents([]);
    }
  };

  useEffect(() => {
    if (activeTab === "approve") fetchPendingStudents();
  }, [activeTab]);

  const handleApproveStudent = async (
    studentId: string,
    isApprove: boolean,
  ) => {
    try {
      Swal.fire({
        title: isApprove ? "Approving..." : "Rejecting...",
        didOpen: () => Swal.showLoading(),
      });
      if (isApprove) await apiClient.put(`/api/Player/${studentId}/approve`);
      else await apiClient.delete(`/api/Player/${studentId}/reject`);

      Swal.fire({
        icon: "success",
        title: isApprove ? "Approved!" : "Rejected!",
        showConfirmButton: false,
        timer: 1200,
      });
      fetchPendingStudents();
    } catch (error: any) {
      showApiError(error, {
        action: isApprove ? "approve this student" : "reject this student",
      });
    }
  };

  // Hàm hiển thị ảnh to khi Admin muốn kiểm tra giấy tờ
  const handleViewImage = (url: string, title: string) => {
    Swal.fire({
      title: title,
      imageUrl: url,
      imageAlt: title,
      showConfirmButton: false,
      showCloseButton: true,
      width: "auto",
      customClass: {
        popup: "rounded-[2rem] pb-8",
        image:
          "rounded-xl max-h-[70vh] object-contain mt-4 border border-slate-200 shadow-sm",
      },
    });
  };

  // ==========================================
  // TAB 2: MANAGE PLAYERS (ban / unban)
  // ==========================================
  const [players, setPlayers] = useState<any[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  const fetchAllPlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      setPlayers(getList(await playerApi.getAllPlayers()));
    } catch (error) {
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "players") fetchAllPlayers();
  }, [activeTab]);

  const filteredPlayers = players.filter((p) => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return true;
    return [playerName(p), p.email, p.phone, p.universityName, p.cccdNumber]
      .filter(Boolean)
      .some((field: any) => String(field).toLowerCase().includes(q));
  });

  const handleBanPlayer = async (p: any) => {
    const studentId = studentKey(p);
    if (!studentId)
      return Swal.fire(
        "Player record is incomplete",
        "This player has no ID in the system, so they can't be banned. Reload the list and try again.",
        "warning",
      );

    // Lý do bắt buộc: backend nhét thẳng nó vào mail gửi cho player, để rỗng thì
    // player nhận được một cái mail ban không nói vì sao.
    const { value: reason } = await Swal.fire({
      title: `Ban ${playerName(p)}?`,
      input: "textarea",
      inputLabel: "Reason (will be emailed to the player)",
      inputPlaceholder: "e.g., Confirmed plagiarism during Round 2...",
      inputAttributes: { "aria-label": "Ban reason" },
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ban player",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      inputValidator: (value) =>
        !value || !value.trim() ? "A reason is required." : undefined,
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700",
      },
    });
    if (!reason) return;

    try {
      Swal.fire({ title: "Banning...", didOpen: () => Swal.showLoading() });
      await playerApi.banPlayer({ studentId, reason: reason.trim() });
      Swal.fire({
        icon: "success",
        title: "Player banned",
        text: "A notification email has been sent to the player.",
        confirmButtonColor: "#ea580c",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2.5",
        },
      });
      fetchAllPlayers();
    } catch (error: any) {
      showApiError(error, { action: "ban this player" });
    }
  };

  const handleUnbanPlayer = async (p: any) => {
    const studentId = studentKey(p);
    if (!studentId)
      return Swal.fire(
        "Player record is incomplete",
        "This player has no ID in the system, so they can't be unbanned. Reload the list and try again.",
        "warning",
      );

    const result = await Swal.fire({
      title: `Unban ${playerName(p)}?`,
      text: "The player will regain access and be notified by email.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unban",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700",
      },
    });
    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: "Unbanning...", didOpen: () => Swal.showLoading() });
      await playerApi.unbanPlayer(studentId);
      Swal.fire({
        icon: "success",
        title: "Player unbanned",
        text: "A notification email has been sent to the player.",
        confirmButtonColor: "#ea580c",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2.5",
        },
      });
      fetchAllPlayers();
    } catch (error: any) {
      showApiError(error, { action: "unban this player" });
    }
  };

  // ==========================================
  // TAB 3: CREATE TEACHER
  // ==========================================
  const [newTeacher, setNewTeacher] = useState({
    email: "",
    password: "",
    fullName: "",
    address: "",
    phone: "",
    isGuest: false,
  });

  const handleCreateTeacher = async () => {
    if (!newTeacher.fullName || !newTeacher.email || !newTeacher.password)
      return Swal.fire(
        "Required",
        "Please fill in all required fields!",
        "warning",
      );
    try {
      Swal.fire({
        title: "Creating Account...",
        didOpen: () => Swal.showLoading(),
      });
      await apiClient.post("/api/Teacher", newTeacher);

      Swal.fire({
        icon: "success",
        title: "Account Created!",
        html: "The account can now be assigned to a track when an event is created.",
        confirmButtonColor: "#ea580c",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-8 py-3",
        },
      });

      setNewTeacher({
        email: "",
        password: "",
        fullName: "",
        address: "",
        phone: "",
        isGuest: false,
      });
    } catch (error: any) {
      showApiError(error, {
        action: "create this account",
        hint: "An account with this email may already exist.",
      });
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-0 sm:p-4 lg:p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-6 lg:mb-10">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#ea580c] tracking-tight">
            Users & Accounts
          </h2>
          <p className="text-slate-500 font-medium text-base mt-2">
            Manage student approvals, player accounts, and internal
            judge/mentor accounts.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex overflow-x-auto border-b border-slate-100 px-3 sm:px-6 bg-slate-50/50 pt-3">
            {[
              {
                id: "approve",
                label: "Approve Students",
                icon: <Users size={18} />,
              },
              {
                id: "players",
                label: "Manage Players",
                icon: <UserCheck size={18} />,
              },
              {
                id: "provide",
                label: "Create Teacher Account",
                icon: <UserPlus size={18} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 sm:px-6 lg:px-8 py-4 text-sm font-extrabold border-b-[3px] transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-orange-600 text-orange-600 bg-white rounded-t-2xl shadow-sm"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-white rounded-t-2xl"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 lg:p-8 flex-1 bg-white">
            {/* TAB 1: APPROVE STUDENTS */}
            {activeTab === "approve" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="border border-slate-100 rounded-[1.5rem] overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm min-w-[1300px]">
                    <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-5">Full Name</th>
                        <th className="px-6 py-5">Email & Phone</th>
                        <th className="px-6 py-5">University Name</th>
                        <th className="px-6 py-5">CCCD Number</th>
                        <th className="px-4 py-5 text-center">
                          ID Card (CCCD)
                        </th>
                        <th className="px-4 py-5 text-center">Student Card</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map((s) => (
                        <tr
                          key={studentKey(s)}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-5 font-extrabold text-[#ea580c]">
                            {s.fullName || s.name || s.studentName || "—"}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">
                                {s.email || "—"}
                              </span>
                              <span className="font-bold text-slate-400 text-xs">
                                {s.phone || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-medium text-slate-500">
                            {s.universityName || "—"}
                          </td>

                          {/* Cột CCCD Number */}
                          <td className="px-6 py-5 font-bold text-slate-600">
                            {s.cccdNumber || s.CccdNumber || "—"}
                          </td>

                          {/* Cột ID Card */}
                          <td className="px-4 py-5">
                            <div className="flex justify-center">
                              {s.idCardImageUrl ||
                              s.IdCardImageUrl ||
                              s.idCardImage ||
                              s.idCardUrl ? (
                                <button
                                  onClick={() =>
                                    handleViewImage(
                                      s.idCardImageUrl ||
                                        s.IdCardImageUrl ||
                                        s.idCardImage ||
                                        s.idCardUrl,
                                      "ID Card (CCCD)",
                                    )
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-orange-600 hover:border-orange-600 transition-all shadow-sm"
                                >
                                  <Eye size={14} /> View
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-xs">
                                  No image
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cột Student Card */}
                          <td className="px-4 py-5">
                            <div className="flex justify-center">
                              {s.studentCardImageUrl ||
                              s.StudentCardImageUrl ||
                              s.studentCardImage ||
                              s.studentCardUrl ? (
                                <button
                                  onClick={() =>
                                    handleViewImage(
                                      s.studentCardImageUrl ||
                                        s.StudentCardImageUrl ||
                                        s.studentCardImage ||
                                        s.studentCardUrl,
                                      "Student Card",
                                    )
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-orange-600 hover:border-orange-600 transition-all shadow-sm"
                                >
                                  <Eye size={14} /> View
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-xs">
                                  No image
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleApproveStudent(studentKey(s), true)
                                }
                                className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs transition-colors"
                              >
                                <CheckCircle size={14} strokeWidth={2.5} />{" "}
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveStudent(studentKey(s), false)
                                }
                                className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 font-bold text-xs transition-colors"
                              >
                                <XCircle size={14} strokeWidth={2.5} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-20 text-slate-400 font-medium text-base"
                          >
                            <CheckCircle
                              size={48}
                              className="mx-auto mb-4 text-emerald-100"
                              strokeWidth={1.5}
                            />
                            No accounts currently pending approval.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE PLAYERS */}
            {activeTab === "players" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search by name, email, phone, university..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <button
                    onClick={fetchAllPlayers}
                    disabled={isLoadingPlayers}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-all"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoadingPlayers ? "animate-spin" : ""}
                    />
                    Reload
                  </button>
                </div>

                <div className="border border-slate-100 rounded-[1.5rem] overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm min-w-[1200px]">
                    <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-5">Full Name</th>
                        <th className="px-6 py-5">Email & Phone</th>
                        <th className="px-6 py-5">University Name</th>
                        <th className="px-6 py-5">CCCD Number</th>
                        <th className="px-4 py-5 text-center">Documents</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPlayers.map((p) => {
                        const banned = isPlayerBanned(p);
                        const idCardUrl =
                          p.idCardImageUrl ||
                          p.IdCardImageUrl ||
                          p.idCardImage ||
                          p.idCardUrl;
                        const studentCardUrl =
                          p.studentCardImageUrl ||
                          p.StudentCardImageUrl ||
                          p.studentCardImage ||
                          p.studentCardUrl;

                        return (
                          <tr
                            key={studentKey(p)}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-5 font-extrabold text-[#ea580c]">
                              {playerName(p)}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">
                                  {p.email || "—"}
                                </span>
                                <span className="font-bold text-slate-400 text-xs">
                                  {p.phone || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-medium text-slate-500">
                              {p.universityName || "—"}
                            </td>
                            <td className="px-6 py-5 font-bold text-slate-600">
                              {p.cccdNumber || p.CccdNumber || "—"}
                            </td>
                            <td className="px-4 py-5">
                              <div className="flex justify-center gap-2">
                                {idCardUrl ? (
                                  <button
                                    onClick={() =>
                                      handleViewImage(
                                        idCardUrl,
                                        "ID Card (CCCD)",
                                      )
                                    }
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-orange-600 hover:border-orange-600 transition-all shadow-sm"
                                  >
                                    <Eye size={14} /> CCCD
                                  </button>
                                ) : null}
                                {studentCardUrl ? (
                                  <button
                                    onClick={() =>
                                      handleViewImage(
                                        studentCardUrl,
                                        "Student Card",
                                      )
                                    }
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-orange-600 hover:border-orange-600 transition-all shadow-sm"
                                  >
                                    <Eye size={14} /> Student
                                  </button>
                                ) : null}
                                {!idCardUrl && !studentCardUrl && (
                                  <span className="text-slate-400 italic text-xs">
                                    No image
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {banned ? (
                                <span className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-100 font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                                  <Ban size={12} strokeWidth={2.5} /> Banned
                                </span>
                              ) : (
                                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                                  <CheckCircle size={12} strokeWidth={2.5} />{" "}
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                {banned ? (
                                  <button
                                    onClick={() => handleUnbanPlayer(p)}
                                    className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs transition-colors"
                                  >
                                    <RotateCcw size={14} strokeWidth={2.5} />{" "}
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBanPlayer(p)}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 font-bold text-xs transition-colors"
                                  >
                                    <Ban size={14} strokeWidth={2.5} /> Ban
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPlayers.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-20 text-slate-400 font-medium text-base"
                          >
                            <Users
                              size={48}
                              className="mx-auto mb-4 text-slate-100"
                              strokeWidth={1.5}
                            />
                            {isLoadingPlayers
                              ? "Loading players..."
                              : players.length === 0
                                ? "No approved players yet."
                                : "No player matches your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CREATE TEACHER */}
            {activeTab === "provide" && (
              <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={newTeacher.fullName}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="e.g., Nguyen Van A"
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#ea580c] placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Login Email
                      </label>
                      <input
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            email: e.target.value,
                          })
                        }
                        placeholder="e.g., teacher@fpt.edu.vn"
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#ea580c] placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={newTeacher.phone}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            phone: e.target.value,
                          })
                        }
                        placeholder="e.g., 0987654321"
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#ea580c] placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Password
                      </label>
                      <input
                        type="text"
                        value={newTeacher.password}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            password: e.target.value,
                          })
                        }
                        placeholder="Enter secure password"
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-extrabold text-orange-600 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Organization / Dept
                      </label>
                      <input
                        type="text"
                        value={newTeacher.address}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            address: e.target.value,
                          })
                        }
                        placeholder="e.g., Software Engineering Dept."
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#ea580c] placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Account Type
                      </label>
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl h-[52px]">
                        <button
                          type="button"
                          onClick={() =>
                            setNewTeacher({ ...newTeacher, isGuest: false })
                          }
                          className={`flex-1 text-sm font-extrabold rounded-xl transition-all ${!newTeacher.isGuest ? "bg-white shadow-sm text-[#ea580c]" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          Internal
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewTeacher({ ...newTeacher, isGuest: true })
                          }
                          className={`flex-1 text-sm font-extrabold rounded-xl transition-all ${newTeacher.isGuest ? "bg-white shadow-sm text-orange-600" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          Guest
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-slate-100 pt-8">
                    <button
                      type="button"
                      onClick={handleCreateTeacher}
                      className="px-8 py-3.5 bg-orange-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-orange-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} strokeWidth={2.5} /> Create Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
