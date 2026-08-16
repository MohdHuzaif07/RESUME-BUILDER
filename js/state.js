/**
 * @typedef {Object} PersonalInfo
 * @property {string} fullName - Full name of the candidate
 * @property {string} jobTitle - Target or current job title
 * @property {string} email - Contact email address
 * @property {string} phone - Contact phone number
 * @property {string} location - City, Country or Location
 * @property {string} linkedin - LinkedIn profile URL
 * @property {string} github - GitHub profile URL
 * @property {string} portfolio - Portfolio website URL
 * @property {string} summary - Professional summary text
 * @property {string} profileImage - Base64 Data URL of uploaded profile image
 *
 * @typedef {Object} EducationEntry
 * @property {string} institution - School/University name
 * @property {string} degree - Degree or certification title
 * @property {string} startDate - Start date (YYYY-MM)
 * @property {string} endDate - End date (YYYY-MM)
 * @property {boolean} currentlyStudying - Whether currently enrolled
 * @property {string} description - Additional details/coursework/GPA
 *
 * @typedef {Object} ExperienceEntry
 * @property {string} company - Company or organization name
 * @property {string} jobTitle - Position or role held
 * @property {string} startDate - Start date (YYYY-MM)
 * @property {string} endDate - End date (YYYY-MM)
 * @property {boolean} currentlyWorking - Whether currently employed here
 * @property {string} description - Responsibilities and achievements
 *
 * @typedef {Object} ProjectEntry
 * @property {string} name - Project name
 * @property {string} url - Project or repository URL
 * @property {string} technologies - Comma-separated or listed technologies used
 * @property {string} description - Overview of contribution and features
 *
 * @typedef {Object} CertificationEntry
 * @property {string} name - Name of certification
 * @property {string} issuer - Issuing organization
 * @property {string} issueDate - Issue date (YYYY-MM)
 * @property {string} expiryDate - Expiration date (YYYY-MM)
 * @property {string} url - Verification/credential link
 *
 * @typedef {Object} AchievementEntry
 * @property {string} title - Achievement title or honor
 * @property {string} date - Date received (YYYY-MM)
 * @property {string} description - Context or description
 *
 * @typedef {Object} LanguageEntry
 * @property {string} language - Language name
 * @property {string} proficiency - Level ("native" | "fluent" | "advanced" | "intermediate" | "basic")
 *
 * @typedef {Object} ResumeState
 * @property {PersonalInfo} personalInfo
 * @property {EducationEntry[]} education
 * @property {ExperienceEntry[]} experience
 * @property {ProjectEntry[]} projects
 * @property {string[]} skills
 * @property {CertificationEntry[]} certifications
 * @property {AchievementEntry[]} achievements
 * @property {LanguageEntry[]} languages
 * @property {string} template - Active resume template identifier
 */

/**
 * Central resume state object.
 * All form updates should modify this object.
 * @type {ResumeState}
 */
const resumeState = {
  personalInfo: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    profileImage: "",
  },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  languages: [],
  sectionOrder: [
    "summary",
    "education",
    "experience",
    "projects",
    "skills",
    "certifications",
    "achievements",
    "languages",
  ],
  template: "default",
};

