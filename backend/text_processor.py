import re

def clean_text(text: str) -> str:
    """Remove espaços em excesso e caracteres invisíveis."""
    # Remove mais de duas quebras de linha seguidas
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove caracteres invisíveis/estranhos
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    return text.strip()

def chunk_text(text: str, max_chars: int = 4000) -> list[str]:
    """Divide o texto em blocos menores sem quebrar no meio de frases."""
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for p in paragraphs:
        # Se adicionar este parágrafo passar do limite, salva o chunk atual
        if len(current_chunk) + len(p) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = p + "\n\n"
        else:
            current_chunk += p + "\n\n"
            
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks
