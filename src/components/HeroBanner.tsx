import React from 'react';
import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
  title: string;
  synopsis: string;
  year?: string;
  rating?: string | number;
  duration?: string;
  genre?: string;
  backdropUrl?: string;
  isFavorite?: boolean;
  onPlay: () => void;
  onDetails: () => void;
  onToggleFavorite?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  synopsis,
  backdropUrl = '',
  onPlay,
  onDetails,
}) => {
  return (
    <div
      data-tv-section="hero"
      className="relative w-full h-[220px] sm:h-[250px] md:h-[280px] overflow-hidden select-none px-6 sm:px-8 mb-3"
    >
      {/* Background Container with Smooth Film Vignette */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#0E1015] shadow-2xl">
        {/* Dynamic Key Art Image */}
        {backdropUrl ? (
          <img
            key={backdropUrl}
            src={backdropUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-opacity duration-300 animate-fade-in"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-black" />
        )}

        {/* Cinematic Multi-stop Dark Scrims matching Reference */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0E] via-[#090A0E]/85 to-transparent w-full md:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0E] via-transparent to-black/30" />

        {/* Content Details Block */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 md:p-7 max-w-2xl z-10">
          {/* Badge: FILME EM DESTAQUE matching reference screenshot */}
          <div className="mb-2">
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#E50914] text-white shadow-sm">
              FILME EM DESTAQUE
            </span>
          </div>

          {/* Cinematic Big Title */}
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md mb-1.5 uppercase line-clamp-1">
            {title}
          </h1>

          {/* Synopsis (2 lines to keep compact height) */}
          <p className="text-xs text-slate-300 line-clamp-2 mb-3.5 max-w-xl leading-relaxed">
            {synopsis}
          </p>

          {/* Action Buttons matching Reference */}
          <div className="flex items-center gap-2.5">
            {/* Primary Watch Button (Solid Red) */}
            <button
              id="hero-play-btn"
              data-tv-next-left="sidebar-item-home"
              data-tv-next-up="header-search-btn"
              onClick={onPlay}
              className="tv-focusable flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-red-600/30 transition-all outline-none"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Assistir</span>
            </button>

            {/* Details Button */}
            <button
              id="hero-details-btn"
              data-tv-next-up="header-search-btn"
              onClick={onDetails}
              className="tv-focusable flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/15 transition-all outline-none"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Mais Informações</span>
            </button>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
