import { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Building,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

export function ProfilePage() {
  // States quản lý việc ẩn/hiện mật khẩu
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States lưu trữ giá trị nhập và thông báo
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Hàm xử lý khi bấm nút "Lưu mật khẩu"
  const handleSavePassword = () => {
    if (!currentPassword || !newPassword) return; // Nếu để trống thì không làm gì

    // Hiện thông báo thành công
    setShowSuccessMessage(true);

    // Xóa trắng ô nhập liệu sau khi lưu
    setCurrentPassword("");
    setNewPassword("");

    // Tự động tắt thông báo sau 3 giây
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Thông tin Cá nhân</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Quản lý thông tin tài khoản và bảo mật của bạn.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Cột trái: Avatar & Vai trò */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
              <User size={40} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Nguyễn Quang Trí
            </h2>
            <p className="text-sm font-semibold text-emerald-600 mt-1">
              Admin Hệ thống
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-200">
              <Shield size={12} /> Thành viên Ban Tổ Chức
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Chi tiết tài khoản</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <User size={14} /> Họ và tên
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Nguyễn Quang Trí"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Mail size={14} /> Email FPTU
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="trinq@fpt.edu.vn"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Building size={14} /> Đơn vị / CLB
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="JSC (Ban Văn hóa)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Phone size={14} /> Số điện thoại
                  </label>
                  <input
                    type="text"
                    defaultValue="0878877905"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                  Cập nhật thông tin
                </button>
              </div>
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Key size={16} /> Đổi mật khẩu
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Thông báo thành công */}
              {showSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 size={16} /> Đổi mật khẩu thành công!
                </div>
              )}

              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-300 focus:border-slate-900 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-300 focus:border-slate-900 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleSavePassword}
                className="px-6 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Lưu mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
