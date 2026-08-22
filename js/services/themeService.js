/**
 * Theme Service
 * Manages automatic system theme detection (prefers-color-scheme) and manual theme switching.
 */

(function () {
  const THEME_STORAGE_KEY = "resume_builder_theme_pref";

  const ThemeService = {
    currentTheme: "system", // 'system' | 'light' | 'dark'
    mediaQuery: null,

    init() {
      if (typeof window === "undefined") return;

      this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Load saved preference or default to 'system'
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          this.currentTheme = saved;
        } else {
          this.currentTheme = "system";
        }
      } catch {
        this.currentTheme = "system";
      }

      this.applyTheme();

      // Listen for dynamic OS theme changes
      if (this.mediaQuery && typeof this.mediaQuery.addEventListener === "function") {
        this.mediaQuery.addEventListener("change", () => {
          if (this.currentTheme === "system") {
            this.applyTheme();
          }
        });
      } else if (this.mediaQuery && typeof this.mediaQuery.addListener === "function") {
        this.mediaQuery.addListener(() => {
          if (this.currentTheme === "system") {
            this.applyTheme();
          }
        });
      }
    },

    getSystemTheme() {
      if (this.mediaQuery) {
        return this.mediaQuery.matches ? "dark" : "light";
      }
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    },

    getResolvedTheme() {
      if (this.currentTheme === "system") {
        return this.getSystemTheme();
      }
      return this.currentTheme;
    },

    getTheme() {
      return this.currentTheme;
    },

    setTheme(theme) {
      if (!["system", "light", "dark"].includes(theme)) return;
      this.currentTheme = theme;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // LocalStorage fallback
      }
      this.applyTheme();
    },

    cycleTheme() {
      const order = ["system", "dark", "light"];
      const nextIdx = (order.indexOf(this.currentTheme) + 1) % order.length;
      this.setTheme(order[nextIdx]);
    },

    applyTheme() {
      const resolved = this.getResolvedTheme();
      if (typeof document !== "undefined" && document.documentElement) {
        if (this.currentTheme === "system") {
          document.documentElement.setAttribute("data-theme", resolved);
          document.documentElement.setAttribute("data-theme-mode", "system");
        } else {
          document.documentElement.setAttribute("data-theme", resolved);
          document.documentElement.setAttribute("data-theme-mode", resolved);
        }
      }

      // Update theme toggle UI if present
      this.updateToggleButton();

      // Dispatch custom event
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("themechange", {
            detail: { theme: this.currentTheme, resolvedTheme: resolved },
          })
        );
      }
    },

    updateToggleButton() {
      if (typeof document === "undefined") return;
      const btn = document.getElementById("theme-toggle-btn");
      if (!btn) return;

      const resolved = this.getResolvedTheme();
      const isSystem = this.currentTheme === "system";

      const iconSystem = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      `;

      const iconDark = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;

      const iconLight = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;

      let icon = iconSystem;
      let label = "Theme: Auto (System)";
      if (this.currentTheme === "dark") {
        icon = iconDark;
        label = "Theme: Dark";
      } else if (this.currentTheme === "light") {
        icon = iconLight;
        label = "Theme: Light";
      }

      btn.innerHTML = `${icon}<span class="theme-label">${label}</span>`;
      btn.setAttribute("aria-label", `Switch theme. Current: ${label}`);
      btn.setAttribute("title", `Current: ${label}. Click to switch.`);
    },
  };

  window.ThemeService = ThemeService;

  // Auto-initialize when script loads in browser
  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => ThemeService.init());
    } else {
      ThemeService.init();
    }
  }
})();
