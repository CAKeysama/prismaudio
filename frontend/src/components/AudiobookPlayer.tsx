import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, FastForward, Rewind, SkipForward, LibraryBig } from 'lucide-react';
import { useAudioController } from '../hooks/useAudioController';
import { savePlayerState, loadPlayerState } from '../utils/storageManager';

interface Timestamp {
  text: string;
  start: number;
  end: number;
}

interface AudiobookPlayerProps {
  currentUrl: string;
  audioUrl: string;
  timestamps: Timestamp[];
  title?: string;
  nextUrl?: string;
  onNextChapter?: (url: string) => void;
  onAddToLibrary?: () => void;
}

export function AudiobookPlayer({ currentUrl, audioUrl, timestamps, title, nextUrl, onNextChapter, onAddToLibrary }: AudiobookPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [hasRestoredTime, setHasRestoredTime] = useState(false);

  const { volume, speed, handleVolumeChange, handleSpeedChange } = useAudioController(audioRef);

  useEffect(() => {
    const index = timestamps.findIndex((t, i) => {
      const nextStart = timestamps[i + 1]?.start || Infinity;
      return currentTime >= t.start && currentTime < nextStart;
    });
    
    if (index !== -1 && index !== activeWordIndex) {
      setActiveWordIndex(index);
      
      const activeElement = document.getElementById(`word-${index}`);
      if (activeElement && scrollRef.current) {
        const container = scrollRef.current;
        const offsetTop = activeElement.offsetTop;
        const containerHeight = container.clientHeight;
        
        if (offsetTop < container.scrollTop + 50 || offsetTop > container.scrollTop + containerHeight - 50) {
          container.scrollTo({
            top: offsetTop - containerHeight / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, timestamps, activeWordIndex]);

  useEffect(() => {
    if (duration > 0 && !hasRestoredTime) {
      const saved = loadPlayerState();
      // Restaurar apenas se a URL for a mesma para não restaurar posição de outro capítulo
      if (saved && saved.currentTime && saved.currentUrl === currentUrl && saved.currentTime < duration) {
        if (audioRef.current) {
          audioRef.current.currentTime = saved.currentTime;
          setCurrentTime(saved.currentTime);
        }
      }
      setHasRestoredTime(true);
    }
  }, [duration, hasRestoredTime, currentUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);
      // Evita muitas escritas usando um throttling simples baseado em segundos inteiros
      if (Math.abs(currentTime - newTime) > 1 || newTime === 0) {
          savePlayerState({ currentTime: newTime, currentUrl });
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      savePlayerState({ currentTime: time, currentUrl });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* Cabeçalho do Capítulo */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate" title={title || 'Capítulo Atual'}>
            {title || 'Capítulo Desconhecido'}
          </h2>
          <p className="text-xs text-zinc-500 truncate mt-1" title={currentUrl}>
            {currentUrl}
          </p>
        </div>
        {onAddToLibrary && (
          <button 
            onClick={onAddToLibrary}
            className="ml-4 p-2 text-zinc-400 hover:text-indigo-400 bg-zinc-900 rounded-lg border border-zinc-800 transition-colors flex items-center gap-2"
            title="Adicionar à Biblioteca"
          >
            <LibraryBig size={18} />
            <span className="text-sm font-medium hidden sm:inline">Salvar</span>
          </button>
        )}
      </div>

      {/* Text Area (Karaoke) */}
      <div 
        ref={scrollRef}
        className="flex-1 p-8 overflow-y-auto text-lg leading-relaxed text-zinc-400 font-medium"
      >
        {timestamps.map((t, i) => (
          <React.Fragment key={i}>
            <span 
              id={`word-${i}`}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = t.start;
                  setCurrentTime(t.start);
                  if (!isPlaying) togglePlay();
                }
              }}
              className={`cursor-pointer transition-colors duration-150 ease-in-out ${
                i === activeWordIndex 
                  ? 'text-white bg-indigo-500/30 py-1 rounded shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                  : 'hover:text-zinc-200'
              }`}
            >
              {t.text}
            </span>
            {' '}
          </React.Fragment>
        ))}
      </div>

      {/* Player Controls */}
      <div className="p-6 bg-zinc-950 border-t border-zinc-800">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (nextUrl && onNextChapter) {
              onNextChapter(nextUrl);
            }
          }}
        />
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-mono text-zinc-500 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            title="Progresso do capítulo"
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-zinc-500 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          
          {/* Volume Control */}
          <div className="flex items-center gap-2 group w-1/4">
            <button className="text-zinc-400 hover:text-white transition-colors" title="Volume">
              <Volume2 size={20} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              title="Ajustar Volume"
              className="w-20 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Main Controls */}
          <div className="flex flex-1 justify-center items-center gap-6">
            <button 
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime -= 10;
              }}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Retroceder 10 segundos"
            >
              <Rewind size={24} />
            </button>
            <button 
              onClick={togglePlay}
              title={isPlaying ? "Pausar" : "Play"}
              className="flex items-center justify-center w-14 h-14 bg-white text-black rounded-full hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime += 10;
              }}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Avançar 10 segundos"
            >
              <FastForward size={24} />
            </button>
          </div>

          {/* Right Controls (Speed, Next, Download) */}
          <div className="flex items-center justify-end gap-4 w-1/4">
            <div className="flex items-center gap-2" title="Velocidade da voz">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={speed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="w-16 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300 hidden sm:block"
              />
              <div className="px-2 py-1 text-xs font-semibold bg-zinc-800 text-zinc-400 rounded w-12 text-center">
                {speed.toFixed(2)}x
              </div>
            </div>

            {onNextChapter && (
              <button 
                onClick={() => onNextChapter(nextUrl || '')}
                disabled={!nextUrl && !onNextChapter} // Habilita pelo fallback do pai se necessário
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                title="Próximo capítulo"
              >
                <SkipForward size={20} />
              </button>
            )}

            <a 
              href={audioUrl} 
              download
              title="Baixar áudio (MP3)"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Download size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
