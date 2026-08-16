/**
 * Application entry point.
 * Wires form inputs to resumeState and triggers live preview updates.
 */

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PERSONAL_FIELDS = [
  { id: "full-name", key: "fullName" },
  { id: "job-title", key: "jobTitle" },
  { id: "email", key: "email" },
  { id: "phone", key: "phone" },
  { id: "location", key: "location" },
  { id: "linkedin", key: "linkedin" },
  { id: "github", key: "github" },
  { id: "portfolio", key: "portfolio" },
  { id: "summary", key: "summary" },
];

const DYNAMIC_SECTIONS = [
  {
    stateKey: "education",
    sectionName: "education",
    listId: "education-list",
    templateId: "education-template",
    addButtonId: "add-education",
    currentField: "currentlyStudying",
  },
  {
    stateKey: "experience",
    sectionName: "experience",
    listId: "experience-list",
    templateId: "experience-template",
    addButtonId: "add-experience",
    currentField: "currentlyWorking",
  },
  {
    stateKey: "projects",
    sectionName: "project",
    listId: "projects-list",
    templateId: "project-template",
    addButtonId: "add-project",
  },
  {
    stateKey: "certifications",
    sectionName: "certification",
    listId: "certifications-list",
    templateId: "certification-template",
    addButtonId: "add-certification",
  },
  {
    stateKey: "achievements",
    sectionName: "achievement",
    listId: "achievements-list",
    templateId: "achievement-template",
    addButtonId: "add-achievement",
  },
  {
    stateKey: "languages",
    sectionName: "language",
    listId: "languages-list",
    templateId: "language-template",
    addButtonId: "add-language",
  },
];

/* ─── Debounce Utility ─── */

function debounce(fn, delay) {
  let timerId = null;
  return function (...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(this, args);
    }, delay);
  };
}

/* ─── State ↔ Form Sync ─── */

function syncPersonalInfoFromForm() {
  const info = { ...resumeState.personalInfo };

  PERSONAL_FIELDS.forEach(({ id, key }) => {
    const field = document.getElementById(id);
    if (field) {
      info[key] = field.value.trim();
    }
  });

  resumeState.personalInfo = info;
}

function readDynamicEntry(entryEl) {
  const entry = {};

  entryEl.querySelectorAll("[data-field]").forEach((field) => {
    const key = field.dataset.field;

    if (field.type === "checkbox") {
      entry[key] = field.checked;
      return;
    }

    entry[key] = field.value.trim();
  });

  return entry;
}

function syncDynamicSectionsFromForm() {
  DYNAMIC_SECTIONS.forEach(({ stateKey, listId }) => {
    const list = document.getElementById(listId);
    if (!list) return;

    resumeState[stateKey] = Array.from(list.querySelectorAll(".dynamic-entry")).map(
      readDynamicEntry
    );
  });
}

function syncSkillsFromForm() {
  const skillsInput = document.getElementById("skills");
  if (!skillsInput) return;

  resumeState.skills = skillsInput.value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function syncTemplateFromForm() {
  const templateSelect = document.getElementById("template");
  if (templateSelect) {
    resumeState.template = templateSelect.value;
  }
}

function syncStateFromForm() {
  syncPersonalInfoFromForm();
  syncSkillsFromForm();
  syncDynamicSectionsFromForm();
  syncTemplateFromForm();
}

/* ─── LocalStorage Persistence ─── */

const STORAGE_KEY = "resume_builder_data";

function showStorageWarning(message) {
  let banner = document.getElementById("storage-warning-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "storage-warning-banner";
    banner.className = "storage-warning-banner";
    banner.setAttribute("role", "alert");
    const header = document.querySelector(".app-header");
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    } else {
      document.body.prepend(banner);
    }
  }
  banner.textContent = message;
  banner.hidden = false;

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    banner.hidden = true;
  }, 8000);
}

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeState));
  } catch (err) {
    // Handle QuotaExceededError — try saving without profileImage
    if (err.name === "QuotaExceededError" || err.code === 22 || err.code === 1014) {
      try {
        const slimState = {
          ...resumeState,
          personalInfo: { ...resumeState.personalInfo, profileImage: "" },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slimState));
        showStorageWarning(
          "Storage is nearly full. Your profile image won't be saved between sessions, but all other data is preserved."
        );
      } catch (innerErr) {
        showStorageWarning(
          "Unable to save your resume data. Browser storage is full."
        );
        console.warn("Unable to save resume state to localStorage:", innerErr);
      }
    } else {
      console.warn("Unable to save resume state to localStorage:", err);
    }
  }
}

function loadStateFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === "object") {
      if (parsed.personalInfo && typeof parsed.personalInfo === "object") {
        resumeState.personalInfo = {
          ...resumeState.personalInfo,
          ...parsed.personalInfo,
        };
      }
      if (Array.isArray(parsed.education)) resumeState.education = parsed.education;
      if (Array.isArray(parsed.experience)) resumeState.experience = parsed.experience;
      if (Array.isArray(parsed.projects)) resumeState.projects = parsed.projects;
      if (Array.isArray(parsed.skills)) resumeState.skills = parsed.skills;
      if (Array.isArray(parsed.certifications)) resumeState.certifications = parsed.certifications;
      if (Array.isArray(parsed.achievements)) resumeState.achievements = parsed.achievements;
      if (Array.isArray(parsed.languages)) resumeState.languages = parsed.languages;
      if (typeof parsed.template === "string") resumeState.template = parsed.template;
      return true;
    }
  } catch (err) {
    console.warn("Unable to load resume state from localStorage:", err);
  }
  return false;
}

/* ─── Populate Form From State ─── */

function populateDynamicEntry(entryEl, entryData) {
  if (!entryEl || !entryData) return;

  entryEl.querySelectorAll("[data-field]").forEach((field) => {
    const key = field.dataset.field;
    if (key in entryData) {
      if (field.type === "checkbox") {
        field.checked = Boolean(entryData[key]);
      } else {
        field.value = entryData[key] ?? "";
      }
    }
  });

  applyCurrentCheckboxBehavior(entryEl);
}

function populateFormFromState() {
  const info = resumeState.personalInfo || {};

  PERSONAL_FIELDS.forEach(({ id, key }) => {
    const field = document.getElementById(id);
    if (field && info[key] !== undefined) {
      field.value = info[key];
    }
  });

  if (info.profileImage) {
    showProfileImagePreview(info.profileImage);
  }

  const skillsInput = document.getElementById("skills");
  if (skillsInput && Array.isArray(resumeState.skills)) {
    skillsInput.value = resumeState.skills.join(", ");
  }

  const templateSelect = document.getElementById("template");
  if (templateSelect && resumeState.template) {
    templateSelect.value = resumeState.template;
  }

  DYNAMIC_SECTIONS.forEach(({ stateKey, listId, templateId }) => {
    const list = document.getElementById(listId);
    const template = document.getElementById(templateId);
    if (!list || !template) return;

    list.innerHTML = "";

    const entries = resumeState[stateKey];
    if (Array.isArray(entries)) {
      entries.forEach((entryData) => {
        const entryEl = template.content.cloneNode(true).querySelector(".dynamic-entry");
        if (!entryEl) return;
        populateDynamicEntry(entryEl, entryData);
        list.appendChild(entryEl);
      });
    }
  });

  updateSummaryCharCount();
}

/* ─── Update Pipeline ─── */

function updateStateAndPreview() {
  syncStateFromForm();
  renderPreview();
  saveStateToStorage();
}

/** Debounced version for text input events (50ms) */
const debouncedUpdateStateAndPreview = debounce(updateStateAndPreview, 50);

/* ─── Field Validation ─── */

function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;

  if (message) {
    input.classList.add("invalid");
    error.textContent = message;
  } else {
    input.classList.remove("invalid");
    error.textContent = "";
  }
}

function validateFullName() {
  const value = document.getElementById("full-name")?.value.trim() || "";
  const message = value ? "" : "Full name is required.";
  setFieldError("full-name", "full-name-error", message);
  return !message;
}

