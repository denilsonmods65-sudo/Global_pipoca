import React, { useState, useEffect } from 'react';
import { MovieItem, SeriesEpisode, SeriesInfo, SeriesItem, WatchProgress } from '../types/iptv';
import { IptvService } from '../services/iptvService';
import { Play, ArrowLeft, Star, Clock, Calendar, Check, Film, Tv, List } from 'lucide-react';
import { MediaCard } from './MediaCard';

interface MediaDetailsModalProps {
  item: MovieItem | SeriesItem | null;
  isSeries?: boolean;
  onClose: () => void;
  onPlay: (streamUrl: string, title: string, episodeMeta?: { seriesId: string; seasonNum: number; episodeNum: number; episodeTitle: string }) => void;
  onSelectRelated: (item: MovieItem | SeriesItem, isSeries?: boolean) => void;
  relatedItems?: (MovieItem | SeriesItem)[];
}

export const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  item,
  isSeries = false,
  onClose,
  onPlay,
  onSelectRelated,
  relatedItems = [],
}) => {
  const iptvService = IptvService.getInstance();
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('1');
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    if (!item) return;

    setIsFavorite(iptvService.isFavorite(item.id));

    if (isSeries) {
      const sItem = item as SeriesItem;
      // If it already has seasons preloaded (e.g. demo)
      if (sItem.seasons && Object.keys(sItem.seasons).length > 0) {
        setSeriesInfo({
          seasons: Object.keys(sItem.seasons).map((k) => ({ season_number: Number(k), name: `Temporada ${k}` })),
          info: {},
          episodes: sItem.seasons,
        });
        setSelectedSeason(Object.keys(sItem.seasons)[0]);
      } else {
        // Fetch from Xtream API
        setLoadingEpisodes(true);
        iptvService
          .getSeriesInfo(sItem.series_id)
          .then((info) => {
            setSeriesInfo(info);
            const seasonKeys = Object.keys(info.episodes);
            if (seasonKeys.length > 0) {
              setSelectedSeason(seasonKeys[0]);
            }
          })
          .catch(() => {
            // Ignore error gracefully
          })
          .finally(() => {
            setLoadingEpisodes(false);
          });
      }
    }
  }, [item, isSeries, iptvService]);

  if (!item) return null;

  const movie = !isSeries ? (item as MovieItem) : null;
  const series = isSeries ? (item as SeriesItem) : null;

  const title = item.name;
  const backdrop =
    movie?.backdrop_path ||
    (series?.backdrop_path && series.backdrop_path[0]) ||
    item.stream_icon ||
    (series as any)?.cover ||
    '/src/assets/images/noctra_hero_cinematic_1792121162420.jpg';

  const poster = item.stream_icon || (series as any)?.cover || backdrop;
  const rating = item.rating || '8.5';
  const year = movie?.year || series?.releaseDate?.split('-')[0] || '2024';
  const genre = movie?.genre || series?.genre || 'Geral';
  const plot = movie?.plot || series?.plot || 'Sinopse não informada pelo provedor.';
  const cast = movie?.cast || series?.cast;
  const director = movie?.director || series?.director;
  const duration = movie?.duration || series?.episode_run_time || '110 min';

  // Check watch progress
  const watchProgress: WatchProgress | undefined = iptvService.getWatchProgress(item.id);

  const handleToggleFavorite = () => {
    const updated = iptvService.toggleFavorite(item.id);
    setIsFavorite(updated);
  };

  const handlePrimaryPlay = () => {
    if (!isSeries) {
      const url = movie?.stream_url || iptvService.getStreamUrl('movie', movie?.stream_id || '');
      onPlay(url, title);
    } else {
      // Play first episode of selected season or resume
      const episodes = seriesInfo?.episodes[selectedSeason] || [];
      if (episodes.length > 0) {
        const firstEp = episodes[0];
        onPlay(firstEp.stream_url || '', `${title} - T${selectedSeason}:E${firstEp.episode_num} ${firstEp.title}`, {
          seriesId: String(series?.series_id),
          seasonNum: Number(selectedSeason),
          episodeNum: firstEp.episode_num,
          episodeTitle: firstEp.title,
        });
      }
    }
  };

  const currentEpisodes: SeriesEpisode[] =
    isSeries && seriesInfo && seriesInfo.episodes[selectedSeason]
      ? seriesInfo.episodes[selectedSeason]
      : [];

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0B0E]/95 backdrop-blur-xl animate-fade-in"
    >
      {/* Top Bar with Back Button */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-[#0A0B0E]/80 backdrop-blur-md border-b border-white/5">
        <button
          onClick={onClose}
          className="tv-focusable flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
          <span className="text-xs text-slate-400 ml-1">(Esc / Back)</span>
        </button>

        <span className="font-display font-bold text-amber-400 text-sm tracking-wide">
          NOCTRA PLAY · DETALHES
        </span>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/60 mb-8 shadow-2xl">
          {/* Backdrop Image */}
          <div className="relative w-full h-[320px] sm:h-[400px] overflow-hidden">
            <img
              src={backdrop}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1015] via-[#0F1015]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1015] via-transparent to-transparent w-1/2" />
          </div>

          {/* Details Overlay Content */}
          <div className="relative p-8 -mt-44 z-10 flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Thumbnail */}
            <div className="w-44 sm:w-56 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black aspect-[2/3]">
              <img
                src={poster}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Column */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mb-2">
                <span className="flex items-center gap-1 font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{rating}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{year}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{duration}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">
                  {isSeries ? 'SÉRIE COMPLETA' : 'FILME 4K'}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                {title}
              </h1>

              <p className="text-sm font-semibold text-amber-300 mb-4">{genre}</p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl mb-6">
                {plot}
              </p>

              {/* Cast & Director */}
              {(cast || director) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 border-t border-white/10 pt-4 mb-6">
                  {director && (
                    <div>
                      <span className="font-bold text-slate-200">Direção:</span> {director}
                    </div>
                  )}
                  {cast && (
                    <div>
                      <span className="font-bold text-slate-200">Elenco:</span> {cast}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handlePrimaryPlay}
                  className="tv-focusable flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FFD700] hover:bg-amber-400 text-black font-extrabold text-base tracking-wide shadow-xl shadow-amber-500/25 transition-all outline-none"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{watchProgress ? 'CONTINUAR ASSISTINDO' : 'ASSISTIR AGORA'}</span>
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="tv-focusable flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/15 transition-all outline-none"
                >
                  <Check className={`w-4 h-4 ${isFavorite ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{isFavorite ? 'Na Minha Lista' : 'Adicionar à Lista'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Series Seasons & Episodes Section */}
        {isSeries && (
          <div className="mb-10 p-6 rounded-2xl bg-zinc-900/40 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <List className="w-5 h-5 text-amber-400" />
                <span>Temporadas e Episódios</span>
              </h3>
            </div>

            {/* Season Selector Tabs */}
            {seriesInfo && Object.keys(seriesInfo.episodes).length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                  {Object.keys(seriesInfo.episodes).map((seasonKey) => {
                    const isSelected = selectedSeason === seasonKey;
                    return (
                      <button
                        key={seasonKey}
                        onClick={() => setSelectedSeason(seasonKey)}
                        className={`tv-focusable px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all outline-none ${
                          isSelected
                            ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 focus:bg-amber-400 focus:text-black'
                        }`}
                      >
                        Temporada {seasonKey}
                      </button>
                    );
                  })}
                </div>

                {/* Episodes List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      tabIndex={0}
                      onClick={() =>
                        onPlay(ep.stream_url || '', `${title} - T${selectedSeason}:E${ep.episode_num} ${ep.title}`, {
                          seriesId: String(series?.series_id),
                          seasonNum: Number(selectedSeason),
                          episodeNum: ep.episode_num,
                          episodeTitle: ep.title,
                        })
                      }
                      className="tv-focusable flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-amber-400/40 focus:border-amber-400 group cursor-pointer transition-all outline-none"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 group-focus:bg-amber-400 group-focus:text-black text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {ep.episode_num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm text-slate-100 group-focus:text-amber-400 truncate">
                            {ep.title}
                          </h4>
                          {ep.info?.duration && (
                            <span className="text-xs text-slate-400 shrink-0">
                              {ep.info.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {ep.info?.plot || 'Reproduzir episódio da temporada.'}
                        </p>
                      </div>
                      <div className="self-center p-2 rounded-full bg-white/5 group-focus:bg-amber-400 group-focus:text-black text-slate-400">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : loadingEpisodes ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Carregando lista de episódios do servidor...</p>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-sm">
                Lista de episódios não disponível diretamente para esta série.
              </div>
            )}
          </div>
        )}

        {/* Recomendações: Você Também Pode Gostar */}
        {relatedItems.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-4">
              Você Também Pode Gostar
            </h3>
            <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
              {relatedItems.slice(0, 8).map((rel) => (
                <MediaCard
                  key={rel.id}
                  id={rel.id}
                  title={rel.name}
                  imageUrl={rel.stream_icon || (rel as any).cover}
                  rating={rel.rating}
                  year={(rel as any).year || (rel as any).releaseDate?.split('-')[0]}
                  subtitle={(rel as any).genre}
                  type={isSeries ? 'series' : 'movie'}
                  onClick={() => onSelectRelated(rel, isSeries)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
