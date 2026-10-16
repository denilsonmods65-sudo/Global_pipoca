import React, { useState } from 'react';
import { SportsMatch, LiveChannel } from '../types/iptv';
import { Trophy, Calendar, Radio, Tv, Play } from 'lucide-react';

interface SportsScheduleViewProps {
  matches: SportsMatch[];
  liveChannels: LiveChannel[];
  onTuneChannel: (channel: LiveChannel) => void;
  onPlayDirect: (streamUrl: string, title: string) => void;
}

export const SportsScheduleView: React.FC<SportsScheduleViewProps> = ({
  matches,
  liveChannels,
  onTuneChannel,
  onPlayDirect,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  const filteredMatches = matches.filter((m) => {
    if (filter === 'today') return m.matchDate === 'today';
    if (filter === 'upcoming') return m.matchDate === 'upcoming';
    return true;
  });

  const handleMatchClick = (match: SportsMatch) => {
    // Find matching live channel in user's IPTV channels
    const foundChannel = liveChannels.find(
      (ch) =>
        ch.name.toLowerCase().includes(match.channelName.toLowerCase()) ||
        match.channelName.toLowerCase().includes(ch.name.toLowerCase())
    );

    if (foundChannel) {
      onTuneChannel(foundChannel);
    } else {
      // Find any sports channel or play demo live stream
      const genericSports = liveChannels.find((ch) => ch.category_id === 'esportes') || liveChannels[0];
      if (genericSports) {
        onTuneChannel(genericSports);
      } else {
        onPlayDirect(
          'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
          `${match.homeTeam} x ${match.awayTeam} (${match.channelName})`
        );
      }
    }
  };

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto">
      {/* Sports Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8 h-64 sm:h-80">
        <img
          src="/src/assets/images/noctra_sports_live_1792121162613.jpg"
          alt="Futebol e Jogos ao Vivo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/80 to-transparent w-full md:w-3/5" />
        <div className="absolute inset-0 p-8 flex flex-col justify-end max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Futebol & Competições Ao Vivo</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Programação Esportiva Oficial
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Acompanhe as transmissões dos principais campeonatos nacionais e internacionais com canais integrados.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none ${
            filter === 'all'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Todas as Partidas ({matches.length})
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none ${
            filter === 'today'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Jogos de Hoje
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none ${
            filter === 'upcoming'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
          }`}
        >
          Próximos Jogos
        </button>
      </div>

      {/* Match Cards Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((m) => {
            const isLive = m.status === 'live';
            return (
              <div
                key={m.id}
                tabIndex={0}
                onClick={() => handleMatchClick(m)}
                className="tv-focusable tv-focus-target group rounded-2xl bg-[#14161C] border border-white/5 p-5 hover:border-amber-400/40 focus:border-amber-400 transition-all cursor-pointer outline-none relative overflow-hidden"
              >
                {/* Competition Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-slate-400 mb-4">
                  <span className="font-semibold text-slate-300 truncate max-w-[200px]">
                    {m.competition}
                  </span>
                  {isLive ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                      <Radio className="w-3 h-3" />
                      AO VIVO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Calendar className="w-3 h-3" />
                      {m.timeDisplay}
                    </span>
                  )}
                </div>

                {/* Score / Teams Clash */}
                <div className="flex items-center justify-between gap-4 my-2">
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center font-bold text-base text-white mb-1.5 shadow">
                      {m.homeTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm text-slate-100 block truncate">
                      {m.homeTeam}
                    </span>
                  </div>

                  {/* Score or VS */}
                  <div className="px-3 text-center">
                    {isLive || m.status === 'finished' ? (
                      <div className="font-mono font-black text-xl text-amber-400 tracking-wider">
                        {m.scoreHome} : {m.scoreAway}
                      </div>
                    ) : (
                      <span className="font-display font-black text-xs text-slate-500 uppercase tracking-widest">
                        VS
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center font-bold text-base text-white mb-1.5 shadow">
                      {m.awayTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm text-slate-100 block truncate">
                      {m.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Footer Channel Link */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>{m.channelName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:text-amber-300">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Sintonizar</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          Nenhuma partida encontrada no momento.
        </div>
      )}
    </div>
  );
};
