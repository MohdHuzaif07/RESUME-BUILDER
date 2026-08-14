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
    listId: "education-list",
    templateId: "education-template",
    addButtonId: "add-education",
    currentField: "currentlyStudying",
  },
  {
    stateKey: "experience",
    listId: "experience-list",
    templateId: "experience-template",
    addButtonId: "add-experience",
    currentField: "currentlyWorking",
  },
  {
    stateKey: "projects",
    listId: "projects-list",
    templateId: "project-template",
    addButtonId: "add-project",
  },
  {
    stateKey: "certifications",
    listId: "certifications-list",
    templateId: "certification-template",
    addButtonId: "add-certification",
  },
  {
    stateKey: "achievements",
    listId: "achievements-list",
    templateId: "achievement-template",
    addButtonId: "add-achievement",
  },
  {
    stateKey: "languages",
    listId: "languages-list",
    templateId: "language-template",
    addButtonId: "add-language",
  },
];

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

function updateStateAndPreview() {
  syncStateFromForm();
  renderPreview();
}

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

function updateSummaryCharCount() {
  const summary = document.getElementById("summary");
  const counter = document.getElementById("summary-char-count");
  if (summary && counter) {
    counter.textContent = String(summary.value.length);
  }
}

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
  DYNAMIC_SECTIONS.forEach(({ currentField }) => {
    if (currentField) {
      toggleEndDateField(entryEl, currentField);
    }
  });
}

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

function clearProfileImage() {
  const fileInput = document.getElementById("profile-image");
  const previewWrapper = document.getElementById("profile-image-preview-wrapper");
  const previewImage = document.getElementById("profile-image-preview");

  if (fileInput) fileInput.value = "";
  if (previewImage) previewImage.src = "";
  if (previewWrapper) previewWrapper.hidden = true;

  resumeState.personalInfo.profileImage = "";
  setFieldError("profile-image", "profile-image-error", "");
  renderPreview();
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

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    setFieldError(
      "profile-image",
      "profile-image-error",
      "Please upload a JPG, PNG, or WebP image."
    );
    event.target.value = "";
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    setFieldError(
      "profile-image",
      "profile-image-error",
      "Image must be 2 MB or smaller."
    );
    event.target.value = "";
    return;
  }

  setFieldError("profile-image", "profile-image-error", "");

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      showProfileImagePreview(reader.result);
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

function handleFormInput(event) {
  const target = event.target;

  if (target.id === "summary") {
    updateSummaryCharCount();
  }

  if (target.matches('[data-field="currentlyStudying"], [data-field="currentlyWorking"]')) {
    const entryEl = target.closest(".dynamic-entry");
    applyCurrentCheckboxBehavior(entryEl);
  }

  updateStateAndPreview();
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

  form.addEventListener("input", handleFormInput);
  form.addEventListener("change", handleFormInput);
  form.addEventListener("click", handleFormClick);
}

function initApp() {
  initFormListeners();
  initDynamicSections();
  initValidation();
  initProfileImage();
  updateSummaryCharCount();
  updateStateAndPreview();
}

document.addEventListener("DOMContentLoaded", initApp);
