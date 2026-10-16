import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
  Tv,
  AlertCircle,
  Subtitles,
  AudioLines,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { LiveChannel, WatchProgress } from '../types/iptv';
import { buildProxyUrl, IptvService } from '../services/iptvService';

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
    seriesId?: string;
    seasonNum?: number;
    episodeNum?: number;
    episodeTitle?: string;
  };
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  streamUrl,
  title,
  onClose,
  isLive = false,
  channelList = [],
  currentChannelId,
  onSwitchChannel,
  mediaMetadata,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showChannelDrawer, setShowChannelDrawer] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<{ id: number; name: string }[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);
  const [showTrackMenu, setShowTrackMenu] = useState<'audio' | 'subs' | null>(null);

  const iptvService = IptvService.getInstance();

  // Reset controls timer
  const kickControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowTrackMenu(null);
    }, 4500);
  }, []);

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

    // Clean previous instance
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

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Collect audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(
            hls.audioTracks.map((t, idx) => ({ id: idx, name: t.name || `Faixa ${idx + 1}` }))
          );
        }
        // Collect subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          setSubtitleTracks(
            hls.subtitleTracks.map((t, idx) => ({ id: idx, name: t.name || `Legenda ${idx + 1}` }))
          );
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
              // Try direct URL if proxy failed or vice versa
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
      // Native Safari / Android WebView playback or MP4 direct
      video.src = proxiedUrl;
      video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      setErrorState('O formato do stream não é compatível com este navegador/dispositivo.');
    }
  }, [isLive, mediaMetadata, iptvService]);

  useEffect(() => {
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
  }, [streamUrl, initPlayer]);

  // Periodic watch progress recording
  useEffect(() => {
    if (isLive || !mediaMetadata?.id) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.currentTime > 5 && video.duration > 0) {
        const progress: WatchProgress = {
          id: mediaMetadata.id || 'current',
          type: mediaMetadata.seriesId ? 'series' : 'movie',
          title,
          currentTime: video.currentTime,
          duration: video.duration,
          timestamp: Date.now(),
          streamUrl,
          seriesId: mediaMetadata.seriesId,
          seasonNum: mediaMetadata.seasonNum,
          episodeNum: mediaMetadata.episodeNum,
          episodeTitle: mediaMetadata.episodeTitle,
        };
        iptvService.saveWatchProgress(progress);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, mediaMetadata, title, streamUrl, iptvService]);

  // Player Remote Controls Keyboard Handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      kickControlsTimer();

      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 4) {
        e.preventDefault();
        if (showChannelDrawer) {
          setShowChannelDrawer(false);
        } else {
          onClose();
        }
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (e.key === ' ' || e.key === 'Enter') {
        // Toggle play/pause if not focused on drawer
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
      } else if (e.key === 'ArrowRight' && !isLive && !showChannelDrawer) {
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      } else if (e.key === 'ArrowLeft' && !isLive && !showChannelDrawer) {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else if (e.key === 'ArrowUp' && isLive) {
        e.preventDefault();
        setShowChannelDrawer(true);
      } else if (e.key === 'ArrowDown' && isLive) {
        e.preventDefault();
        setShowChannelDrawer(true);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLive, showChannelDrawer, onClose, kickControlsTimer]);

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

  return (
    <div
      ref={containerRef}
      data-tv-modal="true"
      onMouseMove={kickControlsTimer}
      onClick={kickControlsTimer}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
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
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Erro de Reprodução</h2>
          <p className="text-slate-300 max-w-md text-sm mb-6">{errorState}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => initPlayer(streamUrl)}
              className="tv-focusable px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-sm outline-none shadow-lg shadow-amber-400/20"
            >
              Tentar Novamente
            </button>
            <button
              onClick={onClose}
              className="tv-focusable px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm outline-none"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="tv-focusable flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm outline-none backdrop-blur-md"
            title="Voltar ao Catálogo (Esc / Back)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-white drop-shadow">
              {title}
            </h2>
            {isLive && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                  Transmissão ao Vivo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Channel Drawer Toggle */}
        {isLive && channelList.length > 0 && (
          <button
            onClick={() => setShowChannelDrawer(!showChannelDrawer)}
            className="tv-focusable flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md outline-none"
          >
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Lista de Canais (Zapping)</span>
          </button>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-3 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Timeline Slider (VOD) */}
        {!isLive && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-300 font-mono w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
            />
            <span className="text-xs text-slate-400 font-mono w-12">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="tv-focusable p-3 rounded-full bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-400/25 transition-all outline-none"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
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
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime += 10;
                  }}
                  className="tv-focusable p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 outline-none"
                  title="Avançar 10 segundos"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Mute / Volume */}
            <button
              onClick={toggleMute}
              className="tv-focusable p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 outline-none ml-2"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Subtitles & Audio Tracks */}
          <div className="flex items-center gap-3">
            {audioTracks.length > 1 && (
              <button
                onClick={() => setShowTrackMenu(showTrackMenu === 'audio' ? null : 'audio')}
                className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold outline-none hover:bg-white/20"
              >
                <AudioLines className="w-4 h-4 text-amber-400" />
                <span>Áudio ({audioTracks.length})</span>
              </button>
            )}

            {subtitleTracks.length > 0 && (
              <button
                onClick={() => setShowTrackMenu(showTrackMenu === 'subs' ? null : 'subs')}
                className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold outline-none hover:bg-white/20"
              >
                <Subtitles className="w-4 h-4 text-amber-400" />
                <span>Legendas</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Channel Drawer for Live Zapping */}
      {showChannelDrawer && isLive && (
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#0E1015]/95 backdrop-blur-2xl border-l border-white/10 z-40 p-4 flex flex-col animate-slide-left">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-bold text-white text-sm">Canais de TV</h3>
            </div>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="tv-focusable text-xs px-2 py-1 rounded bg-white/10 text-slate-300 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {channelList.map((ch) => {
              const isCurrent = ch.id === currentChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    onSwitchChannel?.(ch);
                    setShowChannelDrawer(false);
                  }}
                  className={`tv-focusable w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all outline-none ${
                    isCurrent
                      ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 focus:bg-amber-400 focus:text-black'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center shrink-0 text-xs font-mono">
                    {ch.num || '•'}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-semibold truncate">{ch.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{ch.category_name || 'TV'}</p>
                  </div>
                  {isCurrent && <ChevronRight className="w-4 h-4 text-black shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
