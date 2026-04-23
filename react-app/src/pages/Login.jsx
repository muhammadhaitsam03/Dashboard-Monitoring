import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      <div className="z-[2] w-full max-w-[1050px] md:h-[600px] h-auto min-h-screen md:min-h-0 p-5 flex justify-center items-center">
        <div className="bg-[#385344] w-full h-full md:rounded-[40px] rounded-[30px] flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-x-hidden md:overflow-visible overflow-y-auto">
          {/* Left Panel */}
          <div className="md:flex-[1.1] relative flex flex-col pt-[35px] px-[45px] pb-[30px] z-10 min-h-[350px]">
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

            <div className="flex items-center gap-[12px]">
              <img
                src="https://upload.wikimedia.org/wikipedia/id/9/9a/Logo_Polman_Bandung.png"
                alt="University Logo"
                className="w-[55px] h-auto"
              />
              <div className="text-[#235A8E] text-[13.5px] font-bold leading-[1.1] tracking-[0.2px]">
                <span>
                  POLITEKNIK
                  <br />
                  MANUFAKTUR
                  <br />
                  BANDUNG
                </span>
              </div>
            </div>

            <div className="flex-1 flex justify-center items-center relative mt-[10px]">
              <img
                src="/illustration.png"
                alt="Plant Monitoring"
                className="max-w-[90%] max-h-[280px] object-contain mix-blend-multiply"
              />
            </div>

            <div className="text-[#6A8678] text-[11px] leading-[1.6] mt-auto">
              <p>© 2026 POLITEKNIK MANUFAKTUR BANDUNG</p>
              <p>Powered by NOC</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="md:flex-[0.9] flex flex-col justify-center items-center p-[40px] md:p-[50px] relative z-10 w-full">
            <div className="w-full max-w-[320px] flex flex-col">
              <h1 className="text-[34px] font-semibold mb-[35px] tracking-[0.5px]">
                Login
              </h1>
              <form className="flex flex-col gap-[22px]" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-red-500/20 text-red-100 text-[13px] p-3 rounded-xl border border-red-500/30 font-medium text-center animate-page-enter backdrop-blur-sm">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-[10px]">
                  <label
                    htmlFor="email"
                    className="text-[14px] font-semibold text-white tracking-[0.2px]"
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
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="bg-[#273E31] border-none rounded-[25px] py-[16px] px-[22px] text-white text-[14px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                  />
                </div>
                <div className="flex flex-col gap-[10px]">
                  <label
                    htmlFor="password"
                    className="text-[14px] font-semibold text-white tracking-[0.2px]"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full bg-[#273E31] border-none rounded-[25px] py-[16px] pl-[22px] pr-[55px] text-white text-[14px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[18px] text-[#9BB0A5] hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <a
                    href="#"
                    className="self-end text-[#9BB0A5] hover:text-white text-[12px] underline underline-offset-2 mt-[-2px] transition-colors duration-200"
                  >
                    Forgot Password?
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#80A19B] hover:bg-[#92b6af] text-[#193026] hover:-translate-y-[2px] disabled:opacity-75 disabled:hover:translate-y-0 border-none rounded-[25px] p-[15px] text-[16px] font-semibold cursor-pointer mt-[15px] transition-all duration-300 shadow-[0_4px_15px_rgba(128,161,155,0.25)] hover:shadow-[0_6px_20px_rgba(128,161,155,0.35)]"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
              <p className="text-center text-[13px] text-[#9BB0A5] mt-[30px] leading-[1.6]">
                Don't have an account?
                <br />
                <Link
                  to="/register"
                  className="text-white hover:no-underline underline underline-offset-[3px]"
                >
                  Register Now
                </Link>
              </p>

              <div className="mt-[60px] flex flex-col items-center gap-[35px] text-[11.5px] text-[#799C8A]">
                <a
                  href="#"
                  className="text-[#799C8A] hover:text-[#9ECBB4] underline underline-offset-2"
                >
                  Terms and Services
                </a>
                <p className="md:absolute md:bottom-[35px] md:right-[45px] text-center md:text-right leading-[1.6] md:mt-0 mt-[20px]">
                  Have a problem? Contact us at
                  <br />
                  <a
                    href="mailto:222411015@mhs.polman-bandung.ac.id"
                    className="text-[#799C8A] hover:text-[#9ECBB4]"
                  >
                    222411015@mhs.polman-bandung.ac.id
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
