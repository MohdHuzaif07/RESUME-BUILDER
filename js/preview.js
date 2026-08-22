/**
 * Renders the live resume preview from resumeState with exact multi-page break visual indicators.
 */

function escapeHtml(value) {
  if (value == null || value === "") return "";
  const el = document.createElement("span");
  el.textContent = String(value);
  return el.innerHTML;
}

/**
 * Converts lightweight markdown-like syntax to HTML for resume descriptions and summaries.
 */
function formatRichText(value) {
  if (value == null || value === "") return "";
  const raw = String(value);
  const lines = raw.split(/\r?\n/);

  const result = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = /^([*\-•+])\s*(.+)$/.exec(trimmed);

    if (bulletMatch) {
      if (!inList) {
        result.push("<ul>");
        inList = true;
      }
      result.push(`<li>${applyInlineFormatting(escapeHtml(bulletMatch[2]))}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (trimmed.length > 0) {
        result.push(`<p>${applyInlineFormatting(escapeHtml(trimmed))}</p>`);
      }
    }
  }

  if (inList) {
    result.push("</ul>");
  }

  return result.join("");
}

function applyInlineFormatting(escaped) {
  if (!escaped) return "";
  let formatted = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.+?)__/g, "<strong>$1</strong>");
  formatted = formatted.replace(/(?:^|[^*])\*([^*]+)\*(?!\*)/g, (match, p1) => {
    return match.replace(`*${p1}*`, `<em>${p1}</em>`);
  });
  formatted = formatted.replace(/(?:|^|[^_])_([^_]+)_(?!_)/g, (match, p1) => {
    return match.replace(`_${p1}_`, `<em>${p1}</em>`);
  });
  return formatted;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatMonthYear(value) {
  if (!hasText(value)) return "";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(start, end, isCurrent) {
  const startLabel = formatMonthYear(start);
  const endLabel = isCurrent ? "Present" : formatMonthYear(end);

  if (!startLabel && !endLabel) return "";
  if (!startLabel) return endLabel;
  if (!endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

function safeHref(url) {
  if (!hasText(url) || typeof isValidUrl !== "function" || !isValidUrl(url.trim())) {
    return "";
  }
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return "";
    }
  } catch {
    return "";
  }
  return escapeHtml(url.trim());
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).filter(Boolean);
  }
  if (hasText(skills)) {
    return skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
}

function entryHasContent(entry, fields) {
  return fields.some((field) => {
    const value = entry[field];
    if (typeof value === "boolean") return value;
    return hasText(value);
  });
}

function formatProficiency(value) {
  if (!hasText(value)) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Paginates rendered resume HTML into discrete, pixel-accurate A4 page sheets.
 * Standard A4 at 96 DPI: 794px width x 1123px height.
 */
function paginateResumeHtml(rawHtml, templateKey) {
  if (!rawHtml || !rawHtml.trim()) {
    return "";
  }

  // Node environment fallback for unit tests
  if (typeof document === "undefined" || !document.body) {
    return `
      <div class="resume-page-wrapper" data-page-number="1">
        <div class="resume-page-header-badge">Page 1 of 1</div>
        <div class="resume resume--${templateKey} resume-page-sheet" data-page="1">
          ${rawHtml}
        </div>
      </div>
    `;
  }

  // Measure content in an off-screen staging container with standard A4 width
  const staging = document.createElement("div");
  staging.className = `resume resume--${templateKey} resume-staging-measure`;
  staging.style.cssText =
    "position: absolute; left: -9999px; top: 0; width: 794px; min-width: 794px; max-width: 794px; padding: 2.5rem; box-sizing: border-box; visibility: hidden; pointer-events: none; height: auto;";
  staging.innerHTML = rawHtml;
  document.body.appendChild(staging);

  const PAGE_HEIGHT_PX = 1123;
  const computedStyle = window.getComputedStyle ? window.getComputedStyle(staging) : null;
  const paddingTop = computedStyle ? parseFloat(computedStyle.paddingTop) || 40 : 40;
  const paddingBottom = computedStyle ? parseFloat(computedStyle.paddingBottom) || 40 : 40;
  // Enforce consistent top & bottom border padding on every page
  const usableHeight = PAGE_HEIGHT_PX - (paddingTop + paddingBottom);

  const totalHeight = staging.scrollHeight;

  // Single page optimization: if fits within one A4 page sheet
  if (totalHeight <= PAGE_HEIGHT_PX) {
    document.body.removeChild(staging);
    return `
      <div class="resume-page-wrapper" data-page-number="1">
        <div class="resume-page-header-badge">Page 1 of 1</div>
        <div class="resume resume--${templateKey} resume-page-sheet" data-page="1">
          ${rawHtml}
        </div>
      </div>
    `;
  }

  // Multi-page distribution
  const topLevelChildren = Array.from(staging.children);
  const pages = [];
  let currentPageElements = [];
  let currentPageHeight = 0;

  for (let i = 0; i < topLevelChildren.length; i++) {
    const node = topLevelChildren[i];
    const nodeHeight = node.offsetHeight;
    const nodeMarginBottom = computedStyle
      ? parseFloat(window.getComputedStyle(node).marginBottom) || 0
      : 18;
    const totalNodeHeight = nodeHeight + nodeMarginBottom;

    if (currentPageHeight + totalNodeHeight <= usableHeight) {
      currentPageElements.push(node.cloneNode(true));
      currentPageHeight += totalNodeHeight;
    } else {
      const isSection = node.classList.contains("resume-section");
      const titleEl = isSection ? node.querySelector(".resume-section-title") : null;
      const entryEls = isSection
        ? Array.from(
            node.querySelectorAll(
              ".resume-entry, .resume-grid-entry, .resume-list, .resume-summary, .resume-skills-list, .resume-languages-list, .resume-certifications-list, .resume-skill-group"
            )
          )
        : [];

      if (isSection && titleEl && entryEls.length > 0) {
        const titleHeight = titleEl.offsetHeight + 10;
        let sectionForCurrentPage = document.createElement("section");
        sectionForCurrentPage.className = node.className;
        sectionForCurrentPage.appendChild(titleEl.cloneNode(true));

        let currentSecHeight = titleHeight;
        let entriesOnCurrent = 0;
        let remainingEntries = [];

        for (let j = 0; j < entryEls.length; j++) {
          const entry = entryEls[j];
          const entryHeight =
            entry.offsetHeight +
            (parseFloat(window.getComputedStyle(entry)?.marginBottom) || 12);

          if (
            currentPageHeight + currentSecHeight + entryHeight <= usableHeight &&
            remainingEntries.length === 0
          ) {
            sectionForCurrentPage.appendChild(entry.cloneNode(true));
            currentSecHeight += entryHeight;
            entriesOnCurrent++;
          } else {
            remainingEntries.push(entry);
          }
        }

        if (entriesOnCurrent > 0) {
          currentPageElements.push(sectionForCurrentPage);
          pages.push(currentPageElements);

          // Start fresh page with remaining entries
          currentPageElements = [];
          currentPageHeight = 0;

          let nextSection = document.createElement("section");
          nextSection.className = node.className;
          nextSection.appendChild(titleEl.cloneNode(true));
          let nextSecHeight = titleHeight;

          remainingEntries.forEach((entry) => {
            const eHeight =
              entry.offsetHeight +
              (parseFloat(window.getComputedStyle(entry)?.marginBottom) || 12);
            if (
              currentPageHeight + nextSecHeight + eHeight > usableHeight &&
              nextSection.children.length > 1
            ) {
              currentPageElements.push(nextSection);
              pages.push(currentPageElements);
              currentPageElements = [];
              currentPageHeight = 0;
              nextSection = document.createElement("section");
              nextSection.className = node.className;
              nextSection.appendChild(titleEl.cloneNode(true));
              nextSecHeight = titleHeight;
            }
            nextSection.appendChild(entry.cloneNode(true));
            nextSecHeight += eHeight;
          });

          currentPageElements.push(nextSection);
          currentPageHeight += nextSecHeight;
        } else {
          // Section title + first entry doesn't fit on current page at all. Move whole section to new page!
          if (currentPageElements.length > 0) {
            pages.push(currentPageElements);
            currentPageElements = [];
            currentPageHeight = 0;
          }
          currentPageElements.push(node.cloneNode(true));
          currentPageHeight += totalNodeHeight;
        }
      } else {
        // Non-subdivisible block (header, banner, or single block)
        if (currentPageElements.length > 0) {
          pages.push(currentPageElements);
          currentPageElements = [];
          currentPageHeight = 0;
        }
        currentPageElements.push(node.cloneNode(true));
        currentPageHeight += totalNodeHeight;
      }
    }
  }

  if (currentPageElements.length > 0) {
    pages.push(currentPageElements);
  }

  document.body.removeChild(staging);

  const totalPages = Math.max(1, pages.length);
  return pages
    .map((pageEls, idx) => {
      const pageNum = idx + 1;
      const innerHtml = pageEls.map((el) => el.outerHTML).join("\n");
      return `
        <div class="resume-page-wrapper" data-page-number="${pageNum}">
          <div class="resume-page-header-badge">Page ${pageNum} of ${totalPages}</div>
          <div class="resume resume--${templateKey} resume-page-sheet ${
        pageNum > 1 ? "resume-page-sheet--subsequent" : ""
      }" data-page="${pageNum}">
            ${innerHtml}
          </div>
        </div>
      `;
    })
    .join("\n");
}

function adjustPreviewScale() {
  const panel = document.querySelector(".preview-panel");
  const container = document.getElementById("resume-preview");
  if (!panel || !container) return;

  // Calculate usable panel width excluding panel padding
  const computed = window.getComputedStyle(panel);
  const padLeft = parseFloat(computed.paddingLeft) || 24;
  const padRight = parseFloat(computed.paddingRight) || 24;
  const panelWidth = panel.clientWidth - (padLeft + padRight);

  if (panelWidth > 0 && panelWidth < 794) {
    const scale = Math.min(1, Math.max(0.3, panelWidth / 794));
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "top center";
    const naturalHeight = container.scrollHeight;
    const scaledHeight = naturalHeight * scale;
    container.style.marginBottom = `-${naturalHeight - scaledHeight}px`;
  } else {
    container.style.transform = "none";
    container.style.marginBottom = "0px";
  }
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", adjustPreviewScale);
  window.adjustPreviewScale = adjustPreviewScale;
}

function renderPreview() {
  const previewEl = document.getElementById("resume-preview");
  if (!previewEl) return;

  const state = (typeof resumeState !== "undefined" && resumeState) ? resumeState : (typeof window !== "undefined" ? window.resumeState : null);
  if (!state) return;

  const validTemplates = ["classic", "executive", "minimal"];
  const templateKey =
    state.template && validTemplates.includes(state.template)
      ? state.template
      : "classic";

  const templateObj =
    window.TemplateRegistry?.get(templateKey) ||
    (window.ResumeTemplates && window.ResumeTemplates[templateKey]) ||
    (window.ResumeTemplates && window.ResumeTemplates["classic"]) ||
    null;

  previewEl.className = "resume-pages-container";

  if (templateObj && typeof templateObj.render === "function") {
    const rawHtml = templateObj.render(state);
    const paginated = (window.PaginationEngine && window.PaginationEngine.paginate)
      ? window.PaginationEngine.paginate(rawHtml, templateKey)
      : paginateResumeHtml(rawHtml, templateKey);
    previewEl.innerHTML = paginated;
    adjustPreviewScale();
  }
}

