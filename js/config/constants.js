/**
 * Application Constants and Page Metrics
 */

(function () {
  window.AppConstants = {
    // Invariant A4 Page Metrics at 96 CSS DPI
    A4: {
      WIDTH_PX: 794,
      HEIGHT_PX: 1123,
      PADDING_PX: 40, // 2.5rem
      USABLE_HEIGHT_PX: 1043, // 1123 - 80
      WIDTH_PT: 595.28,
      HEIGHT_PT: 841.89,
      SCALE_RATIO: 1123 / 794, // 1.4142857 (Standard A4 ratio)
    },

    STORAGE_KEY: "resume_builder_data_v1",

    TEMPLATES: [
      { id: "classic", name: "Classic LaTeX", default: true },
      { id: "minimal", name: "Modern Minimal" },
      { id: "executive", name: "Executive" },
    ],

    DEFAULT_SECTION_ORDER: [
      "summary",
      "education",
      "experience",
      "projects",
      "skills",
      "certifications",
      "languages",
      "custom",
    ],

    MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  };
})();
