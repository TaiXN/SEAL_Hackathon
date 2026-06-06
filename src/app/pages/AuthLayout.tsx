import React, { useEffect, useState } from "react";
import { ArrowRight, Check, ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom"; // 1. Import thằng này vào
import { useAuthStore } from "../stores/auth.store";

type AuthView =
  | "login"
  | "register"
  | "forgot-password"
  | "link-sent"
  | "reset-password";

export function AuthLayout() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate(); // 2. Kích hoạt anh shipper chuyển trang này lên

  const [view, setView] = useState<AuthView>("login");

  // ================= STATE CHO LOGIN =================
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [role, setRole] = useState("member"); // mặc định là member, có thể đổi thành judge hoặc admin khi chọn ở dropdown

  // ================= STATE CHO REGISTER =================
  const [studentType, setStudentType] = useState<"fpt" | "other" | null>("fpt");
  const [regEmail, setRegEmail] = useState("");
  const [regUniversity, setRegUniversity] = useState(""); // chỉ dùng khi chọn 'other'
  const [regStudentId, setRegStudentId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // ================= STATE CHO FORGOT / RESET PASSWORD =================
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // ================= HÀM XỬ LÝ KHI BẤM NÚT =================
  useEffect(() => {
    if (accessToken) {
      console.log(
        "Hệ thống thấy bạn có Thẻ VIP rồi! Đang chuyển vào trang chủ...",
      );
      navigate("/login"); // Mượt mà, không reload trang
    }
  }, [navigate]); // thêm biến navigate vào mảng bám đuôi này theo chuẩn của React

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // đóng vai anh shipper, gom dữ liệu từ form và gửi đi
    const dataToSend = { email: loginEmail, password: loginPassword };
    console.log("Dữ liệu chuẩn bị gửi đi là:", dataToSend);

    // Dùng if-else để quyết định link API và trang sẽ chuyển tới
    let apiUrl = "";
    let navigateTo = "";

    if (role === "admin") {
      apiUrl = "https://seal.cosplane.io.vn/api/Auth/admin/login";
      navigateTo = "/admin"; // Tạm ví dụ đường dẫn của admin
    } else if (role === "judge") {
      apiUrl = "https://seal.cosplane.io.vn/api/Auth/teacher/login"; // API của judge
      navigateTo = "/judge";
    } else {
      apiUrl = "http://seal.cosplane.io.vn/api/Auth/login"; // API của member bình thường
      navigateTo = "/member";
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        // 1. Phải bóc tách hộp JSON từ BE gửi về
        const data = await response.json();
        console.log("Data BE trả về là:", data); // In ra coi cho chắc!

        // 2. CHỈ LẤY ĐÚNG CÁI LÕI TOKEN BÊN TRONG
        const actualToken = data.accessToken;

        // 3. Cất đúng cái lõi đó vào két sắt
        setTokens(actualToken, role);

        alert("Đăng nhập thành công!");
        navigate(navigateTo);
      } else {
        alert("Đăng nhập thất bại! Kiểm tra lại mail/pass hoặc role");
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FE kiểm tra Cấp độ 1: Xem 2 mật khẩu có giống nhau không
    if (regPassword !== regConfirmPassword) {
      alert("Mật khẩu xác nhận không khớp! Vui lòng nhập lại.");
      return; // Dừng lại, không gom gửi đi nữa
    }

    const dataToSend = {
      email: regEmail,
      isFptStudent: studentType === "fpt",
      university: studentType === "fpt" ? "FPT University" : regUniversity,
      studentId: regStudentId,
      password: regPassword,
    };
    console.log("[REGISTER] Dữ liệu thu thập chuẩn bị gửi BE:", dataToSend);
    alert("Thu thập Register thành công! Check Console F12 nha.");
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORGOT PWD] Gửi yêu cầu reset cho email:", forgotEmail);
    setView("link-sent"); // Chuyển sang màn hình thông báo đã gửi link
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

              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="judge">Judge</option>
                <option value="member">Team Member</option>
                <option value="leader">Team Leader</option>
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
