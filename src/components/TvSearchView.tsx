import React, { useState } from 'react';
import { Search, X, Film, Tv, Play } from 'lucide-react';
import { LiveChannel, MovieItem, SeriesItem } from '../types/iptv';
import { MediaCard } from './MediaCard';

interface TvSearchViewProps {
  channels: LiveChannel[];
  movies: MovieItem[];
  series: SeriesItem[];
  onSelectMovie: (item: MovieItem) => void;
  onSelectSeries: (item: SeriesItem) => void;
  onSelectChannel: (channel: LiveChannel) => void;
  onClose: () => void;
}

export const TvSearchView: React.FC<TvSearchViewProps> = ({
  channels,
  movies,
  series,
  onSelectMovie,
  onSelectSeries,
  onSelectChannel,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  // TV On-Screen Virtual Keyboard letters for D-pad typing convenience
  const keyRows = [
    ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3'],
    ['G', 'H', 'I', 'J', 'K', 'L', '4', '5', '6'],
    ['M', 'N', 'O', 'P', 'Q', 'R', '7', '8', '9'],
    ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
    ['ESPAÇO', 'APAGAR', 'LIMPAR'],
  ];

  const handleVirtualKey = (key: string) => {
    if (key === 'ESPAÇO') {
      setQuery((q) => q + ' ');
    } else if (key === 'APAGAR') {
      setQuery((q) => q.slice(0, -1));
    } else if (key === 'LIMPAR') {
      setQuery('');
    } else {
      setQuery((q) => q + key);
    }
  };

  const normalized = query.trim().toLowerCase();

  const filteredChannels = normalized
    ? channels.filter((c) => c.name.toLowerCase().includes(normalized))
    : [];

  const filteredMovies = normalized
    ? movies.filter(
        (m) =>
          m.name.toLowerCase().includes(normalized) ||
          m.genre?.toLowerCase().includes(normalized) ||
          m.cast?.toLowerCase().includes(normalized)
      )
    : [];

  const filteredSeries = normalized
    ? series.filter(
        (s) =>
          s.name.toLowerCase().includes(normalized) ||
          s.genre?.toLowerCase().includes(normalized) ||
          s.cast?.toLowerCase().includes(normalized)
      )
    : [];

  const totalResults =
    filteredChannels.length + filteredMovies.length + filteredSeries.length;

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      {/* Search Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o nome do filme, série, canal ou ator..."
            className="tv-focusable w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#14161C] border border-white/10 text-white placeholder-zinc-500 text-base focus:border-amber-400 outline-none transition-all shadow-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="tv-focusable absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* On-Screen Virtual Keyboard for Remote D-Pad */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 mb-8">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">
          Teclado Virtual TV (Navegue com o Controle Remoto)
        </span>
        <div className="space-y-2">
          {keyRows.map((row, rIdx) => (
            <div key={rIdx} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {row.map((k) => (
                <button
                  key={k}
                  onClick={() => handleVirtualKey(k)}
                  className={`tv-focusable px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all outline-none ${
                    k === 'ESPAÇO' || k === 'APAGAR' || k === 'LIMPAR'
                      ? 'bg-white/10 text-amber-300 hover:bg-white/20'
                      : 'bg-zinc-800/80 text-white hover:bg-amber-400 hover:text-black focus:bg-amber-400 focus:text-black'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {normalized && (
        <div className="mb-4 text-xs font-semibold text-slate-400">
          Resultados encontrados: <span className="text-amber-400 font-bold">{totalResults}</span>
        </div>
      )}

      {/* Filtered Channels */}
      {filteredChannels.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-3">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Canais ao Vivo ({filteredChannels.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredChannels.map((ch) => (
              <div
                key={ch.id}
                tabIndex={0}
                onClick={() => onSelectChannel(ch)}
                className="tv-focusable p-3 rounded-xl bg-zinc-900 border border-white/5 hover:border-amber-400/40 focus:border-amber-400 cursor-pointer flex items-center gap-3 transition-all outline-none"
              >
                <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-semibold text-white truncate">{ch.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{ch.category_name || 'TV'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Movies */}
      {filteredMovies.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-amber-400" />
            <span>Filmes ({filteredMovies.length})</span>
          </h3>
          <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
            {filteredMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                title={movie.name}
                imageUrl={movie.stream_icon}
                rating={movie.rating}
                year={movie.year}
                subtitle={movie.genre}
                type="movie"
                onClick={() => onSelectMovie(movie)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtered Series */}
      {filteredSeries.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-3">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Séries ({filteredSeries.length})</span>
          </h3>
          <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
            {filteredSeries.map((s) => (
              <MediaCard
                key={s.id}
                id={s.id}
                title={s.name}
                imageUrl={s.cover}
                rating={s.rating}
                year={s.releaseDate?.split('-')[0]}
                subtitle={s.genre}
                type="series"
                onClick={() => onSelectSeries(s)}
              />
            ))}
          </div>
        </div>
      )}

      {normalized && totalResults === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhum conteúdo encontrado para &quot;{query}&quot;. Tente outro termo de busca.
        </div>
      )}
    </div>
  );
};
