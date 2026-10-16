import React, { useState } from 'react';
import { Tv, X, Download, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface AndroidTvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidTvExportModal: React.FC<AndroidTvExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const manifestSnippet = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.globalpipoca.iptv">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <application
        android:banner="@drawable/pipoca_tv_banner"
        android:theme="@style/Theme.Leanback"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const gradleSnippet = `// Media3 / ExoPlayer para IPTV no Android TV
implementation("androidx.media3:media3-exoplayer:1.5.1")
implementation("androidx.media3:media3-exoplayer-hls:1.5.1")
implementation("androidx.media3:media3-ui:1.5.1")
implementation("androidx.leanback:leanback:1.0.0")`;

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111317] border border-amber-400/40 shadow-2xl p-6 sm:p-8 no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="tv-focusable absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Tv className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight">
              Exportar APK para Android TV
            </h2>
            <p className="text-xs text-slate-400">
              Configurações Leanback Launcher, Media3 / ExoPlayer e Downloader AFTVnews
            </p>
          </div>
        </div>

        {/* TV Banner preview */}
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-6 bg-black">
          <img
            src="/src/assets/images/noctra_tv_banner_1792121160514.jpg"
            alt="Banner GLOBAL PIPOCA Android TV"
            className="w-full h-40 object-cover"
          />
          <div className="p-3 bg-zinc-900/80 flex items-center justify-between text-xs text-slate-300">
            <span>Banner Oficial 16:9 (@drawable/pipoca_tv_banner)</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compatível Leanback
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>1. Como Gerar o APK com Gradle</span>
            </h4>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-amber-300 text-[11px] mb-2 overflow-x-auto flex items-center justify-between">
              <code>./gradlew assembleRelease</code>
              <button
                onClick={() => copyToClipboard('./gradlew assembleRelease', 'cmd')}
                className="text-xs text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-400">
              O arquivo final será gerado em <code className="text-slate-200">app/build/outputs/apk/release/app-release.apk</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>2. AndroidManifest.xml (Leanback Launcher)</span>
            </h4>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-slate-300 text-[10px] overflow-x-auto max-h-36 no-scrollbar relative">
              <pre>{manifestSnippet}</pre>
              <button
                onClick={() => copyToClipboard(manifestSnippet, 'manifest')}
                className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 text-slate-400 hover:text-white"
              >
                {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span>3. Instalação via Downloader (Fire TV & Android TV Box)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
              <li>Instale o aplicativo <strong className="text-white">Downloader by AFTVnews</strong> na Google Play Store da TV.</li>
              <li>Ative <strong className="text-white">Fontes Desconhecidas</strong> em Preferências de Segurança do Android TV.</li>
              <li>Insira a URL direta do APK no Downloader para baixar e instalar imediatamente.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="tv-focusable px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs outline-none"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
