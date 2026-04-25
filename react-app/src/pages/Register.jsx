import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Password harus minimal 6 karakter.");
      return;
    }

    setLoading(true);
    // Register user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      // If email confirmation is enabled, data.user might be null or session might be null.
      // We will redirect to login upon successful registration or auto sign-in if no confirmation required.
      if (data.session) {
        navigate("/home");
      } else {
        // If email confirmation is required, let user know
        setError("Registrasi berhasil! Periksa email Anda untuk verifikasi akun sebelum login.");
        // Optional: navigate to login directly after a delay
        setTimeout(() => navigate('/login'), 4000);
      }
    }
    setLoading(false);
  };

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

      <div className="z-[2] w-full max-w-[1080px] md:h-[660px] h-auto min-h-screen md:min-h-0 p-5 flex justify-center items-center">
        <div className="bg-[#385344] w-full h-full md:rounded-[36px] rounded-[28px] flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-x-hidden md:overflow-visible overflow-y-auto">
          
          {/* Left Panel — Branding & Illustration */}
          <div className="md:flex-[1.05] relative flex flex-col pt-10 px-10 pb-8 z-10 min-h-[280px] md:min-h-[320px]">
            {/* SVG organic shape background */}
            <svg
              className="absolute top-0 left-0 md:w-[140%] md:h-full w-full h-[130%] z-[-1] pointer-events-none"
              viewBox="0 0 600 650"
              preserveAspectRatio="none"
            >
              <path
                className="hidden md:block"
                fill="#ffffff"
                d="M0,0 L0,650 L200,650 C 450,550 400,450 420,300 C 440,150 450,50 250,0 Z"
              ></path>
              <path
                className="block md:hidden"
                fill="#ffffff"
                d="M0,0 L800,0 L800,600 C600,650 400,650 0,600 Z"
              ></path>
            </svg>

            {/* Logo + Title */}
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Dashboard Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <p className="text-[#2C5F4A] text-[15px] font-extrabold tracking-[0.5px] leading-none">
                  DASHBOARD
                </p>
                <p className="text-[#2C5F4A] text-[15px] font-extrabold tracking-[0.5px] leading-none mt-[3px]">
                  MONITORING
                </p>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex-1 flex justify-center items-center relative mt-2">
              <img
                src="/illustration.png"
                alt="Plant Monitoring System"
                className="max-w-[88%] max-h-[300px] object-contain mix-blend-multiply drop-shadow-sm"
              />
            </div>

            {/* Footer */}
            <div className="text-[#8BA898] text-[10.5px] leading-[1.5] mt-auto tracking-[0.2px] hidden md:block">
              <p>© 2026 Politeknik Manufaktur Bandung</p>
              <p className="opacity-70">Powered by NOC</p>
            </div>
          </div>

          {/* Right Panel — Register Form */}
          <div className="md:flex-[0.95] flex flex-col justify-center items-center px-10 py-10 md:px-14 md:py-0 relative z-10 w-full">
            <div className="w-full max-w-[340px] flex flex-col">
              
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[32px] font-bold tracking-[-0.5px] text-white leading-none">
                  Buat Akun
                </h1>
                <p className="text-[#9BB0A5] text-[13.5px] mt-2.5 leading-relaxed">
                  Daftar untuk mulai memantau tanaman Anda
                </p>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-[18px]" onSubmit={handleRegister}>
                {error && (
                  <div className={`text-[12.5px] px-4 py-3 rounded-2xl border font-medium text-center animate-page-enter backdrop-blur-sm leading-relaxed ${error.includes('berhasil') ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20' : 'bg-red-500/15 text-red-200 border-red-500/20'}`}>
                    {error}
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Masukkan nama lengkap"
                    required
                    className="bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[13px] px-5 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-email"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="nama@email.com"
                    required
                    className="bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[13px] px-5 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-password"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="register-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Buat password"
                      required
                      className="w-full bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[13px] pl-5 pr-12 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
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
                    <div className="flex items-center gap-2 mt-0.5">
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
                    htmlFor="register-confirm-password"
                    className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                  >
                    Konfirmasi Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="register-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Masukkan ulang password"
                      required
                      className="w-full bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[13px] pl-5 pr-12 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
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
                  className="bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 border-none rounded-2xl py-[13px] text-[14px] font-bold cursor-pointer mt-1 transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)] hover:shadow-[0_8px_30px_rgba(128,161,155,0.3)] tracking-[0.3px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Membuat akun...
                    </span>
                  ) : "Daftar"}
                </button>
              </form>

              {/* Login link */}
              <p className="text-center text-[13px] text-[#8BA898] mt-6 leading-relaxed">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="text-[#A8CBC4] hover:text-white font-semibold transition-colors duration-200 no-underline hover:underline underline-offset-[3px]"
                >
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
