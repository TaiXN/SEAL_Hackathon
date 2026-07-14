import React, { useEffect, useState } from "react";
import { ArrowRight, Check, ArrowLeft, Mail } from "lucide-react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom"; // 1. Import thằng này vào
=======
import { useNavigate } from "react-router-dom";
>>>>>>> Tri-dev-pr
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";
import { authApi } from "../lib/api/authApi";
import Swal from "sweetalert2";
import { playerApi } from "../lib/api/playerApi";

type AuthView =
  | "login"
  | "register"
  | "forgot-password"
  | "link-sent"
  | "reset-password";

export function AuthLayout() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();

  const [view, setView] = useState<AuthView>("login");

  // ================= STATE CHO LOGIN =================
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [role, setRole] = useState("player"); // mặc định là member

  // ================= STATE CHO REGISTER =================
<<<<<<< HEAD
  const [studentType, setStudentType] = useState<"fpt" | "other" | null>("fpt");
  const [regEmail, setRegEmail] = useState("");
  const [regUniversity, setRegUniversity] = useState("");
=======
  const [regEmail, setRegEmail] = useState("");
>>>>>>> Tri-dev-pr
  const [regStudentId, setRegStudentId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPhone, setRegPhone] = useState("");
<<<<<<< HEAD
  const [regUniversityId, setRegUniversityId] = useState("UNI_FPT");
=======
  const [regUniversityId, setRegUniversityId] = useState("");

  // Danh sách trường Đại học (Lấy theo Database hiện tại)
  const universitiesList = [
    { id: "9cc4a00d-e012-4bda-ac97-482fbbaacc8d", name: "THU THEM UNIVERSITY" },
    { id: "UNI_FPT", name: "FPT University HCM" },
    { id: "UNI_HCMUS", name: "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM" },
    { id: "UNI_HCMUT", name: "Đại học Bách Khoa - ĐHQG TP.HCM" },
    { id: "UNI_HCMUTE", name: "Đại học Sư phạm Kỹ thuật TP.HCM" },
    { id: "UNI_IU", name: "Đại học Quốc tế - ĐHQG TP.HCM" },
    {
      id: "UNI_KHTN",
      name: "Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM",
    },
    { id: "UNI_OTHER", name: "Trường Đại học Khác" },
    { id: "UNI_RMIT", name: "Đại học RMIT Nam Sài Gòn" },
    { id: "UNI_TDTU", name: "Đại học Tôn Đức Thắng" },
    { id: "UNI_UEH", name: "Đại học Kinh tế TP.HCM" },
    { id: "UNI_UIT", name: "Đại học Công nghệ Thông tin - ĐHQG TP.HCM" },
  ];
>>>>>>> Tri-dev-pr

  // ================= STATE CHO FORGOT / RESET PASSWORD =================
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToastId = toast.loading("Đang kiểm tra thông tin...");
    const credentials = { email: loginEmail, password: loginPassword };
    console.log("Dữ liệu chuẩn bị gửi đi là:", credentials);

    try {
      let data;
      let navigateTo = "";

      if (role === "admin") {
        data = await authApi.loginAdmin(credentials);
        navigateTo = "/admin/dashboard";
      } else if (role === "judge") {
        data = await authApi.loginTeacher(credentials);
        navigateTo = "/judge";
      } else {
        data = await authApi.loginPlayer(credentials);
<<<<<<< HEAD
        navigateTo = "/player"; //sửa lại url
=======
        navigateTo = "/player";
>>>>>>> Tri-dev-pr
      }

      if (!data) {
        throw new Error("Không nhận được dữ liệu từ Server");
      }

<<<<<<< HEAD
      console.log("Data API trả về nè: ", data); // ac & rf

      // lấy token: axios ép thành json r
      const actualToken = data.accessToken;
      setTokens(actualToken, role); // set vào kho zustand
=======
      console.log("Data API trả về nè: ", data);

      const actualToken = data.accessToken;
      setTokens(actualToken, role);
>>>>>>> Tri-dev-pr

      toast.success("Đăng nhập thành công! Đang chuyển hướng...", {
        id: loadingToastId,
      });

      navigate(navigateTo);
<<<<<<< HEAD
      //Axios: tự động xuống catch này, bắt lỗi BE trả về 400: sai mk, 404: k tìm thấy, 401: k có token,...
    } catch (error: any) {
      // 1. log ra xem lỗi (lỗi API hay lỗi code JS)
      console.error("Chi tiết lỗi:", error);

      // 2. Lấy thông báo từ Backend (nếu backend có gửi kèm message)
=======
    } catch (error: any) {
      console.error("Chi tiết lỗi:", error);

>>>>>>> Tri-dev-pr
      const errorMsg =
        error.response?.data?.message ||
        "Có lỗi xảy ra trong quá trình đăng nhập!";

      Swal.fire("Lỗi", errorMsg, "error");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regPassword !== regConfirmPassword) {
      Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp!", "error");
      return;
    }

<<<<<<< HEAD
=======
    if (!regUniversityId) {
      Swal.fire("Lỗi", "Vui lòng chọn trường Đại học!", "warning");
      return;
    }

>>>>>>> Tri-dev-pr
    const loadingToastId = toast.loading("Đang tạo tài khoản sinh viên...");

    try {
      await playerApi.register({
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        address: regAddress.trim(),
        phone: regPhone.trim(),
        studentId: regStudentId.trim(),
        universityId: regUniversityId.trim(),
      });

      toast.success("Đăng ký thành công! Đăng nhập để tiếp tục.", {
        id: loadingToastId,
      });

      setView("login");
      setLoginEmail(regEmail);
      setRole("player");
    } catch (error: any) {
      console.error("Register player failed:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể đăng ký tài khoản sinh viên.";

      toast.error(errorMsg, {
        id: loadingToastId,
      });

      Swal.fire("Lỗi", errorMsg, "error");
    }
  };
