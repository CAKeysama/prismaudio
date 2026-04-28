import { useState } from 'react'
import { Headphones, Globe, BookOpen, Loader2 } from 'lucide-react'
import { AudiobookPlayer } from './components/AudiobookPlayer'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const [url, setUrl] = useState('')
  const [voice, setVoice] = useState('pt-BR-AntonioNeural')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [audiobookData, setAudiobookData] = useState<{
    audio_url: string;
    timestamps: any[];
  } | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, voice }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Ocorreu um erro ao processar a história.')
      }
      
      setAudiobookData({
        audio_url: data.audio_url,
        timestamps: data.timestamps,
      })
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Headphones className="text-indigo-500" />
            <span>Prism<span className="text-zinc-500 font-light">Audio</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!audiobookData ? (
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
        ) : (
          <div className="h-[80vh]">
            <button 
              onClick={() => setAudiobookData(null)}
              className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
            >
              ← Voltar para gerar outro
            </button>
            <AudiobookPlayer 
              audioUrl={audiobookData.audio_url} 
              timestamps={audiobookData.timestamps} 
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
