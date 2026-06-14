import { useState } from "react";
import { Search, Plus, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"students" | "judges">("students");

  // Dữ liệu Mock
  const [students, setStudents] = useState([
    { id: "1", name: "Nguyễn Văn An", type: "SV FPT", mssv: "SE173245" },
    { id: "2", name: "Trần Thị Bình", type: "SV Ngoài", mssv: "BK20210123" },
  ]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("Tất cả đối tượng");

  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.mssv.toLowerCase().includes(studentSearch.toLowerCase());
    const matchFilter =
      studentFilter === "Tất cả đối tượng" || student.type === studentFilter;
    return matchSearch && matchFilter;
  });

  const handleApprove = (id: string, name: string) => {
    Swal.fire({
      title: "Phê duyệt tài khoản?",
      text: `Bạn sẽ cấp quyền truy cập hệ thống cho sinh viên ${name}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Duyệt ngay",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        // DÀNH CHO BACKEND:
        // TODO: Gọi API POST/PUT /api/users/{id}/approve
        console.log("API Duyệt sinh viên ID:", id);

        setStudents((prev) => prev.filter((s) => s.id !== id));
        Swal.fire({
          icon: "success",
          title: "Đã duyệt!",
          text: `Tài khoản ${name} đã được kích hoạt.`,
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  const handleReject = (id: string, name: string) => {
    Swal.fire({
      title: "Từ chối tài khoản?",
      text: `Hủy yêu cầu đăng ký của sinh viên ${name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        // DÀNH CHO BACKEND:
        // TODO: Gọi API POST/PUT /api/users/{id}/reject
        console.log("API Từ chối sinh viên ID:", id);

        setStudents((prev) => prev.filter((s) => s.id !== id));
        Swal.fire({
          icon: "success",
          title: "Đã từ chối",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    });
  };

  const [judges, setJudges] = useState([
    {
      id: "1",
      name: "Dr. Alex Johnson",
      email: "alex.j@enterprise.com",
      phone: "0901234567",
      org: "FPT Software",
      task: "Vòng Chung Kết",
    },
  ]);
  const [newJudge, setNewJudge] = useState({
    name: "",
    email: "",
    phone: "",
    org: "",
    password: "",
    task: "Vòng Bảng (Prelim Round)",
  });

  const handleCreateJudge = () => {
    if (
      !newJudge.name ||
      !newJudge.email ||
      !newJudge.password ||
      !newJudge.phone
    ) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng điền đủ Tên, Email, SĐT và Mật khẩu!",
      });
      return;
    }

    // DÀNH CHO BACKEND:
    // TODO: Gọi API POST /api/judges để tạo tài khoản giám khảo
    console.log("API Tạo tài khoản Giám khảo:", newJudge);

    setJudges([{ id: Date.now().toString(), ...newJudge }, ...judges]);
    Swal.fire({
      icon: "success",
      title: "Tạo tài khoản thành công!",
      text: `Đã cấp quyền Giám khảo cho ${newJudge.name}.`,
      confirmButtonColor: "#0f172a",
    });
    setNewJudge({
      name: "",
      email: "",
      phone: "",
      org: "",
      password: "",
      task: "Vòng Bảng (Prelim Round)",
    });
  };

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Người dùng & Phân công
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Phê duyệt sinh viên đăng ký và tạo tài khoản giám khảo khách mời.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-slate-100 px-2">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "students" ? "border-black text-black" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Phê duyệt tài khoản sinh viên
          </button>
          <button
            onClick={() => setActiveTab("judges")}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "judges" ? "border-black text-black" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Giám khảo khách mời & Phân công
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: SINH VIÊN */}
          {activeTab === "students" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div className="relative w-80">
                  <Search
                    size={16}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Tìm tên hoặc MSSV..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400 transition-colors shadow-sm"
                  />
                </div>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
                >
                  <option value="Tất cả đối tượng">Tất cả đối tượng</option>
                  <option value="SV FPT">SV FPT</option>
                  <option value="SV Ngoài">SV Ngoài</option>
                </select>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Họ tên</th>
                      <th className="px-6 py-4 text-center">Loại</th>
                      <th className="px-6 py-4">MSSV</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-slate-500 font-medium"
                        >
                          Không có yêu cầu phê duyệt nào.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200">
                              {student.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                            {student.mssv}
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleApprove(student.id, student.name)
                              }
                              className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() =>
                                handleReject(student.id, student.name)
                              }
                              className="px-4 py-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            >
                              Từ chối
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: GIÁM KHẢO KHÁCH MỜI */}
          {activeTab === "judges" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  CẤP TÀI KHOẢN & PHÂN CÔNG NHIỆM VỤ
                </h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={newJudge.name}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, name: e.target.value })
                      }
                      placeholder="Ví dụ: Dr. Alex Johnson"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Email truy cập
                    </label>
                    <input
                      type="email"
                      value={newJudge.email}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, email: e.target.value })
                      }
                      placeholder="alex@enterprise.com"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      value={newJudge.phone}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, phone: e.target.value })
                      }
                      placeholder="0901234567"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Mật khẩu truy cập hệ thống
                    </label>
                    <input
                      type="text"
                      value={newJudge.password}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, password: e.target.value })
                      }
                      placeholder="Nhập mật khẩu..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400 shadow-sm text-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Đơn vị công tác
                    </label>
                    <input
                      type="text"
                      value={newJudge.org}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, org: e.target.value })
                      }
                      placeholder="FPT Software, VNG, v.v."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      Chọn Vòng thi cần chấm
                    </label>
                    <select
                      value={newJudge.task}
                      onChange={(e) =>
                        setNewJudge({ ...newJudge, task: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 shadow-sm cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="Vòng Bảng (Prelim Round)">
                        Vòng Bảng (Prelim Round)
                      </option>
                      <option value="Vòng Chung Kết">Vòng Chung Kết</option>
                      <option value="Track: AI / Machine Learning">
                        Track: AI / Machine Learning
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-200 pt-6">
                  <button
                    onClick={handleCreateJudge}
                    className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> Tạo tài khoản & Phân công ngay
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-4">
                  Danh sách Giám khảo đã phân công
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Thông tin liên lạc</th>
                        <th className="px-6 py-4">Đơn vị</th>
                        <th className="px-6 py-4">Nhiệm vụ phân công</th>
                        <th className="px-6 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {judges.map((judge) => (
                        <tr
                          key={judge.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {judge.name}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-slate-700 font-medium text-xs">
                              {judge.email}
                            </p>
                            <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                              {judge.phone}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                            {judge.org}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-bold text-xs">
                            {judge.task}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-blue-600 text-xs font-bold underline underline-offset-2 transition-colors">
                              Chỉnh sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-black hover:border-black transition-colors z-20">
        <HelpCircle size={18} />
      </button>
    </main>
  );
}
