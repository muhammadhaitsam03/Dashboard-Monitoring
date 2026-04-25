import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(null); // null = loading, true/false = result

  useEffect(() => {
    // Check if user arrived via a valid recovery link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    };

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsValidSession(true);
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password harus minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message || "Gagal mereset password.");
    } else {
      setSuccess(true);
      // Sign out after password reset so user logs in fresh
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="login-bg min-h-screen flex justify-center items-center overflow-hidden relative text-white">
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="bubble b1"></div>
          <div className="bubble b2"></div>
          <div className="bubble b3"></div>
          <div className="bubble b4"></div>
          <div className="bubble b5"></div>
          <div className="bubble b6"></div>
          <div className="bubble b7"></div>
        </div>
        <div className="z-[2] flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#80A19B]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[#9BB0A5] text-sm">Memverifikasi link reset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg min-h-screen flex justify-center items-center overflow-hidden relative text-white">
      {/* Background Bubbles */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
        <div className="bubble b3"></div>
        <div className="bubble b4"></div>
        <div className="bubble b5"></div>
        <div className="bubble b6"></div>
        <div className="bubble b7"></div>
      </div>

      <div className="z-[2] w-full max-w-[480px] p-5 flex justify-center items-center">
        <div className="bg-[#385344] w-full rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-10 md:p-12 animate-page-enter">
          
          {/* Invalid / expired link */}
          {!isValidSession && !success ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mb-5">
                <AlertTriangle size={30} className="text-amber-400" />
              </div>
              <h2 className="text-[22px] font-bold text-white tracking-[-0.3px] mb-3">
                Link Tidak Valid
              </h2>
              <p className="text-[#9BB0A5] text-[13.5px] leading-relaxed mb-6">
                Link reset password sudah kedaluwarsa atau tidak valid. Silakan kirim ulang permintaan reset password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] border-none rounded-2xl py-[13px] px-8 text-[13.5px] font-bold cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)]"
              >
                Kembali ke Login
              </button>
            </div>
          ) : success ? (
            /* Success state */
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#80A19B]/20 flex items-center justify-center mb-5">
                <CheckCircle size={32} className="text-[#80A19B]" />
              </div>
              <h2 className="text-[24px] font-bold text-white tracking-[-0.3px] mb-3">
                Password Berhasil Direset!
              </h2>
              <p className="text-[#9BB0A5] text-[13.5px] leading-relaxed mb-2">
                Password Anda telah berhasil diperbarui. Anda akan diarahkan ke halaman login.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <svg className="animate-spin h-4 w-4 text-[#80A19B]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[#6E8E7D] text-[12px]">Mengarahkan ke login...</span>
              </div>
            </div>
          ) : (
            /* Reset password form */
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#80A19B]/15 flex items-center justify-center mb-5">
                  <Lock size={24} className="text-[#80A19B]" />
                </div>
                <h2 className="text-[26px] font-bold text-white tracking-[-0.3px] leading-tight">
                  Reset Password
                </h2>
                <p className="text-[#9BB0A5] text-[13.5px] mt-2.5 leading-relaxed">
                  Masukkan password baru Anda. Password harus minimal 6 karakter.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-red-500/15 text-red-200 text-[12.5px] px-4 py-3 rounded-2xl border border-red-500/20 font-medium text-center animate-page-enter backdrop-blur-sm leading-relaxed">
                    {error}
                  </div>
                )}

                {/* New Password */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="new-password"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Password Baru
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Masukkan password baru"
                      autoComplete="new-password"
                      required
                      autoFocus
                      className="w-full bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[14px] pl-5 pr-12 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-[#6E8E7D] hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Password strength hint */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1 flex-1">
                        <div className={`h-1 rounded-full flex-1 transition-colors ${password.length >= 2 ? (password.length >= 8 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-[#3D5A4A]'}`}></div>
                        <div className={`h-1 rounded-full flex-1 transition-colors ${password.length >= 6 ? (password.length >= 8 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-[#3D5A4A]'}`}></div>
                        <div className={`h-1 rounded-full flex-1 transition-colors ${password.length >= 8 ? 'bg-emerald-400' : 'bg-[#3D5A4A]'}`}></div>
                      </div>
                      <span className={`text-[10.5px] font-medium ${password.length >= 8 ? 'text-emerald-400' : password.length >= 6 ? 'text-amber-400' : 'text-red-400'}`}>
                        {password.length >= 8 ? 'Kuat' : password.length >= 6 ? 'Cukup' : 'Lemah'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="confirm-password"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Konfirmasi Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Masukkan ulang password"
                      autoComplete="new-password"
                      required
                      className="w-full bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[14px] pl-5 pr-12 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-[#6E8E7D] hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <p className={`text-[11px] mt-0.5 ${confirmPassword === password ? 'text-emerald-400' : 'text-red-400'}`}>
                      {confirmPassword === password ? '✓ Password cocok' : '✗ Password tidak cocok'}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 border-none rounded-2xl py-[14px] text-[14px] font-bold cursor-pointer mt-1 transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)] hover:shadow-[0_8px_30px_rgba(128,161,155,0.3)] tracking-[0.3px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : "Simpan Password Baru"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
