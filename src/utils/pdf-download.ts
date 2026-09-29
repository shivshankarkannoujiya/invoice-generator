import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getMonthYearAbbr } from './date-helpers';

export interface PDFExportOptions {
  elementId: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
}

export function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_');
}

export async function downloadInvoicePDF({
  elementId,
  clientName,
  invoiceNumber,
  invoiceDate,
}: PDFExportOptions): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Invoice preview element #${elementId} not found`);
  }

  // File naming convention: <Client>_Invoice_<InvoiceNumber>_<Mon-YYYY>.pdf
  const safeClient = sanitizeFilename(clientName || 'Client');
  const safeInvNumber = sanitizeFilename(invoiceNumber || 'INV');
  const monYear = getMonthYearAbbr(invoiceDate);
  const filename = `${safeClient}_Invoice_${safeInvNumber}_${monYear}.pdf`;

  // Capture with html2canvas at high resolution (scale 2 for retina clarity)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      // In the cloned document for the PDF, reset any zoom scale and force unmasked state
      const target = clonedDoc.getElementById(elementId);
      if (target) {
        target.style.transform = 'none';
        target.style.boxShadow = 'none';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Render full A4 page
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(filename);

  return filename;
}
