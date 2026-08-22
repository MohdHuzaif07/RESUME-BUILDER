/**
 * Section Registry
 * Centralized definition of all resume sections for loose coupling and scalability.
 */

(function () {
  window.SectionRegistry = [
    {
      id: "summary",
      title: "Professional Summary",
      isDynamic: false,
      canReorder: true,
      defaultOrder: 1,
    },
    {
      id: "education",
      title: "Education",
      isDynamic: true,
      listId: "education-list",
      templateId: "education-template",
      addBtnId: "add-education",
      currentCheckboxField: "currentlyStudying",
      endDateField: "endDate",
      canReorder: true,
      defaultOrder: 2,
      fields: ["institution", "degree", "startDate", "endDate", "currentlyStudying", "description"],
    },
    {
      id: "experience",
      title: "Work Experience",
      isDynamic: true,
      listId: "experience-list",
      templateId: "experience-template",
      addBtnId: "add-experience",
      currentCheckboxField: "currentlyWorking",
      endDateField: "endDate",
      canReorder: true,
      defaultOrder: 3,
      fields: ["company", "jobTitle", "startDate", "endDate", "currentlyWorking", "description"],
    },
    {
      id: "projects",
      title: "Projects",
      isDynamic: true,
      listId: "projects-list",
      templateId: "project-template",
      addBtnId: "add-project",
      canReorder: true,
      defaultOrder: 4,
      fields: ["title", "technologies", "link", "description"],
    },
    {
      id: "skills",
      title: "Skills",
      isDynamic: false,
      canReorder: true,
      defaultOrder: 5,
    },
    {
      id: "certifications",
      title: "Certifications",
      isDynamic: true,
      listId: "certifications-list",
      templateId: "certification-template",
      addBtnId: "add-certification",
      canReorder: true,
      defaultOrder: 6,
      fields: ["name", "issuer", "date", "url"],
    },
    {
      id: "languages",
      title: "Languages",
      isDynamic: true,
      listId: "languages-list",
      templateId: "language-template",
      addBtnId: "add-language",
      canReorder: true,
      defaultOrder: 7,
      fields: ["language", "proficiency"],
    },
    {
      id: "custom",
      title: "Additional Information",
      isDynamic: false,
      canReorder: true,
      defaultOrder: 8,
    },
  ];

  window.getSectionConfig = function (sectionId) {
    return window.SectionRegistry.find((sec) => sec.id === sectionId) || null;
  };

  window.getDynamicSections = function () {
    return window.SectionRegistry.filter((sec) => sec.isDynamic);
  };
})();
