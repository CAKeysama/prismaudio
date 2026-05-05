import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { savePlayerState, loadPlayerState } from '../utils/storageManager';

export function useAudioController(audioRef: RefObject<HTMLAudioElement | null>) {
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);

  // Carregar estado salvo na montagem
  useEffect(() => {
    const saved = loadPlayerState();
    if (saved) {
      if (saved.volume !== undefined) setVolume(saved.volume);
      if (saved.speed !== undefined) setSpeed(saved.speed);
    }
  }, []);

  // Sincronizar volume com a tag de áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    savePlayerState({ volume });
  }, [volume, audioRef]);

  // Sincronizar velocidade com a tag de áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    savePlayerState({ speed });
  }, [speed, audioRef]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  return {
    volume,
    speed,
    handleVolumeChange,
    handleSpeedChange
  };
}
