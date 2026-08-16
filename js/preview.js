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

function renderPreview() {
  const previewEl = document.getElementById("resume-preview");
  if (!previewEl) return;

  const validTemplates = ["classic", "executive", "minimal"];
  const templateKey = validTemplates.includes(resumeState.template)
    ? resumeState.template
    : "classic";

  const templateObj =
    window.ResumeTemplates && window.ResumeTemplates[templateKey]
      ? window.ResumeTemplates[templateKey]
      : window.ResumeTemplates && window.ResumeTemplates["classic"]
      ? window.ResumeTemplates["classic"]
      : null;

  const templateClass = `resume--${templateKey}`;
  previewEl.className = `resume ${templateClass}`.trim();

  if (templateObj && typeof templateObj.render === "function") {
    previewEl.innerHTML = templateObj.render(resumeState);
  }
}
