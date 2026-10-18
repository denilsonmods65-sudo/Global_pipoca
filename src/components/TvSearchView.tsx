import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Film, Tv, Keyboard, Smartphone } from 'lucide-react';
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
  // Prevent duplicate keyboards: choose either 'virtual' (D-Pad onscreen) or 'native' (Android TV Gboard/Voice)
  const [keyboardMode, setKeyboardMode] = useState<'virtual' | 'native'>('virtual');
  const inputRef = useRef<HTMLInputElement>(null);

  // TV On-Screen Virtual Keyboard keys for D-pad typing convenience
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

  useEffect(() => {
    if (keyboardMode === 'native') {
      inputRef.current?.focus();
    }
  }, [keyboardMode]);

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
    <div
      data-tv-section="search-view"
      className="px-6 sm:px-8 py-5 max-w-7xl mx-auto animate-fade-in select-none"
    >
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E50914]" />
          <input
            ref={inputRef}
            type="text"
            id="search-input-field"
            value={query}
            readOnly={keyboardMode === 'virtual'}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              keyboardMode === 'virtual'
                ? 'Navegue pelas letras do teclado virtual abaixo com o controle...'
                : 'Digite ou dite pelo microfone do controle da TV...'
            }
            data-tv-next-down={keyboardMode === 'virtual' ? 'key-A' : 'search-results-first'}
            className="tv-focusable w-full pl-11 pr-12 py-3 rounded-2xl bg-[#12141A] border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-[#E50914] outline-none transition-all shadow-md"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="tv-focusable absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Keyboard Strategy Switch Button (Guarantees one single keyboard strategy at a time) */}
        <button
          onClick={() => {
            setKeyboardMode((m) => (m === 'virtual' ? 'native' : 'virtual'));
          }}
          className="tv-focusable flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold outline-none border border-white/10 whitespace-nowrap"
          title="Alternar modo do teclado"
        >
          {keyboardMode === 'virtual' ? (
            <>
              <Smartphone className="w-4 h-4 text-[#E50914]" />
              <span>Usar Teclado Nativo da TV (Voz)</span>
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4 text-[#E50914]" />
              <span>Usar Teclado em Tela (D-Pad)</span>
            </>
          )}
        </button>
      </div>

      {/* On-Screen Virtual Keyboard (Only rendered in virtual mode to prevent double keyboard overlap) */}
      {keyboardMode === 'virtual' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0F1116] border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Teclado em Tela (Navegue com as setas e confirme com OK)</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {keyRows.map((row, rIdx) => (
              <div key={rIdx} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {row.map((k) => (
                  <button
                    key={k}
                    id={`key-${k}`}
                    onClick={() => handleVirtualKey(k)}
                    className={`tv-focusable px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all outline-none ${
                      k === 'ESPAÇO' || k === 'APAGAR' || k === 'LIMPAR'
                        ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                        : 'bg-zinc-800/80 text-white hover:bg-[#E50914] focus:bg-[#E50914] focus:text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      {normalized && (
        <div className="mb-4 text-xs font-semibold text-slate-400">
          Resultados encontrados: <span className="text-white font-bold">{totalResults}</span>
        </div>
      )}

      {/* Filtered Channels */}
      {filteredChannels.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2 mb-2.5">
            <Tv className="w-4 h-4 text-[#E50914]" />
            <span>Canais ao Vivo ({filteredChannels.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredChannels.map((ch, idx) => (
              <button
                key={ch.id}
                id={idx === 0 ? 'search-results-first' : undefined}
                onClick={() => onSelectChannel(ch)}
                className="tv-focusable flex items-center gap-2.5 p-2 rounded-xl bg-[#12141A] border border-white/10 text-left outline-none hover:border-[#E50914] focus:border-[#E50914]"
              >
                <div className="w-9 h-9 rounded-lg bg-black/60 flex items-center justify-center shrink-0 overflow-hidden p-1">
                  {ch.stream_icon ? (
                    <img
                      src={ch.stream_icon}
                      alt={ch.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Tv className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-white truncate">{ch.name}</span>
                  <span className="text-[9px] text-slate-400 truncate block">
                    {ch.category_name || 'Canal'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Movies */}
      {filteredMovies.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2 mb-2.5">
            <Film className="w-4 h-4 text-[#E50914]" />
            <span>Filmes ({filteredMovies.length})</span>
          </h3>
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-2">
            {filteredMovies.map((m) => (
              <MediaCard
                key={m.id}
                id={m.id}
                title={m.name}
                imageUrl={m.stream_icon}
                rating={m.rating}
                year={m.year}
                type="movie"
                onClick={() => onSelectMovie(m)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtered Series */}
      {filteredSeries.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2 mb-2.5">
            <Tv className="w-4 h-4 text-[#E50914]" />
            <span>Séries ({filteredSeries.length})</span>
          </h3>
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-2">
            {filteredSeries.map((s) => (
              <MediaCard
                key={s.id}
                id={s.id}
                title={s.name}
                imageUrl={s.cover || s.stream_icon}
                rating={s.rating}
                type="series"
                onClick={() => onSelectSeries(s)}
              />
            ))}
          </div>
        </div>
      )}

      {normalized && totalResults === 0 && (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm">Nenhum resultado encontrado para &quot;{query}&quot;.</p>
        </div>
      )}
    </div>
  );
};
