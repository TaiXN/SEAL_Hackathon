import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hexagon,
  ArrowLeft,
  User,
  Shield,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Building,
  Phone,
} from "lucide-react";

export function ProfilePage() {
  const navigate = useNavigate();

  // State quản lý việc ẩn/hiện mật khẩu
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
    alert("Đăng xuất thành công! Tạm thời quay về trang chủ.");
    navigate("/");
  };

  // Hàm xử lý Lưu mật khẩu
  const handleSavePassword = () => {
    alert("🎉 Cập nhật mật khẩu thành công!");
    // Sau khi báo thành công thì có thể xóa rỗng ô input, hoặc reset lại trạng thái con mắt tùy ý
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-900 pb-12">
      {/* 1. TOP NAVBAR */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Hexagon size={32} className="text-black" strokeWidth={2.5} />
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">
              SEAL Hackathon
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              JUDGE PORTAL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-slate-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Trở về Tổng quan
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <div
            className="flex items-center gap-3 cursor-pointer"
            title="Bạn đang ở trang cá nhân"
          >
            <div className="text-right">
              <h2 className="text-sm font-bold text-slate-900">
                GK. Nguyễn Văn A
              </h2>
            </div>
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-slate-200">
              A
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-5xl mx-auto mt-10 px-4 animate-in fade-in duration-300">
        {/* Tiêu đề */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Thông tin Cá nhân
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý thông tin tài khoản và bảo mật của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CỘT TRÁI: Thẻ Avatar & Đăng xuất */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                <User size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Nguyễn Văn A</h3>
              <p className="text-blue-600 font-bold text-sm mt-1">
                Hội đồng Giám khảo
              </p>

              <div className="mt-4 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Shield size={14} /> Chuyên môn: Web App
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm"
            >
              <LogOut size={18} /> Đăng xuất khỏi hệ thống
            </button>
          </div>

          {/* CỘT PHẢI: Form nhập liệu */}
          <div className="col-span-2 space-y-6">
            {/* Box 1: Chi tiết tài khoản */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">
                Chi tiết tài khoản
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} /> Họ và tên
                  </label>
                  <input
                    type="text"
                    defaultValue="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={14} /> Email FPTU
                  </label>
                  <input
                    type="email"
                    defaultValue="anv@fpt.edu.vn"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={14} /> Đơn vị / CLB
                  </label>
                  <input
                    type="text"
                    defaultValue="Đại học FPT (HCM Campus)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} /> Số điện thoại
                  </label>
                  <input
                    type="text"
                    defaultValue="0901234567"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => alert("Đã cập nhật thông tin cá nhân!")}
                  className="px-6 py-2.5 bg-[#0f172a] text-white text-sm font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
                >
                  Cập nhật thông tin
                </button>
              </div>
            </div>

            {/* Box 2: Đổi mật khẩu */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                <Key size={18} className="text-slate-600" /> Đổi mật khẩu
              </h3>
              <div className="space-y-4">
                {/* Mật khẩu hiện tại */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Mật khẩu hiện tại"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* Mật khẩu mới */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSavePassword}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Lưu mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
