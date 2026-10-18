import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Tv,
  AlertCircle,
  Subtitles,
  AudioLines,
  ChevronRight,
  Sparkles,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import { LiveChannel, MovieItem, SeriesItem, WatchProgress } from '../types/iptv';
import { buildProxyUrl, IptvService } from '../services/iptvService';
import { MediaCard } from './MediaCard';

interface PlayerViewProps {
  streamUrl: string;
  title: string;
  onClose: () => void;
  isLive?: boolean;
  channelList?: LiveChannel[];
  currentChannelId?: string;
  onSwitchChannel?: (channel: LiveChannel) => void;
  mediaMetadata?: {
    id?: string;
    cover?: string;
    seriesId?: string;
    seasonNum?: number;
    episodeNum?: number;
    episodeTitle?: string;
  };
  recommendations?: (MovieItem | SeriesItem)[];
  onSelectRecommendation?: (item: MovieItem | SeriesItem) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  streamUrl,
  title: initialTitle,
  onClose,
  isLive = false,
  channelList = [],
  currentChannelId,
  onSwitchChannel,
  mediaMetadata,
  recommendations = [],
  onSelectRecommendation,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [currentUrl, setCurrentUrl] = useState<string>(streamUrl);
  const [currentTitle, setCurrentTitle] = useState<string>(initialTitle);
  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(currentChannelId);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showChannelDrawer, setShowChannelDrawer] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Real Audio, Subtitle & Quality Track States
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [subtitleTracks, setSubtitleTracks] = useState<{ id: number; name: string }[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate?: number; label: string }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto

  const [activeModal, setActiveModal] = useState<'audio' | 'subs' | 'quality' | null>(null);

  const iptvService = IptvService.getInstance();

  // Reset OSD controls timer
  const kickControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Don't auto-hide if a track settings dialog or drawer is open
      if (!activeModal && !showChannelDrawer) {
        setShowControls(false);
      }
    }, 5000);
  }, [activeModal, showChannelDrawer]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize playback (HLS or Native HTML5)
  const initPlayer = useCallback((targetUrl: string) => {
    const video = videoRef.current;
    if (!video) return;

    setErrorState(null);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setQualityLevels([]);
    setSelectedQuality(-1);

    // Clean previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const proxiedUrl = targetUrl.startsWith('http') ? buildProxyUrl(targetUrl) : targetUrl;
    const isM3U8 = targetUrl.includes('.m3u8') || targetUrl.includes('/live/');

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Collect real audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(
            hls.audioTracks.map((t, idx) => ({
              id: idx,
              name: t.name || t.lang || `Faixa de Áudio ${idx + 1}`,
            }))
          );
          setSelectedAudioTrack(hls.audioTrack);
        } else {
          setAudioTracks([{ id: 0, name: 'Faixa 1 (Padrão da Transmissão)' }]);
          setSelectedAudioTrack(0);
        }

        // Collect real subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          setSubtitleTracks(
            hls.subtitleTracks.map((t, idx) => ({
              id: idx,
              name: t.name || t.lang || `Legenda ${idx + 1}`,
            }))
          );
        }

        // Collect real video quality levels
        if (hls.levels && hls.levels.length > 0) {
          const levels = hls.levels.map((lvl, idx) => ({
            id: idx,
            height: lvl.height || 0,
            bitrate: lvl.bitrate,
            label: lvl.height ? `${lvl.height}p` : `Qualidade ${idx + 1}`,
          }));
          setQualityLevels(levels);
        }

        // Restore saved progress if movie/series
        if (!isLive && mediaMetadata?.id) {
          const savedProgress = iptvService.getWatchProgress(mediaMetadata.id);
          if (savedProgress && savedProgress.currentTime > 5) {
            video.currentTime = savedProgress.currentTime;
          }
        }

        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (hls.url === proxiedUrl && targetUrl !== proxiedUrl) {
                hls.loadSource(targetUrl);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setErrorState('Falha na reprodução do fluxo. Servidor indisponível ou codec não suportado.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isM3U8) {
      video.src = proxiedUrl;
      video.play().catch(() => {
        setIsPlaying(false);
      });
      setAudioTracks([{ id: 0, name: 'Áudio Original (Nativo)' }]);
      setSelectedAudioTrack(0);
    } else {
      setErrorState('O formato do stream não é compatível com este navegador/dispositivo.');
    }
  }, [isLive, mediaMetadata, iptvService]);

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setCurrentTitle(initialTitle);
    setActiveChannelId(currentChannelId);
    initPlayer(streamUrl);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [streamUrl, initialTitle, currentChannelId, initPlayer]);

  // Periodic watch progress recording (including real poster cover)
  useEffect(() => {
    if (isLive || !mediaMetadata?.id) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.currentTime > 5 && video.duration > 0) {
        const progress: WatchProgress = {
          id: mediaMetadata.id || 'current',
          type: mediaMetadata.seriesId ? 'series' : 'movie',
          title: currentTitle,
          cover: mediaMetadata.cover,
          currentTime: video.currentTime,
          duration: video.duration,
          timestamp: Date.now(),
          streamUrl: currentUrl,
          seriesId: mediaMetadata.seriesId,
          seasonNum: mediaMetadata.seasonNum,
          episodeNum: mediaMetadata.episodeNum,
          episodeTitle: mediaMetadata.episodeTitle,
        };
        iptvService.saveWatchProgress(progress);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, mediaMetadata, currentTitle, currentUrl, iptvService]);

  // Switch to specific channel in live mode
  const handleSwitchToChannel = useCallback((channel: LiveChannel) => {
    setActiveChannelId(channel.id);
    setCurrentTitle(channel.name);
    const newUrl =
      channel.stream_url ||
      iptvService.getStreamUrl('live', channel.stream_id || channel.id);
    setCurrentUrl(newUrl);
    initPlayer(newUrl);
    onSwitchChannel?.(channel);
  }, [iptvService, initPlayer, onSwitchChannel]);

  // Live TV Remote Zapping: ArrowUp = Previous Channel, ArrowDown = Next Channel
  const changeLiveChannel = useCallback((direction: 'next' | 'prev') => {
    if (!isLive || channelList.length === 0) return;
    const currentIndex = channelList.findIndex((ch) => ch.id === activeChannelId);
    let nextIndex = 0;
    if (direction === 'next') {
      nextIndex = currentIndex >= 0 && currentIndex < channelList.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : channelList.length - 1;
    }
    const targetChannel = channelList[nextIndex];
    if (targetChannel) {
      handleSwitchToChannel(targetChannel);
    }
  }, [isLive, channelList, activeChannelId, handleSwitchToChannel]);

  // Player Remote Controls Keyboard Handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      kickControlsTimer();

      // Back / Esc key
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 4) {
        e.preventDefault();
        if (activeModal) {
          setActiveModal(null);
          return;
        }
        if (showChannelDrawer) {
          setShowChannelDrawer(false);
          return;
        }
        onClose();
        return;
      }

      // If active modal is open, let user navigate modal with D-Pad
      if (activeModal) return;

      const video = videoRef.current;
      if (!video) return;

      // Enter / OK
      if (e.key === ' ' || e.key === 'Enter') {
        if (!showControls) {
          e.preventDefault();
          setShowControls(true);
          return;
        }
        // If controls already visible, toggle play/pause
        if (!showChannelDrawer) {
          e.preventDefault();
          if (video.paused) {
            video.play();
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        }
        return;
      }

      // Live Channel Switching via Remote ArrowUp / ArrowDown (only when no modal is open)
      if (isLive && !showChannelDrawer) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          changeLiveChannel('next');
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          changeLiveChannel('prev');
          return;
        }
      }

      // VOD Seeking
      if (!isLive && !showChannelDrawer) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLive, showChannelDrawer, activeModal, showControls, onClose, kickControlsTimer, changeLiveChannel]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  // Select Audio Track
  const handleSelectAudio = (trackId: number) => {
    setSelectedAudioTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
    }
    setActiveModal(null);
  };

  // Select Subtitle Track
  const handleSelectSubtitle = (trackId: number) => {
    setSelectedSubtitleTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackId;
    }
    setActiveModal(null);
  };

  // Select Video Quality
  const handleSelectQuality = (qualityId: number) => {
    setSelectedQuality(qualityId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
    }
    setActiveModal(null);
  };

  return (
    <div
      ref={containerRef}
      data-tv-modal="true"
      onMouseMove={kickControlsTimer}
      onClick={kickControlsTimer}
      className="fixed inset-0 z-50 bg-[#07080B] flex flex-col select-none overflow-y-auto no-scrollbar"
    >
      {/* Video Viewport Stage */}
      <div className="relative w-full h-screen min-h-[100vh] flex-shrink-0 flex items-center justify-center bg-black overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onDurationChange={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setErrorState('Erro ao carregar o canal ou filme. Verifique se o servidor IPTV está online.');
          }}
        />

        {/* Error Overlay */}
        {errorState && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-black/85 text-center">
            <AlertCircle className="w-14 h-14 text-rose-500 mb-3 animate-pulse" />
            <h2 className="font-display text-xl font-bold text-white mb-2">Erro de Reprodução</h2>
            <p className="text-slate-300 max-w-md text-xs mb-5">{errorState}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => initPlayer(currentUrl)}
                className="tv-focusable px-5 py-2 rounded-xl bg-[#E50914] text-white font-bold text-xs outline-none shadow-lg"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onClose}
                className="tv-focusable px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs outline-none"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        )}

        {/* Top Controls Bar */}
        <div
          className={`absolute top-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <button
              onClick={onClose}
              className="tv-focusable flex items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs outline-none backdrop-blur-md"
              title="Voltar ao Catálogo"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white drop-shadow">
                {currentTitle}
              </h2>
              {isLive && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                    Transmissão ao Vivo · Setas Cima/Baixo trocam de canal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Channel Drawer Toggle */}
          {isLive && channelList.length > 0 && (
            <button
              onClick={() => setShowChannelDrawer(!showChannelDrawer)}
              className="tv-focusable flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md outline-none"
            >
              <Tv className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Lista de Canais ({channelList.length})</span>
            </button>
          )}
        </div>

        {/* Bottom Controls Bar (OSD) */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-2.5 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Slider (VOD) */}
          {!isLive && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-300 font-mono w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
              />
              <span className="text-[11px] text-slate-400 font-mono w-10">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="tv-focusable p-2.5 rounded-full bg-[#E50914] text-white hover:bg-red-600 shadow-lg shadow-red-600/30 transition-all outline-none"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Skip -10s / +10s (VOD) */}
              {!isLive && (
                <>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime -= 10;
                    }}
                    className="tv-focusable p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 outline-none"
                    title="Voltar 10 segundos"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime += 10;
                    }}
                    className="tv-focusable p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 outline-none"
                    title="Avançar 10 segundos"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Mute / Volume */}
              <button
                onClick={toggleMute}
                className="tv-focusable p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 outline-none"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Audio, Subtitles, Quality & Recommendations Controls */}
            <div className="flex items-center gap-2">
              {/* 1. SELEÇÃO DE ÁUDIO */}
              <button
                onClick={() => setActiveModal(activeModal === 'audio' ? null : 'audio')}
                className={`tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none transition-all ${
                  activeModal === 'audio'
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Seleção de Áudio"
              >
                <AudioLines className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Áudio</span>
              </button>

              {/* 2. SELEÇÃO DE LEGENDAS */}
              <button
                onClick={() => setActiveModal(activeModal === 'subs' ? null : 'subs')}
                className={`tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none transition-all ${
                  activeModal === 'subs'
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Seleção de Legendas"
              >
                <Subtitles className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Legendas</span>
              </button>

              {/* 3. SELEÇÃO DE QUALIDADE */}
              <button
                onClick={() => setActiveModal(activeModal === 'quality' ? null : 'quality')}
                className={`tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none transition-all ${
                  activeModal === 'quality'
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Opções de Qualidade"
              >
                <Sliders className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Qualidade</span>
              </button>

              {/* Recommendations Anchor Button */}
              {recommendations && recommendations.length > 0 && (
                <button
                  onClick={() => {
                    recommendationsRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold outline-none hover:bg-white/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                  <span className="hidden sm:inline">Você também pode gostar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Audio Selection */}
        {activeModal === 'audio' && (
          <div className="absolute bottom-20 right-6 w-72 bg-[#0E1015]/98 border border-white/15 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <AudioLines className="w-4 h-4 text-[#E50914]" />
                <span>Faixas de Áudio</span>
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="tv-focusable text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
              {audioTracks.length > 0 ? (
                audioTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectAudio(track.id)}
                    className={`tv-focusable w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all outline-none ${
                      selectedAudioTrack === track.id
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{track.name}</span>
                    {selectedAudioTrack === track.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-2">
                  Áudio original da transmissão ativo. Não existem outras faixas de áudio no stream.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal: Subtitles Selection */}
        {activeModal === 'subs' && (
          <div className="absolute bottom-20 right-6 w-72 bg-[#0E1015]/98 border border-white/15 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Subtitles className="w-4 h-4 text-[#E50914]" />
                <span>Legendas</span>
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="tv-focusable text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
              <button
                onClick={() => handleSelectSubtitle(-1)}
                className={`tv-focusable w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all outline-none ${
                  selectedSubtitleTrack === -1
                    ? 'bg-[#E50914] text-white font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>Desativadas</span>
                {selectedSubtitleTrack === -1 && <Check className="w-3.5 h-3.5" />}
              </button>
              {subtitleTracks.length > 0 ? (
                subtitleTracks.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubtitle(sub.id)}
                    className={`tv-focusable w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all outline-none ${
                      selectedSubtitleTrack === sub.id
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {selectedSubtitleTrack === sub.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-1.5">
                  Nenhuma legenda incorporada ou externa disponível para este fluxo.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal: Quality Selection */}
        {activeModal === 'quality' && (
          <div className="absolute bottom-20 right-6 w-72 bg-[#0E1015]/98 border border-white/15 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#E50914]" />
                <span>Qualidade do Vídeo</span>
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="tv-focusable text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
              <button
                onClick={() => handleSelectQuality(-1)}
                className={`tv-focusable w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all outline-none ${
                  selectedQuality === -1
                    ? 'bg-[#E50914] text-white font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>Automático (Adaptativo HLS)</span>
                {selectedQuality === -1 && <Check className="w-3.5 h-3.5" />}
              </button>
              {qualityLevels.length > 0 ? (
                qualityLevels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => handleSelectQuality(lvl.id)}
                    className={`tv-focusable w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all outline-none ${
                      selectedQuality === lvl.id
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{lvl.label}</span>
                    {selectedQuality === lvl.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-1.5">
                  Resolução nativa direta definida pelo servidor de streaming IPTV.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Live Channel Drawer */}
        {showChannelDrawer && isLive && (
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-88 bg-[#0B0C10]/98 backdrop-blur-2xl border-l border-white/10 z-40 p-4 flex flex-col animate-slide-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#E50914]" />
                <h3 className="font-display font-bold text-white text-sm">Canais de TV</h3>
              </div>
              <button
                onClick={() => setShowChannelDrawer(false)}
                className="tv-focusable text-xs px-2 py-1 rounded bg-white/10 text-slate-300 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
              {channelList.map((ch) => {
                const isCurrent = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      handleSwitchToChannel(ch);
                      setShowChannelDrawer(false);
                    }}
                    className={`tv-focusable w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all outline-none ${
                      isCurrent
                        ? 'bg-[#E50914] text-white font-bold shadow-md shadow-red-600/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 focus:bg-[#E50914] focus:text-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center shrink-0 text-xs font-mono">
                      {ch.num || '•'}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-semibold truncate">{ch.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ch.category_name || 'TV'}</p>
                    </div>
                    {isCurrent && <ChevronRight className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Seção abaixo do player: Você também pode gostar disso */}
      {recommendations && recommendations.length > 0 && (
        <div
          ref={recommendationsRef}
          className="w-full bg-[#07080B] border-t border-white/10 px-6 sm:px-8 py-6 z-20 flex-shrink-0"
        >
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
              <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-wide">
                Você também pode gostar disso
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Recomendações do mesmo gênero</span>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-2">
            {recommendations.slice(0, 12).map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.name}
                imageUrl={item.stream_icon || (item as any).cover}
                rating={item.rating}
                year={(item as any).year}
                type="movie"
                onClick={() => onSelectRecommendation?.(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
