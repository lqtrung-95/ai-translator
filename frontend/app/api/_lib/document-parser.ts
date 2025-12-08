import * as cheerio from 'cheerio';

export interface ParsedParagraph {
  id: string;
  order: number;
  type: 'heading' | 'paragraph' | 'code' | 'list';
  original: string;
  translated?: string;
  translationStatus?: 'pending' | 'translating' | 'completed' | 'error';
  metadata?: {
    headingLevel?: number;
    language?: string;
  };
}

export interface ParsedDocument {
  title: string;
  paragraphs: ParsedParagraph[];
  metadata: {
    source: string;
    format: 'url' | 'html' | 'markdown' | 'text';
    extractedAt: string;
    totalParagraphs: number;
  };
}

/**
 * Fetch and parse a URL
 */
export async function parseUrl(url: string): Promise<ParsedDocument> {
  console.log(`Fetching URL: ${url}`);

  // Extract anchor/hash from URL
  let anchorId: string | null = null;
  let cleanUrl = url;

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    anchorId = url.substring(hashIndex + 1);
    cleanUrl = url.substring(0, hashIndex);
    console.log(`Detected anchor: #${anchorId}`);
  }

  const response = await fetch(cleanUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return parseHTML(html, url, 'url', anchorId);
}

/**
 * Parse HTML content
 */
