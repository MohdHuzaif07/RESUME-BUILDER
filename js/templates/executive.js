/**
 * Executive Resume Template Renderer (Top Dark Banner — Reference Image 3)
 */

(function () {
  window.ResumeTemplates = window.ResumeTemplates || {};

  function renderBannerHtml(personalInfo = {}) {
    const { fullName, jobTitle, profileImage } = personalInfo;
    if (!hasText(fullName) && !hasText(jobTitle) && !hasText(profileImage)) return "";

    const photoHtml = hasText(profileImage)
      ? `<img class="resume-photo" src="${escapeHtml(profileImage)}" alt="Profile photo">`
      : "";

    return `
      <div class="resume-banner">
        <div class="resume-banner-text">
          ${hasText(fullName) ? `<h1 class="resume-name">${escapeHtml(fullName)}</h1>` : ""}
          ${hasText(jobTitle) ? `<p class="resume-title">${escapeHtml(jobTitle)}</p>` : ""}
        </div>
        ${photoHtml}
      </div>
    `;
  }

  function renderContactBarHtml(personalInfo = {}) {
    const { email, phone, location, linkedin, github, portfolio } = personalInfo;

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

    if (!contactItems.length && !linkItems.length) return "";

    return `
      <div class="resume-contact-bar">
        ${contactItems.length ? `<ul class="resume-contact">${contactItems.join(" • ")}</ul>` : ""}
        ${linkItems.length ? `<ul class="resume-links">${linkItems.join(" • ")}</ul>` : ""}
      </div>
    `;
  }

  function renderCertificationsHtml(certifications = []) {
    const entries = certifications.filter((entry) =>
      entryHasContent(entry, ["name", "issuer", "issueDate", "expiryDate", "url"])
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
            ${titleHtml}
            ${hasText(entry.issuer) ? `<p class="resume-entry-subtitle">${escapeHtml(entry.issuer)}</p>` : ""}
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

  window.ResumeTemplates["executive"] = {
    name: "Dark Top Banner (Image 3)",
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
      } = state;

      const sectionMap = {
        summary: renderSummaryHtml(personalInfo.summary),
        education: renderEducationHtml(education),
        experience: renderExperienceHtml(experience),
        projects: renderProjectsHtml(projects),
        skills: renderSkillsHtml(skills),
        certifications: renderCertificationsHtml(certifications),
        languages: renderLanguagesHtml(languages),
        achievements: renderAchievementsHtml(achievements),
      };

      const leftKeys = ["certifications", "languages", "skills"];
      const rightKeys = ["summary", "education", "experience", "projects", "achievements"];

      const leftSections = sectionOrder
        .filter((k) => leftKeys.includes(k))
        .map((k) => sectionMap[k] || "")
        .filter(Boolean);

      const rightSections = sectionOrder
        .filter((k) => rightKeys.includes(k))
        .map((k) => sectionMap[k] || "")
        .filter(Boolean);

      return `
        ${renderBannerHtml(personalInfo)}
        ${renderContactBarHtml(personalInfo)}
        <div class="resume-body-grid">
          <div class="resume-left-col">
            ${leftSections.join("")}
          </div>
          <div class="resume-right-col">
            ${rightSections.join("")}
          </div>
        </div>
      `;
    },
  };
})();
