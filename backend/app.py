import gradio as gr
from scraper import extract_text_from_url
from text_processor import clean_text, chunk_text
from tts_engine import build_audiobook
import tempfile
import os

# Lista de vozes neurais brasileiras e portuguesas
VOICES = {
    "Antonio (BR - Masculino)": "pt-BR-AntonioNeural",
    "Francisca (BR - Feminino)": "pt-BR-FranciscaNeural",
    "Thalita (BR - Feminino)": "pt-BR-ThalitaNeural",
    "Duarte (PT - Masculino)": "pt-PT-DuarteNeural",
    "Raquel (PT - Feminino)": "pt-PT-RaquelNeural"
}

def process_and_generate(input_type, url, text, voice_name, progress=gr.Progress()):
    try:
        if input_type == "Link (URL)":
            if not url:
                raise gr.Error("Por favor, insira um link válido.")
            progress(0, desc="Acessando o site e extraindo texto...")
            raw_text = extract_text_from_url(url)
        else:
            if not text:
                raise gr.Error("Por favor, insira o texto.")
            raw_text = text
            
        progress(0.1, desc="Processando e limpando o texto...")
        cleaned_text = clean_text(raw_text)
        chunks = chunk_text(cleaned_text)
        
        if not chunks:
            raise gr.Error("Nenhum texto encontrado para converter.")
            
        # Cria um arquivo temporário final no sistema
        output_filename = os.path.join(tempfile.gettempdir(), "audiobook_gerado.mp3")
        
        voice_id = VOICES[voice_name]
        
        def on_progress(p):
            # p vai de 0 até 1.0 (mapeado de 10% a 100%)
            progress(0.1 + (p * 0.9), desc=f"Gerando áudio com Edge TTS ({int(p*100)}%)...")
            
        build_audiobook(chunks, voice_id, output_filename, progress_callback=on_progress)
        
        return output_filename
        
    except Exception as e:
        raise gr.Error(f"Erro: {str(e)}")

# Interface Gráfica
with gr.Blocks(title="Conversor de Web Novel para Audiobook") as demo:
    gr.Markdown("# 🎧 Web Novel para Audiobook")
    gr.Markdown("Transforme links de capítulos de web novels ou textos longos em um audiobook de alta qualidade para escutar e baixar.")
    
    with gr.Row():
        with gr.Column(scale=1):
            input_type = gr.Radio(
                ["Link (URL)", "Texto Puro"], 
                label="De onde vem a história?", 
                value="Link (URL)"
            )
            url_input = gr.Textbox(
                label="URL do Capítulo", 
                placeholder="Ex: https://site-de-novel.com/capitulo-1"
            )
            text_input = gr.Textbox(
                label="Cole o Texto da História", 
                lines=10, 
                visible=False
            )
            
            voice_dropdown = gr.Dropdown(
                choices=list(VOICES.keys()), 
                label="Voz do Narrador", 
                value="Antonio (BR - Masculino)"
            )
            
            generate_btn = gr.Button("🔊 Gerar Audiobook", variant="primary")
            
        with gr.Column(scale=1):
            audio_output = gr.Audio(
                label="Audiobook Gerado", 
                type="filepath", 
                interactive=False
            )
            gr.Markdown("*Você pode escutar direto aqui pelo player ou clicar no ícone de Download (seta para baixo) que aparecerá no canto do player.*")
            
    # Lógica para alternar entre campo de texto e campo de URL
    def toggle_inputs(choice):
        if choice == "Link (URL)":
            return gr.update(visible=True), gr.update(visible=False)
        else:
            return gr.update(visible=False), gr.update(visible=True)
            
    input_type.change(fn=toggle_inputs, inputs=input_type, outputs=[url_input, text_input])
    
    # Evento de clique
    generate_btn.click(
        fn=process_and_generate,
        inputs=[input_type, url_input, text_input, voice_dropdown],
        outputs=audio_output
    )

if __name__ == "__main__":
    demo.launch(inbrowser=True)
