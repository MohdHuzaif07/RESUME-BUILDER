/**
 * Resume Template Registry
 * Central registry for pluggable resume templates.
 */

(function () {
  window.ResumeTemplates = window.ResumeTemplates || {};

  window.TemplateRegistry = {
    templates: {},

    register(id, templateObj) {
      if (!id || !templateObj || typeof templateObj.render !== "function") {
        console.error("Invalid template registration for:", id);
        return;
      }
      this.templates[id] = templateObj;
      window.ResumeTemplates[id] = templateObj;
    },

    get(id) {
      return this.templates[id] || this.templates["classic"] || null;
    },

    getAll() {
      return Object.keys(this.templates);
    },
  };
})();
