import requests
from bs4 import BeautifulSoup
from readability import Document

def extract_text_from_url(url: str) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    # Readability isola o conteúdo principal da página
    doc = Document(response.text)
    html_content = doc.summary()
    
    # BeautifulSoup limpa as tags HTML e extrai apenas o texto
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator='\n\n', strip=True)
    return text
