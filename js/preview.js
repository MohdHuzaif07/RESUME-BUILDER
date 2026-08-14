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

function renderHeaderHtml(personalInfo = {}) {
  const {
    fullName,
    jobTitle,
    email,
    phone,
    location,
    linkedin,
    github,
    portfolio,
    profileImage,
  } = personalInfo;

  const contactItems = [
    hasText(email) ? `<li>${escapeHtml(email)}</li>` : "",
    hasText(phone) ? `<li>${escapeHtml(phone)}</li>` : "",
    hasText(location) ? `<li>${escapeHtml(location)}</li>` : "",
  ].filter(Boolean);

  const linkItems = [
    safeHref(linkedin)
      ? `<li><a href="${safeHref(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>`
      : "",
    safeHref(github)
      ? `<li><a href="${safeHref(github)}" target="_blank" rel="noopener noreferrer">GitHub</a></li>`
      : "",
    safeHref(portfolio)
      ? `<li><a href="${safeHref(portfolio)}" target="_blank" rel="noopener noreferrer">Portfolio</a></li>`
      : "",
  ].filter(Boolean);

  const hasHeaderContent =
    hasText(fullName) ||
    hasText(jobTitle) ||
    contactItems.length > 0 ||
    linkItems.length > 0 ||
    hasText(profileImage);

  if (!hasHeaderContent) return "";

  const photoHtml = hasText(profileImage)
    ? `<img class="resume-photo" src="${escapeHtml(profileImage)}" alt="Profile photo">`
    : "";

  return `
    <header class="resume-header">
      ${photoHtml}
      <div class="resume-header-content">
        ${hasText(fullName) ? `<h1 class="resume-name">${escapeHtml(fullName)}</h1>` : ""}
        ${hasText(jobTitle) ? `<p class="resume-title">${escapeHtml(jobTitle)}</p>` : ""}
        ${contactItems.length ? `<ul class="resume-contact">${contactItems.join("")}</ul>` : ""}
        ${linkItems.length ? `<ul class="resume-links">${linkItems.join("")}</ul>` : ""}
      </div>
    </header>
  `;
}

function renderSummaryHtml(summary) {
  if (!hasText(summary)) return "";

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Summary</h2>
      <p class="resume-summary">${escapeHtml(summary)}</p>
    </section>
  `;
}

function renderExperienceHtml(experience = []) {
  const entries = experience.filter((entry) =>
    entryHasContent(entry, ["company", "jobTitle", "startDate", "endDate", "description"])
  );

  if (!entries.length) return "";

  const items = entries
    .map((entry) => {
      const dateRange = formatDateRange(
        entry.startDate,
        entry.endDate,
        Boolean(entry.currentlyWorking)
      );

      return `
        <div class="resume-entry">
          <div class="resume-entry-header">
            ${hasText(entry.jobTitle)
              ? `<h3 class="resume-entry-title">${escapeHtml(entry.jobTitle)}</h3>`
              : `<h3 class="resume-entry-title">${escapeHtml(entry.company || "Experience")}</h3>`}
            ${dateRange ? `<span class="resume-entry-date">${dateRange}</span>` : ""}
          </div>
          ${hasText(entry.company) && hasText(entry.jobTitle)
            ? `<p class="resume-entry-subtitle">${escapeHtml(entry.company)}</p>`
            : ""}
          ${hasText(entry.description)
            ? `<p class="resume-entry-description">${escapeHtml(entry.description)}</p>`
            : ""}
        </div>
      `;
    })
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Experience</h2>
      ${items}
    </section>
  `;
}

function renderEducationHtml(education = []) {
  const entries = education.filter((entry) =>
    entryHasContent(entry, ["institution", "degree", "startDate", "endDate", "description"])
  );

  if (!entries.length) return "";

  const items = entries
    .map((entry) => {
      const dateRange = formatDateRange(
        entry.startDate,
        entry.endDate,
        Boolean(entry.currentlyStudying)
      );

      return `
        <div class="resume-entry">
          <div class="resume-entry-header">
            ${hasText(entry.institution)
              ? `<h3 class="resume-entry-title">${escapeHtml(entry.institution)}</h3>`
              : `<h3 class="resume-entry-title">${escapeHtml(entry.degree || "Education")}</h3>`}
            ${dateRange ? `<span class="resume-entry-date">${dateRange}</span>` : ""}
          </div>
          ${hasText(entry.degree)
            ? `<p class="resume-entry-subtitle">${escapeHtml(entry.degree)}</p>`
            : ""}
          ${hasText(entry.description)
            ? `<p class="resume-entry-description">${escapeHtml(entry.description)}</p>`
            : ""}
        </div>
      `;
    })
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Education</h2>
      ${items}
    </section>
  `;
}

function renderProjectsHtml(projects = []) {
  const entries = projects.filter((entry) =>
    entryHasContent(entry, ["name", "url", "technologies", "description"])
  );

  if (!entries.length) return "";

  const items = entries
    .map((entry) => {
      const href = safeHref(entry.url);
      const titleHtml = hasText(entry.name)
        ? href
          ? `<h3 class="resume-entry-title"><a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.name)}</a></h3>`
          : `<h3 class="resume-entry-title">${escapeHtml(entry.name)}</h3>`
        : "";

      return `
        <div class="resume-entry">
          ${titleHtml ? `<div class="resume-entry-header">${titleHtml}</div>` : ""}
          ${hasText(entry.technologies)
            ? `<p class="resume-entry-meta">${escapeHtml(entry.technologies)}</p>`
            : ""}
          ${hasText(entry.description)
            ? `<p class="resume-entry-description">${escapeHtml(entry.description)}</p>`
            : ""}
        </div>
      `;
    })
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Projects</h2>
      ${items}
    </section>
  `;
}

