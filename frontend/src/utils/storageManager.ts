export interface PlayerState {
  currentTime: number;
  volume: number;
  speed: number;
  currentUrl: string;
  audiobookData?: {
    audio_url: string;
    timestamps: any[];
    title?: string;
    next_url?: string;
  } | null;
}

const PLAYER_STATE_KEY = 'prismaudio_player_state';

export function savePlayerState(state: Partial<PlayerState>) {
  try {
    const existingStr = localStorage.getItem(PLAYER_STATE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const updated = { ...existing, ...state };
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao salvar estado do player", err);
  }
}

export function loadPlayerState(): PlayerState | null {
  try {
    const existingStr = localStorage.getItem(PLAYER_STATE_KEY);
    if (!existingStr) return null;
    return JSON.parse(existingStr) as PlayerState;
  } catch (err) {
    console.error("Erro ao carregar estado do player", err);
    return null;
  }
}

export function clearPlayerState() {
  localStorage.removeItem(PLAYER_STATE_KEY);
}
