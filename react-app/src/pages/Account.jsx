import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sun,
  Moon,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Check,
  Loader2,
  AlertCircle,
  Camera,
  Upload,
  Save
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl animate-slide-up z-[100] border ${
      type === 'success' 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500/20 dark:text-emerald-400' 
        : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/30 dark:border-rose-500/20 dark:text-rose-400'
    }`}>
      {type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
    </div>
  );
};

const SettingRow = ({ label, value, onChange, type = "text", isPassword, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2 py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 group">
      <label className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center">
        <input
          type={isPassword && !showPassword ? "password" : "text"}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-50/50 dark:bg-gray-800/40 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-[#1E463A] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl px-4 py-3.5 outline-none transition-all text-[15px] font-semibold text-gray-800 dark:text-gray-200"
        />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function Account() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user, signOut, refreshUser, updateUserState } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Administrator',
    email: '',
    password: '',
    currentPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'Administrator',
        email: user.email || '',
        password: '',
        currentPassword: ''
      });
      setAvatarPreview(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // 1. Verification for sensitive changes
      const isSensitiveChange = formData.email !== user.email || formData.password !== '';
      if (isSensitiveChange) {
        if (!formData.currentPassword) {
          throw new Error("Password saat ini diperlukan untuk mengubah email atau kata sandi.");
        }
        // Verify current password by attempting sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword
        });
        if (verifyError) throw new Error("Kata sandi saat ini tidak valid.");
      }

      let finalAvatarUrl = user.user_metadata?.avatar_url || null;

      // 2. Upload Avatar if a NEW file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        finalAvatarUrl = publicUrl;
      }

      // 3. Prepare the update object
      const updateData = {
        data: { 
          full_name: formData.name,
          role: formData.role,
          avatar_url: finalAvatarUrl
        }
      };

      // Include email/password in the same update call if they changed
      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // 4. Perform Consolidated Update
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser(updateData);
      if (updateError) throw updateError;

      // 5. Success Message
      if (formData.email !== user.email) {
        setToast({ type: 'success', message: "Profile saved! Check your new email for confirmation." });
      } else {
        setToast({ type: 'success', message: "Profile updated successfully!" });
      }

      // 6. Force Refresh Global State
      // Update local state immediately for instant sync
      if (updatedUser) updateUserState(updatedUser);
      // Also refresh from server as a safety measure
      await refreshUser();
      
      setAvatarFile(null);
      setFormData(prev => ({ ...prev, currentPassword: '', password: '' }));
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const isDirty = (
    formData.name !== (user?.user_metadata?.full_name || '') ||
    formData.email !== (user?.email || '') ||
    formData.role !== (user?.user_metadata?.role || 'Administrator') ||
    formData.password !== '' ||
    avatarFile !== null
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden px-6 md:px-10 lg:px-14 py-6 md:py-8 animate-page-enter relative z-0">
      
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[700px] h-[700px] bg-blue-200/10 dark:bg-blue-900/10 rounded-full blur-[140px] -z-10 pointer-events-none"></div>

      <header className="flex justify-between items-center mb-6 mt-2 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Pengaturan Akun</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kelola informasi profil dan keamanan Anda</p>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <NotificationDropdown />

          <div
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 rounded-full w-14 h-8 flex items-center p-1 relative cursor-pointer shadow-inner hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <div className={`bg-white dark:bg-gray-900 rounded-full w-6 h-6 flex justify-center items-center shadow-sm absolute transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
              {isDark ? <Moon className="w-3.5 h-3.5 text-gray-100" /> : <Sun className="w-3.5 h-3.5 text-gray-700" />}
            </div>
          </div>

          <LiveClock />

          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

          <div onClick={() => navigate('/account')} className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1.5 pr-4 rounded-[25px] transition-colors -mr-2">
            <div className="w-10 h-10 overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-[#cecfce] dark:border-gray-600">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
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

      <div className="max-w-7xl mx-auto w-full flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-10">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#1a1f2e] rounded-[32px] p-8 border border-gray-100 dark:border-gray-700/40 shadow-xl shadow-black/[0.02] dark:shadow-none flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <span className="text-4xl font-black text-indigo-400/50 uppercase tracking-tighter">
                      {formData.name?.[0] || 'A'}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-2 -right-2 bg-[#1E463A] dark:bg-emerald-600 text-white p-3 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-gray-800"
                >
                  <Camera size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{formData.name || 'User'}</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mb-6">{formData.email}</p>
              
              <div className="w-full h-px bg-gray-100 dark:bg-gray-700/50 mb-6"></div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Status Akun</span>
                  <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Aktif</span>
                </div>
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Peran</span>
                  <span className="text-gray-800 dark:text-gray-300 font-bold">{formData.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleLogout}
                className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold py-4 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-500/20"
              >
                Sign Out
              </button>

              {isDirty && (
                <button 
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="w-full bg-[#1E463A] dark:bg-emerald-600 hover:bg-[#15342a] dark:hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#1E463A]/20 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 animate-fade-in"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Information Sections */}
          <div className="lg:col-span-8 space-y-8">
            
            <section>
              <div className="flex items-center gap-3 mb-5 ml-2">
                <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Informasi Dasar</h2>
              </div>
              
              <div className="bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100 dark:border-gray-700/40 shadow-xl shadow-black/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                  <SettingRow 
                    label="Nama Lengkap" 
                    value={formData.name} 
                    onChange={(val) => setFormData(p => ({...p, name: val}))}
                    placeholder="Masukkan nama lengkap"
                  />
                  <SettingRow 
                    label="Peran / Role" 
                    value={formData.role} 
                    onChange={(val) => setFormData(p => ({...p, role: val}))}
                    placeholder="Contoh: Administrator, Staff"
                  />
                  <div className="md:col-span-2">
                    <SettingRow 
                      label="Alamat Email" 
                      value={formData.email} 
                      onChange={(val) => setFormData(p => ({...p, email: val}))}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-5 ml-2">
                <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Keamanan Akun</h2>
              </div>
              
              <div className="bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100 dark:border-gray-700/40 shadow-xl shadow-black/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                  <SettingRow 
                    label="Kata Sandi Saat Ini" 
                    value={formData.currentPassword} 
                    isPassword={true}
                    onChange={(val) => setFormData(p => ({...p, currentPassword: val}))}
                    placeholder="Wajib untuk ubah email/sandi"
                  />
                  <SettingRow 
                    label="Kata Sandi Baru" 
                    value={formData.password} 
                    isPassword={true}
                    onChange={(val) => setFormData(p => ({...p, password: val}))}
                    placeholder="Isi untuk mengubah sandi"
                  />
                </div>
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium ml-1">
                  Gunakan kata sandi saat ini untuk memverifikasi perubahan email atau kata sandi baru.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}


