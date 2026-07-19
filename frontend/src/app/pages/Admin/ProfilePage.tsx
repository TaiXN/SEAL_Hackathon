import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Building,
  Phone,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../lib/api/authApi";

export function ProfilePage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State lưu thông tin Admin thật từ hệ thống
  const [profile, setProfile] = useState({
    fullName: "Loading...",
    email: "Loading...",
    address: "Loading...",
    phone: "Loading...",
  });

  // Lấy data thật của người dùng đang đăng nhập từ LocalStorage
  // Lấy data thật của người dùng đang đăng nhập từ LocalStorage
  useEffect(() => {
    // Thử tìm các key phổ biến thường dùng khi login
    const userDataStr =
      localStorage.getItem("user") ||
      localStorage.getItem("userInfo") ||
      localStorage.getItem("admin") ||
      localStorage.getItem("account");

    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setProfile({
          fullName: userData.fullName || userData.name || "System Admin",
          email: userData.email || "No Email Provided",
          address: userData.address || "SEAL Hackathon Committee",
          phone: userData.phone || "No Phone Provided",
        });
      } catch (e) {
        console.error("Failed to parse user data");
      }
    } else {
      // NẾU TÌM KHÔNG THẤY, GÁN GIÁ TRỊ MẶC ĐỊNH CHO ĐỠ BỊ CHỮ "LOADING..."
      setProfile({
        fullName: "System Administrator",
        email: "admin@sealhackathon.com",
        address: "SEAL Hackathon Committee",
        phone: "—",
      });
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match!");
      return;
    }

    const loadingToastId = toast.loading("Sending password change request...");

    try {
      await authApi.changePassword({
        oldPassword: oldPassword,
        newPassword: newPassword,
        rePassword: confirmPassword,
      });

      toast.success("Password changed successfully!", {
        id: loadingToastId,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error(
        "Password change failed! Please verify your current password is correct.",
        { id: loadingToastId },
      );
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight">
            My Profile
          </h2>
          <p className="text-slate-500 font-medium text-base mt-2">
            View your personal information and manage account security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CỘT TRÁI: AVATAR CARD */}
          <div className="col-span-1 space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-32 h-32 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner border border-white">
                <User size={56} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-extrabold text-[#0a192f] text-center leading-tight">
                {profile.fullName}
              </h3>
              <p className="text-slate-500 font-bold text-sm mt-2 text-center break-all">
                {profile.email}
              </p>
              <div className="mt-6 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-extrabold text-emerald-600 flex items-center gap-1.5 uppercase tracking-widest">
                <Shield size={14} strokeWidth={2.5} /> System Admin
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: INFO & PASSWORD */}
          <div className="col-span-2 space-y-8">
            {/* THÔNG TIN CÁ NHÂN (READ-ONLY) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
                <h3 className="text-xl font-extrabold text-[#0a192f] flex items-center gap-3">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  Account Details
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Lock size={12} strokeWidth={2.5} /> Locked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <User size={14} strokeWidth={2.5} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    readOnly
                    className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Mail size={14} strokeWidth={2.5} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Building size={14} strokeWidth={2.5} /> Organization
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    readOnly
                    className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Phone size={14} strokeWidth={2.5} /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    readOnly
                    className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ĐỔI MẬT KHẨU */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xl font-extrabold text-[#0a192f] flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Key size={20} strokeWidth={2.5} />
                </div>
                Change Password
              </h3>

              <form
                onSubmit={handleChangePassword}
                className="space-y-5 max-w-md"
              >
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-extrabold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-[#0a192f] transition-colors"
                    >
                      {showOldPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-extrabold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-[#0a192f] transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Retype new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-extrabold text-[#0a192f] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-[#0a192f] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
