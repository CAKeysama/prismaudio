from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import uuid

from scraper import extract_text_from_url
from text_processor import clean_text
from tts_engine import generate_audiobook

app = FastAPI(title="Audioreader API")

# Habilitar CORS para o Frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir do localhost do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar pasta de outputs
OUTPUT_DIR = "outputs"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Servir arquivos estáticos (os áudios MP3)
app.mount("/audio", StaticFiles(directory=OUTPUT_DIR), name="audio")

class GenerateRequest(BaseModel):
    url: str = None
    text: str = None
    voice: str = "pt-BR-AntonioNeural"

@app.post("/api/generate")
def generate(req: GenerateRequest):
    try:
        if req.url:
            raw_text = extract_text_from_url(req.url)
        elif req.text:
            raw_text = req.text
        else:
            raise HTTPException(status_code=400, detail="Forneça uma URL ou texto.")
            
        cleaned_text = clean_text(raw_text)
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="Nenhum texto extraído.")
            
        # Gera áudio e timestamps
        audio_bytes, timestamps = generate_audiobook(cleaned_text, req.voice)
        
        # Salva o áudio
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(audio_bytes)
            
        return {
            "success": True,
            "audio_url": f"/audio/{filename}",
            "text": cleaned_text,
            "timestamps": timestamps
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Servir o Frontend Buildado
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "Frontend não encontrado. Rode 'npm run build' na pasta frontend."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
