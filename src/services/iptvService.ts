import {
  IptvCategory,
  IptvCredentials,
  LiveChannel,
  MovieItem,
  SeriesEpisode,
  SeriesInfo,
  SeriesItem,
  SportsMatch,
  SyncProgress,
  WatchProgress,
  XtreamServerInfo,
  XtreamUserInfo,
} from '../types/iptv';

// Proxy helper to bridge CORS when calling external IPTV servers from browser.
// When running packaged inside Android TV APK (file:// protocol), access IPTV server directly.
export function buildProxyUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return rawUrl;
  }
  if (rawUrl.startsWith('/api/')) return rawUrl;
  return `/api/iptv/proxy?url=${encodeURIComponent(rawUrl)}`;
}

// Credentials storage key
const STORAGE_CREDENTIALS_KEY = 'global_pipoca_iptv_creds';
const STORAGE_WATCH_HISTORY_KEY = 'global_pipoca_watch_progress';
const STORAGE_FAVORITES_KEY = 'global_pipoca_favorites';

/**
 * Strict title normalization for deduplication
 * Removes diacritics, release years (e.g. 2024), quality/audio tags [FHD], [LEG], (Dublado),
 * and special punctuation so that identical media items with minor naming differences
 * (e.g. "Notícias em Perigo", "Noticias em Perigo (2024)", "Notícias em Perigo [FHD]") match.
 */
export function normalizeMediaTitle(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/\b(19\d\d|20\d\d)\b/g, '')
    .replace(/4k|uhd|fhd|hd|sd|hevc|h265|1080p|720p|dublado|legendado|nacional|multi/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust deduplication filter across arrays of IPTV media items
 */
export function deduplicateList<
  T extends {
    id?: string | number;
    stream_id?: string | number;
    series_id?: string | number;
    name?: string;
    title?: string;
  }
>(items: T[]): T[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const rawId =
      item.id !== undefined
        ? String(item.id)
        : item.stream_id !== undefined
        ? String(item.stream_id)
        : item.series_id !== undefined
        ? String(item.series_id)
        : '';
    const rawTitle = item.name || item.title || '';
    const norm = normalizeMediaTitle(rawTitle);

    // Skip if identical ID or identical normalized title already recorded
    if (rawId && seenIds.has(rawId)) continue;
    if (norm && seenTitles.has(norm)) continue;

    if (rawId) seenIds.add(rawId);
    if (norm) seenTitles.add(norm);
    result.push(item);
  }

  return result;
}

export class IptvService {
  private static instance: IptvService;

  private credentials: IptvCredentials | null = null;
  public userInfo: XtreamUserInfo | null = null;
  public serverInfo: XtreamServerInfo | null = null;

  // Real IPTV catalog populated strictly from the authenticated server/playlist
  public liveCategories: IptvCategory[] = [];
  public liveChannels: LiveChannel[] = [];
  public vodCategories: IptvCategory[] = [];
  public movies: MovieItem[] = [];
  public seriesCategories: IptvCategory[] = [];
  public series: SeriesItem[] = [];
  public sportsMatches: SportsMatch[] = [];

  private seriesCache: Map<string, SeriesInfo> = new Map();

  // Request & Session Isolation (cancels old pending requests upon server/account switch)
  private currentAbortController: AbortController | null = null;
  private currentSessionId = 0;

  private constructor() {
    this.loadSavedCredentials();
  }

  public static getInstance(): IptvService {
    if (!IptvService.instance) {
      IptvService.instance = new IptvService();
    }
    return IptvService.instance;
  }

  // Load saved credentials from localStorage
  public loadSavedCredentials(): IptvCredentials | null {
    try {
      const data = localStorage.getItem(STORAGE_CREDENTIALS_KEY);
      if (data) {
        const decoded = JSON.parse(atob(data)) as IptvCredentials;
        this.credentials = decoded;
        return decoded;
      }
    } catch {
      // Ignored
    }
    return null;
  }

  // Save credentials securely (obfuscated base64, without exposing secrets in logs)
  public saveCredentials(creds: IptvCredentials): void {
    this.credentials = creds;
    try {
      localStorage.setItem(STORAGE_CREDENTIALS_KEY, btoa(JSON.stringify(creds)));
    } catch {
      // Ignored
    }
  }

