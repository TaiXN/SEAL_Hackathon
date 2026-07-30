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
    const loadingToastId = toast.loading("Logging out...");
    try {
      await authApi.logout();
      toast.success("Logged out successfully! See you again.", {
        id: loadingToastId,
      });
    } catch (error) {
      console.error(
        "Backend logout failed, clearing frontend session anyway:",
        error,
      );
      toast.error("Something went wrong, but you have been logged out.", {
        id: loadingToastId,
      });
    } finally {
      clearTokens();
      localStorage.removeItem("seal-hackathon-auth");
      navigate("/");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match!");
      return;
    }
    const loadingToastId = toast.loading("Sending password change request...");
    console.log("Submitting password change payload:", {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    try {
      await authApi.changePassword({
        oldPassword: oldPassword,
        newPassword: newPassword,
        rePassword: confirmPassword,
      });

      toast.success("Password changed successfully!", { id: loadingToastId });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change failed:", error);
      toast.error(
        "Password change failed! Please check your current password.",
        { id: loadingToastId },
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-slate-900 pb-12 animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-100 px-10 py-5 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <Hexagon size={28} className="text-[#0a192f]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[#0a192f] leading-tight">
              SEAL Hackathon
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              JUDGE PORTAL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/judge")}
            className="text-sm font-extrabold text-slate-400 hover:text-[#0a192f] transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex items-center gap-4 cursor-default">
            <div className="text-right">
              <h2 className="text-sm font-bold text-slate-900">
                Judge Nguyen Van A
              </h2>
            </div>
            <div className="w-10 h-10 bg-[#0a192f] text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
              J
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-12 px-6">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight">
            Personal Profile
          </h2>
          <p className="text-slate-500 font-medium text-base mt-2">
            Manage your account information and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-28 h-28 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                <User size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Nguyen Van A</h3>
              <p className="text-blue-600 font-bold text-sm mt-1">
                Judging Panel
              </p>

              <div className="mt-6 w-full flex justify-center">
                <span className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-extrabold text-emerald-600 flex items-center gap-2 uppercase tracking-widest">
                  <Shield size={14} strokeWidth={2.5} /> System Authorized
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-[1.5rem] font-extrabold text-sm hover:bg-red-100 transition-colors shadow-sm"
            >
              <LogOut size={18} strokeWidth={2.5} /> Sign Out
            </button>
          </div>

          <div className="col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-extrabold text-[#0a192f] mb-6 text-xl flex items-center gap-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <User size={20} strokeWidth={2.5} />
                </div>
                Account Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Nguyen Van A"
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
                    <Building size={14} /> Organization / Club
                  </label>
                  <input
                    type="text"
                    defaultValue="FPT University (HCM Campus)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} /> Phone Number
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
                  onClick={() => alert("Personal information updated!")}
                  className="px-6 py-2.5 bg-[#0f172a] text-white text-sm font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
                >
                  Update Information
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-extrabold text-[#0a192f] mb-6 text-xl flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Key size={20} strokeWidth={2.5} />
                </div>
                Change Password
              </h3>
              <div className="space-y-4">
                {/* Current password field */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current Password"
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

                {/* New password field */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
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

                {/* Confirm new password field */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
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

              <div className="mt-8 border-t border-slate-100 pt-6">
                <button
                  onClick={handleChangePassword}
                  className="px-8 py-3.5 bg-[#0a192f] text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
