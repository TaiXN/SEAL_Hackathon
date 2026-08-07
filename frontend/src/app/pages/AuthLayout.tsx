import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";
import { authApi } from "../lib/api/authApi";
import Swal from "sweetalert2";
import { playerApi } from "../lib/api/playerApi";
import { friendlyErrorText } from "../lib/utils/apiError";

type AuthView = "login" | "register";

// Password rules required by the backend (>= 8 chars) + FE security recommendations
const PASSWORD_RULES: { test: (pw: string) => boolean; label: string }[] = [
  {
    test: (pw) => pw.length >= 8,
    label: "At least 8 characters (12-16 recommended)",
  },
  {
    test: (pw) => /[A-Z]/.test(pw),
    label: "At least 1 uppercase letter (A-Z)",
  },
  {
    test: (pw) => /[a-z]/.test(pw),
    label: "At least 1 lowercase letter (a-z)",
  },
  { test: (pw) => /[0-9]/.test(pw), label: "At least 1 digit (0-9)" },
  {
    test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/.test(pw),
    label: "At least 1 special character (!, @, #, $, %,...)",
  },
];

const getPasswordErrors = (pw: string): string[] =>
  PASSWORD_RULES.filter((rule) => !rule.test(pw)).map((rule) => rule.label);

export function AuthLayout() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState<AuthView>("login");

  // Receive navigation command from the home page
  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view as AuthView);
    }
    // Đây chính là khúc nó lấy cái email được "xách hộ" về điền vào ô nè
    if (location.state?.prefillEmail) {
      setLoginEmail(location.state.prefillEmail);
    }
  }, [location]);

  // ================= STATES =================
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [role, setRole] = useState("player");
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPasswordErrors, setRegPasswordErrors] = useState<string[]>([]);
  const [regPasswordTouched, setRegPasswordTouched] = useState(false);
  const [regConfirmTouched, setRegConfirmTouched] = useState(false);
  const [regFullName, setRegFullName] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regUniversityId, setRegUniversityId] = useState("");
  const [isUniOpen, setIsUniOpen] = useState(false);

  // --- THÊM 3 STATE MỚI CHO CCCD VÀ ẢNH ---
  const [regCccdNumber, setRegCccdNumber] = useState("");
  const [regIdCardImage, setRegIdCardImage] = useState<File | null>(null);
  const [regStudentCardImage, setRegStudentCardImage] = useState<File | null>(
    null,
  );

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const roleRef = useRef<HTMLDivElement>(null);
  const uniRef = useRef<HTMLDivElement>(null);

  const universitiesList = [
    { id: "9cc4a00d-e012-4bda-ac97-482fbbaacc8d", name: "THU THEM UNIVERSITY" },
    { id: "UNI_FPT", name: "FPT University HCM" },
    { id: "UNI_HCMUS", name: "University of Science - VNUHCM" },
    { id: "UNI_HCMUT", name: "Ho Chi Minh City University of Technology" },
    { id: "UNI_HCMUTE", name: "HCM University of Technology and Education" },
    { id: "UNI_IU", name: "International University - VNUHCM" },
    { id: "UNI_KHTN", name: "University of Social Sciences and Humanities" },
    { id: "UNI_OTHER", name: "Other University" },
    { id: "UNI_RMIT", name: "RMIT University" },
    { id: "UNI_TDTU", name: "Ton Duc Thang University" },
    { id: "UNI_UEH", name: "University of Economics HCMC" },
    { id: "UNI_UIT", name: "UIT - VNUHCM" },
  ];

  const roleList = [
    { id: "admin", name: "Administrator" },
    { id: "judge", name: "Judge / Mentor" },
    { id: "player", name: "Participant (Player)" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
      if (uniRef.current && !uniRef.current.contains(event.target as Node)) {
        setIsUniOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= HANDLERS =================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const loadingToastId = toast.loading("Verifying credentials...");
    // Backend dò account bằng Email.Equals(...) khớp tuyệt đối, còn lúc đăng ký
    // thì email đã được .trim() trước khi lưu. Không trim ở đây thì chỉ cần một
    // khoảng trắng thừa do copy/paste là ra "Email or password is incorrect".
    // (Mật khẩu thì KHÔNG trim — khoảng trắng là ký tự hợp lệ trong mật khẩu.)
    const credentials = { email: loginEmail.trim(), password: loginPassword };

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
        navigateTo = "/gateway";
      }

      if (!data) throw new Error("No data received from server.");

      const actualToken = data.accessToken;
      // Không có token mà vẫn để đi tiếp thì RequireAuth sẽ đá ngược về /login
      // ngay sau toast "Login successful" — nhìn y như đăng nhập không ăn.
      if (!actualToken)
        throw new Error(
          "Server did not return an access token. Please contact the administrator.",
        );

      setTokens(actualToken, role);

      toast.success("Login successful! Redirecting...", { id: loadingToastId });

      navigate(navigateTo, { replace: true });
    } catch (error: any) {
      // Backend trả lý do dưới dạng text thuần ("Email or password is incorrect"),
      // không phải { message }. Đọc bằng ?.data?.message thì luôn undefined nên
      // mọi lỗi đều hiện ra cùng một câu chung chung.
      const status = error.response?.status;
      let errorMsg: string;

      if (!error.response) {
        errorMsg =
          error.code === "ECONNABORTED"
            ? "The server took too long to respond. Please try again."
            : "Cannot reach the server. Check your network connection and try again.";
      } else if (status === 401) {
        // AuthController trả 401 với body rỗng khi mật khẩu đúng nhưng account
        // không thuộc vai trò của cổng đăng nhập đang chọn.
        errorMsg = `This account is not registered as ${
          role === "admin"
            ? "an Administrator"
            : role === "judge"
              ? "a Judge / Mentor"
              : "a Participant"
        }. Please pick the right role and try again.`;
      } else {
        errorMsg = friendlyErrorText(error, { action: "sign you in" });
      }

      toast.dismiss(loadingToastId);
      setLoginError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: errorMsg,
        confirmButtonColor: "#ea580c",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2.5",
        },
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(regPhone.trim())) {
      Swal.fire(
        "Check your phone number",
        "It must be exactly 10 digits, with no spaces or dashes.",
        "warning",
      );
      return;
    }

    const passwordErrors = getPasswordErrors(regPassword);
    setRegPasswordTouched(true);
    setRegPasswordErrors(passwordErrors);
    if (passwordErrors.length > 0) {
      Swal.fire(
        "Password does not meet requirements",
        "Please check the password rules shown below the field.",
        "warning",
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Swal.fire(
        "Passwords don't match",
        "Re-type the confirmation password so both fields are identical.",
        "warning",
      );
      return;
    }
    if (!regUniversityId) {
      Swal.fire(
        "University required",
        "Pick your university from the list before continuing.",
        "warning",
      );
      return;
    }

    // Validate 3 trường mới
    if (!regCccdNumber.trim()) {
      Swal.fire(
        "ID number required",
        "Enter the CCCD number printed on your citizen ID card.",
        "warning",
      );
      return;
    }
    if (!regIdCardImage) {
      Swal.fire(
        "ID card photo required",
        "Upload a clear photo of your citizen ID card so an admin can verify you.",
        "warning",
      );
      return;
    }
    if (!regStudentCardImage) {
      Swal.fire(
        "Student card photo required",
        "Upload a clear photo of your student card so an admin can verify you.",
        "warning",
      );
      return;
    }

    const loadingToastId = toast.loading(
      "Creating student account (Uploading images to Cloudinary)...",
    );
    try {
      const formData = new FormData();
      formData.append("Email", regEmail.trim());
      formData.append("Password", regPassword);
      formData.append("FullName", regFullName.trim());
      formData.append("Address", regAddress.trim());
      formData.append("Phone", regPhone.trim());
      formData.append("UniversityId", regUniversityId.trim());
      formData.append("CccdNumber", regCccdNumber.trim());
      formData.append("IdCardImage", regIdCardImage);
      formData.append("StudentCardImage", regStudentCardImage);

      await playerApi.register(formData as any);

      toast.dismiss(loadingToastId);

      // 1. Hiện thông báo bắt user ấn OK
      await Swal.fire({
        icon: "success",
        title: "Registration successful!",
        text: "Please check your email to get the 6-digit verification code.",
        confirmButtonColor: "#ea580c",
        confirmButtonText: "Got it!",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-2.5",
        },
      });

      // 2. CHỈ DÙNG 1 LỆNH DUY NHẤT NÀY ĐỂ CHUYỂN TRANG
      // Tuyệt đối KHÔNG xài setView("login") ở đây nữa nhé!
      // navigate("/verify-otp", { state: { email: regEmail.trim() } });
      navigate(`/verify-otp?email=${encodeURIComponent(regEmail.trim())}`);
    } catch (error: any) {
      toast.dismiss(loadingToastId);

      // Câu thô của backend CHỈ dùng để đoán tình huống (chưa verify / trùng
      // email), không đưa thẳng ra màn hình — người dùng nhận câu đã biên tập.
      const rawMsg = String(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          error.response?.data?.title ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "") ||
          "",
      );
      const lower = rawMsg.toLowerCase();
      const isDuplicate =
        lower.includes("already") ||
        lower.includes("exist") ||
        lower.includes("duplicate");
      const errorMsg = friendlyErrorText(error, {
        action: "create your account",
        hint: isDuplicate
          ? "An account with this email or ID number already exists. Try signing in instead."
          : "Please double-check your details and uploaded images, then try again.",
      });

      setLoginError(errorMsg);

      // Tùy Backend trả câu gì, thường sẽ chứa chữ "verify", "confirm", "active"
      const isUnverified =
        lower.includes("verify") ||
        lower.includes("confirm") ||
        lower.includes("not active");

      if (isUnverified) {
        // NẾU CHƯA VERIFY: Bật cảnh báo vàng + Nút dắt tay sang tận trang OTP
        Swal.fire({
          icon: "warning",
          title: "Account Not Verified!",
          text: "This account still needs to be verified. Please check your inbox for the 6-digit code, or verify it now.",
          confirmButtonText: "Verify Now",
          confirmButtonColor: "#ea580c",
          showCancelButton: true,
          cancelButtonText: "Close",
          customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl font-bold px-6 py-2.5",
            cancelButton: "rounded-xl font-bold px-6 py-2.5",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Bà bấm Verify Now là nó xách cái email đi thẳng qua trang OTP luôn
            navigate(
              `/verify-otp?email=${encodeURIComponent(loginEmail.trim())}`,
            );
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration failed",
          text: errorMsg,
          confirmButtonColor: "#ea580c",
          customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl font-bold px-6 py-2.5",
          },
        });
      }
    }
  };

  // ================= UI RENDER =================
  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      <div className="hidden lg:flex lg:flex-col lg:w-5/12 bg-orange-600 text-white p-12 relative overflow-hidden">
        <div className="relative z-10 flex-1 flex flex-col justify-center pb-12">
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-tight">
            SEAL Hackathon
          </h1>
          <p className="text-orange-50 text-lg max-w-sm leading-relaxed">
            The ultimate platform for innovators. Register your team and build
            the future today.
          </p>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-24 w-64 h-64 bg-orange-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Tăng max-w để form Register rộng rãi hơn chứa ảnh */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="w-full max-w-[500px]">
          {/* ================= LOGIN ================= */}
          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[440px] mx-auto">
              <div className="mb-10">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Enter your details to access your account.
                </p>
              </div>

              {/* CUSTOM ROLE DROPDOWN */}
              <div className="mb-6 relative" ref={roleRef}>
                <label className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wider">
                  Select Role
                </label>
                <div
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-bold hover:bg-slate-100 transition-all cursor-pointer flex justify-between items-center"
                >
                  <span>{roleList.find((r) => r.id === role)?.name}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${isRoleOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {isRoleOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {roleList.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setIsRoleOpen(false);
                        }}
                        className={`px-4 py-3.5 text-sm font-bold cursor-pointer transition-colors flex items-center justify-between ${
                          role === r.id
                            ? "bg-orange-600 text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {r.name}
                        {role === r.id && <Check size={16} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label
                    className="text-sm font-bold text-slate-700"
                    htmlFor="login-email"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className={`block w-full px-4 py-3 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium ${
                      loginError
                        ? "bg-red-50 border-red-400 focus:ring-red-500/10 focus:border-red-500 text-red-900"
                        : "bg-slate-50 border-slate-200 focus:ring-orange-500/10 focus:border-orange-500"
                    }`}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label
                    className="text-sm font-bold text-slate-700"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className={`block w-full px-4 py-3 pr-11 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium ${
                        loginError
                          ? "bg-red-50 border-red-400 focus:ring-red-500/10 focus:border-red-500 text-red-900"
                          : "bg-slate-50 border-slate-200 focus:ring-orange-500/10 focus:border-orange-500"
                      }`}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label={
                        showLoginPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-xs font-bold text-red-600 pt-1">
                      {loginError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 mt-8"
                >
                  Sign In <ArrowRight size={18} strokeWidth={2} />
                </button>
              </form>

              <div className="text-center mt-10">
                <p className="text-slate-500 text-sm font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all"
                  >
                    Register now
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================= REGISTER ================= */}
          {view === "register" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Create an account
                </h2>
                <p className="text-slate-500 mt-2 text-base">
                  Join the hackathon. Please fill in your details.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      Full Name
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      placeholder="Nguyen Van A"
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:bg-white transition-all"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                    />
                  </div>

                  {/* CCCD NUMBER */}
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      CCCD Number
                    </label>
                    <input
                      id="reg-cccd"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="079206..."
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:bg-white transition-all"
                      value={regCccdNumber}
                      onChange={(e) =>
                        setRegCccdNumber(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      Phone
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="0901234567"
                      maxLength={10}
                      pattern="\d{10}"
                      title="Phone number must be exactly 10 digits"
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:bg-white transition-all"
                      value={regPhone}
                      onChange={(e) =>
                        setRegPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      Address
                    </label>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      placeholder="HCMC"
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:bg-white transition-all"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:bg-white transition-all"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                {/* UPLOAD IMAGES SECTION */}
                <div className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    <label className="text-[13px] font-bold text-slate-700">
                      ID Card Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) =>
                        setRegIdCardImage(e.target.files?.[0] || null)
                      }
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-600 hover:file:bg-orange-200 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 overflow-hidden border-l border-slate-200 pl-4">
                    <label className="text-[13px] font-bold text-slate-700">
                      Student Card Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) =>
                        setRegStudentCardImage(e.target.files?.[0] || null)
                      }
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-600 hover:file:bg-orange-200 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* CUSTOM UNIVERSITY DROPDOWN */}
                <div className="space-y-1.5 relative" ref={uniRef}>
                  <label className="text-[13px] font-bold text-slate-700">
                    University
                  </label>
                  <div
                    onClick={() => setIsUniOpen(!isUniOpen)}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all cursor-pointer flex justify-between items-center ${!regUniversityId ? "text-slate-400" : "text-slate-900"}`}
                  >
                    <span className="truncate pr-4">
                      {regUniversityId
                        ? universitiesList.find((u) => u.id === regUniversityId)
                            ?.name
                        : "Select your university"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isUniOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isUniOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-y-auto max-h-60 animate-in fade-in slide-in-from-top-2 duration-200">
                      {universitiesList.map((uni) => (
                        <div
                          key={uni.id}
                          onClick={() => {
                            setRegUniversityId(uni.id);
                            setIsUniOpen(false);
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                            regUniversityId === uni.id
                              ? "bg-orange-600 text-white font-bold"
                              : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="truncate pr-4">{uni.name}</span>
                          {regUniversityId === uni.id && (
                            <Check size={16} className="flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className={`block w-full px-4 py-2.5 pr-11 border rounded-xl text-sm transition-all focus:bg-white ${
                          regPasswordTouched && regPasswordErrors.length > 0
                            ? "bg-red-50 border-red-400 focus:border-red-500 text-red-900"
                            : "bg-slate-50 border-slate-200 focus:border-orange-500"
                        }`}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegPasswordErrors(
                            getPasswordErrors(e.target.value),
                          );
                        }}
                        onBlur={() => setRegPasswordTouched(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        aria-label={
                          showRegPassword ? "Hide password" : "Show password"
                        }
                        tabIndex={-1}
                      >
                        {showRegPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[13px] font-bold text-slate-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm"
                        type={showRegConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className={`block w-full px-4 py-2.5 pr-11 border rounded-xl text-sm transition-all focus:bg-white ${
                          regConfirmTouched &&
                          regConfirmPassword.length > 0 &&
                          regConfirmPassword !== regPassword
                            ? "bg-red-50 border-red-400 focus:border-red-500 text-red-900"
                            : "bg-slate-50 border-slate-200 focus:border-orange-500"
                        }`}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        onBlur={() => setRegConfirmTouched(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        aria-label={
                          showRegConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        tabIndex={-1}
                      >
                        {showRegConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {regPasswordTouched &&
                  regConfirmTouched &&
                  regConfirmPassword.length > 0 &&
                  regConfirmPassword !== regPassword && (
                    <p className="text-xs font-bold text-red-600 -mt-2">
                      Confirm password does not match.
                    </p>
                  )}

                {regPasswordTouched && (
                  <ul className="-mt-1 space-y-1 rounded-xl bg-slate-50 p-3">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(regPassword);
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-2 text-xs font-medium ${
                            passed ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {passed ? (
                            <Check size={14} className="flex-shrink-0" />
                          ) : (
                            <span className="flex-shrink-0 w-3.5 text-center">
                              ✕
                            </span>
                          )}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all mt-6"
                >
                  Create Account <ArrowRight size={16} strokeWidth={2} />
                </button>
              </form>

              <div className="text-center mt-8">
                <p className="text-slate-500 text-sm font-medium">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
