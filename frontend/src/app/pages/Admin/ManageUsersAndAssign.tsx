import { useState, useEffect } from "react";
import {
  Plus,
  Briefcase,
  ShieldAlert,
  Trash2,
  ChevronDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  UserPlus,
  UserCog,
} from "lucide-react";
import Swal from "sweetalert2";

import apiClient from "../../lib/api/apiClient";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { eventApi } from "../../lib/api/eventApi";

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
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Processing error!",
        "error",
      );
    }
  };

  // ==========================================
  // TAB 2: CREATE TEACHER
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
        html: "Redirecting to Assignment tab...",
        confirmButtonColor: "#0a192f",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-8 py-3",
        },
      }).then(() => setActiveTab("assign"));

      setNewTeacher({
        email: "",
        password: "",
        fullName: "",
        address: "",
        phone: "",
        isGuest: false,
      });
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data || "Account creation failed!",
        "error",
      );
    }
  };

  // ==========================================
  // TAB 3: ASSIGN PERSONNEL
  // ==========================================
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackIdToManage, setTrackIdToManage] = useState("");
  const [ongoingEvents, setOngoingEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teacherId: "",
    isMentor: true,
  });

  const loadAllTeachers = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get(`/api/Teacher/available?t=${Date.now()}`);
      setRawTeachers(getList(res.data));
    } catch (e: any) {
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assign") {
      (async () => {
        try {
          const evs = getList(await eventApi.getAllEvents());
          evs.sort(
            (a: any, b: any) => Number(b.year || 0) - Number(a.year || 0),
          );
          setOngoingEvents(evs);
        } catch (e) {}
        await loadAllTeachers();
      })();
    }
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      setTrackIdToManage("");
      if (!selectedEventId) {
        setTracks([]);
        return;
      }
      try {
        const allTracks = getList(await trackTopicApi.getAllTracks());
        setTracks(
          allTracks.filter(
            (t: any) =>
              String(t.eventId || t.eventID) === String(selectedEventId),
          ),
        );
      } catch (e) {
        setTracks([]);
      }
    })();
  }, [selectedEventId]);

  const [assignedTeachers, setAssignedTeachers] = useState<any[]>([]);

  const loadAssignedTeachers = async (trackId: string) => {
    if (!trackId) {
      setAssignedTeachers([]);
      return;
    }
    try {
      const [judgesRes, mentorsRes] = await Promise.all([
        apiClient
          .get(`/api/Judge/track/${trackId}`)
          .catch(() => ({ data: [] })),
        apiClient
          .get(`/api/Mentor/track/${trackId}`)
          .catch(() => ({ data: [] })),
      ]);

      const judges = getList(judgesRes.data).map((j: any) => ({
        id: j.teacherId || j.judgeId || j.id,
        name:
          j.teacher?.fullName ||
          j.teacher?.name ||
          j.fullName ||
          j.teacherName ||
          j.name ||
          "Judge",
        isMentor: false,
      }));

      const mentors = getList(mentorsRes.data).map((m: any) => ({
        id: m.teacherId || m.mentorId || m.id,
        name:
          m.teacher?.fullName ||
          m.teacher?.name ||
          m.fullName ||
          m.teacherName ||
          m.name ||
          "Mentor",
        isMentor: true,
      }));
      setAssignedTeachers([...judges, ...mentors]);
    } catch (error) {}
  };

  useEffect(() => {
    loadAssignedTeachers(trackIdToManage);
  }, [trackIdToManage]);

  const handleAssignTeacher = async () => {
    if (!assignForm.teacherId || !trackIdToManage)
      return Swal.fire(
        "Required",
        "Please select a Track and a Personnel!",
        "warning",
      );
    try {
      Swal.fire({ title: "Assigning...", didOpen: () => Swal.showLoading() });
      const cleanId = String(assignForm.teacherId).trim();
      const endpoint = assignForm.isMentor
        ? `/api/Mentor/track/${trackIdToManage}/teacher/${cleanId}`
        : `/api/Judge/track/${trackIdToManage}/teacher/${cleanId}`;
      await apiClient.post(endpoint);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Personnel assigned.",
        timer: 1200,
        showConfirmButton: false,
      });
      setAssignForm({ ...assignForm, teacherId: "" });
      loadAllTeachers();
      loadAssignedTeachers(trackIdToManage);
    } catch (error: any) {
      Swal.fire("Error", error.response?.data || "Assignment failed!", "error");
    }
  };

  const handleRemoveTeacher = async (teacherId: string, isMentor: boolean) => {
    const result = await Swal.fire({
      title: "Remove Assignment?",
      text: "Are you sure you want to remove this personnel from the track?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Remove",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 bg-slate-100 text-slate-700",
      },
    });
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Removing...", didOpen: () => Swal.showLoading() });
        const endpoint = isMentor
          ? `/api/Mentor/track/${trackIdToManage}/teacher/${teacherId}`
          : `/api/Judge/track/${trackIdToManage}/teacher/${teacherId}`;
        await apiClient.delete(endpoint);
        Swal.fire({
          icon: "success",
          title: "Removed",
          showConfirmButton: false,
          timer: 1000,
        });
        loadAllTeachers();
        loadAssignedTeachers(trackIdToManage);
      } catch (error) {
        Swal.fire("Error", "Cannot remove personnel!", "error");
      }
    }
  };

  const activeEventName =
    ongoingEvents.find(
      (e: any) => String(e.id || e.eventId) === String(selectedEventId),
    )?.name || "—";
  const selectedTrackName =
    tracks.find(
      (t: any) => String(t.id || t.trackId) === String(trackIdToManage),
    )?.trackName || "—";

  const uniqueTeachersForDropdown = Array.from(
    new Map(
      rawTeachers.map((t) => [
        String(t.teacherId),
        { id: t.teacherId, name: t.teacherName || t.fullName || "New Account" },
      ]),
    ).values(),
  );

  const availableTeachers = uniqueTeachersForDropdown.filter((t) => {
    return !assignedTeachers.some((a) => String(a.id) === String(t.id));
  });

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight">
            Users & Assignments
          </h2>
          <p className="text-slate-500 font-medium text-base mt-2">
            Manage student approvals, internal accounts, and assign
            judges/mentors.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 pt-3">
            {[
              {
                id: "approve",
                label: "Approve Students",
                icon: <Users size={18} />,
              },
              {
                id: "provide",
                label: "Create Teacher Account",
                icon: <UserPlus size={18} />,
              },
              {
                id: "assign",
                label: "Assign Mentor / Judge",
                icon: <UserCog size={18} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-8 py-4 text-sm font-extrabold border-b-[3px] transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-[#0a192f] text-[#0a192f] bg-white rounded-t-2xl shadow-sm"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-white rounded-t-2xl"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 flex-1 bg-white">
            {/* TAB 1: APPROVE STUDENTS */}
            {activeTab === "approve" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5">Full Name</th>
                        <th className="px-6 py-5">Phone Number</th>
                        <th className="px-6 py-5">Email Address</th>
                        <th className="px-6 py-5">University / Org</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map((s) => (
                        <tr
                          key={studentKey(s)}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-8 py-5 font-extrabold text-[#0a192f]">
                            {s.fullName || s.name || s.studentName || "—"}
                          </td>
                          <td className="px-6 py-5 font-bold text-slate-500">
                            {s.phone || "—"}
                          </td>
                          <td className="px-6 py-5 font-medium text-slate-500">
                            {s.email || "—"}
                          </td>
                          <td className="px-6 py-5 font-bold text-slate-500">
                            {s.address || "—"}
                          </td>
                          <td className="px-8 py-5 flex justify-end gap-3">
                            <button
                              onClick={() =>
                                handleApproveStudent(studentKey(s), true)
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs transition-colors"
                            >
                              <CheckCircle size={16} strokeWidth={2.5} />{" "}
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleApproveStudent(studentKey(s), false)
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 font-bold text-xs transition-colors"
                            >
                              <XCircle size={16} strokeWidth={2.5} /> Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
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

            {/* TAB 2: CREATE TEACHER */}
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-extrabold text-blue-600 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                        className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                          className={`flex-1 text-sm font-extrabold rounded-xl transition-all ${!newTeacher.isGuest ? "bg-white shadow-sm text-[#0a192f]" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          Internal
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewTeacher({ ...newTeacher, isGuest: true })
                          }
                          className={`flex-1 text-sm font-extrabold rounded-xl transition-all ${newTeacher.isGuest ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
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
                      className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} strokeWidth={2.5} /> Create Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ASSIGN PERSONNEL */}
            {activeTab === "assign" && (
              <div className="space-y-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                    <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
                        1
                      </div>
                      Select Target Event
                    </h3>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                    >
                      <option
                        value=""
                        disabled
                        style={{ padding: "10px", fontWeight: "600" }}
                      >
                        {ongoingEvents.length === 0
                          ? "-- No events available --"
                          : "-- Select Event --"}
                      </option>
                      {ongoingEvents.map((ev: any) => (
                        <option
                          key={ev.id || ev.eventId}
                          value={ev.id || ev.eventId}
                          style={{ padding: "10px", fontWeight: "600" }}
                        >
                          {(ev.name || ev.eventName) ?? "Event"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`transition-all duration-300 ${!selectedEventId ? "opacity-40 pointer-events-none grayscale" : ""}`}
                  >
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
                          2
                        </div>
                        Select Track
                      </h3>
                      <select
                        value={trackIdToManage}
                        onChange={(e) => setTrackIdToManage(e.target.value)}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                      >
                        <option
                          value=""
                          disabled
                          style={{ padding: "10px", fontWeight: "600" }}
                        >
                          {!selectedEventId
                            ? "-- Pending event selection --"
                            : tracks.length === 0
                              ? "-- No tracks --"
                              : "-- Select Track --"}
                        </option>
                        {tracks.map((t: any) => (
                          <option
                            key={t.id || t.trackId}
                            value={t.id || t.trackId}
                            style={{ padding: "10px", fontWeight: "600" }}
                          >
                            {t.trackName || t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className={`transition-all duration-500 ${!trackIdToManage ? "opacity-30 pointer-events-none" : ""}`}
                >
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                    <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">
                        3
                      </div>
                      Assign Personnel
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full space-y-2.5 relative">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Teacher Account
                          </label>
                          <button
                            onClick={loadAllTeachers}
                            disabled={isRefreshing}
                            className="text-[11px] text-blue-600 font-extrabold flex items-center gap-1.5 hover:text-blue-800 transition-colors"
                          >
                            <RefreshCw
                              size={12}
                              className={isRefreshing ? "animate-spin" : ""}
                            />{" "}
                            Reload
                          </button>
                        </div>
                        <select
                          value={assignForm.teacherId}
                          onChange={(e) =>
                            setAssignForm({
                              ...assignForm,
                              teacherId: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0a192f] outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer appearance-none transition-all"
                        >
                          <option
                            value=""
                            disabled
                            style={{ padding: "10px", fontWeight: "600" }}
                          >
                            -- Select an unassigned account --
                          </option>
                          {availableTeachers.map((t: any) => (
                            <option
                              key={`opt-${t.id}`}
                              value={t.id}
                              style={{ padding: "10px", fontWeight: "600" }}
                            >
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-5 top-[44px] text-slate-400 pointer-events-none"
                          size={16}
                        />
                      </div>

                      <div className="w-full md:w-1/3 space-y-2.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                          Role
                        </label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl h-[52px]">
                          <button
                            type="button"
                            onClick={() =>
                              setAssignForm({ ...assignForm, isMentor: true })
                            }
                            className={`flex-1 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${assignForm.isMentor ? "bg-white shadow-sm text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                          >
                            <Briefcase size={16} strokeWidth={2.5} /> Mentor
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAssignForm({ ...assignForm, isMentor: false })
                            }
                            className={`flex-1 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${!assignForm.isMentor ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                          >
                            <ShieldAlert size={16} strokeWidth={2.5} /> Judge
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAssignTeacher}
                        className="w-full md:w-auto px-8 py-3.5 bg-[#0a192f] text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 active:translate-y-0 transition-all h-[52px] mb-0.5"
                      >
                        Assign Role
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[#0a192f] mb-5 px-2">
                      Current Assignments
                    </h3>
                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm bg-white">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="px-8 py-5">Personnel Name</th>
                            <th className="px-6 py-5">Event</th>
                            <th className="px-6 py-5">Track</th>
                            <th className="px-6 py-5 text-center">Role</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {assignedTeachers.map((item: any, idx: number) => {
                            const matchedTeacher = rawTeachers.find(
                              (t: any) =>
                                String(t.teacherId || t.id) === String(item.id),
                            );
                            const realName =
                              matchedTeacher?.fullName ||
                              matchedTeacher?.teacherName ||
                              matchedTeacher?.name ||
                              item.name;

                            return (
                              <tr
                                key={`assigned-${item.id}-${idx}`}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-8 py-5 font-bold text-[#0a192f]">
                                  {realName}
                                </td>
                                <td className="px-6 py-5 font-medium text-slate-500">
                                  {activeEventName}
                                </td>
                                <td className="px-6 py-5 font-medium text-slate-500">
                                  {selectedTrackName}
                                </td>
                                <td className="px-6 py-5 text-center">
                                  {item.isMentor ? (
                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                                      <Briefcase size={12} strokeWidth={2.5} />{" "}
                                      Mentor
                                    </span>
                                  ) : (
                                    <span className="px-3.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                                      <ShieldAlert
                                        size={12}
                                        strokeWidth={2.5}
                                      />{" "}
                                      Judge
                                    </span>
                                  )}
                                </td>
                                <td className="px-8 py-5 flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      handleRemoveTeacher(
                                        item.id,
                                        item.isMentor,
                                      )
                                    }
                                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {assignedTeachers.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-16 text-center text-slate-400 font-medium text-base"
                              >
                                No personnel assigned to this track yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