function renderSkillsHtml(skills) {
  const skillList = normalizeSkills(skills);
  if (!skillList.length) return "";

  const items = skillList
    .map((skill) => `<li class="resume-skill">${escapeHtml(skill)}</li>`)
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Skills</h2>
      <ul class="resume-skills">${items}</ul>
    </section>
  `;
}

function renderCertificationsHtml(certifications = []) {
  const entries = certifications.filter((entry) =>
    entryHasContent(entry, ["name", "issuer", "issueDate", "expiryDate", "url"])
  );

  if (!entries.length) return "";

  const items = entries
    .map((entry) => {
      const dateParts = [
        entry.issueDate ? formatMonthYear(entry.issueDate) : "",
        entry.expiryDate ? formatMonthYear(entry.expiryDate) : "",
      ].filter(Boolean);

      const dateRange = dateParts.length === 2
        ? `${dateParts[0]} – ${dateParts[1]}`
        : dateParts[0] || "";

      const href = safeHref(entry.url);
      const titleHtml = hasText(entry.name)
        ? href
          ? `<h3 class="resume-entry-title"><a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.name)}</a></h3>`
          : `<h3 class="resume-entry-title">${escapeHtml(entry.name)}</h3>`
        : "";

      return `
        <div class="resume-entry">
          <div class="resume-entry-header">
            ${titleHtml}
            ${dateRange ? `<span class="resume-entry-date">${dateRange}</span>` : ""}
          </div>
          ${hasText(entry.issuer)
            ? `<p class="resume-entry-subtitle">${escapeHtml(entry.issuer)}</p>`
            : ""}
        </div>
      `;
    })
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Certifications</h2>
      ${items}
    </section>
  `;
}

function renderAchievementsHtml(achievements = []) {
  const entries = achievements.filter((entry) =>
    entryHasContent(entry, ["title", "date", "description"])
  );

  if (!entries.length) return "";

  const items = entries
    .map((entry) => {
      const dateLabel = formatMonthYear(entry.date);
      const titleLine = hasText(entry.title)
        ? `<span class="resume-list-item-title">${escapeHtml(entry.title)}</span>`
        : "";
      const dateLine = dateLabel
        ? ` <span class="resume-list-item-date">(${dateLabel})</span>`
        : "";

      const descriptionLine = hasText(entry.description)
        ? `<br>${escapeHtml(entry.description)}`
        : "";

      return `<li>${titleLine}${dateLine}${descriptionLine}</li>`;
    })
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Achievements</h2>
      <ul class="resume-list">${items}</ul>
    </section>
  `;
}

function formatProficiency(value) {
  if (!hasText(value)) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderLanguagesHtml(languages = []) {
  const entries = languages.filter((entry) =>
    entryHasContent(entry, ["language", "proficiency"])
  );

  if (!entries.length) return "";

  const items = entries
    .map(
      (entry) => `
        <div class="resume-language">
          <span class="resume-language-name">${escapeHtml(entry.language)}</span>
          ${hasText(entry.proficiency)
            ? `<span class="resume-language-level">${escapeHtml(formatProficiency(entry.proficiency))}</span>`
            : ""}
        </div>
      `
    )
    .join("");

  return `
    <section class="resume-section">
      <h2 class="resume-section-title">Languages</h2>
      ${items}
    </section>
  `;
}

function renderPreview() {
  const previewEl = document.getElementById("resume-preview");
  if (!previewEl) return;

  const {
    personalInfo = {},
    education = [],
    experience = [],
    projects = [],
    skills = [],
    certifications = [],
    achievements = [],
    languages = [],
    template = "default",
  } = resumeState;

  const templateClass = `resume--${template || "default"}`;
  previewEl.className = `resume ${templateClass}`.trim();

  const sections = [
    renderHeaderHtml(personalInfo),
    renderSummaryHtml(personalInfo.summary),
    renderExperienceHtml(experience),
    renderEducationHtml(education),
    renderProjectsHtml(projects),
    renderSkillsHtml(skills),
    renderCertificationsHtml(certifications),
    renderAchievementsHtml(achievements),
    renderLanguagesHtml(languages),
  ].filter(Boolean);

  previewEl.innerHTML = sections.join("");
}
