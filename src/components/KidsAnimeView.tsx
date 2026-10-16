import React, { useState } from 'react';
import { LiveChannel, MovieItem, SeriesItem } from '../types/iptv';
import { MediaCard } from './MediaCard';
import { Sparkles, Play, Tv } from 'lucide-react';

interface KidsAnimeViewProps {
  channels: LiveChannel[];
  movies: MovieItem[];
  series: SeriesItem[];
  onSelectMovie: (item: MovieItem) => void;
  onSelectSeries: (item: SeriesItem) => void;
  onSelectChannel: (channel: LiveChannel) => void;
}

export const KidsAnimeView: React.FC<KidsAnimeViewProps> = ({
  channels,
  movies,
  series,
  onSelectMovie,
  onSelectSeries,
  onSelectChannel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kids' | 'anime'>('kids');

  const isKidsMatch = (text: string) => {
    const t = text.toLowerCase();
    return (
      t.includes('kid') ||
      t.includes('infantil') ||
      t.includes('desenho') ||
      t.includes('família') ||
      t.includes('familia') ||
      t.includes('animacao') ||
      t.includes('animação') ||
      t.includes('disney') ||
      t.includes('cartoon')
    );
  };

  const isAnimeMatch = (text: string) => {
    const t = text.toLowerCase();
    return (
      t.includes('anime') ||
      t.includes('otaku') ||
      t.includes('crunchyroll') ||
      t.includes('manga') ||
      t.includes('japão') ||
      t.includes('japan')
    );
  };

  const currentMatcher = activeSubTab === 'kids' ? isKidsMatch : isAnimeMatch;

  const relevantChannels = channels.filter(
    (c) => currentMatcher(c.name) || currentMatcher(c.category_name || '')
  );

  const relevantMovies = movies.filter(
    (m) =>
      currentMatcher(m.name) ||
      currentMatcher(m.category_name || '') ||
      currentMatcher(m.genre || '')
  );

  const relevantSeries = series.filter(
    (s) =>
      currentMatcher(s.name) ||
      currentMatcher(s.category_name || '') ||
      currentMatcher(s.genre || '')
  );

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveSubTab('kids')}
          className={`tv-focusable px-6 py-2.5 rounded-2xl text-sm font-extrabold transition-all outline-none ${
            activeSubTab === 'kids'
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Kids & Família
        </button>
        <button
          onClick={() => setActiveSubTab('anime')}
          className={`tv-focusable px-6 py-2.5 rounded-2xl text-sm font-extrabold transition-all outline-none ${
            activeSubTab === 'anime'
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Anime & Mangá
        </button>
      </div>

      {/* Relevant Live Channels */}
      {relevantChannels.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-3">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Canais Ao Vivo</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {relevantChannels.map((ch) => (
              <div
                key={ch.id}
                tabIndex={0}
                onClick={() => onSelectChannel(ch)}
                className="tv-focusable p-3 rounded-xl bg-[#14161C] border border-white/5 hover:border-amber-400/40 focus:border-amber-400 cursor-pointer flex items-center gap-3 transition-all outline-none"
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

      {/* Relevant Movies */}
      {relevantMovies.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white mb-3">
            {activeSubTab === 'kids' ? 'Filmes Infantis & Família' : 'Filmes de Anime'}
          </h3>
          <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
            {relevantMovies.map((movie) => (
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

      {/* Relevant Series */}
      {relevantSeries.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display font-bold text-lg text-white mb-3">
            {activeSubTab === 'kids' ? 'Desenhos & Séries Kids' : 'Séries de Anime'}
          </h3>
          <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
            {relevantSeries.map((s) => (
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

      {relevantChannels.length === 0 && relevantMovies.length === 0 && relevantSeries.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhum conteúdo específico encontrado nesta seção no catálogo atual.
        </div>
      )}
    </div>
  );
};