export function parseHTML(html: string, source: string = 'upload', format: 'url' | 'html' = 'html', anchorId?: string | null): ParsedDocument {
  const $ = cheerio.load(html);

  // Remove unwanted elements including images, figures, and media
  $('script, style, nav, footer, header, aside, .sidebar, .navigation, .menu, .ads, .advertisement, .cookie-banner, .popup, img, figure, picture, video, iframe, svg').remove();

  // Try to find the main content area
  let mainContent = $('main, article, .content, .main-content, #content, #main, .documentation, .doc-content, .markdown-body, .prose').first();
  if (mainContent.length === 0) {
    mainContent = $('body');
  }

  // If anchor ID is provided, try to find that element and start from there
  if (anchorId) {
    // Try different ID formats and common patterns
    const possibleIds = [
      anchorId,
      anchorId.replace(/_/g, '-'),
      anchorId.replace(/-/g, '_'),
      decodeURIComponent(anchorId),
    ];

    let foundElement = null;
    for (const id of possibleIds) {
      // Try to find by ID
      const byId = $(`#${id}`);
      if (byId.length > 0) {
        foundElement = byId;
        break;
      }

      // Try to find by name attribute
      const byName = $(`[name="${id}"]`);
      if (byName.length > 0) {
        foundElement = byName;
        break;
      }

      // Try to find heading with matching text or data attributes
      const byDataId = $(`[data-id="${id}"], [data-anchor="${id}"]`);
      if (byDataId.length > 0) {
        foundElement = byDataId;
        break;
      }
    }

    if (foundElement && foundElement.length > 0) {
      console.log(`Found anchor element: ${anchorId}`);

      // Get the anchor element and all its following siblings
      // Create a temporary container to hold these elements
      const tempContainer = $('<div></div>');
      foundElement.nextAll().addBack().each((_, el) => {
        tempContainer.append($(el).clone());
      });
      mainContent = tempContainer as any;
    } else {
      console.log(`Anchor not found: ${anchorId}, parsing from beginning`);
    }
  }

  // Extract title
  let title = $('title').text().trim() ||
              $('h1').first().text().trim() ||
              'Untitled Document';

  // Clean up title
  title = title.replace(/\s+/g, ' ').substring(0, 200);

  const paragraphs: ParsedParagraph[] = [];
  let order = 0;

  // Process elements in order
  mainContent.find('h1, h2, h3, h4, h5, h6, p, pre, code, ul, ol, blockquote, table').each((_, element) => {
    const $el = $(element);
    const tagName = element.tagName.toLowerCase();
    let text = '';
    let type: ParsedParagraph['type'] = 'paragraph';
    const metadata: ParsedParagraph['metadata'] = {};

    // Skip empty elements
    text = $el.text().trim();
    if (!text || text.length < 3) return;

    // Skip if inside another processed element
    if ($el.parents('pre, code, ul, ol, table').length > 0 && !['pre', 'code', 'ul', 'ol', 'table'].includes(tagName)) {
      return;
    }

    // Skip if text contains image alt text patterns or common image-related phrases
    const imagePatterns = [
      /^(image|photo|picture|figure|diagram|screenshot|icon|logo|illustration)(\s|:|\.|$)/i,
      /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i,
      /click to (enlarge|expand|view)/i,
      /thumbnail/i,
    ];

    const hasImagePattern = imagePatterns.some(pattern => pattern.test(text));
    if (hasImagePattern) {
      return; // Skip this element
    }

    // Determine type and extract content
    if (tagName.match(/^h[1-6]$/)) {
      type = 'heading';
      metadata.headingLevel = parseInt(tagName[1]);
    } else if (tagName === 'pre' || (tagName === 'code' && $el.parent('pre').length === 0)) {
      type = 'code';
      // Try to detect language from class
      const className = $el.attr('class') || $el.parent().attr('class') || '';
      const langMatch = className.match(/language-(\w+)|lang-(\w+)|(\w+)-code|highlight-(\w+)/);
      if (langMatch) {
        metadata.language = langMatch[1] || langMatch[2] || langMatch[3] || langMatch[4];
      }
      // For code, preserve formatting
      text = $el.text();
    } else if (tagName === 'ul' || tagName === 'ol') {
      type = 'list';
      // Convert list items to bullet points
      const items: string[] = [];
      $el.children('li').each((_, li) => {
        const itemText = $(li).text().trim();
        if (itemText) {
          items.push(`• ${itemText}`);
        }
      });
      text = items.join('\n');
    } else if (tagName === 'blockquote') {
      type = 'paragraph';
      text = `> ${text}`;
    } else if (tagName === 'table') {
      type = 'paragraph';
      // Simple table to text conversion
      const rows: string[] = [];
      $el.find('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('th, td').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells.join(' | '));
        }
      });
      text = rows.join('\n');
    }

    // Skip duplicates and very short content
    if (text.length >= 3) {
      order++;
      paragraphs.push({
        id: `p-${order}`,
        order,
        type,
        original: text,
        translationStatus: 'pending',
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }
  });

  // If we got very few paragraphs, try a simpler approach
  if (paragraphs.length < 3) {
    const bodyText = mainContent.text();
    const sentences = bodyText.split(/[.!?。！？]\s+/).filter(s => s.trim().length > 10);

    paragraphs.length = 0;
    sentences.slice(0, 50).forEach((sentence, idx) => {
      paragraphs.push({
        id: `p-${idx + 1}`,
        order: idx + 1,
        type: 'paragraph',
        original: sentence.trim(),
        translationStatus: 'pending',
      });
    });
  }

  return {
    title,
    paragraphs: paragraphs.slice(0, 100), // Limit to 100 paragraphs
    metadata: {
      source,
      format,
      extractedAt: new Date().toISOString(),
      totalParagraphs: paragraphs.length,
    },
  };
}

/**
 * Parse Markdown content
 */
