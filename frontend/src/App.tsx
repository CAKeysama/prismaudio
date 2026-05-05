import { useState, useEffect } from 'react'
import { Headphones, Globe, BookOpen, Loader2, Library } from 'lucide-react'
import { AudiobookPlayer } from './components/AudiobookPlayer'
import { LibraryView } from './components/LibraryView'
import { loadPlayerState, savePlayerState, clearPlayerState } from './utils/storageManager'
import { addNovel } from './utils/libraryManager'
import { getNextChapterUrl } from './utils/chapterNavigator'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const [view, setView] = useState<'home' | 'player' | 'library'>('home')
  const [url, setUrl] = useState('')
  const [voice, setVoice] = useState('pt-BR-AntonioNeural')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [audiobookData, setAudiobookData] = useState<{
    audio_url: string;
    timestamps: any[];
    title?: string;
    next_url?: string;
  } | null>(null)

  // Restaurar sessão ao abrir o app
  useEffect(() => {
    const saved = loadPlayerState();
    if (saved && saved.audiobookData && saved.currentUrl) {
      setUrl(saved.currentUrl);
      setAudiobookData(saved.audiobookData);
      setView('player');
    }
  }, []);

  const fetchAudiobook = async (targetUrl: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl, voice }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Ocorreu um erro ao processar a história.');
      }
      
      const newAudiobookData = {
        audio_url: data.audio_url,
        timestamps: data.timestamps,
        title: data.title,
        next_url: data.next_url,
      };
      
      setAudiobookData(newAudiobookData);
      setUrl(targetUrl);
      
      savePlayerState({ 
        currentUrl: targetUrl, 
        audiobookData: newAudiobookData 
      });
      
      setView('player');
    } catch (err: any) {
      setError(err.message);
      // Se deu erro ao buscar o próximo via navegação automática, muda a view pra home
      if (view === 'player') setView('home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    await fetchAudiobook(url);
  };

  const handleNextChapter = async (nextUrlBackend: string) => {
    const targetUrl = nextUrlBackend || getNextChapterUrl(url);
    if (targetUrl) {
      await fetchAudiobook(targetUrl);
    } else {
      alert('Não foi possível determinar o próximo capítulo automaticamente.');
    }
  };

  const handleAddToLibrary = () => {
    if (audiobookData && url) {
      addNovel({
        name: audiobookData.title || 'Novel Desconhecida',
        currentChapterUrl: url,
      });
      alert('Progresso salvo na biblioteca!');
    }
  };

  const handleSelectFromLibrary = (selectedUrl: string) => {
    setUrl(selectedUrl);
    setView('home'); 
    fetchAudiobook(selectedUrl);
  };

  const closePlayer = () => {
    setAudiobookData(null);
    clearPlayerState();
    setView('home');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 text-white font-bold text-xl tracking-tight cursor-pointer"
            onClick={() => setView('home')}
          >
            <Headphones className="text-indigo-500" />
            <span>Prism<span className="text-zinc-500 font-light">Audio</span></span>
          </div>
          
          <nav className="flex gap-4">
            <button 
              onClick={() => setView('library')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${view === 'library' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
            >
              <Library size={18} />
              Biblioteca
            </button>
            {audiobookData && view !== 'player' && (
              <button 
                onClick={() => setView('player')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <BookOpen size={18} />
                Lendo
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {view === 'library' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Minha Biblioteca</h1>
            <LibraryView onSelectNovel={handleSelectFromLibrary} />
          </div>
        )}

        {view === 'home' && (
          <div className="max-w-2xl mx-auto mt-20">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Transforme qualquer web novel em uma experiência imersiva.
              </h1>
              <p className="text-xl text-zinc-400">
                Cole a URL do capítulo. O sistema limpará anúncios, extrairá o conteúdo e gerará um audiobook sincronizado de alta fidelidade.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">URL do Capítulo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://site-de-novel.com/capitulo-1"
                      className="block w-full pl-11 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Voz do Narrador</label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="block w-full px-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="pt-BR-AntonioNeural">Antônio (Brasil - Masculino)</option>
                    <option value="pt-BR-FranciscaNeural">Francisca (Brasil - Feminino)</option>
                    <option value="pt-PT-DuarteNeural">Duarte (Portugal - Masculino)</option>
                  </select>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 focus:ring-4 focus:ring-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Gerando Audiobook...
                    </>
                  ) : (
                    <>
                      <BookOpen size={20} />
                      Começar Leitura
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'player' && audiobookData && (
          <div className="h-[80vh]">
            <button 
              onClick={closePlayer}
              className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
            >
              ← Fechar leitura e voltar ao início
            </button>
            <AudiobookPlayer 
              currentUrl={url}
              audioUrl={audiobookData.audio_url} 
              timestamps={audiobookData.timestamps}
              title={audiobookData.title}
              nextUrl={audiobookData.next_url}
              onNextChapter={handleNextChapter}
              onAddToLibrary={handleAddToLibrary}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
