/**
 * Direct Client-Side High-Speed PDF Exporter with Proper Multi-Page Alignment & Item-Level Page Breaks
 */

function getPageBreaks(previewEl, canvas, canvasPageHeight) {
  const containerRect = previewEl.getBoundingClientRect();
  if (!containerRect.height) return [0, canvas.height];

  // Scale ratio from DOM coordinates to Canvas pixel coordinates
  const scale = canvas.height / containerRect.height;

  // Find all individual breakable item elements:
  // (.resume-entry, .resume-sidebar-entry, .resume-language, .resume-section-title, .resume-section, p, li)
  const elements = Array.from(
    previewEl.querySelectorAll(
      ".resume-entry, .resume-sidebar-entry, .resume-language, .resume-section-title, .resume-section, p, li"
    )
  );

  const blocks = elements
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const top = (rect.top - containerRect.top) * scale;
      const bottom = (rect.bottom - containerRect.top) * scale;
      return { top, bottom, height: bottom - top };
    })
    .filter((b) => b.height > 0)
    .sort((a, b) => a.top - b.top);

  const breaks = [0];
  let currentY = 0;
  const totalCanvasHeight = canvas.height;

  while (currentY + canvasPageHeight < totalCanvasHeight - 15) {
    const idealY = currentY + canvasPageHeight;
    let actualY = idealY;

    // Find the specific item element that crosses idealY
    for (const b of blocks) {
      if (b.top < idealY && b.bottom > idealY) {
        // Break 4px above this specific item if it started after currentY
        if (b.top > currentY + 25) {
          actualY = b.top - 4;
        }
        break;
      }
    }

    if (actualY <= currentY) {
      actualY = idealY;
    }

    breaks.push(actualY);
    currentY = actualY;
  }

  breaks.push(totalCanvasHeight);
  return breaks;
}

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
    // Ultra High-Definition (Scale 3) crisp canvas rendering
    const canvas = await html2canvas(previewEl, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      backgroundColor: "#ffffff",
    });

    // Standard A4 dimensions in points (72 points per inch)
    const pdfWidth = 595.28;
    const pdfHeight = 841.89;

    const containerWidth = previewEl.offsetWidth || canvas.width / 3;
    const ratio = pdfWidth / containerWidth;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const canvasPageHeight = (pdfHeight / pdfWidth) * canvas.width;
    const breaks = getPageBreaks(previewEl, canvas, canvasPageHeight);
    const pageCount = breaks.length - 1;

    const pageTopMarginPt = 24; // Elegant 24pt top margin for Page 2+

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) pdf.addPage();

      const startY = breaks[i];
      const endY = breaks[i + 1];
      const sliceHeight = endY - startY;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
      }

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
      const slicePdfHeight = (sliceHeight / canvas.width) * pdfWidth;

      // Page 1 starts at Y=0; Page 2+ starts at Y=pageTopMarginPt for proper top spacing
      const renderY = i === 0 ? 0 : pageTopMarginPt;
      pdf.addImage(pageImgData, "JPEG", 0, renderY, pdfWidth, slicePdfHeight, undefined, "FAST");
    }

    // MAP CLICKABLE HYPERLINKS ONTO PDF WITH ITEM-LEVEL OFFSETS & TOP MARGIN
    const links = previewEl.querySelectorAll("a[href]");
    const containerRect = previewEl.getBoundingClientRect();
    const scale = canvas.height / containerRect.height;

    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const rect = a.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relLeft = rect.left - containerRect.left;
      const relTopCanvas = (rect.top - containerRect.top) * scale;

      // Find page slice index for this link
      let pageIdx = 0;
      for (let i = 0; i < pageCount; i++) {
        if (relTopCanvas >= breaks[i] && relTopCanvas < breaks[i + 1]) {
          pageIdx = i;
          break;
        }
      }

      const pageTopCanvas = relTopCanvas - breaks[pageIdx];
      const topOffsetPt = pageIdx === 0 ? 0 : pageTopMarginPt;
      const pdfX = relLeft * ratio;
      const pdfY = (pageTopCanvas / scale) * ratio + topOffsetPt;
      const pdfW = rect.width * ratio;
      const pdfH = rect.height * ratio;

      if (pageIdx < pageCount) {
        pdf.setPage(pageIdx + 1);
        pdf.link(pdfX, pdfY, pdfW, pdfH, { url: href });
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
