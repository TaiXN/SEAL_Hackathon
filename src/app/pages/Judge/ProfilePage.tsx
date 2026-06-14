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
import { useAuthStore } from "../../stores/auth.store";
import { authApi } from "../../lib/api/authApi";
import toast from "react-hot-toast";

export function ProfilePage() {
  const navigate = useNavigate();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clearTokens = useAuthStore((state) => state.clearTokens);

  const handleLogout = async () => {
    const loadingToastId = toast.loading("Đang đăng xuất khỏi hệ thống...");
    try {
      // 2. Gọi API xóa Cookie và Token
      await authApi.logout();

      toast.success("Đăng xuất thành công! Hẹn gặp lại.", {
        id: loadingToastId,
      });
    } catch (error) {
      // Kỹ thuật phòng thủ: Lỡ BE sập hoặc lỗi mạng, FE vẫn phải ép xóa token
      // để giải thoát cho người dùng chứ không giữ họ lại trong trang bảo mật.
      console.error("Lỗi BE khi logout nhưng vẫn clear FE:", error);
      toast.error("Hệ thống có chút sự cố, nhưng vẫn đăng xuất cho bà nha!", {
        id: loadingToastId,
      });
    } finally {
      // 3. Dù API thành công hay thất bại, cuối cùng vẫn phải quét sạch két sắt Zustand
      clearTokens();
      localStorage.removeItem("seal-hackathon-auth");
      navigate("/");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra sương sương ở Frontend trước để đỡ tốn một lượt gọi API lên BE
    if (newPassword !== confirmPassword) {
      toast.error("Hai mật khẩu không khớp nhau!");
      return;
    }
    // 2. Bật hiệu ứng loading
    const loadingToastId = toast.loading("Đang gửi yêu cầu đổi mật khẩu...");
    console.log("Tao đang gửi cái này đi nè:", {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    try {
      // 3. Gọi API qua authApi (Dữ liệu tự động được chuẩn hóa)
      await authApi.changePassword({
        oldPassword: oldPassword,
        newPassword: newPassword,
        rePassword: confirmPassword,
      });

      // 4. Thông báo thành công rực rỡ
      toast.success("Đổi mật khẩu thành công!", {
        id: loadingToastId,
      });

      // 5. Xóa sạch các ô nhập liệu trong form cho đẹp giao diện
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Axios tự động bắt các lỗi như: 400 (Sai mật khẩu cũ) ném xuống đây
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error(
        "Đổi mật khẩu thất bại! Kiểm tra lại mật khẩu cũ chính xác chưa.",
        {
          id: loadingToastId,
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-900 pb-12">
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
            onClick={() => navigate("/judge")}
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

      <main className="max-w-5xl mx-auto mt-10 px-4 animate-in fade-in duration-300">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Thông tin Cá nhân
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý thông tin tài khoản và bảo mật của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="col-span-2 space-y-6">
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

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                <Key size={18} className="text-slate-600" /> Đổi mật khẩu
              </h3>
              <div className="space-y-4">
                {/* Ô Mật khẩu hiện tại */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Mật khẩu hiện tại"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
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

                {/* Ô Mật khẩu mới */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Ô Xác nhận mật khẩu mới */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleChangePassword}
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
