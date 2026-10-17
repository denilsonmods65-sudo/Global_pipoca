import React, { useState, useEffect } from 'react';
import { TvTab } from '../types/iptv';
import { Search, Settings, Radio, Tv, Popcorn, Clock } from 'lucide-react';

interface HeaderProps {
  activeTab: TvTab;
  onSelectTab: (tab: TvTab) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleRemote: () => void;
  onOpenExportGuide: () => void;
  onLogout?: () => void;
  serverConnected: boolean;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  onOpenSettings,
  onToggleRemote,
  onOpenExportGuide,
  onLogout,
  serverConnected,
  username,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: TvTab; label: string }[] = [
    { id: 'home', label: 'Início' },
    { id: 'movies', label: 'Global Filmes' },
    { id: 'series', label: 'Global Séries' },
    { id: 'live', label: 'TV ao Vivo' },
    { id: 'sports', label: 'Futebol & Jogos' },
    { id: 'kids', label: 'Kids & Anime' },
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-6 px-8 py-3.5 bg-[#090A0D]/95 backdrop-blur-md border-b border-white/5">
      {/* Zone 1: Wordmark Brand GLOBAL PIPOCA */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          id="header-brand-btn"
          data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
          onClick={() => onSelectTab('home')}
          className="tv-focusable flex items-center gap-2.5 group text-left outline-none focus:scale-105 transition-transform"
        >
          {/* Glowing Popcorn Cinema Emblem */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-[#FFD700] to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/40">
            <Popcorn className="w-5 h-5 text-black fill-black/20" />
            <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-pulse pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-wider text-white whitespace-nowrap leading-tight">
              GLOBAL <span className="text-[#FFD700]">PIPOCA</span>
            </span>
            <span className="text-[9px] font-bold text-amber-400/80 tracking-widest uppercase">
              Cinema & IPTV Android TV
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Horizontal Navigation Categories */}
      <nav className="hidden lg:flex items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`header-tab-${tab.id}`}
              data-tv-active-tab={isActive ? 'true' : undefined}
              data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
              onClick={() => onSelectTab(tab.id)}
              className={`tv-focusable px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 outline-none ${
                isActive
                  ? 'bg-[#FFD700] text-black font-extrabold shadow-md shadow-amber-400/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 focus:bg-[#FFD700] focus:text-black'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Clock, Search & Remote */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live TV Clock */}
        {timeString && (
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeString}</span>
          </div>
        )}

        {/* Search */}
        <button
          id="header-search-btn"
          data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
          onClick={onOpenSearch}
          title="Pesquisar Catálogo (Controle Remoto)"
          className={`tv-focusable p-2 rounded-xl transition-colors outline-none ${
            activeTab === 'search'
              ? 'bg-[#FFD700] text-black'
              : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-[#FFD700] focus:text-black'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Virtual TV Remote Toggle */}
        <button
          id="header-remote-btn"
          data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
          onClick={onToggleRemote}
          title="Controle Remoto Virtual (D-Pad)"
          className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-amber-300 hover:bg-amber-500/20 focus:bg-[#FFD700] focus:text-black transition-colors whitespace-nowrap outline-none"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Controle TV</span>
        </button>

        {/* Android TV APK Guide */}
        <button
          id="header-apk-btn"
          data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
          onClick={onOpenExportGuide}
          title="Exportar APK Android TV"
          className="tv-focusable hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 focus:bg-[#FFD700] focus:text-black transition-colors whitespace-nowrap outline-none"
        >
          <Tv className="w-3.5 h-3.5 text-emerald-400" />
          <span>APK TV</span>
        </button>

        {/* Server & Settings / Switch Account */}
        <button
          id="header-settings-btn"
          data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
          onClick={onOpenSettings}
          title="Servidor Conectado - Clique para Gerenciar"
          className="tv-focusable flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 focus:bg-[#FFD700] focus:text-black transition-colors whitespace-nowrap outline-none"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              serverConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span className="max-w-[90px] truncate">{username || 'IPTV'}</span>
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Direct Disconnect / Switch Server Button */}
        {onLogout && (
          <button
            id="header-logout-btn"
            data-tv-next-down={activeTab === 'home' ? 'hero-play-btn' : undefined}
            onClick={onLogout}
            title="Desconectar e Trocar de Servidor"
            className="tv-focusable px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white focus:bg-rose-500 focus:text-white transition-all whitespace-nowrap outline-none"
          >
            Trocar Servidor
          </button>
        )}
      </div>
    </header>
  );
};
