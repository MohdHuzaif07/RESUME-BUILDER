/**
 * PDF Export Service
 * 100% Invariant WYSIWYG Client-Side A4 PDF Exporter.
 * Uses isolated DOM sandboxing to eliminate text overlapping, scaling artifacts, and scroll distortions.
 */

(function () {
  let isGeneratingPdf = false;

  const PdfExportService = {
    async exportPdf() {
      if (isGeneratingPdf) return;

      const previewEl = document.getElementById("resume-preview");
      const downloadBtn = document.getElementById("download-pdf-btn");

      if (!previewEl) {
        alert("Resume preview element not found.");
        return;
      }

      // Query all rendered A4 page sheets from the preview
      const pageSheets = Array.from(previewEl.querySelectorAll(".resume-page-sheet"));
      if (!pageSheets.length) {
        alert("No resume pages found to download.");
        return;
      }

      const { jsPDF } = window.jspdf || {};
      if (!jsPDF || typeof html2canvas !== "function") {
        alert("PDF library is loading or failed to load. Please try again.");
        return;
      }

      isGeneratingPdf = true;

      // Loading state on download button
      let originalBtnText = "";
      if (downloadBtn) {
        originalBtnText = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.classList.add("btn-loading");
        downloadBtn.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2 a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          <span>Generating PDF...</span>
        `;
      }

      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
          compress: true,
        });

        // Exact standard A4 dimensions in points
        const pdfWidth = window.AppConstants?.A4?.WIDTH_PT || 595.28;
        const pdfHeight = window.AppConstants?.A4?.HEIGHT_PT || 841.89;

        for (let i = 0; i < pageSheets.length; i++) {
          if (i > 0) pdf.addPage();

          const sheet = pageSheets[i];

          // Create an isolated, off-screen sandbox container on document.body
          // This guarantees that ancestor transform: scale(...) and scroll offsets do NOT distort html2canvas text positioning!
          const sandbox = document.createElement("div");
          sandbox.style.cssText = `
            position: fixed;
            top: 0;
            left: -9999px;
            width: 794px;
            height: 1123px;
            padding: 0;
            margin: 0;
            background-color: #ffffff;
            z-index: -9999;
            overflow: visible;
            box-sizing: border-box;
            transform: none !important;
          `;

          const clonedSheet = sheet.cloneNode(true);
          clonedSheet.style.transform = "none";
          clonedSheet.style.margin = "0";
          clonedSheet.style.width = "794px";
          clonedSheet.style.height = "1123px";
          clonedSheet.style.boxSizing = "border-box";
          sandbox.appendChild(clonedSheet);
          document.body.appendChild(sandbox);

          // Render canvas in the clean sandbox
          const canvas = await html2canvas(clonedSheet, {
            scale: 3,
            width: 794,
            height: 1123,
            windowWidth: 794,
            windowHeight: 1123,
            scrollX: 0,
            scrollY: 0,
            useCORS: true,
            allowTaint: true,
            logging: false,
            imageTimeout: 0,
            backgroundColor: "#ffffff",
          });

          const pageImgData = canvas.toDataURL("image/jpeg", 0.98);
          pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

          // Extract and map clickable hyperlinks from the cloned sheet
          const links = clonedSheet.querySelectorAll("a[href]");
          const sheetRect = clonedSheet.getBoundingClientRect();

          links.forEach((a) => {
            const href = a.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

            const rect = a.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const relX = ((rect.left - sheetRect.left) / sheetRect.width) * pdfWidth;
            const relY = ((rect.top - sheetRect.top) / sheetRect.height) * pdfHeight;
            const relW = (rect.width / sheetRect.width) * pdfWidth;
            const relH = (rect.height / sheetRect.height) * pdfHeight;

            pdf.setPage(i + 1);
            pdf.link(relX, relY, relW, relH, { url: href });
          });

          // Clean up the staging sandbox
          if (sandbox.parentNode) {
            sandbox.parentNode.removeChild(sandbox);
          }
        }

        const state = (typeof resumeState !== "undefined" && resumeState) ? resumeState : window.resumeState;
        const fullName = (state?.personalInfo?.fullName || "Resume").trim().replace(/\s+/g, "_");
        pdf.save(`${fullName}.pdf`);

        // Success state feedback
        if (downloadBtn) {
          downloadBtn.classList.remove("btn-loading");
          downloadBtn.classList.add("btn-success");
          downloadBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="checkmark-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>PDF Downloaded!</span>
          `;
          setTimeout(() => {
            downloadBtn.classList.remove("btn-success");
            downloadBtn.innerHTML = originalBtnText;
            downloadBtn.disabled = false;
          }, 2000);
        }
      } catch (err) {
        console.error("PDF generation error:", err);
        alert("An error occurred while generating your PDF. Please check the console for details.");
        if (downloadBtn) {
          downloadBtn.disabled = false;
          downloadBtn.classList.remove("btn-loading");
          downloadBtn.innerHTML = originalBtnText;
        }
      } finally {
        isGeneratingPdf = false;
      }
    },
  };

  window.PdfExportService = PdfExportService;
  window.downloadResumePdf = () => PdfExportService.exportPdf();
})();
