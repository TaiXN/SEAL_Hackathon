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
        title: isApprove ? "Đang duyệt..." : "Đang từ chối...",
        didOpen: () => Swal.showLoading(),
      });
      if (isApprove) await apiClient.put(`/api/Player/${studentId}/approve`);
      else await apiClient.delete(`/api/Player/${studentId}/reject`);

      Swal.fire({
        icon: "success",
        title: isApprove ? "Đã duyệt!" : "Đã từ chối!",
        showConfirmButton: false,
        timer: 1200,
      });
      fetchPendingStudents();
    } catch (error: any) {
      Swal.fire(
        "Thất bại",
        error?.response?.data?.message || "Lỗi xử lý!",
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
      return Swal.fire("Lỗi", "Vui lòng nhập đủ thông tin!", "error");
    try {
      Swal.fire({
        title: "Đang tạo tài khoản...",
        didOpen: () => Swal.showLoading(),
      });

      await apiClient.post("/api/Teacher", newTeacher);

      Swal.fire({
        icon: "success",
        title: "Tạo thành công!",
        html: "Chuyển sang trang Phân công.<br/><i>Lưu ý: Nếu qua Tab Phân công chưa thấy tên, hãy bấm nút <b>Tải lại danh sách</b> để đồng bộ với Server!</i>",
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
        "Lỗi",
        error.response?.data || "Tạo tài khoản thất bại!",
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

  // Nắm giữ dữ liệu gốc từ API
  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teacherID: "",
    isMentor: true,
  });

  // NẠP DỮ LIỆU CHUẨN TỪ BE (Tránh lặp code)
  const loadAllTeachers = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get(`/api/Teacher?t=${Date.now()}`);
      setRawTeachers(getList(res.data)); // Lưu lại đúng y xì cấu trúc JSON của Backend
    } catch (e: any) {
      console.error("Lỗi GET /api/Teacher:", e);
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

  // HÀM XỬ LÝ PHÂN CÔNG (GÁN / XÓA)
  const handleAssignTeacher = async () => {
    if (!assignForm.teacherID || !trackIdToManage)
      return Swal.fire(
        "Lỗi",
        "Vui lòng chọn Track và chọn Nhân sự!",
        "warning",
      );
    try {
      Swal.fire({
        title: "Đang phân công...",
        didOpen: () => Swal.showLoading(),
      });
      const endpoint = assignForm.isMentor
        ? `/api/Mentor/track/${trackIdToManage}/mentor/${assignForm.teacherID}`
        : `/api/Judge/track/${trackIdToManage}/judge/${assignForm.teacherID}`;

      await apiClient.post(endpoint);
      Swal.fire("Thành công!", "Đã gán nhân sự.", "success");
      setAssignForm({ ...assignForm, teacherID: "" });
      loadAllTeachers();
    } catch (error: any) {
      Swal.fire("Thất bại", error.response?.data || "Lỗi phân công!", "error");
    }
  };

  const handleRemoveTeacher = async (teacherId: string, isMentor: boolean) => {
    const result = await Swal.fire({
      title: "Gỡ nhân sự?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
    });
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Đang xóa...", didOpen: () => Swal.showLoading() });
        const endpoint = isMentor
          ? `/api/Mentor/track/${trackIdToManage}/mentor/${teacherId}`
          : `/api/Judge/track/${trackIdToManage}/judge/${teacherId}`;

        await apiClient.delete(endpoint);
        Swal.fire({
          icon: "success",
          title: "Đã gỡ",
          showConfirmButton: false,
          timer: 1000,
        });
        loadAllTeachers();
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa!", "error");
      }
    }
  };

  // ==========================================
  // XỬ LÝ LOGIC DỮ LIỆU ĐỂ HIỂN THỊ (DROPDOWN & BẢNG)
  // ==========================================

  // 1. Tên hiển thị của bảng
  const activeEventName =
    ongoingEvents.find(
      (e: any) => String(e.id || e.eventId) === String(selectedEventId),
    )?.name || "—";
  const selectedTrackName =
    tracks.find(
      (t: any) => String(t.id || t.trackId) === String(trackIdToManage),
    )?.trackName || "—";

  // 2. KHỬ TRÙNG LẶP CHO DROPDOWN (Bóp chết lỗi màu đỏ của React)
  const uniqueTeachersForDropdown = Array.from(
    new Map(
      rawTeachers.map((t) => [
        String(t.teacherId),
        {
          id: t.teacherId,
          name: t.teacherName || t.fullName || "Tài khoản mới",
        },
      ]),
    ).values(),
  );

  // 3. LỌC ĐIỀU KIỆN MENTOR/JUDGE: Hễ có mặt trong Track này rồi là bị xóa khỏi Dropdown
  const availableTeachers = uniqueTeachersForDropdown.filter((t) => {
    const hasAnyRoleInThisTrack = rawTeachers.some(
      (r) =>
        String(r.teacherId) === String(t.id) &&
        String(r.trackId) === String(trackIdToManage),
    );
    return !hasAnyRoleInThisTrack;
  });

  // 4. DANH SÁCH CHO BẢNG: Chỉ lấy những record có `trackId` khớp với Track đang chọn
  const assignedList = rawTeachers
    .filter((r) => String(r.trackId) === String(trackIdToManage))
    .map((r) => ({
      id: r.teacherId,
      name: r.teacherName || r.fullName || "Tài khoản mới",
      isMentor: r.isMentor,
    }));

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Người dùng & Phân công
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-slate-100 px-2">
          <button
            onClick={() => setActiveTab("approve")}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "approve" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Phê duyệt sinh viên
          </button>
          <button
            onClick={() => setActiveTab("provide")}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "provide" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Cấp tài khoản Teacher
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "assign" ? "border-black text-black" : "border-transparent text-slate-400"}`}
          >
            Phân công Mentor/Judge
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PHÊ DUYỆT */}
          {activeTab === "approve" && (
            <div className="space-y-6 animate-in fade-in">
              <table className="w-full text-left text-sm border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Họ tên</th>
                    <th className="px-6 py-4">MSSV</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={studentKey(s)} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">
                        {s.fullName || s.name || s.studentName || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {s.studentCode || s.studentId || s.code || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {s.email || "—"}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() =>
                            handleApproveStudent(studentKey(s), true)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs"
                        >
                          <CheckCircle size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() =>
                            handleApproveStudent(studentKey(s), false)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs"
                        >
                          <XCircle size={14} /> Từ chối
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
                        Không có tài khoản nào đang chờ duyệt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: CẤP TÀI KHOẢN */}
          {activeTab === "provide" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Họ và tên
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
                      Email truy cập
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
                      Số điện thoại
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
                      Mật khẩu
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
                      Đơn vị công tác
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
                      Loại tài khoản (isGuest)
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl h-[42px]">
                      <button
                        type="button"
                        onClick={() =>
                          setNewTeacher({ ...newTeacher, isGuest: false })
                        }
                        className={`flex-1 text-xs font-bold rounded-lg ${!newTeacher.isGuest ? "bg-white shadow" : "text-slate-500"}`}
                      >
                        Nội bộ
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewTeacher({ ...newTeacher, isGuest: true })
                        }
                        className={`flex-1 text-xs font-bold rounded-lg ${newTeacher.isGuest ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
                      >
                        Khách mời
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
                    <Plus size={16} /> Cấp tài khoản
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHÂN CÔNG */}
          {activeTab === "assign" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  1. CHỌN SỰ KIỆN ĐỂ PHÂN CÔNG
                </h3>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">
                    {ongoingEvents.length === 0
                      ? "-- Chưa có sự kiện --"
                      : "-- Chọn sự kiện --"}
                  </option>
                  {ongoingEvents.map((ev: any) => (
                    <option
                      key={ev.id || ev.eventId}
                      value={ev.id || ev.eventId}
                    >
                      {(ev.name || ev.eventName) ?? "Sự kiện"}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`transition-all duration-300 ${!selectedEventId ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    2. CHỌN HẠNG MỤC (TRACK)
                  </h3>
                  <select
                    value={trackIdToManage}
                    onChange={(e) => setTrackIdToManage(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {!selectedEventId
                        ? "-- Hãy chọn sự kiện trước --"
                        : tracks.length === 0
                          ? `-- Chưa có track --`
                          : `-- Chọn Track --`}
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
                    3. PHÂN CÔNG NHÂN SỰ VÀO TRACK
                  </h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-500">
                          Chọn Tài khoản Teacher
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
                          Tải lại danh sách
                        </button>
                      </div>
                      <select
                        value={assignForm.teacherID}
                        onChange={(e) =>
                          setAssignForm({
                            ...assignForm,
                            teacherID: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer appearance-none"
                      >
                        <option value="" disabled>
                          -- Chọn tài khoản chưa phân công vai trò nào --
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
                        Vai trò
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
                      Gán quyền
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4">
                    Danh sách Nhân sự đang phụ trách
                  </h3>
                  <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-4">Tên Nhân sự</th>
                        <th className="px-6 py-4">Sự kiện</th>
                        <th className="px-6 py-4">Hạng mục (Track)</th>
                        <th className="px-6 py-4 text-center">Vai trò</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
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
                            Chưa có ai được phân công.
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
