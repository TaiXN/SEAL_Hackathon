import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Briefcase,
  ShieldAlert,
  Trash2,
  ChevronDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Link as LinkIcon,
  FileText,
  CheckSquare,
  Activity,
  Globe,
  Ban,
  Unlock,
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
  // TAB 1: PHÊ DUYỆT SINH VIÊN
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
        "Failed",
        error?.response?.data?.message || "Processing error!",
        "error",
      );
    }
  };

  // ==========================================
  // TAB 2: CẤP TÀI KHOẢN TEACHER
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
      return Swal.fire("Error", "Please fill in all required fields!", "error");
    try {
      Swal.fire({
        title: "Creating account...",
        didOpen: () => Swal.showLoading(),
      });

      await apiClient.post("/api/Teacher", newTeacher);

      Swal.fire({
        icon: "success",
        title: "Created successfully!",
        html: "Redirecting to the Assignment tab.<br/><i>Note: If you switch to the Assignment tab and do not see the name, click <b>Reload list</b> to sync with the Server!</i>",
      }).then(() => {
        setActiveTab("assign");
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
      Swal.fire(
        "Error",
        error.response?.data || "Account creation failed!",
        "error",
      );
    }
  };

  // ==========================================
  // TAB 3: PHÂN CÔNG MENTOR/JUDGE
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
      console.error("Lỗi GET /api/Teacher/available:", e);
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
        name: j.teacherName || j.name || "Giám khảo",
        isMentor: false,
      }));

      const mentors = getList(mentorsRes.data).map((m: any) => ({
        id: m.teacherId || m.mentorId || m.id,
        name: m.teacherName || m.name || "Mentor",
        isMentor: true,
      }));

      setAssignedTeachers([...judges, ...mentors]);
    } catch (error) {
      console.error("Lỗi lấy danh sách đã phân công:", error);
    }
  };

  useEffect(() => {
    loadAssignedTeachers(trackIdToManage);
  }, [trackIdToManage]);

  const handleAssignTeacher = async () => {
    if (!assignForm.teacherId || !trackIdToManage)
      return Swal.fire(
        "Error",
        "Please select a Track and a Person!",
        "warning",
      );

    try {
      Swal.fire({
        title: "Assigning...",
        didOpen: () => Swal.showLoading(),
      });

      const cleanId = String(assignForm.teacherId).trim();

      const endpoint = assignForm.isMentor
        ? `/api/Mentor/track/${trackIdToManage}/teacher/${cleanId}`
        : `/api/Judge/track/${trackIdToManage}/teacher/${cleanId}`;

      await apiClient.post(endpoint);
      Swal.fire("Success!", "Personnel assigned.", "success");
      setAssignForm({ ...assignForm, teacherId: "" });

      loadAllTeachers();
      loadAssignedTeachers(trackIdToManage);
    } catch (error: any) {
      Swal.fire("Failed", error.response?.data || "Assignment error!", "error");
    }
  };

  const handleRemoveTeacher = async (teacherId: string, isMentor: boolean) => {
    const result = await Swal.fire({
      title: "Remove personnel?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
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
        Swal.fire("Error", "Cannot remove!", "error");
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
        {
          id: t.teacherId,
          name: t.teacherName || t.fullName || "New Account",
        },
      ]),
    ).values(),
  );

  const availableTeachers = uniqueTeachersForDropdown.filter((t) => {
    const isAlreadyAssigned = assignedTeachers.some(
      (a) => String(a.id) === String(t.id),
    );
    return !isAlreadyAssigned;
  });

  const assignedList = assignedTeachers;

  // ==========================================
  // TAB 4: DUYỆT BÀI NỘP CỦA TEAM (REFACTORED)
  // ==========================================
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [teamInRounds, setTeamInRounds] = useState<any[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  // Lấy danh sách Vòng thi (Rounds) khi vào tab
  useEffect(() => {
    if (activeTab === "submissions") {
      apiClient
        .get("/api/Round")
        .then((res) => setRounds(getList(res.data)))
        .catch((err) => console.error("Lỗi lấy danh sách Vòng thi", err));
    }
  }, [activeTab]);

  // Lấy danh sách đội trong vòng thi khi chọn Round
  const fetchTeamsInRound = async (roundId: string) => {
    if (!roundId) {
      setTeamInRounds([]);
      return;
    }
    try {
      setIsLoadingSubs(true);
      // Gọi đúng API Backend đã chuẩn bị
      const res = await apiClient.get(
        `/api/TeamInRound/details/round/${roundId}`,
      );
      setTeamInRounds(getList(res.data));
    } catch (error) {
      console.error("Lỗi lấy chi tiết đội trong vòng thi:", error);
      setTeamInRounds([]);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  useEffect(() => {
    fetchTeamsInRound(selectedRoundId);
  }, [selectedRoundId]);

  // Hàm xử lý hành động (Approve, Ban, Unban)
  const handleTeamAction = async (
    teamInRoundId: string,
    action: "approve" | "ban" | "unban",
  ) => {
    const actionMap = {
      approve: { text: "Duyệt bài", icon: "success" },
      ban: { text: "Cấm đội", icon: "warning" },
      unban: { text: "Gỡ cấm", icon: "success" },
    };
    const currentAction = actionMap[action];

    try {
      Swal.fire({
        title: `Đang ${currentAction.text}...`,
        didOpen: () => Swal.showLoading(),
      });

      // Gọi API tương ứng với hành động
      await apiClient.put(`/api/TeamInRound/${action}/${teamInRoundId}`);

      Swal.fire({
        icon: currentAction.icon as any,
        title: `Đã ${currentAction.text}!`,
        showConfirmButton: false,
        timer: 1500,
      });
      // Tải lại danh sách
      fetchTeamsInRound(selectedRoundId);
    } catch (error: any) {
      Swal.fire(
        "Lỗi",
        error?.response?.data?.title ||
          error?.response?.data ||
          `Không thể thực hiện hành động này!`,
        "error",
      );
    }
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Users & Assignments
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-slate-100 px-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("approve")}
            className={`whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "approve" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Approve Students
          </button>
          <button
            onClick={() => setActiveTab("provide")}
            className={`whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "provide" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Create Teacher Account
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "assign" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Assign Mentor/Judge
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PHÊ DUYỆT */}
          {/* TAB 1: APPROVAL */}
          {activeTab === "approve" && (
            <div className="space-y-6 animate-in fade-in">
              <table className="w-full text-left text-sm border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">School/Organization</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={studentKey(s)} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">
                        {s.fullName || s.name || s.studentName || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {s.phone || s.phone || s.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {s.email || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {s.address || s.address || s.address || "—"}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() =>
                            handleApproveStudent(studentKey(s), true)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleApproveStudent(studentKey(s), false)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-slate-400"
                      >
                        No accounts waiting for approval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: CREATE ACCOUNT */}
          {activeTab === "provide" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Login Email
                    </label>
                    <input
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Organization / Department
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Account Type (isGuest)
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl h-[42px]">
                      <button
                        type="button"
                        onClick={() =>
                          setNewTeacher({ ...newTeacher, isGuest: false })
                        }
                        className={`flex-1 text-xs font-bold rounded-lg ${!newTeacher.isGuest ? "bg-white shadow" : "text-slate-500"}`}
                      >
                        Internal
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewTeacher({ ...newTeacher, isGuest: true })
                        }
                        className={`flex-1 text-xs font-bold rounded-lg ${newTeacher.isGuest ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
                      >
                        Guest
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    onClick={handleCreateTeacher}
                    className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Plus size={16} /> Create Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENT */}
          {activeTab === "assign" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  1. SELECT EVENT FOR ASSIGNMENT
                </h3>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">
                    {ongoingEvents.length === 0
                      ? "-- No events available --"
                      : "-- Select event --"}
                  </option>
                  {ongoingEvents.map((ev: any) => (
                    <option
                      key={ev.id || ev.eventId}
                      value={ev.id || ev.eventId}
                    >
                      {(ev.name || ev.eventName) ?? "Event"}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`transition-all duration-300 ${!selectedEventId ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    2. SELECT TRACK
                  </h3>
                  <select
                    value={trackIdToManage}
                    onChange={(e) => setTrackIdToManage(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {!selectedEventId
                        ? "-- Please select an event first --"
                        : tracks.length === 0
                          ? `-- No tracks available --`
                          : `-- Select Track --`}
                    </option>
                    {tracks.map((t: any) => (
                      <option key={t.id || t.trackId} value={t.id || t.trackId}>
                        {t.trackName || t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className={`transition-all duration-300 ${!trackIdToManage ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    3. ASSIGN PERSONNEL TO TRACK
                  </h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-500">
                          Select Teacher Account
                        </label>
                        <button
                          onClick={loadAllTeachers}
                          disabled={isRefreshing}
                          className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:text-blue-800 transition-colors"
                        >
                          <RefreshCw
                            size={12}
                            className={isRefreshing ? "animate-spin" : ""}
                          />{" "}
                          Reload list
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer appearance-none"
                      >
                        <option value="" disabled>
                          -- Select an unassigned account --
                        </option>
                        {availableTeachers.map((t: any) => (
                          <option key={`opt-${t.id}`} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-[38px] text-slate-400 pointer-events-none"
                        size={16}
                      />
                    </div>

                    <div className="w-1/3 space-y-2">
                      <label className="text-[11px] font-bold text-slate-500">
                        Role
                      </label>
                      <div className="flex bg-slate-100 p-1 rounded-xl h-[46px]">
                        <button
                          type="button"
                          onClick={() =>
                            setAssignForm({ ...assignForm, isMentor: true })
                          }
                          className={`flex-1 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${assignForm.isMentor ? "bg-white shadow text-emerald-600" : "text-slate-500"}`}
                        >
                          <Briefcase size={16} /> Mentor
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignForm({ ...assignForm, isMentor: false })
                          }
                          className={`flex-1 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${!assignForm.isMentor ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
                        >
                          <ShieldAlert size={16} /> Judge
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAssignTeacher}
                      className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-800 h-[46px] mb-0.5"
                    >
                      Assign Role
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4">
                    Currently Assigned Personnel
                  </h3>
                  <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-4">Personnel Name</th>
                        <th className="px-6 py-4">Event</th>
                        <th className="px-6 py-4">Track</th>
                        <th className="px-6 py-4 text-center">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {assignedList.map((item: any, idx: number) => (
                        <tr
                          key={`assigned-${item.id}-${idx}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {activeEventName}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {selectedTrackName}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.isMentor ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-xs rounded-full inline-flex items-center gap-1">
                                <Briefcase size={12} /> Mentor
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 font-bold text-xs rounded-full inline-flex items-center gap-1">
                                <ShieldAlert size={12} /> Judge
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleRemoveTeacher(item.id, item.isMentor)
                              }
                              className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {assignedList.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-12 text-center text-slate-500 font-medium"
                          >
                            No one has been assigned yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
