/**
 * Default Resume Template Renderer (Left Dark Sidebar — Reference Image 4)
 */

(function () {
  window.ResumeTemplates = window.ResumeTemplates || {};

  function renderSidebarHtml(personalInfo = {}, certifications = [], languages = [], skills = []) {
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

    const photoHtml = hasText(profileImage)
      ? `<img class="resume-photo" src="${escapeHtml(profileImage)}" alt="Profile photo">`
      : "";

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

    /* Sidebar Certifications */
    const certEntries = certifications.filter((entry) =>
      entryHasContent(entry, ["name", "issuer", "url"])
    );
    const certsHtml = certEntries.length
      ? `
        <section class="resume-section">
          <h2 class="resume-section-title">Certifications</h2>
          ${certEntries
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
            .join("")}
        </section>
      `
      : "";

    /* Sidebar Languages */
    const langEntries = languages.filter((entry) =>
      entryHasContent(entry, ["language", "proficiency"])
    );
    const langsHtml = langEntries.length
      ? `
        <section class="resume-section">
          <h2 class="resume-section-title">Languages</h2>
          ${langEntries
            .map(
              (entry) => `
                <div class="resume-sidebar-entry" style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h3 class="resume-sidebar-entry-title" style="margin: 0;">${escapeHtml(entry.language)}</h3>
                  ${hasText(entry.proficiency) ? `<span class="resume-sidebar-entry-subtitle" style="font-style: italic;">${escapeHtml(formatProficiency(entry.proficiency))}</span>` : ""}
                </div>
              `
            )
            .join("")}
        </section>
      `
      : "";

    /* Sidebar Skills */
    const skillList = normalizeSkills(skills);
    const skillsHtml = skillList.length
      ? `
        <section class="resume-section">
          <h2 class="resume-section-title">Skills</h2>
          <p class="resume-sidebar-entry-subtitle" style="color: #ffffff;">${skillList.map(s => escapeHtml(s)).join(", ")}</p>
        </section>
      `
      : "";

    return `
      <div class="resume-sidebar-panel">
        ${photoHtml}
        ${hasText(fullName) ? `<h1 class="resume-name">${escapeHtml(fullName)}</h1>` : ""}
        ${hasText(jobTitle) ? `<p class="resume-title">${escapeHtml(jobTitle)}</p>` : ""}
        ${contactItems.length ? `<ul class="resume-contact">${contactItems.join("")}</ul>` : ""}
        ${linkItems.length ? `<ul class="resume-links">${linkItems.join("")}</ul>` : ""}
        ${certsHtml}
        ${langsHtml}
        ${skillsHtml}
      </div>
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

  function renderAchievementsHtml(achievements = []) {
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

  window.ResumeTemplates["default"] = {
    name: "Dark Left Sidebar (Image 4)",
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
        renderSummaryHtml(personalInfo.summary),
        renderEducationHtml(education),
        renderExperienceHtml(experience),
        renderProjectsHtml(projects),
        renderAchievementsHtml(achievements),
      ].filter(Boolean);

      return `
        <div class="resume-container">
          ${renderSidebarHtml(personalInfo, certifications, languages, skills)}
          <div class="resume-main-panel">
            ${mainSections.join("")}
          </div>
        </div>
      `;
    },
  };
})();
