import React, { useState } from 'react';
import { SeriesItem, IptvCategory } from '../types/iptv';
import { deduplicateList } from '../services/iptvService';
import { MediaCard } from './MediaCard';

interface SeriesViewProps {
  categories: IptvCategory[];
  series: SeriesItem[];
  onSelectSeries: (series: SeriesItem) => void;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  categories,
  series,
  onSelectSeries,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const baseSeries =
    selectedCategory === 'all'
      ? series
      : series.filter((s) => s.category_id === selectedCategory);

  const filteredSeries = deduplicateList(baseSeries);

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all outline-none ${
            selectedCategory === 'all'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Todas as Séries ({series.length})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category_id;
          const count = series.filter((s) => s.category_id === cat.category_id).length;
          return (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all outline-none ${
                isSelected
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
              }`}
            >
              {cat.category_name} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Grid of Series Posters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

      {filteredSeries.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhuma série encontrada nesta categoria.
        </div>
      )}
    </div>
  );
};
