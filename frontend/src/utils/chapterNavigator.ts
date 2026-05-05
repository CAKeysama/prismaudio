export function getNextChapterUrl(currentUrl: string): string | null {
  if (!currentUrl) return null;

  try {
    const urlObj = new URL(currentUrl);
    
    // Tenta encontrar um número no final da URL
    // Ex: site.com/novel/capitulo-123 ou site.com/novel/123/
    const path = urlObj.pathname;
    
    // Expressão regular para pegar números no final (com ou sem barra final)
    const match = path.match(/(\d+)\/?$/);
    
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      const nextNumber = currentNumber + 1;
      
      // Substituir o número antigo pelo novo
      const newPath = path.replace(new RegExp(`${currentNumber}(\/?)$`), `${nextNumber}$1`);
      urlObj.pathname = newPath;
      
      return urlObj.toString();
    }
    
    return null;
  } catch (err) {
    console.error("Erro ao analisar URL para encontrar próximo capítulo:", err);
    return null;
  }
}
