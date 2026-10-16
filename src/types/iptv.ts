export interface IptvCredentials {
  serverUrl: string;
  username: string;
  password: string;
  type: 'xtream' | 'm3u';
  m3uUrl?: string;
}

export interface XtreamUserInfo {
  username: string;
  password?: string;
  message?: string;
  auth: number;
  status: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

export interface XtreamServerInfo {
  url?: string;
  port?: string;
  https_port?: string;
  server_protocol?: string;
  rtmp_port?: string;
  timezone?: string;
  time_now?: string;
}

export interface IptvCategory {
  category_id: string;
  category_name: string;
  parent_id?: number | string;
}

export interface LiveChannel {
  id: string;
  num?: number;
  name: string;
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id: string;
  category_name?: string;
  stream_url?: string;
  direct_source?: string;
}

export interface MovieItem {
  id: string;
  num?: number;
  name: string;
  stream_id: number | string;
  stream_icon?: string;
  rating?: string | number;
  rating_5based?: number;
  added?: string;
  year?: string;
  category_id: string;
  category_name?: string;
  container_extension?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  duration?: string;
  backdrop_path?: string;
  stream_url?: string;
}

export interface SeriesEpisode {
  id: string | number;
  episode_num: number;
  title: string;
  container_extension?: string;
  info?: {
    duration?: string;
    duration_secs?: number;
    plot?: string;
    movie_image?: string;
    rating?: number | string;
    releasedate?: string;
  };
  stream_url?: string;
}

export interface SeriesItem {
  id: string;
  num?: number;
  name: string;
  series_id: number | string;
  cover?: string;
  stream_icon?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string | number;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
  category_name?: string;
  seasons?: Record<string, SeriesEpisode[]>;
}

export interface SeriesInfo {
  seasons: Array<any>;
  info: Record<string, any>;
  episodes: Record<string, SeriesEpisode[]>;
}

export interface SportsMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffTime: string;
  status: 'live' | 'upcoming' | 'finished';
  channelName: string;
  channelStreamId?: string | number;
  scoreHome?: number;
  scoreAway?: number;
  matchDate: 'today' | 'upcoming';
  timeDisplay: string;
}

export interface WatchProgress {
  id: string;
  type: 'movie' | 'series' | 'live';
  title: string;
  cover?: string;
  currentTime: number;
  duration: number;
  timestamp: number;
  streamUrl: string;
  seriesId?: string;
  seasonNum?: number;
  episodeNum?: number;
  episodeTitle?: string;
}

export interface SyncProgress {
  phase: 'idle' | 'auth' | 'categories' | 'channels' | 'vod' | 'series' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
  percentage: number;
  error?: string;
}

export type TvTab =
  | 'home'
  | 'live'
  | 'movies'
  | 'series'
  | 'sports'
  | 'kids'
  | 'anime'
  | 'search'
  | 'settings';
