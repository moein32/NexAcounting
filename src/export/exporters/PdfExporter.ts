import { safeHtml2Canvas } from '../../utils/html2canvasHelper';
import { jsPDF } from 'jspdf';

export class PdfExporter {
  /**
   * Captures an HTML element (e.g. invoice template container or report table)
   * and saves it as a high-quality PDF.
   */
  public static async exportElementToPdf(
    element: HTMLElement,
    filename: string,
    options?: { pageSize?: 'a4' | 'a5'; orientation?: 'p' | 'l' }
  ): Promise<void> {
    const canvas = await safeHtml2Canvas(element, {
      scale: 2, // High resolution canvas rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfPageSize = options?.pageSize || 'a4';
    const orientation = options?.orientation || 'p';

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pdfPageSize,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename}.pdf`);
  }
}
