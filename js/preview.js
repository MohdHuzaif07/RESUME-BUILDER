/**
 * Renders the live resume preview from resumeState.
 *
 * Expected state shape:
 * resumeState.personalInfo — fullName, jobTitle, email, phone, location,
 *   linkedin, github, portfolio, summary, profileImage (data URL)
 * resumeState.education[] — institution, degree, startDate, endDate,
 *   currentlyStudying, description
 * resumeState.experience[] — company, jobTitle, startDate, endDate,
 *   currentlyWorking, description
 * resumeState.projects[] — name, url, technologies, description
 * resumeState.skills[] — string array
 * resumeState.certifications[] — name, issuer, issueDate, expiryDate, url
 * resumeState.achievements[] — title, date, description
 * resumeState.languages[] — language, proficiency
 * resumeState.template — "default" | "modern" | "classic"
 */

function escapeHtml(value) {
  if (value == null || value === "") return "";
  const el = document.createElement("span");
  el.textContent = String(value);
  return el.innerHTML;
}

/**
 * Converts lightweight markdown-like syntax to HTML for resume descriptions and summaries.
 * Supported:
 *   * text, - text, • text, + text → bullet list items (<ul><li>...</li></ul>)
 *   **text** or __text__           → <strong>bold</strong>
 *   *text* or _text_               → <em>italic</em>
 *   Plain text lines               → <p> paragraphs
 *
 * All text is HTML-escaped first to prevent XSS.
 */
function formatRichText(value) {
  if (value == null || value === "") return "";
  const raw = String(value);
  const lines = raw.split(/\r?\n/);

  const result = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect bullet lines starting with *, -, •, or +
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

/**
 * Applies inline formatting to already-escaped HTML text.
 * **text** or __text__ → <strong>text</strong>
 * *text* or _text_     → <em>text</em>
 */
function applyInlineFormatting(escaped) {
  if (!escaped) return "";
  // Bold: **text** or __text__
  let formatted = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic: *text* or _text_
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

  const templateKey = resumeState.template || "default";
  const templateObj =
    window.ResumeTemplates && window.ResumeTemplates[templateKey]
      ? window.ResumeTemplates[templateKey]
      : window.ResumeTemplates && window.ResumeTemplates["default"]
      ? window.ResumeTemplates["default"]
      : null;

  const templateClass = `resume--${templateKey}`;
  previewEl.className = `resume ${templateClass}`.trim();

  if (templateObj && typeof templateObj.render === "function") {
    previewEl.innerHTML = templateObj.render(resumeState);
  }
}

