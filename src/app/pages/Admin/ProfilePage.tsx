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
import toast from "react-hot-toast";
import { authApi } from "../../lib/api/authApi";

export function ProfilePage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("The two passwords do not match!");
      return;
    }

    const loadingToastId = toast.loading("Sending password change request...");

    try {
      // call API qua authApi (data tự động được chuẩn hóa)
      await authApi.changePassword({
        oldPassword: oldPassword,
        newPassword: newPassword,
        rePassword: confirmPassword,
      });

      toast.success("Password changed successfully!", {
        id: loadingToastId,
      });

      // xóa các ô nhập trong form về trống
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Axios tự động bắt lỗi như: 400 (sai mật khẩu cũ) ném xuống đây
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error(
        "Password change failed! Please verify your current password is correct.",
        {
          id: loadingToastId,
        },
      );
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Personal Information</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your account information and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
              <User size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Nguyễn Quang Trí
            </h3>
            <p className="text-emerald-600 font-bold text-sm mt-1">
              System Admin
            </p>
            <div className="mt-4 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Shield size={14} /> Organizing Committee Member
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-lg">
              Account Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Nguyễn Quang Trí"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={14} /> FPTU Email
                </label>
                <input
                  type="email"
                  defaultValue="trinq@fpt.edu.vn"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building size={14} /> Department / Club
                </label>
                <input
                  type="text"
                  defaultValue="JSC (Ban Văn hóa)"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="text"
                  defaultValue="0878877905"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button className="px-6 py-2.5 bg-[#0f172a] text-white text-sm font-bold rounded-lg hover:bg-black transition-colors shadow-sm">
                Update Information
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
              <Key size={18} className="text-slate-600" /> Change Password
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-300 focus:border-slate-900 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
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
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-300 focus:border-slate-900 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleChangePassword}
                  className="px-6 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Save Password
                </button>
                {showSuccessMessage && (
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 animate-in slide-in-from-left-2">
                    <CheckCircle2 size={16} /> Updated successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
