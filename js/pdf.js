/**
 * Direct Client-Side High-Speed PDF Exporter with Proper Multi-Page Alignment & Item-Level Page Breaks
 */

function getPageBreaks(previewEl, canvas, page1CanvasHeight, page2CanvasHeight) {
  const containerRect = previewEl.getBoundingClientRect();
  if (!containerRect.height) return [0, canvas.height];

  // Scale ratio from DOM coordinates to Canvas pixel coordinates
  const scale = canvas.height / containerRect.height;

  // Find atomic leaf elements (individual titles, subtitles, list items, paragraphs, headings).
  // DO NOT include entry wrapper containers like .resume-entry or .resume-section!
  const elements = Array.from(
    previewEl.querySelectorAll(
      ".resume-section-title, .resume-entry-title, .resume-entry-subtitle, .resume-entry-description li, .resume-entry-description p, .resume-sidebar-entry, .resume-language, .resume-list li, .resume-summary"
    )
  );

  const blocks = elements
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const top = (rect.top - containerRect.top) * scale;
      const bottom = (rect.bottom - containerRect.top) * scale;
      const isTitle = el.classList.contains("resume-section-title");
      return { top, bottom, height: bottom - top, isTitle, el };
    })
    .filter((b) => b.height > 0)
    .sort((a, b) => a.top - b.top);

  const breaks = [1];
  let currentY = 0;
  const totalCanvasHeight = canvas.height;
  let pageIdx = 0;

  while (currentY + (pageIdx === 0 ? page1CanvasHeight : page2CanvasHeight) < totalCanvasHeight - 15) {
    const targetHeight = pageIdx === 0 ? page1CanvasHeight : page2CanvasHeight;
    const idealY = currentY + targetHeight;
    let actualY = idealY;

    // Find the specific item element that crosses idealY
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.top < idealY && b.bottom > idealY) {
        if (b.top > currentY + 30) {
          actualY = b.top - 4;
        }
        break;
      }
    }

    // Orphan section title check:
    // If actualY leaves a section title alone near the bottom (no item fits after title), break BEFORE section title!
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.isTitle) {
        const nextItem = blocks[i + 1];
        if (nextItem && nextItem.top >= actualY && b.top < actualY) {
          if (b.top > currentY + 30 && actualY - b.top < 60) {
            actualY = b.top - 4;
          }
        }
      }
    }

    if (actualY <= currentY) {
      actualY = idealY;
    }

    breaks.push(actualY);
    currentY = actualY;
    pageIdx++;
  }

  breaks.push(totalCanvasHeight);
  return breaks;
}

let isGeneratingPdf = false;

async function downloadResumePdf() {
  if (isGeneratingPdf) return;

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

  isGeneratingPdf = true;

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

    const pageTopMarginPt = 28;    // 28pt top margin for Page 2+
    const pageBottomMarginPt = 28; // 28pt bottom margin for all pages

    // Printable canvas height available on Page 1 vs Page 2+
    const page1MaxPt = pdfHeight - pageBottomMarginPt;
    const page2MaxPt = pdfHeight - pageTopMarginPt - pageBottomMarginPt;

    const page1CanvasHeight = (page1MaxPt / pdfWidth) * canvas.width;
    const page2CanvasHeight = (page2MaxPt / pdfWidth) * canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const breaks = getPageBreaks(previewEl, canvas, page1CanvasHeight, page2CanvasHeight);
    const pageCount = breaks.length - 1;

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

      const sliceStartY = breaks[pageIdx];
      const offsetInSliceCanvas = relTopCanvas - sliceStartY;
      const offsetInSlicePt = (offsetInSliceCanvas / canvas.width) * pdfWidth;

      const topMarginForThisPage = pageIdx === 0 ? 0 : pageTopMarginPt;
      const pdfY = topMarginForThisPage + offsetInSlicePt;
      const pdfX = (relLeft / containerRect.width) * pdfWidth;
      const pdfW = (rect.width / containerRect.width) * pdfWidth;
      const pdfH = (rect.height / containerRect.height) * (pdfWidth * (canvas.height / canvas.width));

      pdf.setPage(pageIdx + 1);
      pdf.link(pdfX, pdfY, pdfW, pdfH, { url: href });
    });

    const fullName = (resumeState.personalInfo.fullName || "Resume").trim().replace(/\s+/g, "_");
    pdf.save(`${fullName}.pdf`);

    // Show smooth success state
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
}
