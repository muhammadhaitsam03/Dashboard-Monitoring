import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Leaf,
  BarChart3,
  BrainCircuit,
  Shield,
  Cpu,
  Wifi
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';

/* ── Team data ─────────────────────────────────────── */
const TEAM = [
  // Row 1 (4 people)
  {
    name: 'Dr. Irfan Ardiansah, S.TP., M.T.',
    role: 'Pembimbing 1',
    initials: 'MH',
    gradient: 'from-emerald-400 to-teal-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Koko Iwan A. K, S.T.P., M.Sc., Ph.D',
    role: 'Pembimbing 2',
    initials: 'M2',
    gradient: 'from-blue-400 to-cyan-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Nadif Gasha Anugerah',
    role: 'Mahasiswa',
    initials: 'M3',
    gradient: 'from-purple-400 to-pink-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Mirza Akmal Arisyi',
    role: 'Mahasiswa',
    initials: 'M4',
    gradient: 'from-amber-400 to-orange-500',
    social: { github: '#', linkedin: '#' }
  },
  // Row 2 (3 people)
  {
    name: 'Yogi Muldani Hendrawan, S.ST., M.T., Ph.D., IPM.',
    role: 'Pembimbing 1',
    initials: 'M5',
    gradient: 'from-rose-400 to-red-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Dr. Heri Setiawan S.T., M.T.',
    role: 'Pembimbing 2',
    initials: 'M6',
    gradient: 'from-cyan-400 to-blue-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Muhammad Haitsam Hafidhulhaq',
    role: 'Mahasiswa',
    initials: 'M7',
    gradient: 'from-indigo-400 to-violet-500',
    image: '/team/Muhammad Haitsam Hafidhulhaq.jpg',
    social: { github: '#', linkedin: '#' }
  },
  // Row 3 (3 people)
  {
    name: 'Member 8',
    role: 'Pembimbing 1',
    initials: 'M8',
    gradient: 'from-pink-400 to-fuchsia-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Member 9',
    role: 'Pembimbing 2',
    initials: 'M9',
    gradient: 'from-lime-400 to-green-500',
    social: { github: '#', linkedin: '#' }
  },
  {
    name: 'Zulfan Al-Zahwan Putra Ashadi',
    role: 'Mahasiswa',
    initials: 'M0',
    gradient: 'from-yellow-400 to-amber-500',
    social: { github: '#', linkedin: '#' }
  },
];

const TEAM_ROWS = [
  { label: 'Universitas Padjadjaran', members: TEAM.slice(0, 4) },
  { label: 'Politeknik Manufaktur Bandung', members: TEAM.slice(4, 7) },
  { label: 'Universitas Islam Negeri Bandung', members: TEAM.slice(7, 10) },
];

/* ── Feature cards ─────────────────────────────────── */
const FEATURES = [
  {
    icon: BarChart3,
    title: 'Monitoring Real-time',
    desc: 'Pantau suhu, kelembapan, cahaya, pH, dan TDS secara terus-menerus melalui umpan sensor langsung dan grafik interaktif.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: BrainCircuit,
    title: 'Prediksi Berbasis AI',
    desc: 'Manfaatkan model machine learning PatchTST untuk meramalkan kondisi lingkungan hingga 7 hari ke depan.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Threshold Cerdas',
    desc: 'Atur batas peringatan otomatis untuk setiap sensor, memastikan tanaman Anda selalu berada dalam rentang optimal.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: Cpu,
    title: 'Integrasi IoT',
    desc: 'Terhubung secara mulus dengan mikrokontroler ESP32 dan infrastruktur cloud Supabase untuk aliran data yang andal.',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    icon: Wifi,
    title: 'Akses Jarak Jauh',
    desc: 'Akses data greenhouse Anda dari mana saja — desktop maupun mobile — dengan antarmuka modern yang responsif.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    icon: Leaf,
    title: 'Pertumbuhan Optimal',
    desc: 'Rekomendasi berbasis data membantu Anda menciptakan lingkungan sempurna untuk budidaya selada merah keriting secara hidroponik.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-500/10',
  },
];

import { useAuth } from '../context/AuthContext';