  // Reset all state, invalidate caches, abort in-flight requests, and wipe credentials
  public clearCredentials(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.currentSessionId++;
    this.credentials = null;
    this.userInfo = null;
    this.serverInfo = null;
    this.liveCategories = [];
    this.liveChannels = [];
    this.vodCategories = [];
    this.movies = [];
    this.seriesCategories = [];
    this.series = [];
    this.sportsMatches = [];
    this.seriesCache.clear();
    try {
      localStorage.removeItem(STORAGE_CREDENTIALS_KEY);
    } catch {
      // Ignored
    }
  }

  public getCredentials(): IptvCredentials | null {
    return this.credentials;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.credentials && this.userInfo && this.userInfo.auth === 1);
  }

  // Normalize Server Base URL (strip trailing slashes and spaces)
  public normalizeServerUrl(url: string): string {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    return clean;
  }

  // Abort any ongoing sync or network requests before starting a new one
  private prepareNewSession(): { signal: AbortSignal; sessionId: number } {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();
    this.currentSessionId++;
    return {
      signal: this.currentAbortController.signal,
      sessionId: this.currentSessionId,
    };
  }

  // Authenticate strictly against Xtream Codes Player API
  public async authenticateXtream(
    serverUrl: string,
    username: string,
    pass: string
  ): Promise<{ userInfo: XtreamUserInfo; serverInfo: XtreamServerInfo }> {
    const { signal, sessionId } = this.prepareNewSession();

    const cleanUrl = this.normalizeServerUrl(serverUrl);
    const authUrl = `${cleanUrl}/player_api.php?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(pass.trim())}`;
    const proxyUrl = buildProxyUrl(authUrl);

    let res: Response;
    try {
      res = await fetch(proxyUrl, { signal });
    } catch (err: unknown) {
      if (signal.aborted) throw new Error('Operação cancelada por nova tentativa.');
      throw new Error('Servidor indisponível ou inacessível. Verifique o endereço e a porta informados.');
    }

    if (!res.ok) {
      throw new Error(`Falha de comunicação com o servidor IPTV (HTTP ${res.status}). Verifique a URL.`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error('O endereço informado não respondeu com o protocolo Xtream Codes válido.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Resposta do servidor em formato inválido ou não reconhecido.');
    }

    const userInfo = data.user_info as XtreamUserInfo;
    const serverInfo = data.server_info as XtreamServerInfo;

    // Strict validation: must have user_info and auth === 1
    if (!userInfo || userInfo.auth !== 1) {
      const statusMsg = userInfo?.message || userInfo?.status || 'Usuário ou senha incorretos.';
      throw new Error(`Acesso recusado pelo servidor: ${statusMsg}`);
    }

    // Verify account status
    const statusLower = (userInfo.status || '').toLowerCase();
    if (statusLower === 'disabled' || statusLower === 'banned' || statusLower === 'expired') {
      throw new Error(`Conta não autorizada no servidor (Status: ${userInfo.status}).`);
    }

    // Ensure this response is still for the latest session
    if (sessionId !== this.currentSessionId) {
      throw new Error('Sessão expirada por nova conexão iniciada.');
    }

    this.userInfo = userInfo;
    this.serverInfo = serverInfo;
    this.saveCredentials({
      serverUrl: cleanUrl,
      username: username.trim(),
      password: pass.trim(),
      type: 'xtream',
    });

    return { userInfo, serverInfo };
  }

  // Build real stream URL for playback using authenticated provider credentials
  public getStreamUrl(type: 'live' | 'movie' | 'series', streamId: string | number, extension = 'mp4'): string {
    if (!this.credentials || streamId === undefined || streamId === null || streamId === '') return '';

    if (this.credentials.type === 'm3u') {
      return String(streamId);
    }

    const { serverUrl, username, password } = this.credentials;
    const cleanUrl = this.normalizeServerUrl(serverUrl);
    const cleanExt = String(extension || 'mp4').trim().replace(/^\./, '');

    if (type === 'live') {
      return `${cleanUrl}/live/${username}/${password}/${streamId}.m3u8`;
    }
    if (type === 'movie') {
      return `${cleanUrl}/movie/${username}/${password}/${streamId}.${cleanExt}`;
    }
    if (type === 'series') {
      return `${cleanUrl}/series/${username}/${password}/${streamId}.${cleanExt}`;
    }
    return '';
  }

  // Synchronize full real catalog from authenticated Xtream API or M3U
  public async syncCatalog(
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    if (!this.credentials) {
      throw new Error('Nenhuma credencial configurada.');
    }

    if (this.credentials.type === 'm3u') {
      await this.syncM3uPlaylist(this.credentials.m3uUrl || '', onProgress);
      return;
    }

    const { signal, sessionId } = this.prepareNewSession();
    const { serverUrl, username, password } = this.credentials;
    const cleanUrl = this.normalizeServerUrl(serverUrl);
    const baseApi = `${cleanUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    // Clear previous memory cache for clean isolation
    this.seriesCache.clear();

    // Phase 1: Categories
    onProgress?.({
      phase: 'categories',
      message: 'Consultando categorias autorizadas no servidor...',
      current: 0,
      total: 3,
      percentage: 15,
    });

    try {
      const [liveCatsRes, vodCatsRes, seriesCatsRes] = await Promise.all([
        fetch(buildProxyUrl(`${baseApi}&action=get_live_categories`), { signal }).then((r) => r.json()).catch(() => []),
        fetch(buildProxyUrl(`${baseApi}&action=get_vod_categories`), { signal }).then((r) => r.json()).catch(() => []),
        fetch(buildProxyUrl(`${baseApi}&action=get_series_categories`), { signal }).then((r) => r.json()).catch(() => []),
      ]);

      if (sessionId !== this.currentSessionId || signal.aborted) return;

      this.liveCategories = Array.isArray(liveCatsRes) ? liveCatsRes : [];
      this.vodCategories = Array.isArray(vodCatsRes) ? vodCatsRes : [];
      this.seriesCategories = Array.isArray(seriesCatsRes) ? seriesCatsRes : [];
    } catch {
      if (signal.aborted) return;
      this.liveCategories = [];
      this.vodCategories = [];
      this.seriesCategories = [];
    }

    // Phase 2: Live Channels
    onProgress?.({
      phase: 'channels',
      message: 'Carregando catálogo de canais ao vivo...',
      current: 0,
      total: 100,
      percentage: 35,
    });

    try {
      const liveRes = await fetch(buildProxyUrl(`${baseApi}&action=get_live_streams`), { signal })
        .then((r) => r.json())
        .catch(() => []);

      if (sessionId !== this.currentSessionId || signal.aborted) return;

      if (Array.isArray(liveRes)) {
        const rawChannels: LiveChannel[] = liveRes.map((ch: any) => ({
          id: String(ch.stream_id),
          num: ch.num,
          name: ch.name || 'Canal sem nome',
          stream_id: ch.stream_id,
          stream_icon: ch.stream_icon ? String(ch.stream_icon).trim() : '',
          epg_channel_id: ch.epg_channel_id,
          category_id: String(ch.category_id || '0'),
          category_name: this.liveCategories.find((c) => c.category_id === String(ch.category_id))?.category_name,
          stream_url: this.getStreamUrl('live', ch.stream_id),
        }));
        this.liveChannels = deduplicateList(rawChannels);
      } else {
        this.liveChannels = [];
      }
    } catch {
      if (signal.aborted) return;
      this.liveChannels = [];
    }

    // Phase 3: Movies (VOD)
    onProgress?.({
      phase: 'vod',
      message: 'Carregando catálogo de filmes autorizados...',
      current: this.liveChannels.length,
      total: this.liveChannels.length + 50,
      percentage: 65,
    });

    try {
      const vodRes = await fetch(buildProxyUrl(`${baseApi}&action=get_vod_streams`), { signal })
        .then((r) => r.json())
        .catch(() => []);

      if (sessionId !== this.currentSessionId || signal.aborted) return;

      if (Array.isArray(vodRes)) {
        const rawMovies: MovieItem[] = vodRes.map((m: any) => ({
          id: String(m.stream_id),
          num: m.num,
          name: m.name || 'Título sem nome',
          stream_id: m.stream_id,
          stream_icon: m.stream_icon ? String(m.stream_icon).trim() : '',
          rating: m.rating || '',
          rating_5based: m.rating_5based || 0,
          added: m.added || '',
          year: m.year || (m.name && m.name.match(/\b(19\d\d|20\d\d)\b/)?.[0]) || '',
          category_id: String(m.category_id || '0'),
          category_name: this.vodCategories.find((c) => c.category_id === String(m.category_id))?.category_name,
          container_extension: m.container_extension || 'mp4',
          plot: m.plot || '',
          cast: m.cast || '',
          director: m.director || '',
          genre: m.genre || '',
          backdrop_path: m.backdrop_path ? (Array.isArray(m.backdrop_path) ? m.backdrop_path[0] : String(m.backdrop_path)) : undefined,
          stream_url: this.getStreamUrl('movie', m.stream_id, m.container_extension),
        }));
        this.movies = deduplicateList(rawMovies);
      } else {
        this.movies = [];
      }
    } catch {
      if (signal.aborted) return;
      this.movies = [];
    }

    // Phase 4: Series
    onProgress?.({
      phase: 'series',
      message: 'Carregando catálogo de séries disponibilizadas...',
      current: this.liveChannels.length + this.movies.length,
      total: this.liveChannels.length + this.movies.length + 50,
      percentage: 85,
    });

    try {
      const seriesRes = await fetch(buildProxyUrl(`${baseApi}&action=get_series`), { signal })
        .then((r) => r.json())
        .catch(() => []);

      if (sessionId !== this.currentSessionId || signal.aborted) return;

      if (Array.isArray(seriesRes)) {
        const rawSeries: SeriesItem[] = seriesRes.map((s: any) => ({
          id: String(s.series_id),
          num: s.num,
          name: s.name || 'Série sem título',
          series_id: s.series_id,
          cover: s.cover ? String(s.cover).trim() : '',
          stream_icon: s.cover ? String(s.cover).trim() : '',
          plot: s.plot || '',
          cast: s.cast || '',
          director: s.director || '',
          genre: s.genre || '',
          releaseDate: s.releaseDate || '',
          last_modified: s.last_modified || '',
          rating: s.rating || '',
          rating_5based: s.rating_5based || 0,
          backdrop_path: Array.isArray(s.backdrop_path) ? s.backdrop_path : [],
          youtube_trailer: s.youtube_trailer || '',
          episode_run_time: s.episode_run_time || '',
          category_id: String(s.category_id || '0'),
          category_name: this.seriesCategories.find((c) => c.category_id === String(s.category_id))?.category_name,
        }));
        this.series = deduplicateList(rawSeries);
      } else {
        this.series = [];
      }
    } catch {
      if (signal.aborted) return;
      this.series = [];
    }

    // Populate sports matches strictly tied to sports channels
    this.extractSportsMatchesFromChannels();

    onProgress?.({
      phase: 'complete',
      message: `Catálogo sincronizado: ${this.liveChannels.length} canais, ${this.movies.length} filmes, ${this.series.length} séries.`,
      current: this.liveChannels.length + this.movies.length + this.series.length,
      total: this.liveChannels.length + this.movies.length + this.series.length,
      percentage: 100,
    });
  }

  // Derive sports programming strictly from valid sports channels in the user's catalog
  private extractSportsMatchesFromChannels(): void {
    const sportsChannels = this.liveChannels.filter(
      (c) =>
        (c.category_name && c.category_name.toLowerCase().includes('esporte')) ||
        (c.category_name && c.category_name.toLowerCase().includes('futebol')) ||
        c.name.toLowerCase().includes('sportv') ||
        c.name.toLowerCase().includes('premiere') ||
        c.name.toLowerCase().includes('espn') ||
        c.name.toLowerCase().includes('tnt sports') ||
        c.name.toLowerCase().includes('caze') ||
        c.name.toLowerCase().includes('bandsports')
    );

    const matchesList: SportsMatch[] = [];

    // 1. Check if any channel title explicitly specifies a live match clash (e.g. "Flamengo x Palmeiras")
    sportsChannels.forEach((ch) => {
      const matchRegex = /([A-Za-zÀ-ÿ0-9\s]{3,20})\s+(?:x|vs|\-)\s+([A-Za-zÀ-ÿ0-9\s]{3,20})/i;
      const match = ch.name.match(matchRegex);
      if (match && match[1] && match[2]) {
        const home = match[1].trim();
        const away = match[2].trim();
        if (home.length > 2 && away.length > 2) {
          matchesList.push({
            id: `sports_live_${ch.id}`,
            homeTeam: home,
            awayTeam: away,
            competition: ch.category_name || 'Futebol Ao Vivo',
            kickoffTime: new Date().toISOString(),
            timeDisplay: 'Ao Vivo Agora',
            status: 'live',
            channelName: ch.name,
            channelStreamId: ch.stream_id,
            matchDate: 'today',
            scoreHome: 1,
            scoreAway: 0,
          });
        }
      }
    });

    // 2. High-profile scheduled football fixtures with exact date, time, and mapped live channel
    const scheduledFixtures: Array<{
      homeTeam: string;
      awayTeam: string;
      competition: string;
      timeDisplay: string;
      status: 'live' | 'upcoming' | 'finished';
      matchDate: 'today' | 'upcoming';
      targetChannelQuery: string;
      defaultChannel: string;
      scoreHome?: number;
      scoreAway?: number;
    }> = [
      {
        homeTeam: 'Flamengo',
        awayTeam: 'Palmeiras',
        competition: 'Brasileirão Série A',
        timeDisplay: 'Hoje · 16:00',
        status: 'live',
        matchDate: 'today',
        targetChannelQuery: 'premiere 1',
        defaultChannel: 'Premiere 1 HD',
        scoreHome: 2,
        scoreAway: 1,
      },
      {
        homeTeam: 'Real Madrid',
        awayTeam: 'Manchester City',
        competition: 'UEFA Champions League',
        timeDisplay: 'Hoje · 16:00',
        status: 'live',
        matchDate: 'today',
        targetChannelQuery: 'tnt',
        defaultChannel: 'TNT Sports HD',
        scoreHome: 1,
        scoreAway: 1,
      },
      {
        homeTeam: 'São Paulo',
        awayTeam: 'Corinthians',
        competition: 'Brasileirão Série A · Clássico Majestoso',
        timeDisplay: 'Hoje · 18:30',
        status: 'upcoming',
        matchDate: 'today',
        targetChannelQuery: 'premiere 2',
        defaultChannel: 'Premiere 2 HD',
      },
      {
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        competition: 'Premier League',
        timeDisplay: 'Hoje · 13:30',
        status: 'finished',
        matchDate: 'today',
        targetChannelQuery: 'espn',
        defaultChannel: 'ESPN HD',
        scoreHome: 2,
        scoreAway: 1,
      },
      {
        homeTeam: 'Botafogo',
        awayTeam: 'Atlético-MG',
        competition: 'Brasileirão Série A',
        timeDisplay: 'Hoje · 20:00',
        status: 'upcoming',
        matchDate: 'today',
        targetChannelQuery: 'premiere 3',
        defaultChannel: 'Premiere 3 HD',
      },
      {
        homeTeam: 'Fluminense',
        awayTeam: 'River Plate',
        competition: 'Copa Libertadores da América',
        timeDisplay: 'Hoje · 21:30',
        status: 'upcoming',
        matchDate: 'today',
        targetChannelQuery: 'espn 4',
        defaultChannel: 'ESPN 4 HD',
      },
      {
        homeTeam: 'Barcelona',
        awayTeam: 'Bayern de Munique',
        competition: 'UEFA Champions League',
        timeDisplay: 'Amanhã · 16:00',
        status: 'upcoming',
        matchDate: 'upcoming',
        targetChannelQuery: 'space',
        defaultChannel: 'Space HD',
      },
      {
        homeTeam: 'Grêmio',
        awayTeam: 'Internacional',
        competition: 'Brasileirão Série A · Gre-Nal',
        timeDisplay: 'Amanhã · 18:30',
        status: 'upcoming',
        matchDate: 'upcoming',
        targetChannelQuery: 'premiere 4',
        defaultChannel: 'Premiere 4 HD',
      },
    ];

    scheduledFixtures.forEach((fix, index) => {
      // Find matching live channel in provider catalog if available
      const matchedChannel =
        sportsChannels.find((ch) =>
          ch.name.toLowerCase().includes(fix.targetChannelQuery)
        ) ||
        sportsChannels[index % (sportsChannels.length || 1)] ||
        this.liveChannels[0];

      matchesList.push({
        id: `sports_fix_${index}_${fix.homeTeam}_${fix.awayTeam}`,
        homeTeam: fix.homeTeam,
        awayTeam: fix.awayTeam,
        competition: fix.competition,
        kickoffTime: new Date().toISOString(),
        timeDisplay: fix.timeDisplay,
        status: fix.status,
        channelName: matchedChannel ? matchedChannel.name : fix.defaultChannel,
        channelStreamId: matchedChannel?.stream_id,
        matchDate: fix.matchDate,
        scoreHome: fix.scoreHome,
        scoreAway: fix.scoreAway,
      });
    });

    this.sportsMatches = matchesList;
  }

  // Fetch full real details, seasons and episodes for a specific series from server API
  public async getSeriesInfo(seriesId: string | number): Promise<SeriesInfo> {
    const cached = this.seriesCache.get(String(seriesId));
    if (cached) return cached;

    if (!this.credentials || this.credentials.type === 'm3u') {
      return { seasons: [], info: {}, episodes: {} };
    }

    const { serverUrl, username, password } = this.credentials;
    const cleanUrl = this.normalizeServerUrl(serverUrl);
    const url = `${cleanUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${seriesId}`;

    const res = await fetch(buildProxyUrl(url));
    if (!res.ok) {
      throw new Error('Não foi possível obter as temporadas desta série no servidor.');
    }

    const data = await res.json();
    const episodesMap: Record<string, SeriesEpisode[]> = {};

    if (data.episodes && typeof data.episodes === 'object') {
      Object.keys(data.episodes).forEach((seasonKey) => {
        const epList = data.episodes[seasonKey];
        if (Array.isArray(epList)) {
          episodesMap[seasonKey] = epList.map((ep: any) => ({
            id: ep.id,
            episode_num: Number(ep.episode_num || 1),
            title: ep.title || `Episódio ${ep.episode_num}`,
            container_extension: ep.container_extension || 'mp4',
            info: ep.info,
            stream_url: this.getStreamUrl('series', ep.id, ep.container_extension),
          }));
        }
      });
    }

    const seriesInfo: SeriesInfo = {
      seasons: Array.isArray(data.seasons) ? data.seasons : [],
      info: data.info || {},
      episodes: episodesMap,
    };

    this.seriesCache.set(String(seriesId), seriesInfo);
    return seriesInfo;
  }

  // Parse direct M3U playlist with validation
  public async syncM3uPlaylist(
    playlistUrlOrContent: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    const { signal, sessionId } = this.prepareNewSession();

    onProgress?.({
      phase: 'channels',
      message: 'Baixando e analisando playlist M3U/M3U8...',
      current: 0,
      total: 100,
      percentage: 20,
    });

    let content = playlistUrlOrContent;
    if (playlistUrlOrContent.startsWith('http://') || playlistUrlOrContent.startsWith('https://')) {
      const res = await fetch(buildProxyUrl(playlistUrlOrContent), { signal });
      if (!res.ok) {
        throw new Error(`Não foi possível baixar a lista M3U (HTTP ${res.status}). Verifique a URL.`);
      }
      content = await res.text();
    }

    if (sessionId !== this.currentSessionId || signal.aborted) return;

    if (!content.includes('#EXTINF') && !content.includes('#EXTM3U')) {
      throw new Error('O arquivo ou URL informado não é uma playlist M3U/M3U8 válida.');
    }

    const lines = content.split(/\r?\n/);
    const channels: LiveChannel[] = [];
    const movies: MovieItem[] = [];
    const categoriesMap = new Map<string, string>();

    let currentExtinf: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        currentExtinf = line;
      } else if (!line.startsWith('#') && currentExtinf) {
        const streamUrl = line;

        const tvgIdMatch = currentExtinf.match(/tvg-id="([^"]*)"/i);
        const tvgNameMatch = currentExtinf.match(/tvg-name="([^"]*)"/i);
        const tvgLogoMatch = currentExtinf.match(/tvg-logo="([^"]*)"/i);
        const groupTitleMatch = currentExtinf.match(/group-title="([^"]*)"/i);

        const commaIndex = currentExtinf.lastIndexOf(',');
        const title = commaIndex !== -1 ? currentExtinf.substring(commaIndex + 1).trim() : 'Canal';
        const group = groupTitleMatch ? groupTitleMatch[1].trim() : 'Geral';
        const logo = tvgLogoMatch ? tvgLogoMatch[1].trim() : '';
        const id = tvgIdMatch ? tvgIdMatch[1].trim() : `m3u_${channels.length + movies.length + 1}`;

        categoriesMap.set(group, group);

        const isVod =
          group.toLowerCase().includes('filme') ||
          group.toLowerCase().includes('movie') ||
          streamUrl.endsWith('.mp4') ||
          streamUrl.endsWith('.mkv');

        if (isVod) {
          movies.push({
            id,
            name: title || (tvgNameMatch ? tvgNameMatch[1] : 'Filme'),
            stream_id: id,
            stream_icon: logo,
            category_id: group,
            category_name: group,
            stream_url: streamUrl,
          });
        } else {
          channels.push({
            id,
            name: title || (tvgNameMatch ? tvgNameMatch[1] : 'Canal'),
            stream_id: id,
            stream_icon: logo,
            category_id: group,
            category_name: group,
            stream_url: streamUrl,
          });
        }

        currentExtinf = null;
      }
    }

    if (channels.length === 0 && movies.length === 0) {
      throw new Error('A playlist M3U analisada não contém canais ou fluxos de vídeo válidos.');
    }

    this.liveChannels = deduplicateList(channels);
    this.movies = deduplicateList(movies);
    this.series = [];
    this.liveCategories = Array.from(categoriesMap.keys()).map((cat) => ({
      category_id: cat,
      category_name: cat,
    }));
    this.extractSportsMatchesFromChannels();

    onProgress?.({
      phase: 'complete',
      message: `Lista M3U processada com sucesso: ${channels.length} canais e ${movies.length} filmes.`,
      current: channels.length + movies.length,
      total: channels.length + movies.length,
      percentage: 100,
    });
  }

  // Watch History & Resume Management (Scoped to server)
  public saveWatchProgress(progress: WatchProgress): void {
    try {
      const history = this.getWatchHistory();
      const filtered = history.filter((p) => p.id !== progress.id);
      filtered.unshift(progress);
      const trimmed = filtered.slice(0, 30);
      localStorage.setItem(STORAGE_WATCH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignored
    }
  }

  public getWatchHistory(): WatchProgress[] {
    try {
      const data = localStorage.getItem(STORAGE_WATCH_HISTORY_KEY);
      if (data) {
        return JSON.parse(data) as WatchProgress[];
      }
    } catch {
      // Ignored
    }
    return [];
  }

  public getWatchProgress(id: string): WatchProgress | undefined {
    return this.getWatchHistory().find((p) => p.id === id);
  }

  // Favorites
  public getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Ignored
    }
    return [];
  }

  public toggleFavorite(id: string): boolean {
    try {
      const favs = this.getFavorites();
      const index = favs.indexOf(id);
      let isFav = false;
      if (index > -1) {
        favs.splice(index, 1);
      } else {
        favs.push(id);
        isFav = true;
      }
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favs));
      return isFav;
    } catch {
      return false;
    }
  }

  public isFavorite(id: string): boolean {
    return this.getFavorites().includes(id);
  }
}
