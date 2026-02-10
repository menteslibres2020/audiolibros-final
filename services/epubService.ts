
import JSZip from 'jszip';

export interface EpubSegment {
  id: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  imageUrl?: string;
  imagePrompt?: string;
  charCount: number;
}

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  charCount: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  isIntro?: boolean;
  segments?: EpubSegment[];
}

export class EpubService {
  // Lista expandida de palabras que suelen indicar contenido no narrativo
  private garbageKeywords = [
    'tito luis', 'epublibre', 'digitalizado por', 'corregido por', 'maquetado por',
    'legal', 'copyright', 'licencia', 'página de créditos', 'introducción del editor',
    'sobre este libro', 'epub v', 'v1.0', 'v1.1', 'v1.2', 'v2.0', 'edición electrónica',
    'todos los derechos reservados', 'isbn:', 'issn:', 'depósito legal', 'jagoba',
    'maquetación:', 'corrección:', 'generado con', 'instrucciones de uso',
    'índice', 'tabla de contenidos', 'table of contents', 'índice de capítulos',
    'dedicatoria', 'agradecimientos', 'prefacio', 'notas de la edición'
  ];

  private MAX_FRAGMENTS_PER_CHAPTER = 10;

  async parseEpub(file: File): Promise<{ title: string; author: string; chapters: EpubChapter[] }> {
    const zip = await JSZip.loadAsync(file);
    const containerXml = await zip.file("META-INF/container.xml")?.async("string");
    if (!containerXml) throw new Error("No es un archivo ePub válido");

    const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
    if (!opfPath) throw new Error("No se pudo encontrar el manifiesto");

    const opfContent = await zip.file(opfPath)?.async("string");
    if (!opfContent) throw new Error("No se pudo leer el manifiesto");

    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
    const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/);
    const title = titleMatch ? titleMatch[1] : "Libro Desconocido";
    const author = authorMatch ? authorMatch[1] : "";

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opfContent, "text/xml");
    const manifestItems: Record<string, string> = {};
    Array.from(xmlDoc.querySelectorAll("manifest > item")).forEach(item => {
      manifestItems[item.getAttribute("id") || ""] = item.getAttribute("href") || "";
    });

    const spineItems = Array.from(xmlDoc.querySelectorAll("spine > itemref")).map(ref => {
      const idref = ref.getAttribute("idref") || "";
      return manifestItems[idref];
    });

    const chapters: EpubChapter[] = [];
    const baseDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

    for (let i = 0; i < spineItems.length; i++) {
      const href = spineItems[i];
      const fullPath = baseDir + href;
      const contentHtml = await zip.file(fullPath)?.async("string");

      if (contentHtml) {
        const doc = parser.parseFromString(contentHtml, "text/html");

        // Limpieza profunda de elementos HTML no deseados
        doc.querySelectorAll('script, style, nav, footer, header, hr, aside, .index, .toc').forEach(el => el.remove());

        let chapterTitle = doc.querySelector('h1, h2, h3')?.textContent?.trim();
        let text = doc.body.innerText.trim();

        // Filtro agresivo de basura
        if (this.isGarbageContent(text, title, author, chapterTitle)) continue;

        const cleaned = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

        // Solo aceptamos capítulos con suficiente contenido real
        if (cleaned.length > 100) {
          const segments = this.splitIntoManageableChunks(cleaned);
          if (segments.length > 0) {
            chapters.push({
              id: `ch-${i}-${Math.random().toString(36).substr(2, 5)}`,
              title: chapterTitle || `Capítulo ${chapters.length + 1}`,
              content: cleaned,
              charCount: cleaned.length,
              status: 'pending',
              segments: segments
            });
          }
        }
      }
    }
    return { title, author, chapters };
  }

  private isGarbageContent(text: string, title: string, author: string, chapterTitle?: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerTitle = chapterTitle?.toLowerCase() || "";

    // 1. Check keywords en el texto o el título
    const hasGarbageWord = this.garbageKeywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase()) || lowerTitle.includes(keyword.toLowerCase())
    );

    // Si es muy corto y tiene una palabra basura, fuera.
    if (text.length < 2000 && hasGarbageWord) return true;

    // 2. Detección de índices (alta densidad de números o puntos suspensivos)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 5) {
      const numericLines = lines.filter(l => /[\d\.]{2,}/.test(l)).length;
      const dottedLines = lines.filter(l => l.includes('...') || l.includes('···')).length;
      // Si más del 40% de las líneas parecen de un índice, es basura
      if ((numericLines + dottedLines) / lines.length > 0.4 && text.length < 5000) return true;
    }

    // 3. Solo título o autor (páginas de respeto)
    if (text.length < 500 && (lowerText.includes(title.toLowerCase()) || lowerText.includes(author.toLowerCase()))) {
      // A menos que sea un capítulo real, suele ser basura
      if (lines.length < 10) return true;
    }

    return false;
  }

  private splitIntoManageableChunks(text: string): EpubSegment[] {
    const MAX_CHARS = 2000;
    const paragraphs = text.split(/\n+/);
    const segments: EpubSegment[] = [];

    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // Si el párrafo actual ya excede el límite (caso raro de párrafo gigante), lo cortamos a la fuerza
      if (paragraph.length > MAX_CHARS) {
        if (currentChunk) {
          segments.push(this.createSegment(currentChunk));
          currentChunk = "";
        }
        // Cortar párrafo gigante en pedazos de 3000
        let tempP = paragraph;
        while (tempP.length > 0) {
          let slice = tempP.slice(0, MAX_CHARS);
          // Intentar cortar en un punto y seguido para no dejar frases cortadas
          const lastPeriod = slice.lastIndexOf('.');
          if (lastPeriod > MAX_CHARS * 0.8) {
            slice = tempP.slice(0, lastPeriod + 1);
          }
          segments.push(this.createSegment(slice));
          tempP = tempP.slice(slice.length).trim();
        }
      }
      // Si sumar este párrafo no pasa el límite, lo acumulamos
      else if (currentChunk.length + paragraph.length < MAX_CHARS) {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
      // Si pasa el límite, guardamos el chunk actual y empezamos uno nuevo con este párrafo
      else {
        segments.push(this.createSegment(currentChunk));
        currentChunk = paragraph;
      }
    }

    if (currentChunk.trim()) {
      segments.push(this.createSegment(currentChunk));
    }

    return segments;
  }

  private createSegment(content: string): EpubSegment {
    return {
      id: `seg-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      status: 'pending',
      charCount: content.trim().length
    };
  }
}

export const epubService = new EpubService();
