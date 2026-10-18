import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface MediaRowProps {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  onSeeAll?: () => void;
  children: React.ReactNode;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  icon,
  onSeeAll,
  children,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative my-3 sm:my-3.5 px-6 sm:px-8 group/row select-none">
      {/* Row Header matching Reference */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-white">{icon}</span>}
          <h3 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
            {title}
          </h3>
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="tv-focusable text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 outline-none transition-colors"
          >
            <span>Ver tudo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-2.5 px-1 -mx-1"
      >
        {children}
      </div>
    </section>
  );
};
