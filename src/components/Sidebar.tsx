import React from 'react';
import {
  Home,
  Film,
  Tv,
  Radio,
  Trophy,
  Bookmark,
  Search,
  Settings,
  LogOut,
  Download,
  Sliders,
} from 'lucide-react';
import { TvTab } from '../types/iptv';
import globalPipocaLogo from '../assets/images/global_pipoca_logo.png';

interface SidebarProps {
  activeTab: TvTab;
  onSelectTab: (tab: TvTab) => void;
  onOpenSettings: () => void;
  onToggleRemote?: () => void;
  onOpenExportGuide?: () => void;
  onLogout?: () => void;
  serverConnected?: boolean;
  username?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onToggleRemote,
  onOpenExportGuide,
  onLogout,
  serverConnected = true,
  username,
}) => {
  const menuItems: { id: TvTab; label: string; icon: React.ReactNode; isAction?: boolean }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-4 h-4 shrink-0" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="w-4 h-4 shrink-0" /> },
    { id: 'series', label: 'Séries', icon: <Tv className="w-4 h-4 shrink-0" /> },
    { id: 'live', label: 'Canais ao Vivo', icon: <Radio className="w-4 h-4 shrink-0" /> },
    { id: 'sports', label: 'Futebol', icon: <Trophy className="w-4 h-4 shrink-0" /> },
    { id: 'kids', label: 'Meus Conteúdos', icon: <Bookmark className="w-4 h-4 shrink-0" /> },
    { id: 'search', label: 'Pesquisa', icon: <Search className="w-4 h-4 shrink-0" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4 shrink-0" />, isAction: true },
  ];

  return (
    <aside
      data-tv-section="sidebar"
      className="w-52 sm:w-56 md:w-60 bg-[#07080D] border-r border-white/5 flex flex-col justify-between p-3.5 sm:p-4 select-none shrink-0 z-30 h-screen overflow-y-auto no-scrollbar shadow-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Brand Logo & Title matching Reference */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-amber-400/30 shadow-lg shadow-amber-500/10 bg-black">
            <img
              src={globalPipocaLogo}
              alt="GLOBAL PIPOCA"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm sm:text-base font-black tracking-wider text-white">
              GLOBAL
            </span>
            <span className="font-display text-xs sm:text-sm font-black tracking-widest text-[#FFD700] drop-shadow">
              PIPOCA
            </span>
          </div>
        </div>

        {/* Vertical Navigation Items with strict sequential D-Pad chaining */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const prevItem = menuItems[idx - 1];
            const nextItem = menuItems[idx + 1];

            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                data-tv-focusable="true"
                data-tv-active={isActive ? 'true' : undefined}
                data-tv-next-up={prevItem ? `sidebar-item-${prevItem.id}` : undefined}
                data-tv-next-down={nextItem ? `sidebar-item-${nextItem.id}` : 'sidebar-btn-remote'}
                data-tv-next-right="hero-play-btn"
                onClick={() => {
                  if (item.isAction && item.id === 'settings') {
                    onOpenSettings();
                  } else {
                    onSelectTab(item.id);
                  }
                }}
                className={`tv-focusable flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all outline-none text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-white font-extrabold border-l-4 border-[#FFD700] shadow-sm shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 focus:bg-amber-400/20 focus:text-white'
                }`}
              >
                <span className={isActive ? 'text-[#FFD700]' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section: Tools & Server Status */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        {/* Quick Tools Buttons for TV and Testing */}
        <div className="flex items-center gap-1.5">
          {onToggleRemote && (
            <button
              id="sidebar-btn-remote"
              data-tv-focusable="true"
              data-tv-next-up="sidebar-item-settings"
              data-tv-next-right="hero-play-btn"
              data-tv-next-down="sidebar-btn-apk"
              onClick={onToggleRemote}
              title="Controle Remoto Virtual (D-Pad)"
              className="tv-focusable flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white outline-none border border-white/5"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Controle</span>
            </button>
          )}

          {onOpenExportGuide && (
            <button
              id="sidebar-btn-apk"
              data-tv-focusable="true"
              data-tv-next-up="sidebar-btn-remote"
              data-tv-next-right="hero-play-btn"
              data-tv-next-down={onLogout ? 'sidebar-btn-logout' : undefined}
              onClick={onOpenExportGuide}
              title="Exportar APK Android TV"
              className="tv-focusable flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 outline-none border border-white/5"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {onLogout && (
            <button
              id="sidebar-btn-logout"
              data-tv-focusable="true"
              data-tv-next-up="sidebar-btn-apk"
              data-tv-next-right="hero-play-btn"
              onClick={onLogout}
              title="Desconectar / Trocar Servidor"
              className="tv-focusable flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 outline-none border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Server & User Info Tag */}
        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serverConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="truncate text-zinc-400">{username || 'GLOBAL PIPOCA'}</span>
          </div>
          <span className="text-[9px] text-zinc-600 font-sans font-bold">TV 4K</span>
        </div>
      </div>
    </aside>
  );
};
