import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaRowProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export const MediaRow: React.FC<MediaRowProps> = ({ title, badge, children }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative my-6 px-8 group/row">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-100">
            {title}
          </h3>
          {badge && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {badge}
            </span>
          )}
        </div>

        {/* Mouse Navigation Arrows */}
        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-slate-300 hover:text-white transition-colors"
            title="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-slate-300 hover:text-white transition-colors"
            title="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-3.5 px-2 -mx-2"
      >
        {children}
      </div>
    </section>
  );
};
