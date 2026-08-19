import html2canvas, { Options } from 'html2canvas';

/**
 * Converts an oklch color string to rgb/rgba using canvas or standard fallbacks
 */
function oklchToRgb(oklchStr: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000'; // default
      ctx.fillStyle = oklchStr;
      // If the browser natively understands oklch in canvas context, ctx.fillStyle returns hex/rgb
      const fill = ctx.fillStyle;
      if (fill && !fill.includes('oklch')) {
        return fill;
      }
      // Otherwise draw 1 pixel and read back RGBA
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(2)})`;
    }
  } catch (e) {
    // Fallback if canvas fails
  }
  return '#1e293b';
}

/**
 * Sanitizes CSS text to replace unsupported oklch(...) color functions with safe rgb/rgba/hex
 */
export function sanitizeOklchInCssText(cssText: string): string {
  if (!cssText || !cssText.includes('oklch')) {
    return cssText;
  }
  return cssText.replace(/oklch\([^)]+\)/gi, (match) => {
    return oklchToRgb(match);
  });
}

/**
 * Sanitizes a cloned document before html2canvas parses it:
 * 1. Replaces all oklch() color functions in all <style> tags
 * 2. Replaces all oklch() color functions in inline style attributes of all elements
 */
export function sanitizeClonedDocumentForHtml2Canvas(clonedDoc: Document) {
  try {
    // 1. Process all <style> tags in the cloned document
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
        styleEl.textContent = sanitizeOklchInCssText(styleEl.textContent);
      }
    });

    // 2. Process all elements with inline style attributes containing oklch
    const allElements = clonedDoc.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute) {
        const inlineStyle = htmlEl.getAttribute('style');
        if (inlineStyle && inlineStyle.includes('oklch')) {
          htmlEl.setAttribute('style', sanitizeOklchInCssText(inlineStyle));
        }
      }
    });
  } catch (err) {
    console.warn('Could not sanitize oklch in cloned document for html2canvas:', err);
  }
}

/**
 * Safe wrapper around html2canvas that automatically strips/converts oklch colors
 */
export async function safeHtml2Canvas(element: HTMLElement, options: Partial<Options> = {}): Promise<HTMLCanvasElement> {
  const originalOnClone = options.onclone;

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    ...options,
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      sanitizeClonedDocumentForHtml2Canvas(clonedDoc);
      if (originalOnClone) {
        originalOnClone(clonedDoc, clonedEl);
      }
    },
  });
}
