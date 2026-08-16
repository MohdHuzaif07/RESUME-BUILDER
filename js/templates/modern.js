/**
 * Modern Resume Template Renderer (Right Dark Sidebar — Reference Image 2)
 * Fully customizable main/sidebar column placement
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

  /* Main Panel Component Renderers */

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
        <p class="resume-summary">${skillList.map((s) => escapeHtml(s)).join(", ")}</p>
      </section>
    `;
  }

  function renderCertificationsMainHtml(certifications = []) {
    const entries = certifications.filter((entry) =>
      entryHasContent(entry, ["name", "issuer", "issueDate", "expiryDate", "url"])
    );

    if (!entries.length) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Certifications</h2>
        ${entries
          .map((entry) => {
            const href = safeHref(entry.url);
            const titleHtml = hasText(entry.name)
              ? href
                ? `<h3 class="resume-entry-title"><a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.name)}</a></h3>`
                : `<h3 class="resume-entry-title">${escapeHtml(entry.name)}</h3>`
              : "";
            return `
              <div class="resume-entry">
                ${titleHtml}
                ${hasText(entry.issuer) ? `<p class="resume-entry-subtitle">${escapeHtml(entry.issuer)}</p>` : ""}
              </div>
            `;
          })
          .join("")}
      </section>
    `;
  }

  function renderLanguagesMainHtml(languages = []) {
    const entries = languages.filter((entry) =>
      entryHasContent(entry, ["language", "proficiency"])
    );

    if (!entries.length) return "";

    const items = entries
      .map(
        (entry) =>
          `<strong>${escapeHtml(entry.language)}</strong>${hasText(entry.proficiency) ? ` (${escapeHtml(formatProficiency(entry.proficiency))})` : ""}`
      )
      .join(" • ");

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Languages</h2>
        <p class="resume-summary">${items}</p>
      </section>
    `;
  }

  function renderAchievementsMainHtml(achievements = []) {
    const entries = achievements.filter((entry) =>
      entryHasContent(entry, ["title", "date", "description"])
    );

    if (!entries.length) return "";

    const items = entries
      .map((entry) => {
        const titleLine = hasText(entry.title)
          ? `<strong>${escapeHtml(entry.title)}</strong>`
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
        <ul class="resume-list">${items}</ul>
      </section>
    `;
  }

  /* Right Dark Sidebar Component Renderers */

  function renderSummarySidebarHtml(summary) {
    if (!hasText(summary)) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Summary</h2>
        <div class="resume-summary" style="color: #ffffff;">${formatRichText(summary)}</div>
      </section>
    `;
  }

  function renderEducationSidebarHtml(education = []) {
    const entries = education.filter((e) => entryHasContent(e, ["institution", "degree"]));
    if (!entries.length) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Education</h2>
        ${entries
          .map(
            (e) => `
          <div class="resume-sidebar-entry">
            <h3 class="resume-sidebar-entry-title">${escapeHtml(e.institution || e.degree)}</h3>
            ${hasText(e.degree) && hasText(e.institution) ? `<p class="resume-sidebar-entry-subtitle">${escapeHtml(e.degree)}</p>` : ""}
          </div>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderExperienceSidebarHtml(experience = []) {
    const entries = experience.filter((e) => entryHasContent(e, ["company", "jobTitle"]));
    if (!entries.length) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Work Experience</h2>
        ${entries
          .map(
            (e) => `
          <div class="resume-sidebar-entry">
            <h3 class="resume-sidebar-entry-title">${escapeHtml(e.jobTitle || e.company)}</h3>
            ${hasText(e.company) && hasText(e.jobTitle) ? `<p class="resume-sidebar-entry-subtitle">${escapeHtml(e.company)}</p>` : ""}
          </div>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderProjectsSidebarHtml(projects = []) {
    const entries = projects.filter((e) => entryHasContent(e, ["name"]));
    if (!entries.length) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Projects</h2>
        ${entries
          .map(
            (e) => `
          <div class="resume-sidebar-entry">
            <h3 class="resume-sidebar-entry-title">${escapeHtml(e.name)}</h3>
            ${hasText(e.technologies) ? `<p class="resume-sidebar-entry-subtitle">${escapeHtml(e.technologies)}</p>` : ""}
          </div>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderSkillsSidebarHtml(skills) {
    const skillList = normalizeSkills(skills);
    if (!skillList.length) return "";

    return `
      <section class="resume-section">
        <h2 class="resume-section-title">Skills</h2>
        <p class="resume-sidebar-entry-subtitle" style="color: #ffffff;">${skillList.map((s) => escapeHtml(s)).join(", ")}</p>
      </section>
    `;
  }

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
        sectionOrder = [
          "summary",
          "education",
          "experience",
          "projects",
          "skills",
          "certifications",
          "achievements",
          "languages",
        ],
        sectionColumns = {},
      } = state;

      const defaultCols = {
        summary: "main",
        education: "main",
        experience: "main",
        projects: "main",
        skills: "main",
        certifications: "sidebar",
        languages: "sidebar",
        achievements: "sidebar",
      };

      const mainMap = {
        summary: renderSummaryHtml(personalInfo.summary),
        education: renderEducationHtml(education),
        experience: renderExperienceHtml(experience),
        projects: renderProjectsHtml(projects),
        skills: renderSkillsHtml(skills),
        certifications: renderCertificationsMainHtml(certifications),
        languages: renderLanguagesMainHtml(languages),
        achievements: renderAchievementsMainHtml(achievements),
      };

      const sidebarMap = {
        summary: renderSummarySidebarHtml(personalInfo.summary),
        education: renderEducationSidebarHtml(education),
        experience: renderExperienceSidebarHtml(experience),
        projects: renderProjectsSidebarHtml(projects),
        skills: renderSkillsSidebarHtml(skills),
        certifications: renderCertificationsSidebarHtml(certifications),
        languages: renderLanguagesSidebarHtml(languages),
        achievements: renderAchievementsSidebarHtml(achievements),
      };

      const mainSections = [
        renderHeaderHtml(personalInfo),
        ...sectionOrder
          .filter((k) => (sectionColumns[k] || defaultCols[k] || "main") === "main")
          .map((k) => mainMap[k] || ""),
      ].filter(Boolean);

      const sidebarSections = sectionOrder
        .filter((k) => (sectionColumns[k] || defaultCols[k]) === "sidebar")
        .map((k) => sidebarMap[k] || "")
        .filter(Boolean);

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
