/**
 * Direct Client-Side High-Speed PDF Exporter with Clickable Link Annotations
 */

async function downloadResumePdf() {
  const previewEl = document.getElementById("resume-preview");
  const downloadBtn = document.getElementById("download-pdf-btn");

  if (!previewEl) {
    alert("Resume preview element not found.");
    return;
  }

  // Ensure jsPDF and html2canvas are available
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || typeof html2canvas !== "function") {
    alert("PDF library is loading or failed to load. Please try again.");
    return;
  }

  // Set loading state on button
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
    // Speed-optimized canvas rendering flags
    const canvas = await html2canvas(previewEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Standard A4 dimensions in points (72 points per inch)
    const pdfWidth = 595.28;
    const pdfHeight = 841.89;

    const containerWidth = previewEl.offsetWidth || canvas.width / 2;
    const containerHeight = previewEl.offsetHeight || canvas.height / 2;
    const ratio = pdfWidth / containerWidth;
    const totalPdfHeight = containerHeight * ratio;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pageCount = Math.ceil(totalPdfHeight / pdfHeight);

    if (pageCount <= 1) {
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, totalPdfHeight, undefined, "FAST");
    } else {
      // Slicing canvas across pages if document height exceeds single A4
      const canvasPageHeight = (pdfHeight / pdfWidth) * canvas.width;

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(canvasPageHeight, canvas.height - i * canvasPageHeight);

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            i * canvasPageHeight,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            canvas.width,
            pageCanvas.height
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        const slicePdfHeight = (pageCanvas.height / canvas.width) * pdfWidth;
        pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, slicePdfHeight, undefined, "FAST");
      }
    }

    // MAP CLICKABLE HYPERLINKS ONTO PDF
    const links = previewEl.querySelectorAll("a[href]");
    const containerRect = previewEl.getBoundingClientRect();

    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const rect = a.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relLeft = rect.left - containerRect.left;
      const relTop = rect.top - containerRect.top;

      const pdfX = relLeft * ratio;
      const pdfY = relTop * ratio;
      const pdfW = rect.width * ratio;
      const pdfH = rect.height * ratio;

      const targetPageIndex = Math.floor(pdfY / pdfHeight);
      const pageY = pdfY % pdfHeight;

      if (targetPageIndex < pageCount) {
        pdf.setPage(targetPageIndex + 1);
        pdf.link(pdfX, pageY, pdfW, pdfH, { url: href });
      }
    });

    // Generate clean dynamic filename
    const fullName = resumeState?.personalInfo?.fullName?.trim();
    const safeName = fullName ? fullName.replace(/[^a-zA-Z0-9_-]/g, "_") : "Resume";
    const filename = `${safeName}_Resume.pdf`;

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("An error occurred while generating the PDF. Please try again.");
  } finally {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.classList.remove("btn-loading");
      downloadBtn.innerHTML = originalBtnText;
    }
  }
}
