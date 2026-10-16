import React, { useState } from 'react';
import { MovieItem, IptvCategory } from '../types/iptv';
import { MediaCard } from './MediaCard';
import { Film } from 'lucide-react';

interface MoviesViewProps {
  categories: IptvCategory[];
  movies: MovieItem[];
  onSelectMovie: (movie: MovieItem) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  categories,
  movies,
  onSelectMovie,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMovies =
    selectedCategory === 'all'
      ? movies
      : movies.filter((m) => m.category_id === selectedCategory);

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
          Todos os Filmes ({movies.length})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category_id;
          const count = movies.filter((m) => m.category_id === cat.category_id).length;
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

      {/* Grid of Posters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

      {filteredMovies.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhum filme encontrado nesta categoria.
        </div>
      )}
    </div>
  );
};
