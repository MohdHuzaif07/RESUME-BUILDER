/**
 * PDF Export Bridge
 * Delegates to PdfExportService with sandboxed zero-distortion rendering.
 */

async function downloadResumePdf() {
  if (window.PdfExportService && typeof window.PdfExportService.exportPdf === "function") {
    return window.PdfExportService.exportPdf();
  }
  alert("PDF generator component is still loading.");
}

window.downloadResumePdf = downloadResumePdf;
