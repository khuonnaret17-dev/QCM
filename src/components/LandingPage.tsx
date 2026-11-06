import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Send, AlertCircle, ArrowRight, X } from 'lucide-react';
import { recordLogin } from '../services/firebase';
import { UserSession } from '../types';

interface LandingPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [activeModal, setActiveModal] = useState<'member' | 'admin' | null>(null);

  // Member form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [memberError, setMemberError] = useState('');

  // Admin form state
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');

  // Validate member passcode: 6 digits, starts with 20, ends with 26
  const validateMemberPasscode = (code: string): boolean => {
    return /^20\d{2}26$/.test(code);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    if (!username.trim()) {
      setMemberError('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ (Username)!');
      return;
    }

    if (!password.trim()) {
      setMemberError('សូមបញ្ចូលលេខសម្ងាត់ ៦ខ្ទង់!');
      return;
    }

    if (!validateMemberPasscode(password)) {
      setMemberError('លេខសម្ងាត់មិនត្រឹមត្រូវ! ត្រូវតែមាន ៦ខ្ទង់ ចាប់ផ្ដើមដោយ ២០ និងបញ្ចប់ដោយ ២៦ (ឧ. 201126)');
      return;
    }

    const session: UserSession = {
      username: username.trim(),
      role: 'user',
      loggedInAt: new Date().toISOString(),
    };

    await recordLogin(session.username, password, 'user');
    onLoginSuccess(session);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (adminCode.trim() !== '168') {
      setAdminError('លេខកូដ Master Code មិនត្រឹមត្រូវទេ! (Code: 168)');
      return;
    }

    const session: UserSession = {
      username: 'Admin Master',
      role: 'admin',
      loggedInAt: new Date().toISOString(),
    };

    await recordLogin('Admin Master', adminCode, 'admin');
    onLoginSuccess(session);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Video Animation */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-network-of-lines-and-dots-12966-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark Slate Radial Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/90 to-slate-950 z-0 pointer-events-none" />

      {/* Royal Header Section */}
      <header className="relative z-10 w-full max-w-5xl mx-auto pt-8 px-4 text-center">
        {/* Kingdom Header */}
        <div className="flex flex-col items-center justify-center space-y-1 mb-4">
          <p className="font-moul text-amber-300 text-lg sm:text-2xl tracking-wider drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
            ព្រះរាជាណាចក្រកម្ពុជា
          </p>
          <p className="font-siemreap text-amber-200/90 text-sm sm:text-base font-semibold tracking-widest flex items-center gap-2">
            <span>ជាតិ</span> • <span>សាសនា</span> • <span>ព្រះមហាក្សត្រ</span>
          </p>
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1" />
        </div>

        {/* Logo with bounce & glow */}
        <div className="flex justify-center my-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-red-600 to-yellow-500 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-700 animate-pulse" />
            <img
              src="https://i.postimg.cc/0ygmLdvR/3QCM_Ep4.png"
              alt="Master Quiz KH Logo"
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-amber-400/90 shadow-2xl object-cover animate-bounce [animation-duration:3s]"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-moul text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-wide drop-shadow-md">
          MASTER QUIZ KH
        </h1>
        <p className="mt-2 text-slate-300 font-kantumruy text-sm sm:text-base max-w-2xl mx-auto font-medium">
          ប្រព័ន្ធគ្រប់គ្រង និងធ្វើតេស្តសមត្ថភាពត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋ (QCM, Q&A, ពន្យល់ពាក្យ & AI)
        </p>
      </header>

      {/* Main Role Selection Section */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <p className="text-amber-300/90 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 bg-slate-900/80 px-4 py-1.5 rounded-full border border-amber-500/30 backdrop-blur">
          សូមជ្រើសរើសតួនាទីដើម្បីចូលប្រព័ន្ធ
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          {/* Member Card (Blue) */}
          <div
            onClick={() => setActiveModal('member')}
            className="card-running-blue rounded-2xl p-[2px] cursor-pointer group transform hover:-translate-y-1.5 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20"
          >
            <div className="relative z-10 bg-slate-900/90 hover:bg-slate-900/95 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center backdrop-blur-md border border-cyan-500/30">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <UserCheck className="w-9 h-9" />
              </div>
              <h2 className="font-moul text-xl sm:text-2xl text-cyan-300 mb-2">
                សមាជិក (Member)
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                សម្រាប់បេក្ខជនធ្វើតេស្តសមត្ថភាព ហ្វឹកហាត់វិញ្ញាសា QCM, Q&A និងស្វែងយល់វាក្យសព្ទរដ្ឋបាល
              </p>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md group-hover:shadow-cyan-500/40 transition-all"
              >
                <span>ចូលធ្វើតេស្ត</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Card (Red) */}
          <div
            onClick={() => setActiveModal('admin')}
            className="card-running-red rounded-2xl p-[2px] cursor-pointer group transform hover:-translate-y-1.5 transition-all duration-300 shadow-xl hover:shadow-rose-500/20"
          >
            <div className="relative z-10 bg-slate-900/90 hover:bg-slate-900/95 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center backdrop-blur-md border border-red-500/30">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="font-moul text-xl sm:text-2xl text-rose-300 mb-2">
                ADMIN (អ្នកគ្រប់គ្រង)
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                សម្រាប់អ្នកគ្រប់គ្រង បញ្ចូលវិញ្ញាសាថ្មី បង្កើតសំណួរតាម AI និង Export ឯកសារ PDF
              </p>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md group-hover:shadow-rose-500/40 transition-all"
              >
                <span>ចូលផ្ទាំងគ្រប់គ្រង</span>
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Telegram Links */}
      <footer className="relative z-10 w-full py-6 px-4 text-center border-t border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <p className="text-xs text-slate-400 mb-2">
          Master Quiz KH • ប្រព័ន្ធត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋកម្ពុជា
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <a
            href="https://t.me/Naret26?direct"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ទាក់ទង Admin Telegram</span>
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="https://t.me/qcm_and_q_a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ក្រុម Telegram QCM & Q&A</span>
          </a>
        </div>
      </footer>

      {/* Modal: Member Login */}
      {activeModal === 'member' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-moul text-lg text-cyan-300">ចូលជាសមាជិក (Member)</h3>
                <p className="text-xs text-slate-400">វាយ Username និងលេខកូដ ៦ខ្ទង់</p>
              </div>
            </div>

            {memberError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleMemberLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ឈ្មោះអ្នកប្រើប្រាស់ (Username) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ឧ. បូរ៉ា ឬ Dara"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  លេខសម្ងាត់ ៦ខ្ទង់ (Passcode) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ឧ. 201126 ឬ 209926"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-widest focus:outline-none focus:border-cyan-500 transition"
                />
                <p className="text-[11px] text-amber-300/80 mt-1.5">
                  * លក្ខខណ្ឌកូដ៖ ៦ខ្ទង់ ចាប់ផ្ដើមដោយ <strong className="text-amber-200">20</strong> និងបញ្ចប់ដោយ <strong className="text-amber-200">26</strong> (ឧ. 201126)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
              >
                <span>ផ្ទៀងផ្ទាត់ និងចូលធ្វើតេស្ត</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">មិនទាន់មានលេខសម្ងាត់សមាជិក?</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href="https://t.me/Naret26?direct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ទាក់ទង Admin សុំកូដ</span>
                </a>
                <a
                  href="https://t.me/qcm_and_q_a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ក្រុម QCM & Q&A</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Login */}
      {activeModal === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/40 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-moul text-lg text-rose-300">ផ្ទាំងគ្រប់គ្រង (Admin)</h3>
                <p className="text-xs text-slate-400">បញ្ចូលលេខកូដ Master Code របស់អ្នកគ្រប់គ្រង</p>
              </div>
            </div>

            {adminError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Master Code សម្ងាត់ <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="បញ្ចូលលេខកូដ 168"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:border-red-500 transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-medium text-sm transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>ផ្ទៀងផ្ទាត់ និងចូលគ្រប់គ្រង</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
