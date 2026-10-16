/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IptvService } from './services/iptvService';
import {
  LiveChannel,
  MovieItem,
  SeriesItem,
  TvTab,
  WatchProgress,
} from './types/iptv';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { HighlightsMosaic } from './components/HighlightsMosaic';
import { Top10Row } from './components/Top10Row';
import { MediaRow } from './components/MediaRow';
import { MediaCard } from './components/MediaCard';
import { MediaDetailsModal } from './components/MediaDetailsModal';
import { PlayerView } from './components/PlayerView';
import { IptvLoginScreen } from './components/IptvLoginScreen';
import { TvRemoteControl } from './components/TvRemoteControl';
import { AndroidTvExportModal } from './components/AndroidTvExportModal';
import { LiveChannelsView } from './components/LiveChannelsView';
import { MoviesView } from './components/MoviesView';
import { SeriesView } from './components/SeriesView';
import { SportsScheduleView } from './components/SportsScheduleView';
import { KidsAnimeView } from './components/KidsAnimeView';
import { TvSearchView } from './components/TvSearchView';
import { useTvSpatialNavigation } from './hooks/useTvNavigation';
import { Tv, Popcorn, AlertCircle } from 'lucide-react';

export default function App() {
  const iptvService = IptvService.getInstance();

  // Authentication State (Strictly required before accessing catalogue)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSavedAuth, setIsCheckingSavedAuth] = useState<boolean>(true);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // App Tabs & Content populated ONLY from authenticated IPTV server
  const [activeTab, setActiveTab] = useState<TvTab>('home');
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchProgress[]>([]);

  // Modals & Navigation
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [remoteOpen, setRemoteOpen] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<MovieItem | SeriesItem | null>(null);
  const [isSeriesDetails, setIsSeriesDetails] = useState<boolean>(false);

  // Dynamic Spotlight item (Leanback active preview from focused card)
  const [spotlightItem, setSpotlightItem] = useState<MovieItem | SeriesItem | null>(null);

  const [activePlayer, setActivePlayer] = useState<{
    url: string;
    title: string;
    isLive: boolean;
    currentChannelId?: string;
    mediaMetadata?: {
      id?: string;
      seriesId?: string;
      seasonNum?: number;
      episodeNum?: number;
      episodeTitle?: string;
    };
  } | null>(null);

  // Load actual catalog from IptvService into React state
  const loadDataFromService = useCallback(() => {
    setChannels([...iptvService.liveChannels]);
    setMovies([...iptvService.movies]);
    setSeries([...iptvService.series]);
    setWatchHistory(iptvService.getWatchHistory());
  }, [iptvService]);

  // Initial startup verification: check for stored credentials and authenticate
  useEffect(() => {
    const creds = iptvService.getCredentials();
    if (creds) {
      if (creds.type === 'xtream') {
        iptvService
          .authenticateXtream(creds.serverUrl, creds.username, creds.password)
          .then(() => iptvService.syncCatalog())
          .then(() => {
            loadDataFromService();
            setIsAuthenticated(true);
            setIsCheckingSavedAuth(false);
          })
          .catch((err: unknown) => {
            const msg =
              err instanceof Error
                ? err.message
                : 'Falha ao reconectar ao servidor IPTV com as credenciais salvas.';
            setAuthErrorMessage(msg);
            setIsAuthenticated(false);
            setIsCheckingSavedAuth(false);
          });
      } else if (creds.type === 'm3u' && creds.m3uUrl) {
        iptvService
          .syncM3uPlaylist(creds.m3uUrl)
          .then(() => {
            loadDataFromService();
            setIsAuthenticated(true);
            setIsCheckingSavedAuth(false);
          })
          .catch((err: unknown) => {
            const msg =
              err instanceof Error
                ? err.message
                : 'Falha ao reprocessar a lista M3U salva.';
            setAuthErrorMessage(msg);
            setIsAuthenticated(false);
            setIsCheckingSavedAuth(false);
          });
      } else {
        setIsAuthenticated(false);
        setIsCheckingSavedAuth(false);
      }
    } else {
      // No credentials stored: directly present Login Screen as required
      setIsAuthenticated(false);
      setIsCheckingSavedAuth(false);
    }
  }, [iptvService, loadDataFromService]);

  // Clean Account Isolation / Logout / Switch Server
  const handleLogout = useCallback(() => {
    iptvService.clearCredentials();
    setChannels([]);
    setMovies([]);
    setSeries([]);
    setWatchHistory([]);
    setSelectedItem(null);
    setActivePlayer(null);
    setSpotlightItem(null);
    setIsAuthenticated(false);
    setLoginModalOpen(false);
    setAuthErrorMessage(null);
    setActiveTab('home');
  }, [iptvService]);

  // Remote / Back Key Navigation
  const handleTvBack = useCallback(() => {
    if (activePlayer) {
      setActivePlayer(null);
      return;
    }
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }
    if (exportModalOpen) {
      setExportModalOpen(false);
      return;
    }
    if (loginModalOpen) {
      setLoginModalOpen(false);
      return;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return;
    }
  }, [activePlayer, selectedItem, exportModalOpen, loginModalOpen, activeTab]);

  useTvSpatialNavigation({
    enabled: true,
    onBack: handleTvBack,
  });

  // Open Details Modal for Movie
  const handleOpenMovie = (movie: MovieItem) => {
    setSelectedItem(movie);
    setIsSeriesDetails(false);
  };

  // Open Details Modal for Series
  const handleOpenSeries = (s: SeriesItem) => {
    setSelectedItem(s);
    setIsSeriesDetails(true);
  };

  // Play Live Channel directly
  const handlePlayChannel = (channel: LiveChannel) => {
    const url = channel.stream_url || iptvService.getStreamUrl('live', channel.stream_id);
    setActivePlayer({
      url,
      title: channel.name,
      isLive: true,
      currentChannelId: channel.id,
    });
  };

  // Play VOD or Series Episode
  const handlePlayMedia = (
    streamUrl: string,
    title: string,
    episodeMeta?: {
      seriesId: string;
      seasonNum: number;
      episodeNum: number;
      episodeTitle: string;
    }
  ) => {
    setActivePlayer({
      url: streamUrl,
      title,
      isLive: false,
      mediaMetadata: episodeMeta
        ? {
            id: `${episodeMeta.seriesId}_s${episodeMeta.seasonNum}_e${episodeMeta.episodeNum}`,
            ...episodeMeta,
          }
        : selectedItem
        ? { id: selectedItem.id }
        : undefined,
    });
  };

  // Continue Watching card click
  const handleResumeWatch = (progress: WatchProgress) => {
    setActivePlayer({
      url: progress.streamUrl,
      title: progress.title,
      isLive: progress.type === 'live',
      mediaMetadata: {
        id: progress.id,
        seriesId: progress.seriesId,
        seasonNum: progress.seasonNum,
        episodeNum: progress.episodeNum,
        episodeTitle: progress.episodeTitle,
      },
    });
  };

  // 1. Initial Loading Splash while checking saved credentials
  if (isCheckingSavedAuth) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-slate-100 flex flex-col items-center justify-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-300 via-[#FFD700] to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 border border-amber-300/40 mb-6 animate-pulse">
          <Popcorn className="w-9 h-9 text-black fill-black/20" />
        </div>
        <h1 className="font-display text-2xl font-black text-white tracking-wider mb-2">
          GLOBAL <span className="text-[#FFD700]">PIPOCA</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Conectando ao servidor IPTV autorizado...
        </p>
      </div>
    );
  }

  // 2. Not Authenticated: Render Login Screen directly as the initial view
  if (!isAuthenticated) {
    return (
      <IptvLoginScreen
        onLoginSuccess={() => {
          loadDataFromService();
          setIsAuthenticated(true);
        }}
        initialErrorMessage={authErrorMessage}
      />
    );
  }

  // Active Hero Spotlight item from real server catalog (default to first real movie or series)
  const defaultHero = movies[0] || series[0] || null;
  const currentHero = spotlightItem || defaultHero;

  // Real Top 10 items from server catalog sorted by rating
  const top10Items = [...movies, ...series]
    .filter((item) => item && item.name)
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 10);

  const hasContent = channels.length > 0 || movies.length > 0 || series.length > 0;

  return (
    <div className="min-h-screen bg-[#0C0D10] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header - GLOBAL PIPOCA */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSearch={() => setActiveTab('search')}
        onOpenSettings={() => setLoginModalOpen(true)}
        onToggleRemote={() => setRemoteOpen(!remoteOpen)}
        onOpenExportGuide={() => setExportModalOpen(true)}
        onLogout={handleLogout}
        serverConnected={isAuthenticated}
        username={iptvService.userInfo?.username}
      />

      {/* Main Content Sections */}
      <main className="flex-1 pb-16">
        {/* If the authenticated server returned an empty catalog */}
        {!hasContent && (
          <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-[#14161C] border border-amber-400/30 text-center">
            <Tv className="w-12 h-12 text-amber-400/60 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Conexão Estabelecida com Sucesso
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              O servidor IPTV autenticou sua conta ({iptvService.userInfo?.username}), mas nenhum canal, filme ou série foi retornado nas categorias autorizadas. Verifique sua lista de pacotes com o provedor.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  iptvService.syncCatalog().then(() => loadDataFromService());
                }}
                className="tv-focusable px-6 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-xs"
              >
                Tentar Recarregar
              </button>
              <button
                onClick={handleLogout}
                className="tv-focusable px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20"
              >
                Trocar de Servidor
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: INÍCIO */}
        {activeTab === 'home' && hasContent && (
          <div className="animate-fade-in">
            {/* Cinematic Hero Spotlight Banner from real server content */}
            {currentHero && (
              <HeroBanner
                title={currentHero.name}
                synopsis={
                  currentHero.plot ||
                  'Conteúdo disponível no seu servidor IPTV autorizado.'
                }
                year={(currentHero as any).year || (currentHero as any).releaseDate?.split('-')[0] || ''}
                rating={currentHero.rating || ''}
                duration={(currentHero as any).duration || (currentHero as any).episode_run_time || ''}
                genre={(currentHero as any).genre || (currentHero as any).category_name || 'IPTV'}
                backdropUrl={
                  (currentHero as any).backdrop_path?.[0] ||
                  (currentHero as any).backdrop_path ||
                  currentHero.stream_icon ||
                  (currentHero as any).cover ||
                  ''
                }
                isFavorite={iptvService.isFavorite(currentHero.id)}
                onPlay={() => {
                  const url =
                    (currentHero as any).stream_url ||
                    iptvService.getStreamUrl('movie', (currentHero as any).stream_id || currentHero.id);
                  handlePlayMedia(url, currentHero.name);
                }}
                onDetails={() => {
                  if ((currentHero as any).series_id) {
                    handleOpenSeries(currentHero as SeriesItem);
                  } else {
                    handleOpenMovie(currentHero as MovieItem);
                  }
                }}
                onToggleFavorite={() => {
                  iptvService.toggleFavorite(currentHero.id);
                  loadDataFromService();
                }}
              />
            )}

            {/* Mosaico de Destaques - Visual Reference Composition */}
            <HighlightsMosaic
              featuredMovie={movies[0] || null}
              featuredSeries={series[0] || null}
              featuredChannel={channels[0] || null}
              secondaryMovie={movies[1] || null}
              onSelectMovie={handleOpenMovie}
              onSelectSeries={handleOpenSeries}
              onSelectChannel={handlePlayChannel}
              onFocusItem={(item) => setSpotlightItem(item)}
            />

            {/* Row 1: Continuar Assistindo (Real local history) */}
            {watchHistory.length > 0 && (
              <MediaRow title="Continuar Assistindo" badge="Meu Histórico">
                {watchHistory.map((item) => {
                  const progressPct =
                    item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
                  const remainingMinutes =
                    item.duration > item.currentTime
                      ? Math.ceil((item.duration - item.currentTime) / 60)
                      : 0;

                  return (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      imageUrl={item.cover}
                      progress={progressPct}
                      remainingMinutes={remainingMinutes}
                      aspectRatio="landscape"
                      onClick={() => handleResumeWatch(item)}
                      onFocus={() => {
                        const matched = movies.find((m) => m.id === item.id);
                        if (matched) setSpotlightItem(matched);
                      }}
                    />
                  );
                })}
              </MediaRow>
            )}

            {/* Row 2: TOP 10 DE HOJE (Outlined numbers with real titles from provider) */}
            {top10Items.length > 0 && (
              <Top10Row
                items={top10Items}
                onSelectItem={(item) => {
                  if ((item as any).series_id) {
                    handleOpenSeries(item as SeriesItem);
                  } else {
                    handleOpenMovie(item as MovieItem);
                  }
                }}
              />
            )}

            {/* Row 3: Global Filmes em Destaque (Real provider movies) */}
            {movies.length > 0 && (
              <MediaRow title="Global Filmes em Destaque" badge={`${movies.length} Títulos`}>
                {movies.slice(0, 15).map((movie) => (
                  <MediaCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.name}
                    imageUrl={movie.stream_icon}
                    rating={movie.rating}
                    year={movie.year}
                    subtitle={movie.genre || movie.category_name}
                    type="movie"
                    onClick={() => handleOpenMovie(movie)}
                    onFocus={() => setSpotlightItem(movie)}
                  />
                ))}
              </MediaRow>
            )}

            {/* Row 4: Global Séries em Alta (Real provider series) */}
            {series.length > 0 && (
              <MediaRow title="Global Séries em Alta" badge={`${series.length} Séries`}>
                {series.slice(0, 15).map((s) => (
                  <MediaCard
                    key={s.id}
                    id={s.id}
                    title={s.name}
                    imageUrl={s.cover}
                    rating={s.rating}
                    year={s.releaseDate?.split('-')[0]}
                    subtitle={s.genre || s.category_name}
                    type="series"
                    onClick={() => handleOpenSeries(s)}
                    onFocus={() => setSpotlightItem(s)}
                  />
                ))}
              </MediaRow>
            )}

            {/* Row 5: Canais de TV Ao Vivo Populares (Real provider channels) */}
            {channels.length > 0 && (
              <MediaRow title="Canais Ao Vivo Populares" badge={`${channels.length} Canais`}>
                {channels.slice(0, 12).map((ch) => (
                  <div
                    key={ch.id}
                    tabIndex={0}
                    onClick={() => handlePlayChannel(ch)}
                    className="tv-focusable tv-focus-target group relative w-56 sm:w-64 flex-shrink-0 cursor-pointer rounded-xl p-3 bg-[#14161C] border border-white/5 hover:border-amber-400/40 focus:border-amber-400 flex items-center gap-3 transition-all outline-none"
                  >
                    <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {ch.stream_icon ? (
                        <img
                          src={ch.stream_icon}
                          alt={ch.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="font-bold text-xs text-amber-400">TV</span>
                      )}
                    </div>
                    <div className="truncate flex-1">
                      <h4 className="font-semibold text-xs text-white group-focus:text-amber-400 truncate">
                        {ch.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">{ch.category_name || 'TV'}</p>
                    </div>
                  </div>
                ))}
              </MediaRow>
            )}
          </div>
        )}

        {/* TAB 2: GLOBAL FILMES */}
        {activeTab === 'movies' && (
          <MoviesView
            categories={iptvService.vodCategories}
            movies={movies}
            onSelectMovie={handleOpenMovie}
          />
        )}

        {/* TAB 3: GLOBAL SÉRIES */}
        {activeTab === 'series' && (
          <SeriesView
            categories={iptvService.seriesCategories}
            series={series}
            onSelectSeries={handleOpenSeries}
          />
        )}

        {/* TAB 4: TV AO VIVO */}
        {activeTab === 'live' && (
          <LiveChannelsView
            categories={iptvService.liveCategories}
            channels={channels}
            onPlayChannel={handlePlayChannel}
          />
        )}

        {/* TAB 5: FUTEBOL & JOGOS AO VIVO */}
        {activeTab === 'sports' && (
          <SportsScheduleView
            matches={iptvService.sportsMatches}
            liveChannels={channels}
            onTuneChannel={handlePlayChannel}
            onPlayDirect={(url, title) =>
              setActivePlayer({ url, title, isLive: true })
            }
          />
        )}

        {/* TAB 6: KIDS & ANIME */}
        {activeTab === 'kids' && (
          <KidsAnimeView
            channels={channels}
            movies={movies}
            series={series}
            onSelectMovie={handleOpenMovie}
            onSelectSeries={handleOpenSeries}
            onSelectChannel={handlePlayChannel}
          />
        )}

        {/* TAB 7: SEARCH */}
        {activeTab === 'search' && (
          <TvSearchView
            channels={channels}
            movies={movies}
            series={series}
            onSelectMovie={handleOpenMovie}
            onSelectSeries={handleOpenSeries}
            onSelectChannel={handlePlayChannel}
            onClose={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Details View Modal (Mandatory: Opens first before playing) */}
      {selectedItem && (
        <MediaDetailsModal
          item={selectedItem}
          isSeries={isSeriesDetails}
          onClose={() => setSelectedItem(null)}
          onPlay={handlePlayMedia}
          onSelectRelated={(rel, isSer) => {
            setSelectedItem(rel);
            setIsSeriesDetails(Boolean(isSer));
          }}
          relatedItems={isSeriesDetails ? series : movies}
        />
      )}

      {/* Fullscreen Video Player */}
      {activePlayer && (
        <PlayerView
          streamUrl={activePlayer.url}
          title={activePlayer.title}
          isLive={activePlayer.isLive}
          channelList={channels}
          currentChannelId={activePlayer.currentChannelId}
          onSwitchChannel={handlePlayChannel}
          mediaMetadata={activePlayer.mediaMetadata}
          onClose={() => {
            setActivePlayer(null);
            setWatchHistory(iptvService.getWatchHistory());
          }}
        />
      )}

      {/* Settings / Switch Account Modal */}
      {loginModalOpen && (
        <IptvLoginScreen
          canDismiss={true}
          onDismiss={() => setLoginModalOpen(false)}
          onLoginSuccess={() => {
            loadDataFromService();
            setLoginModalOpen(false);
          }}
        />
      )}

      {/* Android TV & APK Guide Modal */}
      <AndroidTvExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* Virtual D-Pad TV Remote Control */}
      <TvRemoteControl
        isOpen={remoteOpen}
        onClose={() => setRemoteOpen(false)}
        onGoHome={() => {
          setActivePlayer(null);
          setSelectedItem(null);
          setActiveTab('home');
        }}
      />
    </div>
  );
}
