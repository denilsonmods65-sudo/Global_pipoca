import React from 'react';
import { MovieItem, SeriesItem, LiveChannel } from '../types/iptv';
import { Play, Info, Star, Radio, Flame, Sparkles, Film, Tv } from 'lucide-react';

interface HighlightsMosaicProps {
  featuredMovie?: MovieItem | null;
  featuredSeries?: SeriesItem | null;
  featuredChannel?: LiveChannel | null;
  secondaryMovie?: MovieItem | null;
  onSelectMovie: (movie: MovieItem) => void;
  onSelectSeries: (series: SeriesItem) => void;
  onSelectChannel: (channel: LiveChannel) => void;
  onFocusItem?: (item: MovieItem | SeriesItem) => void;
}

export const HighlightsMosaic: React.FC<HighlightsMosaicProps> = ({
  featuredMovie,
  featuredSeries,
  featuredChannel,
  secondaryMovie,
  onSelectMovie,
  onSelectSeries,
  onSelectChannel,
  onFocusItem,
}) => {
  // If no items are loaded from the IPTV server, don't render an empty mosaic
  if (!featuredMovie && !featuredSeries && !featuredChannel && !secondaryMovie) {
    return null;
  }

  return (
    <section className="relative px-8 my-6 select-none animate-fade-in">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-pulse" />
          <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-wide">
            MOSAICO DE <span className="text-[#FFD700]">DESTAQUES</span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
            <Sparkles className="w-3 h-3 text-[#FFD700]" />
            Seleção Especial
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium hidden md:block">
          Navegue com o D-pad do controle remoto
        </p>
      </div>

      {/* Asymmetric TV Mosaic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Main Large Spotlight Card: Featured Movie (Spans 7 cols) */}
        {featuredMovie && (
          <div
            tabIndex={0}
            data-tv-focusable="true"
            onClick={() => onSelectMovie(featuredMovie)}
            onFocus={() => onFocusItem && onFocusItem(featuredMovie)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectMovie(featuredMovie);
              }
            }}
            className="tv-focusable tv-focus-target group relative md:col-span-7 h-56 sm:h-64 rounded-2xl overflow-hidden cursor-pointer bg-[#12141A] border border-white/10 transition-all duration-200 outline-none hover:border-amber-400/50 focus:border-[#FFD700] focus:scale-[1.01] focus:shadow-xl focus:shadow-amber-500/20"
          >
            {/* Backdrop / Poster Art */}
            {featuredMovie.backdrop_path || featuredMovie.stream_icon ? (
              <img
                src={featuredMovie.backdrop_path || featuredMovie.stream_icon}
                alt={featuredMovie.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <Film className="w-12 h-12 text-zinc-700" />
              </div>
            )}

            {/* Cinematic Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10]/90 via-[#0B0C10]/40 to-transparent w-4/5" />

            {/* Badge Top Left */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-[#FFD700] text-black tracking-wide shadow-md shadow-amber-500/30">
                <Flame className="w-3 h-3 fill-black text-black" />
                CINEMA EM ALTA
              </span>
              {featuredMovie.rating && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 backdrop-blur-md text-amber-400 border border-white/10">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>{featuredMovie.rating}</span>
                </span>
              )}
            </div>

            {/* Play Button Indicator on Focus */}
            <div className="absolute top-3 right-3 opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-[#FFD700] text-black flex items-center justify-center shadow-lg shadow-amber-400/40">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>

            {/* Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-semibold mb-1">
                <span>{featuredMovie.year || 'Filme'}</span>
                {featuredMovie.genre && (
                  <>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-zinc-300 truncate max-w-[200px]">{featuredMovie.genre}</span>
                  </>
                )}
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-white/10 text-white font-bold">4K</span>
              </div>
              <h3 className="font-display font-black text-base sm:text-xl text-white group-focus:text-[#FFD700] transition-colors line-clamp-1 leading-snug">
                {featuredMovie.name}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed max-w-xl">
                {featuredMovie.plot || 'Disponível no catálogo do seu servidor IPTV.'}
              </p>
            </div>
          </div>
        )}

        {/* Right Column Stack: Live Channel + Trending Series / Secondary Movie (Spans 5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3.5 sm:gap-4">
          {/* Tile A: Live Channel Highlight */}
          {featuredChannel ? (
            <div
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectChannel(featuredChannel)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectChannel(featuredChannel);
                }
              }}
              className="tv-focusable tv-focus-target group relative h-26 sm:h-[120px] rounded-2xl overflow-hidden cursor-pointer bg-[#12141A] border border-white/10 p-3.5 flex items-center justify-between gap-3.5 transition-all duration-200 outline-none hover:border-amber-400/50 focus:border-[#FFD700] focus:scale-[1.01] focus:shadow-xl focus:shadow-amber-500/20"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Channel Icon or Fallback */}
                <div className="relative w-14 h-14 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {featuredChannel.stream_icon ? (
                    <img
                      src={featuredChannel.stream_icon}
                      alt={featuredChannel.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Tv className="w-6 h-6 text-amber-400" />
                  )}
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </div>

                {/* Channel Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white tracking-wider flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" /> AO VIVO
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {featuredChannel.category_name || 'TV Aberta & Fechada'}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white group-focus:text-[#FFD700] truncate transition-colors">
                    {featuredChannel.name}
                  </h4>
                  <p className="text-[10px] text-amber-400/80 font-medium">Sintonizar Canal Imediato</p>
                </div>
              </div>

              {/* Play Button */}
              <div className="w-9 h-9 rounded-full bg-white/10 group-focus:bg-[#FFD700] text-white group-focus:text-black flex items-center justify-center shrink-0 transition-colors">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          ) : null}

          {/* Tile B: Trending Series or Secondary Movie */}
          {featuredSeries ? (
            <div
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectSeries(featuredSeries)}
              onFocus={() => onFocusItem && onFocusItem(featuredSeries)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSeries(featuredSeries);
                }
              }}
              className="tv-focusable tv-focus-target group relative h-26 sm:h-[120px] rounded-2xl overflow-hidden cursor-pointer bg-[#12141A] border border-white/10 transition-all duration-200 outline-none hover:border-amber-400/50 focus:border-[#FFD700] focus:scale-[1.01] focus:shadow-xl focus:shadow-amber-500/20"
            >
              {featuredSeries.cover || featuredSeries.stream_icon ? (
                <img
                  src={featuredSeries.cover || featuredSeries.stream_icon}
                  alt={featuredSeries.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/70 to-transparent w-4/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent" />

              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-[#FFD700] border border-amber-400/30">
                    SÉRIE EM ALTA
                  </span>
                  {featuredSeries.rating && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {featuredSeries.rating}
                    </span>
                  )}
                </div>
                <h4 className="font-display font-bold text-sm text-white group-focus:text-[#FFD700] truncate transition-colors">
                  {featuredSeries.name}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {featuredSeries.genre || featuredSeries.category_name || 'Temporadas Completas'}
                </p>
              </div>
            </div>
          ) : secondaryMovie ? (
            <div
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectMovie(secondaryMovie)}
              onFocus={() => onFocusItem && onFocusItem(secondaryMovie)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMovie(secondaryMovie);
                }
              }}
              className="tv-focusable tv-focus-target group relative h-26 sm:h-[120px] rounded-2xl overflow-hidden cursor-pointer bg-[#12141A] border border-white/10 transition-all duration-200 outline-none hover:border-amber-400/50 focus:border-[#FFD700] focus:scale-[1.01] focus:shadow-xl focus:shadow-amber-500/20"
            >
              {secondaryMovie.backdrop_path || secondaryMovie.stream_icon ? (
                <img
                  src={secondaryMovie.backdrop_path || secondaryMovie.stream_icon}
                  alt={secondaryMovie.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/70 to-transparent w-4/5" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-[#FFD700] border border-amber-400/30 w-fit mb-1">
                  FILME RECOMENDADO
                </span>
                <h4 className="font-display font-bold text-sm text-white group-focus:text-[#FFD700] truncate transition-colors">
                  {secondaryMovie.name}
                </h4>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
