import requests
from bs4 import BeautifulSoup
from readability import Document

from urllib.parse import urljoin

def extract_data_from_url(url: str) -> dict:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    # Extrair título e link de próximo capítulo do DOM completo
    full_soup = BeautifulSoup(response.text, 'html.parser')
    
    title = ""
    if full_soup.title and full_soup.title.string:
        title = full_soup.title.string.strip()
    if not title:
        h1 = full_soup.find('h1')
        if h1:
            title = h1.get_text(strip=True)
            
    next_url = ""
    next_keywords = ['next', 'próximo', 'proximo', '>>', 'próx', 'seguinte']
    for a in full_soup.find_all('a', href=True):
        text = a.get_text().lower().strip()
        classes = a.get('class', [])
        # Procurar também por classes CSS comuns de paginação caso o texto seja um ícone
        class_str = ' '.join(classes).lower()
        if any(kw in text for kw in next_keywords) or any(kw in class_str for kw in ['next', 'proximo']):
            href = a['href']
            if href and not href.startswith('#') and 'javascript' not in href:
                next_url = urljoin(url, href)
                break
                
    # Readability isola o conteúdo principal da página
    doc = Document(response.text)
    html_content = doc.summary()
    
    # BeautifulSoup limpa as tags HTML e extrai apenas o texto
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator='\n\n', strip=True)
    
    return {
        "text": text,
        "title": title,
        "next_url": next_url
    }
