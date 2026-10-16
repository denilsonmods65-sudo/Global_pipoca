import React, { useState } from 'react';
import { IptvService } from '../services/iptvService';
import { SyncProgress } from '../types/iptv';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Popcorn,
  FileText,
  ShieldCheck,
  Server,
  User,
  Lock,
  X,
  Radio,
} from 'lucide-react';

interface IptvLoginScreenProps {
  onLoginSuccess: () => void;
  canDismiss?: boolean;
  onDismiss?: () => void;
  initialErrorMessage?: string | null;
}

export const IptvLoginScreen: React.FC<IptvLoginScreenProps> = ({
  onLoginSuccess,
  canDismiss = false,
  onDismiss,
  initialErrorMessage = null,
}) => {
  const iptvService = IptvService.getInstance();
  const savedCreds = iptvService.getCredentials();

  const [mode, setMode] = useState<'xtream' | 'm3u'>('xtream');
  const [serverUrl, setServerUrl] = useState(savedCreds?.serverUrl || '');
  const [username, setUsername] = useState(savedCreds?.username || '');
  const [password, setPassword] = useState(savedCreds?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [m3uUrl, setM3uUrl] = useState(savedCreds?.m3uUrl || '');

  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);

  // Validate URL format helper
  const isValidUrl = (url: string): boolean => {
    try {
      const normalized = iptvService.normalizeServerUrl(url);
      const parsed = new URL(normalized);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleXtreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanServer = serverUrl.trim();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // 1. Validar os campos preenchidos
    if (!cleanServer) {
      setErrorMessage('Por favor, informe a URL do servidor IPTV.');
      return;
    }
    if (!isValidUrl(cleanServer)) {
      setErrorMessage('URL do servidor inválida. Use o formato: http://servidor.com:porta');
      return;
    }
    if (!cleanUser) {
      setErrorMessage('Por favor, informe o nome de usuário fornecido pelo seu provedor.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Por favor, informe a senha de acesso.');
      return;
    }

    try {
      setIsLoading(true);

      // 2 & 3. Validar endereço, verificar conexão e autenticar via Xtream API
      setSyncProgress({
        phase: 'auth',
        message: '1/4 Conectando e validando credenciais no servidor IPTV...',
        current: 0,
        total: 100,
        percentage: 15,
      });

      const { userInfo } = await iptvService.authenticateXtream(
        cleanServer,
        cleanUser,
        cleanPass
      );

      // 4. Confirmar que as credenciais foram aceitas
      if (!userInfo || userInfo.auth !== 1) {
        throw new Error('Acesso recusado: usuário ou senha não reconhecidos pelo servidor.');
      }

      // 5 & 6. Consultar categorias, canais, filmes, séries e carregar catálogo
      setSyncProgress({
        phase: 'categories',
        message: '2/4 Credenciais aceitas! Consultando catálogo autorizado...',
        current: 25,
        total: 100,
        percentage: 35,
      });

      await iptvService.syncCatalog((progress) => {
        setSyncProgress(progress);
      });

      // 7. Abrir tela principal após confirmação real
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 500);
    } catch (err: unknown) {
      setIsLoading(false);
      setSyncProgress(null);
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o servidor IPTV.';
      setErrorMessage(msg);
    }
  };

  const handleM3uSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanM3u = m3uUrl.trim();
    if (!cleanM3u) {
      setErrorMessage('Insira a URL completa da playlist M3U/M3U8.');
      return;
    }
    if (!cleanM3u.startsWith('http://') && !cleanM3u.startsWith('https://')) {
      setErrorMessage('A URL da playlist deve iniciar com http:// ou https://');
      return;
    }

    try {
      setIsLoading(true);
      setSyncProgress({
        phase: 'channels',
        message: 'Baixando e processando playlist M3U/M3U8...',
        current: 0,
        total: 100,
        percentage: 25,
      });

      iptvService.saveCredentials({
        serverUrl: cleanM3u,
        username: 'M3U_User',
        password: '',
        type: 'm3u',
        m3uUrl: cleanM3u,
      });

      await iptvService.syncM3uPlaylist(cleanM3u, (progress) => {
        setSyncProgress(progress);
      });

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 500);
    } catch (err: unknown) {
      setIsLoading(false);
      setSyncProgress(null);
      const msg = err instanceof Error ? err.message : 'Falha ao processar a lista M3U informada.';
      setErrorMessage(msg);
    }
  };

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0C10] select-none overflow-y-auto no-scrollbar animate-fade-in"
    >
      {/* Ambient Cinema Lighting Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Main Card Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-[#12141A] border-2 border-amber-400/30 shadow-2xl p-6 sm:p-10 z-10">
        {/* Dismiss Button if opened as settings modal */}
        {canDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="tv-focusable absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 outline-none"
            title="Voltar ao catálogo"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header: GLOBAL PIPOCA */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-[#FFD700] to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40 shrink-0">
            <Popcorn className="w-7 h-7 text-black fill-black/20" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-white tracking-wider flex items-center gap-1.5 leading-none">
              GLOBAL <span className="text-[#FFD700]">PIPOCA</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Acesso ao Servidor IPTV · Android TV & TV Box
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Xtream Codes API vs Playlist M3U) */}
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('xtream');
              setErrorMessage(null);
            }}
            className={`tv-focusable flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all outline-none ${
              mode === 'xtream'
                ? 'bg-[#FFD700] text-black shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5 focus:bg-[#FFD700] focus:text-black'
            }`}
          >
            Xtream Codes API
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('m3u');
              setErrorMessage(null);
            }}
            className={`tv-focusable flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all outline-none ${
              mode === 'm3u'
                ? 'bg-[#FFD700] text-black shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5 focus:bg-[#FFD700] focus:text-black'
            }`}
          >
            Importar M3U / M3U8
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs leading-relaxed animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <strong className="block text-rose-300 font-bold mb-0.5">Falha de Conexão:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Synchronizing Progress State */}
        {isLoading && syncProgress && (
          <div className="p-6 rounded-2xl bg-black/70 border border-amber-400/20 mb-6 text-center">
            <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <h4 className="font-bold text-sm text-white mb-1">Processando Acesso IPTV</h4>
            <p className="text-xs text-slate-300 mb-4">{syncProgress.message}</p>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-[#FFD700] transition-all duration-300"
                style={{ width: `${syncProgress.percentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold mt-2.5 block">
              {syncProgress.percentage}%
            </span>
          </div>
        )}

        {/* Login Form */}
        {!isLoading && (
          <>
            {mode === 'xtream' ? (
              <form onSubmit={handleXtreamSubmit} className="space-y-4">
                {/* Server URL Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>URL DO SERVIDOR</span>
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="ex: http://servidor-iptv.com:8080"
                    autoComplete="url"
                    className="tv-focusable w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-amber-400 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Aceita HTTP e HTTPS com porta e caminho customizado do seu fornecedor.
                  </span>
                </div>

                {/* Username and Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>USUÁRIO</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nome de usuário"
                      autoComplete="username"
                      className="tv-focusable w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>

                  {/* Password Field with Show/Hide Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>SENHA</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha do servidor"
                        autoComplete="current-password"
                        className="tv-focusable w-full pl-4 pr-11 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-amber-400 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="tv-focusable absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg outline-none"
                        title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="tv-focusable w-full py-3.5 rounded-xl bg-[#FFD700] hover:bg-amber-400 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all outline-none active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ENTRAR NO GLOBAL PIPOCA</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleM3uSubmit} className="space-y-4">
                {/* M3U URL Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>URL DA PLAYLIST M3U / M3U8</span>
                  </label>
                  <input
                    type="url"
                    value={m3uUrl}
                    onChange={(e) => setM3uUrl(e.target.value)}
                    placeholder="https://provedor.com/lista.m3u8"
                    className="tv-focusable w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-amber-400 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Importa categorias, canais e VOD disponíveis na lista M3U.
                  </span>
                </div>

                {/* Submit M3U */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="tv-focusable w-full py-3.5 rounded-xl bg-[#FFD700] hover:bg-amber-400 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all outline-none active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>CARREGAR PLAYLIST M3U</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Security & Remote Control Notice */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Credenciais isoladas no dispositivo</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400/90 font-medium">
            <Radio className="w-3 h-3" />
            <span>Navegação por Controle Remoto</span>
          </div>
        </div>
      </div>
    </div>
  );
};
