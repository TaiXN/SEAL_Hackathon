import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { playerApi } from "../../lib/api/playerApi";

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận email từ trang Register truyền qua, nếu không có thì đá về trang Login
  const [searchParams] = useSearchParams();
  const email =
    searchParams.get("email") ||
    location.state?.email ||
    sessionStorage.getItem("registerEmail") ||
    "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // CHIÊU CUỐI: Lấy email từ URL, nếu trượt thì lấy từ State, nếu trượt nữa thì lấy từ Local Memory!
  //   useEffect(() => {
  //     if (!email) {
  //       navigate("/login");
  //     }
  //   }, [email, navigate]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Xử lý khi gõ từng số
  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    // Chỉ lấy ký tự cuối cùng (trường hợp user gõ đè)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    setError(""); // Xóa lỗi khi user bắt đầu gõ lại
  };

  // Xử lý phím Backspace để lùi ô
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý khi user dán (paste) nguyên dải 6 số
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .slice(0, 6)
      .replace(/\D/g, "");
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[nextIndex]?.focus();
      setError("");
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await playerApi.verifyOtp({ email, otpCode });

      toast.success("Account verified successfully!");
      // Thành công -> Bắn về trang Login kèm email để điền sẵn
      navigate("/login", { state: { view: "login", prefillEmail: email } });
    } catch (err: any) {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    // GỌI API GỬI LẠI EMAIL Ở ĐÂY (NẾU BE CÓ HỖ TRỢ)
    // await playerApi.resendOtp({ email });

    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    toast.success("A new verification code has been sent!");
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Nút Back đổi email */}
        <button
          onClick={() => navigate("/login", { state: { view: "register" } })}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-6">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
            <MailCheck size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Verify your email
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            We've sent a 6-digit verification code to <br />
            <span className="font-bold text-slate-800">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 text-center text-xl sm:text-2xl font-black text-slate-900 outline-none transition-all ${
                  error
                    ? "border-red-400 bg-red-50 focus:border-red-500 text-red-600"
                    : "border-slate-200 bg-slate-50 focus:border-orange-500 focus:bg-white"
                }`}
              />
            ))}
          </div>

          {/* Dòng báo lỗi đỏ chữ nhỏ */}
          {error && (
            <p className="text-center text-sm font-bold text-red-600 animate-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.join("").length < 6}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              className={`font-bold transition-colors ${
                timer > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-orange-600 hover:text-orange-700 hover:underline"
              }`}
            >
              {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
