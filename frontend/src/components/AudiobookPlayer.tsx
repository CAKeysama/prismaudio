import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, FastForward, Rewind } from 'lucide-react';

interface Timestamp {
  text: string;
  start: number;
  end: number;
}

interface AudiobookPlayerProps {
  audioUrl: string;
  timestamps: Timestamp[];
}

export function AudiobookPlayer({ audioUrl, timestamps }: AudiobookPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  useEffect(() => {
    // Find the active text chunk based on current time
    const index = timestamps.findIndex((t, i) => {
      const nextStart = timestamps[i + 1]?.start || Infinity;
      return currentTime >= t.start && currentTime < nextStart;
    });
    
    if (index !== -1 && index !== activeWordIndex) {
      setActiveWordIndex(index);
      
      // Optional: Auto-scroll to active word
      const activeElement = document.getElementById(`word-${index}`);
      if (activeElement && scrollRef.current) {
        const container = scrollRef.current;
        const offsetTop = activeElement.offsetTop;
        const containerHeight = container.clientHeight;
        
        // Scroll only if the word is out of the center view
        if (offsetTop < container.scrollTop + 50 || offsetTop > container.scrollTop + containerHeight - 50) {
          container.scrollTo({
            top: offsetTop - containerHeight / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, timestamps, activeWordIndex]);

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
      setCurrentTime(audioRef.current.currentTime);
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm overflow-hidden shadow-2xl">
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
          onEnded={() => setIsPlaying(false)}
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
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-zinc-500 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Volume2 size={20} />
            </button>
            <div className="px-2 py-1 text-xs font-semibold bg-zinc-800 text-zinc-400 rounded">
              1.0x
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime -= 10;
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Rewind size={24} />
            </button>
            <button 
              onClick={togglePlay}
              className="flex items-center justify-center w-14 h-14 bg-white text-black rounded-full hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime += 10;
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <FastForward size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={audioUrl} 
              download
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg transition-colors text-zinc-200"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
