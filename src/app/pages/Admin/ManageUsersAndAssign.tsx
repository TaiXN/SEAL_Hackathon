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

// Hàm hỗ trợ dò tìm ID bất chấp BE đổi tên biến
const extractId = (obj: any): string => {
  return (
    obj.id ||
    obj.Id ||
    obj.trackId ||
    obj.trackID ||
    obj.teacherId ||
    obj.teacherID ||
    obj.mentorId ||
    obj.judgeId ||
    ""
  );
};

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
      setStudents([
        {
          id: "SV01",
          fullName: "Nguyễn Văn A",
          studentCode: "SE160001",
          email: "anv@fpt.edu.vn",
        },
        {
          id: "SV02",
          fullName: "Trần Thị B",
          studentCode: "SE160002",
          email: "btt@fpt.edu.vn",
        },
      ]);
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
        title: "Thành công!",
        showConfirmButton: false,
        timer: 1000,
      });
      fetchPendingStudents();
    } catch (error) {
      Swal.fire(
        "Thành công",
        "Đã xử lý (Mock UI). Nhớ đổi API thật!",
        "success",
      );
      setStudents(students.filter((s) => s.id !== studentId));
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
      const res: any = await apiClient.post("/api/Teacher", newTeacher);
      const createdId =
        extractId(res.data) || (typeof res.data === "string" ? res.data : null);

      if (createdId) {
        Swal.fire({
          icon: "success",
          title: "Tạo thành công!",
          text: "Chuyển sang trang Phân công!",
        }).then(() => {
          setAssignForm({ ...assignForm, teacherID: createdId });
          setActiveTab("assign");
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Tạo thành công!",
          text: "Qua Tab Phân công để chọn tên Teacher nha.",
        });
      }
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
  // TAB 3: PHÂN CÔNG (SỬ DỤNG MENTOR & JUDGE API)
  // ==========================================
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackIdToManage, setTrackIdToManage] = useState("");

  const [allTeachers, setAllTeachers] = useState<any[]>([]); // Chứa list Teacher để làm Dropdown
  const [assignedList, setAssignedList] = useState<any[]>([]); // Chứa cả Mentor và Judge

  const [assignForm, setAssignForm] = useState({
    teacherID: "",
    isMentor: true,
  });
  const [activeEventName, setActiveEventName] = useState("");

  // Lấy dữ liệu Sự kiện & Danh sách TOÀN BỘ Teacher khi mở Tab 3
  useEffect(() => {
    if (activeTab === "assign") {
      (async () => {
        // 1. Lấy Sự kiện & Track
        const events = getList(await eventApi.getAllEvents()).filter(
          (e: any) => e.currentRound !== undefined && e.currentRound < 2,
        );
        if (events.length > 0) {
          const activeEvent = events[events.length - 1];
          setActiveEventName(activeEvent.name || "Sự kiện hiện tại");
          setTracks(
            getList(await trackTopicApi.getAllTracks()).filter(
              (t: any) =>
                String(t.eventId || t.eventID) === String(activeEvent.id),
            ),
          );
        } else {
          setActiveEventName("Không có sự kiện đang diễn ra");
        }

        // 2. Lấy TOÀN BỘ Teacher để làm Dropdown
        try {
          const resTeachers = await apiClient.get("/api/Teacher"); // Đổi đúng endpoint get all teacher của BE nha
          setAllTeachers(getList(resTeachers.data));
        } catch (e) {
          console.warn("Lỗi lấy danh sách Teacher", e);
        }
      })();
    }
  }, [activeTab]);

  // Lấy danh sách Mentor và Judge của Track đang chọn
  const fetchAssignedPersonnel = async () => {
    if (!trackIdToManage) {
      setAssignedList([]);
      return;
    }

    try {
      // Gọi song song 2 API GET Mentor và GET Judge
      const [mentorsRes, judgesRes] = await Promise.all([
        apiClient
          .get(`/api/Mentor/track/${trackIdToManage}`)
          .catch(() => ({ data: [] })),
        apiClient
          .get(`/api/Judge/track/${trackIdToManage}`)
          .catch(() => ({ data: [] })),
      ]);

      // Đồng bộ format data để hiển thị chung 1 bảng
      const mentors = getList(mentorsRes.data).map((m) => ({
        id: extractId(m),
        name: m.fullName || m.name || m.mentorName || "Mentor ẩn danh",
        isMentor: true,
      }));
      const judges = getList(judgesRes.data).map((j) => ({
        id: extractId(j),
        name: j.fullName || j.name || j.judgeName || "Judge ẩn danh",
        isMentor: false,
      }));

      setAssignedList([...mentors, ...judges]);
    } catch (error) {
      setAssignedList([]);
    }
  };

  useEffect(() => {
    fetchAssignedPersonnel();
  }, [trackIdToManage]);

  // HÀM PHÂN CÔNG (POST MENTOR / JUDGE)
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

      Swal.fire("Thành công!", "Đã gán nhân sự vào Track.", "success");
      setAssignForm({ ...assignForm, teacherID: "" });
      fetchAssignedPersonnel(); // Gọi hàm load lại bảng
    } catch (error: any) {
      Swal.fire(
        "Thất bại",
        error.response?.data ||
          "Lỗi phân công (Có thể nhân sự này đã tồn tại)!",
        "error",
      );
    }
  };

  // HÀM XÓA PHÂN CÔNG (DELETE MENTOR / JUDGE)
  const handleRemoveTeacher = async (teacherId: string, isMentor: boolean) => {
    const result = await Swal.fire({
      title: "Gỡ nhân sự này khỏi Track?",
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
          title: "Đã gỡ thành công",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchAssignedPersonnel(); // Gọi hàm load lại bảng
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa phân công!", "error");
      }
    }
  };

  // Lọc ra danh sách Teacher CHƯA được phân công vào Track này để hiện trong Dropdown
  const availableTeachers = allTeachers.filter(
    (t) => !assignedList.some((a) => String(a.id) === String(extractId(t))),
  );

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
              <div className="relative w-80">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm tên hoặc MSSV..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400"
                />
              </div>
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
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{s.fullName}</td>
                      <td className="px-6 py-4 font-mono">{s.studentCode}</td>
                      <td className="px-6 py-4 text-slate-500">{s.email}</td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveStudent(s.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs"
                        >
                          <CheckCircle size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() => handleApproveStudent(s.id, false)}
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  KHỞI TẠO TÀI KHOẢN
                </h3>
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

          {/* TAB 3: PHÂN CÔNG MENTOR/JUDGE */}
          {activeTab === "assign" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  1. CHỌN HẠNG MỤC (TRACK) ĐỂ QUẢN LÝ
                </h3>
                <div className="relative">
                  <select
                    value={trackIdToManage}
                    onChange={(e) => setTrackIdToManage(e.target.value)}
                    disabled={tracks.length === 0}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer appearance-none"
                  >
                    <option value="" disabled>
                      {tracks.length === 0
                        ? `-- Không có sự kiện đang diễn ra --`
                        : `-- Chọn Track của sự kiện: ${activeEventName} --`}
                    </option>
                    {tracks.map((t: any) => (
                      <option key={extractId(t)} value={extractId(t)}>
                        {t.trackName || t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-4 text-slate-400 pointer-events-none"
                    size={18}
                  />
                </div>
              </div>

              <div
                className={`transition-all duration-300 ${!trackIdToManage ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    2. PHÂN CÔNG NHÂN SỰ VÀO TRACK
                  </h3>
                  <div className="flex gap-4 items-end">
                    {/* ĐÃ ĐỔI INPUT THÀNH DROPDOWN CHỌN TÊN TEACHER */}
                    <div className="flex-1 space-y-2 relative">
                      <label className="text-[11px] font-bold text-slate-500">
                        Chọn Tài khoản Teacher
                      </label>
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
                          -- Chọn tài khoản chưa phân công --
                        </option>
                        {availableTeachers.map((t: any) => (
                          <option key={extractId(t)} value={extractId(t)}>
                            {t.fullName || t.name || t.email}
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
                        <th className="px-6 py-4 font-mono font-normal opacity-50">
                          Mã ID
                        </th>
                        <th className="px-6 py-4 text-center">Vai trò</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {assignedList.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            {item.id}
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
                            {/* BỎ NÚT CHUYỂN ĐỔI VAI TRÒ ĐỂ DÙNG THAO TÁC XÓA SẠCH VÀ POST LẠI */}
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
                            colSpan={4}
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