export function parseMarkdown(markdown: string, source: string = 'upload'): ParsedDocument {
  const paragraphs: ParsedParagraph[] = [];
  let order = 0;
  let title = 'Untitled Document';

  // Split by lines and process
  const lines = markdown.split('\n');
  let currentBlock: string[] = [];
  let currentType: ParsedParagraph['type'] = 'paragraph';
  let inCodeBlock = false;
  let codeLanguage = '';

  const flushBlock = () => {
    if (currentBlock.length === 0) return;

    const text = currentBlock.join('\n').trim();
    if (text.length < 3) {
      currentBlock = [];
      return;
    }

    order++;
    paragraphs.push({
      id: `p-${order}`,
      order,
      type: currentType,
      original: text,
      translationStatus: 'pending',
      metadata: currentType === 'code' && codeLanguage ? { language: codeLanguage } : undefined,
    });
    currentBlock = [];
    currentType = 'paragraph';
  };

  for (const line of lines) {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        flushBlock();
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        // Start of code block
        flushBlock();
        inCodeBlock = true;
        currentType = 'code';
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlock.push(line);
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushBlock();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Use first h1 as title
      if (level === 1 && title === 'Untitled Document') {
        title = headingText;
      }

      order++;
      paragraphs.push({
        id: `p-${order}`,
        order,
        type: 'heading',
        original: headingText,
        translationStatus: 'pending',
        metadata: { headingLevel: level },
      });
      continue;
    }

    // List item
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      if (currentType !== 'list') {
        flushBlock();
        currentType = 'list';
      }
      currentBlock.push(line.replace(/^[\s]*[-*+]\s+/, '• ').replace(/^[\s]*\d+\.\s+/, '• '));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushBlock();
      continue;
    }

    // Regular paragraph
    if (currentType === 'list') {
      flushBlock();
    }
    currentBlock.push(line);
  }

  // Flush remaining content
  flushBlock();

  return {
    title,
    paragraphs: paragraphs.slice(0, 100),
    metadata: {
      source,
      format: 'markdown',
      extractedAt: new Date().toISOString(),
      totalParagraphs: paragraphs.length,
    },
  };
}

/**
 * Parse plain text content
 */
export function parsePlainText(text: string, source: string = 'upload'): ParsedDocument {
  const paragraphs: ParsedParagraph[] = [];

  // Split by double newlines or single newlines
  const blocks = text.split(/\n\n+/).filter(b => b.trim().length > 0);

  blocks.slice(0, 100).forEach((block, idx) => {
    const trimmed = block.trim();
    if (trimmed.length < 3) return;

    paragraphs.push({
      id: `p-${idx + 1}`,
      order: idx + 1,
      type: 'paragraph',
      original: trimmed,
      translationStatus: 'pending',
    });
  });

  // Extract title from first paragraph if it looks like a title
  let title = 'Untitled Document';
  if (paragraphs.length > 0 && paragraphs[0].original.length < 100) {
    title = paragraphs[0].original;
  }

  return {
    title,
    paragraphs,
    metadata: {
      source,
      format: 'text',
      extractedAt: new Date().toISOString(),
      totalParagraphs: paragraphs.length,
    },
  };
}

/**
 * Parse PDF content from base64
 * Note: PDF parsing is not currently supported due to library compatibility issues
 */
export async function parsePDF(base64Content: string, source: string = 'upload'): Promise<ParsedDocument> {
  // PDF parsing is complex and the pdf-parse library has ESM compatibility issues
  // For now, return an error message as a paragraph
  return {
    title: 'PDF Document',
    paragraphs: [{
      id: 'pdf-error-1',
      order: 0,
      type: 'paragraph',
      original: 'PDF parsing is not currently supported. Please convert your PDF to text or HTML format first, or paste the content directly.',
      translationStatus: 'pending'
    }],
    metadata: {
      source,
      format: 'text' as const,
      extractedAt: new Date().toISOString(),
      totalParagraphs: 1
    }
  };
}

/**
 * Auto-detect format and parse
 */
export function parseContent(content: string, source: string = 'upload'): ParsedDocument {
  // Detect format
  if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html') || content.includes('<body')) {
    return parseHTML(content, source, 'html');
  }

  // Check for Markdown indicators
  if (content.match(/^#{1,6}\s+/m) || content.includes('```') || content.match(/\[.+\]\(.+\)/)) {
    return parseMarkdown(content, source);
  }

  // Default to plain text
  return parsePlainText(content, source);
}

/**
 * Auto-detect format and parse (async version for PDF support)
 */
export async function parseContentAsync(content: string, source: string = 'upload'): Promise<ParsedDocument> {
  // Check if it's a PDF (base64)
  if (content.startsWith('data:application/pdf;base64,')) {
    return parsePDF(content, source);
  }

  // Otherwise use sync parser
  return parseContent(content, source);
}