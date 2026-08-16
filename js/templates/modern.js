/**
 * Modern Resume Template Renderer (Right Dark Sidebar — Reference Image 2)
 */

(function () {
  window.ResumeTemplates = window.ResumeTemplates || {};

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
    } = personalInfo;

    const contactItems = [
      hasText(phone) ? `<li>${escapeHtml(phone)}</li>` : "",
      hasText(email) ? `<li><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>` : "",
      hasText(location) ? `<li>${escapeHtml(location)}</li>` : "",
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

    if (!hasText(fullName) && !hasText(jobTitle) && !contactItems.length) {
      return "";
    }

    return `
      <header class="resume-header">
        ${hasText(fullName) ? `<h1 class="resume-name">${escapeHtml(fullName)}</h1>` : ""}
        ${hasText(jobTitle) ? `<p class="resume-title">${escapeHtml(jobTitle)}</p>` : ""}
        ${contactItems.length ? `<ul class="resume-contact">${contactItems.join(" • ")}</ul>` : ""}
      </header>
    `;
  }

  function renderSummaryHtml(summary) {
    if (!hasText(summary)) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Summary</h2>
        <div class="resume-summary">${formatRichText(summary)}</div>
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
              ? `<div class="resume-entry-description">${formatRichText(entry.description)}</div>`
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
              ? `<div class="resume-entry-description">${formatRichText(entry.description)}</div>`
              : ""}
          </div>
        `;
      })
      .join("");

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Work Experience</h2>
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

        const techHtml = hasText(entry.technologies)
          ? `<span class="resume-entry-date">${escapeHtml(entry.technologies)}</span>`
          : "";

        return `
          <div class="resume-entry">
            <div class="resume-entry-header">
              ${titleHtml}
              ${techHtml}
            </div>
            ${hasText(entry.description)
              ? `<div class="resume-entry-description">${formatRichText(entry.description)}</div>`
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

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Skills</h2>
        <p class="resume-summary">${skillList.map(s => escapeHtml(s)).join(", ")}</p>
      </section>
    `;
  }

  /* Right Dark Sidebar Components */

  function renderCertificationsSidebarHtml(certifications = []) {
    const entries = certifications.filter((entry) =>
      entryHasContent(entry, ["name", "issuer", "issueDate", "expiryDate", "url"])
    );

    if (!entries.length) return "";

    const items = entries
      .map((entry) => {
        const href = safeHref(entry.url);
        const titleHtml = hasText(entry.name)
          ? href
            ? `<h3 class="resume-sidebar-entry-title"><a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.name)}</a></h3>`
            : `<h3 class="resume-sidebar-entry-title">${escapeHtml(entry.name)}</h3>`
          : "";

        return `
          <div class="resume-sidebar-entry">
            ${titleHtml}
            ${hasText(entry.issuer) ? `<p class="resume-sidebar-entry-subtitle">${escapeHtml(entry.issuer)}</p>` : ""}
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

  function renderLanguagesSidebarHtml(languages = []) {
    const entries = languages.filter((entry) =>
      entryHasContent(entry, ["language", "proficiency"])
    );

    if (!entries.length) return "";

    const items = entries
      .map(
        (entry) => `
          <div class="resume-sidebar-entry" style="display: flex; justify-content: space-between; align-items: baseline;">
            <h3 class="resume-sidebar-entry-title" style="margin: 0;">${escapeHtml(entry.language)}</h3>
            ${hasText(entry.proficiency) ? `<span class="resume-sidebar-entry-subtitle" style="font-style: italic;">${escapeHtml(formatProficiency(entry.proficiency))}</span>` : ""}
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

  function renderAchievementsSidebarHtml(achievements = []) {
    const entries = achievements.filter((entry) =>
      entryHasContent(entry, ["title", "date", "description"])
    );

    if (!entries.length) return "";

    const items = entries
      .map((entry) => {
        const titleLine = hasText(entry.title)
          ? `<strong style="color: #ffffff;">${escapeHtml(entry.title)}</strong>`
          : "";
        const descriptionLine = hasText(entry.description)
          ? `<br>${formatRichText(entry.description)}`
          : "";

        return `<li>${titleLine}${descriptionLine}</li>`;
      })
      .join("");

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Achievements</h2>
        <ul class="resume-sidebar-list">${items}</ul>
      </section>
    `;
  }

  window.ResumeTemplates["modern"] = {
    name: "Dark Right Sidebar (Image 2)",
    render: function (state) {
      const {
        personalInfo = {},
        education = [],
        experience = [],
        projects = [],
        skills = [],
        certifications = [],
        achievements = [],
        languages = [],
      } = state;

      const mainSections = [
        renderHeaderHtml(personalInfo),
        renderSummaryHtml(personalInfo.summary),
        renderEducationHtml(education),
        renderExperienceHtml(experience),
        renderProjectsHtml(projects),
        renderSkillsHtml(skills),
      ].filter(Boolean);

      const sidebarSections = [
        renderCertificationsSidebarHtml(certifications),
        renderLanguagesSidebarHtml(languages),
        renderAchievementsSidebarHtml(achievements),
      ].filter(Boolean);

      return `
        <div class="resume-container">
          <div class="resume-main-panel">
            ${mainSections.join("")}
          </div>
          <div class="resume-sidebar-panel">
            ${sidebarSections.join("")}
          </div>
        </div>
      `;
    },
  };
})();
