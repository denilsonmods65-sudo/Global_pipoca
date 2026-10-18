import React, { useState } from 'react';
import { Film, Tv } from 'lucide-react';

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
  type = 'movie',
  progress,
  aspectRatio = 'poster',
  onClick,
  onFocus,
}) => {
  const [imgError, setImgError] = useState(false);

  const isLandscape = aspectRatio === 'landscape' || progress !== undefined;

  return (
    <div
      tabIndex={0}
      data-media-id={id}
      data-tv-focusable="true"
      onClick={onClick}
      onFocus={onFocus}
      className={`tv-focusable tv-focus-target group relative flex-shrink-0 cursor-pointer flex flex-col transition-all duration-200 select-none outline-none ${
        isLandscape ? 'w-44 sm:w-48' : 'w-24 sm:w-28 md:w-[120px]'
      }`}
    >
      {/* Poster / Thumbnail Container with 2:3 aspect ratio */}
      <div
        className={`relative w-full rounded-xl overflow-hidden bg-[#14161C] border border-white/10 shadow-md ${
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
          <div className="w-full h-full flex flex-col items-center justify-center p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500">
            {type === 'live' ? (
              <Tv className="w-6 h-6 text-red-500/70 mb-1" />
            ) : (
              <Film className="w-6 h-6 text-red-500/70 mb-1" />
            )}
            <span className="text-[9px] text-center font-bold line-clamp-2 text-zinc-400 leading-tight">
              {title}
            </span>
          </div>
        )}

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-focus:opacity-40 transition-opacity" />

        {/* Rating or Live tag */}
        {rating && (
          <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-bold bg-black/80 backdrop-blur-md text-amber-400 border border-white/10">
            ★ {rating}
          </div>
        )}

        {/* Continue Watching Progress Bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-[#E50914]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Title Cleanly Displayed Below the Poster matching Reference */}
      <div className="pt-1.5 px-0.5">
        <h4 className="font-semibold text-[11px] sm:text-xs text-slate-200 truncate group-focus:text-white transition-colors leading-tight">
          {title}
        </h4>
      </div>
    </div>
  );
};
