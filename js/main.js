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

  const countrySelect = document.getElementById("country-code");
  const phoneInput = document.getElementById("phone");
  if (countrySelect && phoneInput) {
    const countryCode = countrySelect.value || "+91";
    const digitsOnly = phoneInput.value.replace(/\D/g, "");
    info.countryCode = countryCode;
    info.phoneNumber = digitsOnly;
    info.phone = digitsOnly.length > 0 ? `${countryCode} ${digitsOnly}` : "";
  }

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
          personalInfo: { ...resumeState.personalInfo, profileImage: "", originalProfileImage: "" },
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
      if (typeof parsed.template === "string") {
        const validTemplates = ["classic", "executive", "minimal"];
        resumeState.template = validTemplates.includes(parsed.template) ? parsed.template : "classic";
      }
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

  const countrySelect = document.getElementById("country-code");
  const phoneInput = document.getElementById("phone");
  if (countrySelect && phoneInput) {
    if (info.countryCode) {
      countrySelect.value = info.countryCode;
    }
    if (info.phoneNumber !== undefined && info.phoneNumber !== "") {
      phoneInput.value = info.phoneNumber;
    } else if (info.phone) {
      // If legacy or composite format like "+91 9876543210" or "9876543210"
      const digitsOnly = info.phone.replace(/\D/g, "");
      phoneInput.value = digitsOnly;
    }
    updatePhoneInputAttributes();
  }

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

function updatePhoneInputAttributes() {
  const countrySelect = document.getElementById("country-code");
  const phoneInput = document.getElementById("phone");
  const flagImg = document.getElementById("selected-flag-img");
  const codeText = document.getElementById("selected-code-text");
  if (!countrySelect || !phoneInput) return;

  const selectedOpt = countrySelect.selectedOptions?.[0];
  const requiredDigits = parseInt(selectedOpt?.dataset.digits || "10", 10);
  const countryCode = selectedOpt?.value || "+91";
  const isoCode = selectedOpt?.dataset.iso || "in";
  const countryName = selectedOpt?.dataset.name || "India";

  phoneInput.maxLength = requiredDigits;
  phoneInput.placeholder = `${requiredDigits}-digit number`;

  if (flagImg) {
    flagImg.src = `https://flagcdn.com/w40/${isoCode}.png`;
    flagImg.alt = `${countryName} flag`;
  }
  if (codeText) {
    codeText.textContent = countryCode;
  }

  if (phoneInput.value.length > requiredDigits) {
    phoneInput.value = phoneInput.value.slice(0, requiredDigits);
  }
}

