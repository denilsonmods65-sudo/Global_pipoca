import React from 'react';
import { Play, Info, Star, Clock, Plus, Check } from 'lucide-react';

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
  year = '2025',
  rating = '8.8',
  duration = '1h 55m',
  genre = 'Cinema & IPTV',
  backdropUrl = '',
  isFavorite = false,
  onPlay,
  onDetails,
  onToggleFavorite,
}) => {
  return (
    <div className="relative w-full h-[270px] sm:h-[300px] md:h-[330px] overflow-hidden select-none px-8 mb-4">
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

        {/* Cinematic Multi-stop Dark Scrims ensuring 10-foot TV legibility without clutter */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/85 to-transparent w-full md:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-black/30" />

        {/* Content Details Block */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-8 max-w-2xl z-10">
          {/* Metadata Row matching Reference 1 & 2 */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-1.5 font-medium">
            {rating && (
              <span className="flex items-center gap-1 font-extrabold text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-400/30">
                <Star className="w-3 h-3 fill-current" />
                <span>{rating}</span>
              </span>
            )}
            {year && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-semibold text-white">{year}</span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-200 border border-white/15">
              16+
            </span>
            {duration && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{duration}</span>
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FFD700] text-black">
              4K ULTRA HD
            </span>
          </div>

          {/* Cinematic Title */}
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md mb-1 line-clamp-1">
            {title}
          </h1>

          {/* Genre */}
          <p className="text-xs font-semibold text-amber-400/90 mb-1.5 truncate">
            {genre}
          </p>

          {/* Synopsis (2 lines to keep compact height) */}
          <p className="text-xs text-slate-300 line-clamp-2 mb-4 max-w-xl leading-relaxed">
            {synopsis}
          </p>

          {/* Action Buttons matching Reference 1 */}
          <div className="flex items-center gap-2.5">
            {/* Primary Watch Button */}
            <button
              id="hero-play-btn"
              data-tv-next-up="header-tab-home"
              onClick={onPlay}
              className="tv-focusable flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FFD700] hover:bg-amber-400 text-black font-extrabold text-xs tracking-wide shadow-md shadow-amber-500/25 transition-all outline-none"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>ASSISTIR AGORA</span>
            </button>

            {/* Details Button */}
            <button
              id="hero-details-btn"
              data-tv-next-up="header-tab-home"
              onClick={onDetails}
              className="tv-focusable flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/15 transition-all outline-none"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Detalhes</span>
            </button>

            {/* My List Button */}
            {onToggleFavorite && (
              <button
                id="hero-fav-btn"
                data-tv-next-up="header-tab-home"
                onClick={onToggleFavorite}
                className="tv-focusable flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs backdrop-blur-md border border-white/15 transition-all outline-none"
              >
                {isFavorite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Na Lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-slate-300" />
                    <span>Minha Lista</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
