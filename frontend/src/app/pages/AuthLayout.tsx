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
import { getServerMsg } from "../lib/utils/criteriaHelpers";

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
  }, [location]);

  // ================= STATES =================
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [role, setRole] = useState("player");
  const [isRoleOpen, setIsRoleOpen] = useState(false); // State for Custom Role Dropdown

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
  const [isUniOpen, setIsUniOpen] = useState(false); // State for Custom University Dropdown

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
    const credentials = { email: loginEmail, password: loginPassword };

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
      setTokens(actualToken, role);

      toast.success("Login successful! Redirecting...", { id: loadingToastId });

      navigate(navigateTo, { replace: true });
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "An error occurred during login!";
      toast.dismiss(loadingToastId);
      setLoginError(errorMsg);
      Swal.fire("Error", errorMsg, "error");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(regPhone.trim())) {
      Swal.fire("Error", "Phone number must be exactly 10 digits!", "warning");
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
      Swal.fire("Error", "Passwords do not match!", "error");
      return;
    }
    if (!regUniversityId) {
      Swal.fire("Error", "Please select a University!", "warning");
      return;
    }

    const loadingToastId = toast.loading("Creating student account...");
    try {
      await playerApi.register({
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        address: regAddress.trim(),
        phone: regPhone.trim(),
        universityId: regUniversityId.trim(),
      });

      toast.success("Registration successful! Please login.", {
        id: loadingToastId,
      });
      setView("login");
      setLoginEmail(regEmail);
      setRole("player");
    } catch (error: any) {
      const errorMsg = getServerMsg(error) || "Unable to register account.";
      toast.error(errorMsg, { id: loadingToastId });
      Swal.fire("Error", errorMsg, "error");
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

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="w-full max-w-[440px]">
          {/* ================= LOGIN ================= */}
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
                <div className="space-y-1.5">
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