/* ── Component ─────────────────────────────────────── */
export default function About() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-teal-200/20 dark:bg-teal-900/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#1E463A]/5 dark:bg-[#1E463A]/15 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* ── Top Header (matches other pages) ──────────── */}
      <header className="flex justify-between items-center mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Tentang Kami</h1>

        <div className="flex items-center gap-4 md:gap-6">
          <NotificationDropdown />

          {/* Theme Toggle */}
          <div
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 rounded-full w-14 h-8 flex items-center p-1 relative cursor-pointer shadow-inner hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <div
              className={`bg-white dark:bg-gray-900 rounded-full w-6 h-6 flex justify-center items-center shadow-sm absolute transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-gray-100" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-gray-700" />
              )}
            </div>
          </div>

          <LiveClock />

          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          <div onClick={() => navigate('/account')} className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1.5 pr-4 rounded-[25px] transition-colors -mr-2">
            <div className="w-10 h-10 overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-[#cecfce] dark:border-gray-600">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'AD'
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{user?.user_metadata?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-12 pb-20">

        {/* ── Hero / Our Story Banner ─────────────────── */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2a4d3a] via-[#385344] to-[#1E463A] dark:from-[#1a3328] dark:via-[#243d2f] dark:to-[#152a20] p-8 md:p-10 lg:p-14 shadow-[0_20px_60px_rgb(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)]">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-teal-300/10 rounded-full blur-2xl"></div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative z-10 flex flex-col gap-6">
            {/* Title row */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg shrink-0">
                <Leaf className="w-7 h-7 text-emerald-300" />
              </div>
              <h2 className="text-2xl md:text-[28px] font-bold text-white tracking-tight">
                Cerita Kami
              </h2>
            </div>

            {/* Lead paragraph */}
            <p className="text-[18px] md:text-[20px] font-medium text-white/90 leading-snug max-w-3xl">
              Pertanian Indonesia besar, tapi cara kerjanya masih banyak yang tertinggal.
            </p>

            {/* Divider */}
            <div className="w-16 h-[2px] bg-emerald-400/40 rounded-full"></div>

            {/* Body paragraphs */}
            <div className="text-[14px] md:text-[15px] text-white/70 leading-[1.8] max-w-3xl space-y-4">
              <p>
                Di lapangan, keputusan budidaya sering dibuat berdasarkan perkiraan. Suhu berubah, nutrisi tidak stabil, pH bergeser — tapi semuanya baru disadari saat tanaman sudah terlanjur terdampak. Pada komoditas sensitif seperti selada merah keriting, keterlambatan kecil bisa berarti penurunan kualitas bahkan gagal panen.
              </p>
              <p>
                Greenhouse dan hidroponik seharusnya memberi kontrol. Kenyataannya, tanpa sistem monitoring yang baik, fluktuasi tetap terjadi dan data tidak benar-benar dimanfaatkan.
              </p>
              <p>
                Kami membangun sistem monitoring berbasis IoT, cloud, dan machine learning untuk mengubah proses yang reaktif menjadi proaktif. Parameter penting seperti suhu, kelembapan, pH, TDS, dan nutrisi dipantau secara real-time dan dianalisis untuk memprediksi kondisi ke depan.
              </p>
            </div>

            {/* Closing statement */}
            <p className="text-[15px] md:text-[16px] font-semibold text-emerald-300/90 italic max-w-3xl">
              Bukan sekadar menampilkan data, tapi membantu mengambil keputusan sebelum masalah terjadi.
            </p>
          </div>
        </section>

        {/* ── What We Offer ───────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-7 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <div>
              <p className="text-[11px] font-semibold text-[#1E463A]/60 dark:text-green-400/70 uppercase tracking-[0.2em] mb-1">Platform</p>
              <h2 className="text-[22px] md:text-[26px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-tight">
                Yang Kami Tawarkan
              </h2>
            </div>
          </div>

          <p className="text-[14px] md:text-[15px] text-gray-500 dark:text-gray-400 leading-[1.75] max-w-3xl mb-10">
            Kami mengkhususkan diri dalam mengubah data greenhouse menjadi wawasan yang dapat ditindaklanjuti.
            Jelajahi rangkaian alat kami yang dirancang untuk memantau, memprediksi, dan mengoptimalkan
            lingkungan hidroponik Anda dengan presisi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="relative overflow-hidden bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[22px] p-6 md:p-7 border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  {/* Soft glow */}
                  <div className={`absolute top-0 right-0 w-28 h-28 ${f.bg} opacity-40 rounded-full blur-2xl -mr-8 -mt-8 transition-opacity group-hover:opacity-60`}></div>

                  <div className={`p-3 rounded-2xl ${f.bg} shadow-sm w-fit mb-5 border border-white/50 dark:border-gray-700/30 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${f.color} stroke-[2]`} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-[1.7]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Our Team ────────────────────────────────── */}
        <section>
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-1.5 h-7 bg-[#1E463A] dark:bg-green-500 rounded-full mb-3"></div>
            <h2 className="text-[22px] md:text-[26px] font-bold text-gray-800 dark:text-gray-100 tracking-tight mb-3">
              Tim Kami
            </h2>
            <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400 max-w-md leading-[1.75]">
              Sekelompok mahasiswa yang penuh semangat, masing-masing membawa keahlian dan keterampilan
              unik untuk mendorong inovasi dan keunggulan dalam setiap proyek yang kami kerjakan.
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {TEAM_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-col items-center gap-6">
                {/* University label */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[1px] bg-gray-300 dark:bg-gray-600"></div>
                  <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
                    {row.label}
                  </h3>
                  <div className="w-8 h-[1px] bg-gray-300 dark:bg-gray-600"></div>
                </div>

                <div className="flex justify-center gap-10 md:gap-14 flex-wrap">
                  {row.members.map((member, i) => (
                    <div
                      key={member.name}
                      className="flex flex-col items-center group w-[160px]"
                      style={{ animationDelay: `${(rowIndex * 4 + i) * 80}ms`, animationFillMode: 'both' }}
                    >
                      {/* Avatar */}
                      <div className="relative mb-4">
                        <div className={`w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center shadow-lg border-[3px] border-white dark:border-gray-800 transition-transform duration-300 group-hover:scale-110 overflow-hidden`}>
                          {member.image ? (
                            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg md:text-xl tracking-wide">{member.initials}</span>
                          )}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>

                      <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 text-center leading-snug">{member.name}</h3>
                      <p className="text-[11px] font-semibold text-[#1E463A]/70 dark:text-green-400/80 uppercase tracking-wider mt-1.5">{member.role}</p>

                      {/* Social icons */}
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <a href={member.social.github} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        </a>
                        <a href={member.social.linkedin} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer Info ─────────────────────────────── */}
        <section className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[24px] p-6 md:p-8 border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">Dashboard Monitoring Greenhouse</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-[1.75]">
                Dibangun sebagai bagian dari Tugas Akhir untuk mendemonstrasikan integrasi jaringan sensor IoT,
                database cloud, dan machine learning untuk pertanian presisi. Diberdayakan oleh React,
                FastAPI, Supabase, dan PatchTST.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Versi</span>
              <span className="text-sm font-bold text-[#1E463A] dark:text-green-400">v1.0.0</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
