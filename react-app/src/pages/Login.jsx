import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message || "Invalid credentials. Please try again.");
    } else if (data.session) {
      navigate("/home");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setResetError(error.message || "Gagal mengirim email reset.");
    } else {
      setResetSuccess(true);
    }
    setResetLoading(false);
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(email); // Pre-fill with login email if available
    setResetError("");
    setResetSuccess(false);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
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

      <div className="z-[2] w-full max-w-[1080px] md:h-[620px] h-auto min-h-screen md:min-h-0 p-5 flex justify-center items-center">
        <div className="bg-[#385344] w-full h-full md:rounded-[36px] rounded-[28px] flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-x-hidden md:overflow-visible overflow-y-auto">
          
          {/* Left Panel — Branding & Illustration */}
          <div className="md:flex-[1.05] relative flex flex-col pt-10 px-10 pb-8 z-10 min-h-[320px]">
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
            <div className="text-[#8BA898] text-[10.5px] leading-[1.5] mt-auto tracking-[0.2px]">
              <p>© 2026 Politeknik Manufaktur Bandung</p>
              <p className="opacity-70">Powered by NOC</p>
            </div>
          </div>

          {/* Right Panel — Login Form / Forgot Password */}
          <div className="md:flex-[0.95] flex flex-col justify-center items-center px-10 py-10 md:px-14 md:py-0 relative z-10 w-full">
            <div className="w-full max-w-[340px] flex flex-col">
              
              {/* ═══ FORGOT PASSWORD VIEW ═══ */}
              {showForgotPassword ? (
                <div className="animate-page-enter">
                  {/* Back button */}
                  <button
                    onClick={closeForgotPassword}
                    className="flex items-center gap-2 text-[#9BB0A5] hover:text-white text-[13px] font-medium transition-colors cursor-pointer mb-8 group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali ke Login
                  </button>

                  {resetSuccess ? (
                    /* Success state */
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-[#80A19B]/20 flex items-center justify-center mb-5">
                        <CheckCircle size={32} className="text-[#80A19B]" />
                      </div>
                      <h2 className="text-[24px] font-bold text-white tracking-[-0.3px] mb-3">
                        Email Terkirim!
                      </h2>
                      <p className="text-[#9BB0A5] text-[13.5px] leading-relaxed mb-2">
                        Kami telah mengirim link reset password ke:
                      </p>
                      <p className="text-[#A8CBC4] text-[14px] font-semibold mb-6 break-all">
                        {resetEmail}
                      </p>
                      <p className="text-[#6E8E7D] text-[12px] leading-relaxed">
                        Periksa inbox dan folder spam Anda. Link akan kedaluwarsa dalam 1 jam.
                      </p>
                      <button
                        onClick={closeForgotPassword}
                        className="mt-8 bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] border-none rounded-2xl py-[13px] px-8 text-[13.5px] font-bold cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)]"
                      >
                        Kembali ke Login
                      </button>
                    </div>
                  ) : (
                    /* Email input form */
                    <>
                      <div className="mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-[#80A19B]/15 flex items-center justify-center mb-5">
                          <Mail size={24} className="text-[#80A19B]" />
                        </div>
                        <h2 className="text-[26px] font-bold text-white tracking-[-0.3px] leading-tight">
                          Lupa Password?
                        </h2>
                        <p className="text-[#9BB0A5] text-[13.5px] mt-2.5 leading-relaxed">
                          Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
                        </p>
                      </div>

                      <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                        {resetError && (
                          <div className="bg-red-500/15 text-red-200 text-[12.5px] px-4 py-3 rounded-2xl border border-red-500/20 font-medium text-center animate-page-enter backdrop-blur-sm leading-relaxed">
                            {resetError}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="reset-email"
                            className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="reset-email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              setResetError("");
                            }}
                            placeholder="nama@email.com"
                            autoComplete="email"
                            required
                            autoFocus
                            className="bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[14px] px-5 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 border-none rounded-2xl py-[14px] text-[14px] font-bold cursor-pointer mt-1 transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)] hover:shadow-[0_8px_30px_rgba(128,161,155,0.3)] tracking-[0.3px]"
                        >
                          {resetLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Mengirim...
                            </span>
                          ) : "Kirim Link Reset"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                /* ═══ LOGIN VIEW ═══ */
                <>
                  {/* Heading */}
                  <div className="mb-9">
                    <h1 className="text-[32px] font-bold tracking-[-0.5px] text-white leading-none">
                      Selamat Datang
                    </h1>
                    <p className="text-[#9BB0A5] text-[13.5px] mt-2.5 leading-relaxed">
                      Masuk ke akun Anda untuk melanjutkan
                    </p>
                  </div>

                  {/* Form */}
                  <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                    {error && (
                      <div className="bg-red-500/15 text-red-200 text-[12.5px] px-4 py-3 rounded-2xl border border-red-500/20 font-medium text-center animate-page-enter backdrop-blur-sm leading-relaxed">
                        {error}
                      </div>
                    )}

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="email"
                        className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="nama@email.com"
                        autoComplete="email"
                        required
                        className="bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[14px] px-5 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                      />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label
                          htmlFor="password"
                          className="text-[12.5px] font-semibold text-[#C8D8CF] tracking-[0.3px] uppercase"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={openForgotPassword}
                          className="text-[#80A19B] hover:text-[#A8CBC4] text-[11.5px] font-medium transition-colors duration-200 cursor-pointer bg-transparent border-none"
                        >
                          Lupa password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          placeholder="Masukkan password"
                          autoComplete="current-password"
                          className="w-full bg-[#2B4236] border border-[#3D5A4A] rounded-2xl py-[14px] pl-5 pr-12 text-white text-[13.5px] outline-none transition-all duration-300 placeholder-[#6E8E7D] focus:border-[#80A19B] focus:bg-[#263D30]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-[#6E8E7D] hover:text-white transition-colors cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#80A19B] hover:bg-[#93B8B1] text-[#1A2E23] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 border-none rounded-2xl py-[14px] text-[14px] font-bold cursor-pointer mt-2 transition-all duration-300 shadow-[0_4px_20px_rgba(128,161,155,0.2)] hover:shadow-[0_8px_30px_rgba(128,161,155,0.3)] tracking-[0.3px]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Masuk...
                        </span>
                      ) : "Masuk"}
                    </button>
                  </form>

                  {/* Register link */}
                  <p className="text-center text-[13px] text-[#8BA898] mt-8 leading-relaxed">
                    Belum punya akun?{" "}
                    <Link
                      to="/register"
                      className="text-[#A8CBC4] hover:text-white font-semibold transition-colors duration-200 no-underline hover:underline underline-offset-[3px]"
                    >
                      Daftar Sekarang
                    </Link>
                  </p>

                  {/* Footer Info */}
                  <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col items-center gap-1 text-[11px] text-[#6E8E7D]">
                    <p>
                      Butuh bantuan?{" "}
                      <a
                        href="mailto:222411015@mhs.polman-bandung.ac.id"
                        className="text-[#80A19B] hover:text-[#A8CBC4] transition-colors"
                      >
                        Hubungi kami
                      </a>
                    </p>
                    <a
                      href="#"
                      className="text-[#6E8E7D] hover:text-[#80A19B] transition-colors"
                    >
                      Terms & Privacy
                    </a>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