function validatePhone() {
  const phoneInput = document.getElementById("phone");
  const countrySelect = document.getElementById("country-code");
  if (!phoneInput) return true;

  const value = phoneInput.value.trim();
  // Phone is optional — valid if empty
  if (!value) {
    setFieldError("phone", "phone-error", "");
    return true;
  }

  const selectedOpt = countrySelect?.selectedOptions?.[0];
  const requiredDigits = parseInt(selectedOpt?.dataset.digits || "10", 10);
  const countryName = selectedOpt?.dataset.name || "selected country";
  const countryCode = countrySelect?.value || "+91";

  if (typeof isValidExactPhone === "function" ? !isValidExactPhone(value, requiredDigits) : value.length !== requiredDigits) {
    const errorMsg = `Enter exactly ${requiredDigits} digits for ${countryName} (${countryCode}). (${value.length}/${requiredDigits})`;
    setFieldError("phone", "phone-error", errorMsg);
    return false;
  }

  setFieldError("phone", "phone-error", "");
  return true;
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

let cropperInstance = null;

function clearProfileImage() {
  const fileInput = document.getElementById("profile-image");
  const previewWrapper = document.getElementById("profile-image-preview-wrapper");
  const previewImage = document.getElementById("profile-image-preview");

  if (fileInput) fileInput.value = "";
  // B5 Fix: Use removeAttribute instead of setting src="" to avoid a spurious network request
  if (previewImage) previewImage.removeAttribute("src");
  if (previewWrapper) previewWrapper.hidden = true;

  resumeState.personalInfo.profileImage = "";
  resumeState.personalInfo.originalProfileImage = "";
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

function openCropModal(dataUrl) {
  const modal = document.getElementById("crop-modal");
  const cropImage = document.getElementById("crop-image");
  if (!modal || !cropImage) return;

  // Destroy previous cropper instance if any
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }

  cropImage.src = dataUrl;
  modal.hidden = false;
  document.body.style.overflow = "hidden"; // prevent background scrolling

  // Wait for the image to load before initializing Cropper
  cropImage.onload = () => {
    cropperInstance = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.85,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  };
}

function closeCropModal() {
  const modal = document.getElementById("crop-modal");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";

  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
}

function applyCrop() {
  if (!cropperInstance) return;

  const canvas = cropperInstance.getCroppedCanvas({
    width: 400,
    height: 400,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  if (!canvas) {
    closeCropModal();
    return;
  }

  const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
  closeCropModal();
  showProfileImagePreview(croppedDataUrl);
  saveStateToStorage();
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
      // Store the full-size original in state so it persists across reloads
      resumeState.personalInfo.originalProfileImage = reader.result;
      openCropModal(reader.result);
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

function handleRecropImage() {
  // Always use the persisted full-size original for re-cropping
  const original = resumeState.personalInfo.originalProfileImage;
  if (original) {
    openCropModal(original);
  } else if (resumeState.personalInfo.profileImage) {
    // Fallback for images saved before this fix
    openCropModal(resumeState.personalInfo.profileImage);
  }
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

/* ─── Mobile Panel Toggle ─── */

function initMobileToggle() {
  const toggleNav = document.querySelector(".mobile-panel-toggle");
  const appMain = document.querySelector(".app-main");
  if (!toggleNav || !appMain) return;

  // Default: show editor on mobile
  appMain.classList.add("show-editor");

  toggleNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;

    const panel = btn.dataset.panel;

    // Update button active states
    toggleNav.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Toggle panel visibility
    if (panel === "preview") {
      appMain.classList.remove("show-editor");
      appMain.classList.add("show-preview");
    } else {
      appMain.classList.remove("show-preview");
      appMain.classList.add("show-editor");
    }
  });
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

  document
    .getElementById("recrop-profile-image")
    ?.addEventListener("click", handleRecropImage);

  // Crop modal buttons
  document
    .getElementById("crop-apply-btn")
    ?.addEventListener("click", applyCrop);

  document
    .getElementById("crop-cancel-btn")
    ?.addEventListener("click", closeCropModal);

  document
    .getElementById("crop-modal-backdrop")
    ?.addEventListener("click", closeCropModal);

  // Close crop modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("crop-modal");
      if (modal && !modal.hidden) {
        closeCropModal();
      }
    }
  });
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

function initPhoneInput() {
  const countryPicker = document.getElementById("country-picker");
  const pickerBtn = document.getElementById("country-picker-btn");
  const dropdownMenu = document.getElementById("country-dropdown-menu");
  const searchInput = document.getElementById("country-search-input");
  const optionsList = document.getElementById("country-options-list");
  const countrySelect = document.getElementById("country-code");
  const phoneInput = document.getElementById("phone");
  if (!phoneInput) return;

  function renderCountryOptions(filterText = "") {
    if (!optionsList || !countrySelect) return;
    const query = filterText.toLowerCase().trim();
    const options = Array.from(countrySelect.options);
    optionsList.innerHTML = "";

    options.forEach((opt) => {
      const name = opt.dataset.name || opt.text;
      const code = opt.value;
      const iso = opt.dataset.iso || "in";
      const digits = opt.dataset.digits || "10";

      if (query) {
        const matchesName = name.toLowerCase().includes(query);
        const matchesCode = code.toLowerCase().includes(query);
        const matchesIso = iso.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesIso) {
          return;
        }
      }

      const li = document.createElement("li");
      li.className = `country-option ${opt.selected ? "selected" : ""}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(opt.selected));
      li.dataset.value = code;
      li.dataset.iso = iso;
      li.dataset.digits = digits;
      li.dataset.name = name;

      li.innerHTML = `
        <img class="country-option-flag" src="https://flagcdn.com/w40/${iso}.png" alt="${escapeHtml(name)} flag" width="20" height="15" loading="lazy">
        <span class="country-option-name">${escapeHtml(name)}</span>
        <span class="country-option-code">(${escapeHtml(code)})</span>
      `;

      li.addEventListener("click", () => {
        countrySelect.value = code;
        updatePhoneInputAttributes();
        closeCountryDropdown();
        validatePhone();
        updateStateAndPreview();
        phoneInput.focus();
      });

      optionsList.appendChild(li);
    });

    if (optionsList.children.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "country-option";
      emptyLi.style.color = "var(--color-text-muted)";
      emptyLi.style.cursor = "default";
      emptyLi.textContent = "No countries found";
      optionsList.appendChild(emptyLi);
    }
  }

  function openCountryDropdown() {
    if (!dropdownMenu || !countryPicker) return;
    dropdownMenu.hidden = false;
    countryPicker.classList.add("open");
    pickerBtn?.setAttribute("aria-expanded", "true");
    renderCountryOptions(searchInput?.value || "");
    setTimeout(() => searchInput?.focus(), 50);
  }

  function closeCountryDropdown() {
    if (!dropdownMenu || !countryPicker) return;
    dropdownMenu.hidden = true;
    countryPicker.classList.remove("open");
    pickerBtn?.setAttribute("aria-expanded", "false");
    if (searchInput) searchInput.value = "";
  }

  if (pickerBtn) {
    pickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdownMenu?.hidden) {
        openCountryDropdown();
      } else {
        closeCountryDropdown();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderCountryOptions(e.target.value);
    });
    searchInput.addEventListener("click", (e) => e.stopPropagation());
  }

  // Close dropdown on clicking outside
  document.addEventListener("click", (e) => {
    if (countryPicker && !countryPicker.contains(e.target)) {
      closeCountryDropdown();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dropdownMenu && !dropdownMenu.hidden) {
      closeCountryDropdown();
      pickerBtn?.focus();
    }
  });

  // Block non-numeric characters on typing
  phoneInput.addEventListener("beforeinput", (e) => {
    if (e.data && /\D/.test(e.data)) {
      e.preventDefault();
    }
  });

  // Sanitize on input / paste and enforce length
  phoneInput.addEventListener("input", (e) => {
    const select = document.getElementById("country-code");
    const requiredDigits = parseInt(select?.selectedOptions?.[0]?.dataset.digits || "10", 10);
    const digitsOnly = e.target.value.replace(/\D/g, "");
    const truncated = digitsOnly.slice(0, requiredDigits);

    if (e.target.value !== truncated) {
      e.target.value = truncated;
    }

    validatePhone();
  });

  phoneInput.addEventListener("blur", validatePhone);

  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      updatePhoneInputAttributes();
      validatePhone();
      updateStateAndPreview();
    });
  }

  updatePhoneInputAttributes();
}

function initApp() {
  initFormListeners();
  initDynamicSections();
  initValidation();
  initPhoneInput();
  initProfileImage();
  initDownloadPdf();
  initMobileToggle();

  const hasLoadedData = loadStateFromStorage();
  if (hasLoadedData) {
    populateFormFromState();
  }

  updateSummaryCharCount();
  updateStateAndPreview();
}

document.addEventListener("DOMContentLoaded", initApp);

