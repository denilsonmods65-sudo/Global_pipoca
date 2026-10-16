import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Home,
  Volume2,
  VolumeX,
  X,
  Radio,
  Tv,
} from 'lucide-react';

interface TvRemoteControlProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome: () => void;
}

export const TvRemoteControl: React.FC<TvRemoteControlProps> = ({
  isOpen,
  onClose,
  onGoHome,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Dispatch synthetic keyboard event matching Android TV keycodes
  const sendKey = (key: string, keyCode: number) => {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none animate-fade-in">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/95 border border-amber-400/50 shadow-2xl text-amber-400 font-bold text-xs hover:scale-105 transition-transform"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Controle TV D-Pad</span>
        </button>
      ) : (
        <div className="w-64 p-5 rounded-3xl bg-[#111317]/95 backdrop-blur-2xl border-2 border-amber-400/40 shadow-2xl shadow-black/80 flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Tv className="w-4 h-4" />
              <span>Controle Remoto TV</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-300 hover:text-white"
                title="Minimizar"
              >
                —
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* D-Pad Circular Controller */}
          <div className="relative w-44 h-44 rounded-full bg-[#1A1D24] border-2 border-white/10 shadow-inner p-2 flex items-center justify-center my-2">
            {/* UP */}
            <button
              onClick={() => sendKey('ArrowUp', 19)}
              title="CIMA (ArrowUp)"
              className="absolute top-2 w-12 h-10 rounded-t-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 active:scale-95 transition-all flex items-center justify-center"
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* DOWN */}
            <button
              onClick={() => sendKey('ArrowDown', 20)}
              title="BAIXO (ArrowDown)"
              className="absolute bottom-2 w-12 h-10 rounded-b-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 active:scale-95 transition-all flex items-center justify-center"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* LEFT */}
            <button
              onClick={() => sendKey('ArrowLeft', 21)}
              title="ESQUERDA (ArrowLeft)"
              className="absolute left-2 w-10 h-12 rounded-l-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 active:scale-95 transition-all flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* RIGHT */}
            <button
              onClick={() => sendKey('ArrowRight', 22)}
              title="DIREITA (ArrowRight)"
              className="absolute right-2 w-10 h-12 rounded-r-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 active:scale-95 transition-all flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* CENTER / OK */}
            <button
              onClick={() => sendKey('Enter', 13)}
              title="OK / SELECIONAR (Enter)"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-[#FFD700] text-black font-extrabold text-xs shadow-lg shadow-amber-400/30 active:scale-90 transition-all flex items-center justify-center"
            >
              OK
            </button>
          </div>

          {/* Action Row */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4">
            {/* BACK Button */}
            <button
              onClick={() => sendKey('Escape', 4)}
              title="VOLTAR (Esc / Back)"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>VOLTAR</span>
            </button>

            {/* HOME Button */}
            <button
              onClick={onGoHome}
              title="TELA INICIAL"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-semibold transition-all"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>INÍCIO</span>
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-3 text-[10px] text-center text-slate-400 leading-tight">
            Use as setas do seu teclado físico (▲ ▼ ◄ ►) e Enter / Esc para navegação nativa.
          </div>
        </div>
      )}
    </div>
  );
};
