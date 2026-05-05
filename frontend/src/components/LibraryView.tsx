import React, { useState, useEffect } from 'react';
import { Book, Clock, Play, Trash2 } from 'lucide-react';
import type { Novel } from '../utils/libraryManager';
import { getLibrary, removeNovel } from '../utils/libraryManager';

interface LibraryViewProps {
  onSelectNovel: (url: string) => void;
}

export function LibraryView({ onSelectNovel }: LibraryViewProps) {
  const [novels, setNovels] = useState<Novel[]>([]);

  useEffect(() => {
    setNovels(getLibrary().sort((a, b) => b.lastReadAt - a.lastReadAt));
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja remover esta novel da sua biblioteca?')) {
      removeNovel(id);
      setNovels(getLibrary().sort((a, b) => b.lastReadAt - a.lastReadAt));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (novels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Book size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-medium mb-2 text-zinc-400">Sua biblioteca está vazia</h3>
        <p>Comece a ouvir um capítulo e salve-o na sua biblioteca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {novels.map((novel) => (
        <div 
          key={novel.id}
          onClick={() => onSelectNovel(novel.currentChapterUrl)}
          className="group relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all cursor-pointer"
        >
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={novel.name}>
              {novel.name || 'Novel Sem Título'}
            </h3>
            
            <p className="text-xs font-mono text-indigo-400 mb-4 line-clamp-1 truncate" title={novel.currentChapterUrl}>
              {novel.currentChapterUrl}
            </p>
            
            <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Visto em {formatDate(novel.lastReadAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button 
              onClick={(e) => handleDelete(novel.id, e)}
              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg backdrop-blur-md transition-colors"
              title="Remover da Biblioteca"
            >
              <Trash2 size={16} />
            </button>
            <div 
              className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg"
              title="Continuar Leitura"
            >
              <Play size={16} className="ml-0.5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
