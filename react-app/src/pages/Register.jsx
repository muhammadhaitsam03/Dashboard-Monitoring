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
      setError("Passwords do not match.");
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
        setError("Registration successful! Check your email to verify your account before logging in. If email confirmation is disabled, you can log in now.");
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

      <div className="z-[2] w-full max-w-[1050px] md:h-[650px] h-auto min-h-screen md:min-h-0 p-5 flex justify-center items-center">
        <div className="bg-[#385344] w-full h-full md:rounded-[40px] rounded-[30px] flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-x-hidden md:overflow-visible overflow-y-auto">
          {/* Left Panel */}
          <div className="md:flex-[1.1] relative flex flex-col pt-[35px] px-[45px] pb-[30px] z-10 min-h-[250px] md:min-h-[350px]">
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
                className="max-w-[70%] max-h-[200px] md:max-w-[90%] md:max-h-[280px] object-contain mix-blend-multiply"
              />
            </div>

            <div className="text-[#6A8678] text-[11px] leading-[1.6] mt-auto hidden md:block">
              <p>© 2026 POLITEKNIK MANUFAKTUR BANDUNG</p>
              <p>Powered by NOC</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="md:flex-[0.9] flex flex-col justify-center items-center p-[30px] md:p-[40px] relative z-10 w-full py-[40px]">
            <div className="w-full max-w-[320px] flex flex-col">
              <h1 className="text-[34px] font-semibold mb-[25px] tracking-[0.5px]">
                Register
              </h1>
              <form className="flex flex-col gap-[16px]" onSubmit={handleRegister}>
                {error && (
                  <div className={`text-[13px] p-3 rounded-xl border font-medium text-center animate-page-enter backdrop-blur-sm ${error.includes('successful') ? 'bg-green-500/20 text-green-100 border-green-500/30' : 'bg-red-500/20 text-red-100 border-red-500/30'}`}>
                    {error}
                  </div>
                )}
                
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-white tracking-[0.2px]">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Full name"
                    required
                    className="bg-[#273E31] border-none rounded-[25px] py-[14px] px-[20px] text-white text-[13px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-white tracking-[0.2px]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter email address"
                    required
                    className="bg-[#273E31] border-none rounded-[25px] py-[14px] px-[20px] text-white text-[13px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-white tracking-[0.2px]">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Create a password"
                      required
                      className="w-full bg-[#273E31] border-none rounded-[25px] py-[14px] pl-[20px] pr-[50px] text-white text-[13px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[16px] text-[#9BB0A5] hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-white tracking-[0.2px]">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Confirm password"
                      required
                      className="w-full bg-[#273E31] border-none rounded-[25px] py-[14px] pl-[20px] pr-[50px] text-white text-[13px] outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] placeholder-[#9BB0A5] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_0_0_2px_rgba(255,255,255,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-[16px] text-[#9BB0A5] hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#80A19B] hover:bg-[#92b6af] text-[#193026] hover:-translate-y-[2px] disabled:opacity-75 disabled:hover:translate-y-0 border-none rounded-[25px] p-[14px] text-[15px] font-semibold cursor-pointer mt-[10px] transition-all duration-300 shadow-[0_4px_15px_rgba(128,161,155,0.25)] hover:shadow-[0_6px_20px_rgba(128,161,155,0.35)]"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              <p className="text-center text-[13px] text-[#9BB0A5] mt-[25px] leading-[1.6]">
                Already have an account?
                <br />
                <Link
                  to="/login"
                  className="text-white hover:no-underline underline underline-offset-[3px]"
                >
                  Login Here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
