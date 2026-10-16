import React, { useState } from 'react';
import { Play, Star, Film, Tv } from 'lucide-react';

interface MediaCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  rating?: string | number;
  year?: string;
  subtitle?: string;
  type?: 'movie' | 'series' | 'live' | 'sports';
  progress?: number; // 0 to 100 for continue watching
  remainingMinutes?: number;
  aspectRatio?: 'poster' | 'landscape';
  onClick: () => void;
  onFocus?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  imageUrl,
  rating,
  year,
  subtitle,
  type = 'movie',
  progress,
  remainingMinutes,
  aspectRatio = 'poster',
  onClick,
  onFocus,
}) => {
  const [imgError, setImgError] = useState(false);

  const isLandscape = aspectRatio === 'landscape' || type === 'live' || progress !== undefined;

  return (
    <div
      tabIndex={0}
      data-media-id={id}
      data-tv-focusable="true"
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`tv-focusable tv-focus-target group relative flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-[#13151B] border border-white/5 transition-all duration-200 select-none outline-none ${
        isLandscape ? 'w-48 sm:w-56 md:w-60' : 'w-28 sm:w-32 md:w-36'
      }`}
    >
      {/* Poster / Thumbnail Container */}
      <div
        className={`relative w-full overflow-hidden bg-[#181A22] ${
          isLandscape ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500">
            {type === 'live' ? (
              <Tv className="w-7 h-7 text-amber-400/50 mb-1.5" />
            ) : (
              <Film className="w-7 h-7 text-amber-400/50 mb-1.5" />
            )}
            <span className="text-[10px] text-center font-medium line-clamp-2 text-zinc-400 leading-tight">
              {title}
            </span>
          </div>
        )}

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D10] via-black/20 to-transparent opacity-80 group-focus:opacity-60 transition-opacity" />

        {/* Rating or Live tag */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          {type === 'live' ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white tracking-wider animate-pulse">
              AO VIVO
            </span>
          ) : rating ? (
            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-black/80 backdrop-blur-md text-amber-400 border border-white/10">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{rating}</span>
            </span>
          ) : null}
        </div>

        {/* Play Icon Hint on Focus */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-black/40">
          <div className="w-10 h-10 rounded-full bg-[#FFD700] text-black flex items-center justify-center shadow-lg shadow-amber-500/30 scale-90 group-focus:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Continue Watching Progress Bar (Reference 1 style) */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-[#FFD700]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-2 sm:p-2.5">
        <h4 className="font-bold text-xs text-slate-100 line-clamp-1 group-focus:text-[#FFD700] transition-colors leading-tight">
          {title}
        </h4>
        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
          <div className="flex items-center gap-1 truncate">
            {year && <span>{year}</span>}
            {year && subtitle && <span aria-hidden="true">·</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
          {remainingMinutes !== undefined && remainingMinutes > 0 && (
            <span className="text-amber-400 font-mono text-[9px] shrink-0 font-semibold">
              {remainingMinutes}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
