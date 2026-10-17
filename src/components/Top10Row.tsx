import React from 'react';
import { MovieItem, SeriesItem } from '../types/iptv';
import { Flame, Play, Star } from 'lucide-react';

interface Top10RowProps {
  items: (MovieItem | SeriesItem)[];
  onSelectItem: (item: MovieItem | SeriesItem) => void;
}

export const Top10Row: React.FC<Top10RowProps> = ({ items, onSelectItem }) => {
  return (
    <section className="relative my-5 px-8 select-none">
      {/* Title Inspired by Reference 1 */}
      <div className="flex items-baseline gap-2.5 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-white">
            TOP <span className="text-[#FFD700]">10</span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            DE HOJE
          </span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25">
          <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          <span>Mais Assistidos</span>
        </div>
      </div>

      {/* Horizontal Carousel with Giant Numbering */}
      <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-3.5 px-2 -mx-2">
        {items.slice(0, 10).map((item, index) => {
          const rank = index + 1;
          const poster =
            item.stream_icon ||
            (item as any).cover ||
            '';
          const rating = item.rating || '8.8';
          const year =
            (item as any).year || (item as any).releaseDate?.split('-')[0] || '';

          return (
            <div
              key={item.id}
              tabIndex={0}
              onClick={() => onSelectItem(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectItem(item);
                }
              }}
              className="tv-focusable tv-focus-target group relative flex-shrink-0 cursor-pointer flex items-end transition-all duration-200 outline-none"
            >
              {/* Giant Rank Number (Reference 1 style with outline) */}
              <div
                className="font-display font-black text-6xl sm:text-7xl leading-none tracking-tighter text-transparent -mr-4 sm:-mr-5 z-0 transition-transform group-focus:scale-110 select-none pointer-events-none"
                style={{
                  WebkitTextStroke: '1.5px rgba(255, 215, 0, 0.85)',
                  textShadow: '0 0 16px rgba(255, 215, 0, 0.3)',
                }}
              >
                {rank}
              </div>

              {/* Poster Card */}
              <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg z-10 transition-transform group-focus:scale-105">
                {poster ? (
                  <img
                    src={poster}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500">
                    <span className="text-[10px] text-center font-medium line-clamp-2 text-zinc-400">
                      {item.name}
                    </span>
                  </div>
                )}

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-focus:opacity-60 transition-opacity" />

                {/* Rating Badge */}
                {rating && (
                  <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[9px] font-bold bg-black/75 backdrop-blur-md text-amber-400 border border-white/10 flex items-center gap-0.5">
                    <Star className="w-2 h-2 fill-current" />
                    <span>{rating}</span>
                  </div>
                )}

                {/* Play Hint on Focus */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-9 h-9 rounded-full bg-[#FFD700] text-black flex items-center justify-center shadow-lg shadow-amber-400/40">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Bottom Title Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h4 className="font-bold text-[11px] text-white group-focus:text-amber-400 truncate leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">
                    {year ? `${year} · ` : ''}{(item as any).genre || (item as any).category_name || 'Top 10'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
