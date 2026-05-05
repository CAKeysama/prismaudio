export interface Novel {
  id: string;
  name: string;
  author?: string;
  genre?: string;
  releaseDate?: string;
  coverUrl?: string;
  currentChapterUrl: string;
  addedAt: number;
  lastReadAt: number;
}

const LIBRARY_KEY = 'prismaudio_library';

export function getLibrary(): Novel[] {
  try {
    const dataStr = localStorage.getItem(LIBRARY_KEY);
    if (!dataStr) return [];
    return JSON.parse(dataStr) as Novel[];
  } catch (err) {
    console.error("Erro ao carregar biblioteca:", err);
    return [];
  }
}

export function saveLibrary(library: Novel[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  } catch (err) {
    console.error("Erro ao salvar biblioteca:", err);
  }
}

export function addNovel(novelData: Omit<Novel, 'id' | 'addedAt' | 'lastReadAt'>): Novel {
  const library = getLibrary();
  
  // Verifica se já existe pela URL ou pelo nome
  const existingIndex = library.findIndex(n => n.name === novelData.name || n.currentChapterUrl === novelData.currentChapterUrl);
  
  const novel: Novel = {
    ...novelData,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    addedAt: Date.now(),
    lastReadAt: Date.now()
  };

  if (existingIndex !== -1) {
    library[existingIndex] = { ...library[existingIndex], ...novelData, lastReadAt: Date.now() };
  } else {
    library.push(novel);
  }

  saveLibrary(library);
  return novel;
}

export function removeNovel(id: string) {
  const library = getLibrary();
  const filtered = library.filter(n => n.id !== id);
  saveLibrary(filtered);
}

export function updateNovelProgress(id: string, chapterUrl: string) {
  const library = getLibrary();
  const index = library.findIndex(n => n.id === id);
  if (index !== -1) {
    library[index].currentChapterUrl = chapterUrl;
    library[index].lastReadAt = Date.now();
    saveLibrary(library);
  }
}
