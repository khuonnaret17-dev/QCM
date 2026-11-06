import React from 'react';
import { LogOut, Volume2, VolumeX, Shield, User, Play, Settings, Users } from 'lucide-react';
import { UserSession } from '../types';
import { toKhmerNum } from '../utils/khmer';

interface NavbarProps {
  session: UserSession;
  activeTab: 'play' | 'admin';
  onTabChange: (tab: 'play' | 'admin') => void;
  onLogout: () => void;
  onlineCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeTab,
  onTabChange,
  onLogout,
  onlineCount,
  isMuted,
  onToggleMute,
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => onTabChange('play')}>
            <div className="relative">
              <img
                src="https://i.postimg.cc/0ygmLdvR/3QCM_Ep4.png"
                alt="Logo"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400 shadow-md object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-moul text-xs sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 whitespace-nowrap">
                  MASTER QUIZ
                </span>
                <span className="px-1 sm:px-1.5 py-0.5 rounded bg-red-600/80 text-[9px] sm:text-[10px] font-bold text-white tracking-wider">
                  KH
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-kantumruy hidden md:block">
                ប្រព័ន្ធធ្វើតេស្តត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋ
              </p>
            </div>
          </div>

          {/* Center Tabs: Only for Admin */}
          {session.role === 'admin' ? (
            <div className="flex items-center bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('play')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
                  activeTab === 'play'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">📊 ធ្វើតេស្ត</span>
                <span className="xs:hidden">តេស្ត</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">⚙️ គ្រប់គ្រង</span>
                <span className="xs:hidden">គ្រប់គ្រង</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-amber-300 font-medium bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full">
              <span>វិញ្ញាសាត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋកម្ពុជា</span>
            </div>
          )}

          {/* Right Actions: Sound, Online Counter, User info, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Online Indicator */}
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-1.5 sm:px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5" />
              <span className="font-semibold">{toKhmerNum(onlineCount || 1)}</span>
              <span className="hidden md:inline text-[10px] text-emerald-300">Online</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'បើកសំឡេង SFX' : 'បិទសំឡេង SFX'}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
            </button>

            {/* Role Badge */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-800/90 border border-slate-700 px-1.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs max-w-[90px] sm:max-w-none">
              {session.role === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold text-rose-300 hidden sm:inline truncate">{session.username}</span>
                  <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] sm:text-[10px] font-bold border border-rose-800">
                    ADMIN
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-cyan-200 truncate max-w-[60px] sm:max-w-[120px]">{session.username}</span>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="ចាកចេញ (Logout)"
              className="p-1.5 sm:p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white transition border border-red-800/50"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