<<<<<<< HEAD
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORGOT PWD] Gửi yêu cầu reset cho email:", forgotEmail);
    setView("link-sent"); // Chuyển sang màn hình thông báo đã gửi link
=======

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORGOT PWD] Gửi yêu cầu reset cho email:", forgotEmail);
    setView("link-sent");
>>>>>>> Tri-dev-pr
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert("Hai mật khẩu mới không khớp nhau!");
      return;
    }
    console.log("[RESET PWD] Mật khẩu mới cập nhật là:", newPassword);
    alert("Đổi mật khẩu thành công! Chuyển về trang Login.");
    setView("login");
  };

  // ================= GIAO DIỆN =================
  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      {/* Left Side - Brand/Minimalist Area */}
      <div className="hidden lg:flex lg:flex-col lg:w-5/12 bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="relative z-10 flex-1 flex flex-col justify-center pb-12">
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-tight">
            FPT Edu
            <br />
            Hackathon
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            The ultimate platform for innovators. Register your team and build
            the future today.
          </p>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-24 w-64 h-64 bg-orange-500 opacity-15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-[440px]">
          {/* ================= LOGIN VIEW ================= */}
          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Enter your details to access your account.
                </p>
              </div>

<<<<<<< HEAD
              <select value={role} onChange={(e) => setRole(e.target.value)}>
=======
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mb-5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
              >
>>>>>>> Tri-dev-pr
                <option value="admin">Admin</option>
                <option value="judge">Judge</option>
                <option value="player">Participants</option>
              </select>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="login-email"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="login-password"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("forgot-password")}
                      className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 mt-8"
                >
                  Sign In <ArrowRight size={18} strokeWidth={2} />
                </button>
              </form>

              <div className="text-center mt-10">
                <p className="text-slate-500 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-semibold text-slate-900 hover:underline underline-offset-4 transition-all"
                  >
                    Register now
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================= REGISTER VIEW ================= */}
          {view === "register" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Create an account
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Join the hackathon. Please fill in your details.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
<<<<<<< HEAD
=======
                {/* --- Full Name --- */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="reg-fullname"
                  >
                    Full Name
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    placeholder="Nguyen Van A"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                  />
                </div>

                {/* --- Phone & Address --- */}
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="reg-phone"
                    >
                      Phone Number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      placeholder="0901234567"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="reg-address"
                    >
                      Address
                    </label>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      placeholder="Ho Chi Minh City"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* --- Email --- */}
>>>>>>> Tri-dev-pr
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="reg-email"
                  >
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

<<<<<<< HEAD
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Are you an FPT student?
                  </label>
                  <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setStudentType("fpt")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${studentType === "fpt" ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {studentType === "fpt" && <Check size={16} />} FPT Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentType("other")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${studentType === "other" ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {studentType === "other" && <Check size={16} />} Other
                      University
                    </button>
                  </div>
                </div>

                {studentType === "other" && (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="university"
                    >
                      University Name
                    </label>
                    <input
                      id="university"
                      type="text"
                      required
                      placeholder="Enter your university name"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                      value={regUniversity}
                      onChange={(e) => setRegUniversity(e.target.value)}
                    />
                  </div>
                )}

=======
                {/* --- University Dropdown --- */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="reg-university"
                  >
                    University
                  </label>
                  <select
                    id="reg-university"
                    required
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={regUniversityId}
                    onChange={(e) => setRegUniversityId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select your university
                    </option>
                    {universitiesList.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* --- Student ID --- */}
>>>>>>> Tri-dev-pr
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="studentId"
                  >
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    required
                    placeholder="e.g. SE123456"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                  />
                </div>

<<<<<<< HEAD
=======
                {/* --- Passwords --- */}
>>>>>>> Tri-dev-pr
                <div className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="reg-password"
                    >
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="reg-confirm"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 mt-8"
                >
                  Create Account <ArrowRight size={18} strokeWidth={2} />
                </button>
              </form>

              <div className="text-center mt-10">
                <p className="text-slate-500 text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-semibold text-slate-900 hover:underline underline-offset-4 transition-all"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {view === "forgot-password" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 group transition-colors w-fit"
                >
                  <ArrowLeft
                    size={16}
                    className="mr-2 group-hover:-translate-x-1 transition-transform"
                  />{" "}
                  Back to login
                </button>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Forgot password
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleForgotSubmit}>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="reset-email"
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 mt-8"
                >
                  Send Reset Link
                </button>
              </form>
            </div>
          )}

          {/* ================= LINK SENT ================= */}
          {view === "link-sent" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
                Check your email
              </h2>
              <p className="text-slate-500 text-base mb-8">
                We've sent a password reset link to your email address. Please
                click the link to continue.
              </p>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mt-8 w-full text-left">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>{" "}
                  Simulator
                </p>
                <button
                  type="button"
                  onClick={() => setView("reset-password")}
                  className="w-full flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow"
                >
                  Simulate clicking email link
                </button>
              </div>
            </div>
          )}

          {/* ================= RESET PASSWORD ================= */}
          {view === "reset-password" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-10">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Set new password
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Please enter and confirm your new password below.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleResetSubmit}>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="confirm-new-password"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 mt-8"
                >
                  Update Password <Check size={18} strokeWidth={2} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