function validateEmail() {
  const value = document.getElementById("email")?.value.trim() || "";
  let message = "";

  if (!value) {
    message = "Email is required.";
  } else if (!isValidEmail(value)) {
    message = "Enter a valid email address.";
  }

  setFieldError("email", "email-error", message);
  return !message;
}

function validateUrlField(inputId, errorId, label) {
  const value = document.getElementById(inputId)?.value.trim() || "";
  const message = value && !isValidUrl(value) ? `Enter a valid ${label} URL.` : "";
  setFieldError(inputId, errorId, message);
  return !message;
}

function validateLinkedIn() {
  return validateUrlField("linkedin", "linkedin-error", "LinkedIn");
}

function validateGitHub() {
  return validateUrlField("github", "github-error", "GitHub");
}

function validatePortfolio() {
  return validateUrlField("portfolio", "portfolio-error", "portfolio");
}

function validatePhone() {
  const value = document.getElementById("phone")?.value.trim() || "";
  // Phone is optional — only validate if user entered something
  if (!value) return true;
  const valid = isValidPhone(value);
  // No dedicated error span in HTML for phone, so use a lightweight approach
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    if (valid) {
      phoneInput.classList.remove("invalid");
      phoneInput.title = "";
    } else {
      phoneInput.classList.add("invalid");
      phoneInput.title = "Enter a valid phone number.";
    }
  }
  return valid;
}

/* ─── Character Counter ─── */

function updateSummaryCharCount() {
  const summary = document.getElementById("summary");
  const counter = document.getElementById("summary-char-count");
  if (summary && counter) {
    counter.textContent = String(summary.value.length);
  }
}

/* ─── Dynamic Entry Checkbox Behavior ─── */

/**
 * B1 Fix: Only toggle the relevant currentField for the entry's section,
 * rather than looping all DYNAMIC_SECTIONS.
 */
function toggleEndDateField(entryEl, checkboxField) {
  if (!entryEl || !checkboxField) return;

  const checkbox = entryEl.querySelector(`[data-field="${checkboxField}"]`);
  const endDate = entryEl.querySelector('[data-field="endDate"]');
  if (!checkbox || !endDate) return;

  endDate.disabled = checkbox.checked;
  if (checkbox.checked) {
    endDate.value = "";
  }
}

function applyCurrentCheckboxBehavior(entryEl) {
  if (!entryEl) return;

  // B1 Fix: Determine the section from the entry's data-section attribute
  // and only toggle the relevant checkbox field.
  const sectionName = entryEl.dataset.section;
  if (!sectionName) return;

  const section = DYNAMIC_SECTIONS.find((s) => s.sectionName === sectionName);
  if (section && section.currentField) {
    toggleEndDateField(entryEl, section.currentField);
  }
}

/* ─── Dynamic Section CRUD ─── */

function addDynamicEntry({ listId, templateId }) {
  const list = document.getElementById(listId);
  const template = document.getElementById(templateId);
  if (!list || !template) return;

  const entry = template.content.cloneNode(true).querySelector(".dynamic-entry");
  if (!entry) return;

  applyCurrentCheckboxBehavior(entry);
  list.appendChild(entry);
  updateStateAndPreview();
}

/* ─── Profile Image ─── */

function clearProfileImage() {
  const fileInput = document.getElementById("profile-image");
  const previewWrapper = document.getElementById("profile-image-preview-wrapper");
  const previewImage = document.getElementById("profile-image-preview");

  if (fileInput) fileInput.value = "";
  // B5 Fix: Use removeAttribute instead of setting src="" to avoid a spurious network request
  if (previewImage) previewImage.removeAttribute("src");
  if (previewWrapper) previewWrapper.hidden = true;

  resumeState.personalInfo.profileImage = "";
  setFieldError("profile-image", "profile-image-error", "");
  updateStateAndPreview();
}

function showProfileImagePreview(dataUrl) {
  const previewWrapper = document.getElementById("profile-image-preview-wrapper");
  const previewImage = document.getElementById("profile-image-preview");

  if (previewImage) previewImage.src = dataUrl;
  if (previewWrapper) previewWrapper.hidden = false;

  resumeState.personalInfo.profileImage = dataUrl;
  renderPreview();
}

function handleProfileImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // A1 Fix: Use validateFile from validation.js instead of inline checks
  const result = validateFile(file, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES);
  if (!result.valid) {
    setFieldError("profile-image", "profile-image-error", result.error);
    event.target.value = "";
    return;
  }

  setFieldError("profile-image", "profile-image-error", "");

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      showProfileImagePreview(reader.result);
      saveStateToStorage();
    }
  };
  reader.onerror = () => {
    setFieldError(
      "profile-image",
      "profile-image-error",
      "Unable to read the selected image."
    );
    event.target.value = "";
  };
  reader.readAsDataURL(file);
}

/* ─── Form Event Handlers ─── */

function handleFormInput(event) {
  const target = event.target;

  if (target.id === "summary") {
    updateSummaryCharCount();
  }

  if (target.matches('[data-field="currentlyStudying"], [data-field="currentlyWorking"]')) {
    const entryEl = target.closest(".dynamic-entry");
    applyCurrentCheckboxBehavior(entryEl);
  }

  // P2 Fix: Use debounced update for text-like inputs to avoid
  // redundant double-firing from input+change on the same keystroke.
  // For checkboxes, selects, and file inputs, update immediately since
  // they only fire 'change' (not 'input').
  const isTextLike =
    target.tagName === "TEXTAREA" ||
    (target.tagName === "INPUT" &&
      !["checkbox", "radio", "file"].includes(target.type));

  if (event.type === "change" && isTextLike) {
    // Skip: the 'input' event already triggered the debounced update.
    return;
  }

  if (isTextLike) {
    debouncedUpdateStateAndPreview();
  } else {
    updateStateAndPreview();
  }
}

function handleFormClick(event) {
  const removeButton = event.target.closest(".btn-remove");
  if (!removeButton) return;

  const entry = removeButton.closest(".dynamic-entry");
  if (entry) {
    entry.remove();
    updateStateAndPreview();
  }
}

/* ─── PDF Download ─── */

function handleDownloadPdf() {
  if (typeof downloadResumePdf === "function") {
    downloadResumePdf();
  } else {
    alert("PDF generator component is still loading.");
  }
}

/* ─── Initialization ─── */

function initDynamicSections() {
  DYNAMIC_SECTIONS.forEach((section) => {
    const addButton = document.getElementById(section.addButtonId);
    if (!addButton) return;

    addButton.addEventListener("click", () => addDynamicEntry(section));
  });
}

function initValidation() {
  document.getElementById("full-name")?.addEventListener("blur", validateFullName);
  document.getElementById("email")?.addEventListener("blur", validateEmail);
  document.getElementById("linkedin")?.addEventListener("blur", validateLinkedIn);
  document.getElementById("github")?.addEventListener("blur", validateGitHub);
  document.getElementById("portfolio")?.addEventListener("blur", validatePortfolio);
  document.getElementById("phone")?.addEventListener("blur", validatePhone);
}

function initProfileImage() {
  document
    .getElementById("profile-image")
    ?.addEventListener("change", handleProfileImageChange);

  document
    .getElementById("remove-profile-image")
    ?.addEventListener("click", clearProfileImage);
}

function initFormListeners() {
  const form = document.getElementById("resume-form");
  if (!form) return;

  // Prevent default form submission (e.g. Enter keypress)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  form.addEventListener("input", handleFormInput);
  form.addEventListener("change", handleFormInput);
  form.addEventListener("click", handleFormClick);
}

function initDownloadPdf() {
  const downloadBtn = document.getElementById("download-pdf-btn") || document.getElementById("download-pdf");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownloadPdf);
  }
}

function initApp() {
  initFormListeners();
  initDynamicSections();
  initValidation();
  initProfileImage();
  initDownloadPdf();

  const hasLoadedData = loadStateFromStorage();
  if (hasLoadedData) {
    populateFormFromState();
  }

  updateSummaryCharCount();
  updateStateAndPreview();
}

document.addEventListener("DOMContentLoaded", initApp);

