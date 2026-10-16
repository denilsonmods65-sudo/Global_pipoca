import React, { useState } from 'react';
import { LiveChannel, IptvCategory } from '../types/iptv';
import { Tv, Play, Star, Radio } from 'lucide-react';
import { MediaCard } from './MediaCard';

interface LiveChannelsViewProps {
  categories: IptvCategory[];
  channels: LiveChannel[];
  onPlayChannel: (channel: LiveChannel) => void;
}

export const LiveChannelsView: React.FC<LiveChannelsViewProps> = ({
  categories,
  channels,
  onPlayChannel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredChannels =
    selectedCategory === 'all'
      ? channels
      : channels.filter((c) => c.category_id === selectedCategory);

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
          Todos os Canais ({channels.length})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category_id;
          const count = channels.filter((c) => c.category_id === cat.category_id).length;
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

      {/* Channel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredChannels.map((ch) => (
          <div
            key={ch.id}
            tabIndex={0}
            onClick={() => onPlayChannel(ch)}
            className="tv-focusable tv-focus-target group rounded-2xl bg-[#14161C] border border-white/5 p-4 hover:border-amber-400/40 focus:border-amber-400 cursor-pointer transition-all outline-none flex items-center gap-4 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-focus:scale-105 transition-transform">
              {ch.stream_icon ? (
                <img
                  src={ch.stream_icon}
                  alt={ch.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Tv className="w-6 h-6 text-amber-400/50" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Ao Vivo
                </span>
                {ch.num && (
                  <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                    CH {ch.num}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-sm text-slate-100 group-focus:text-amber-400 truncate transition-colors">
                {ch.name}
              </h4>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {ch.category_name || 'Programação Ao Vivo'}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-white/5 group-focus:bg-amber-400 group-focus:text-black text-amber-400 flex items-center justify-center shrink-0 transition-colors">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhum canal encontrado nesta categoria.
        </div>
      )}
    </div>
  );
};
