/**
 * Form Section Drag-and-Drop, Arrow Key Reordering, and Column Placement Controller
 */

(function () {
  const DEFAULT_ORDER = [
    "summary",
    "education",
    "experience",
    "projects",
    "skills",
    "certifications",
    "achievements",
    "languages"
  ];

  function getFormSectionOrder() {
    const form = document.getElementById("resume-form");
    if (!form) return DEFAULT_ORDER;

    const sections = Array.from(form.querySelectorAll(".form-section-reorderable"));
    const order = sections.map((sec) => sec.dataset.section).filter(Boolean);
    return order.length ? order : DEFAULT_ORDER;
  }

  function updateStateSectionOrder() {
    const newOrder = getFormSectionOrder();
    if (typeof resumeState === "object" && resumeState) {
      resumeState.sectionOrder = newOrder;
    }
    if (typeof renderPreview === "function") {
      renderPreview();
    }
    updateMoveButtonsState();
  }

  function updateStateSectionColumns() {
    const form = document.getElementById("resume-form");
    if (!form) return;

    const selects = form.querySelectorAll(".column-select");
    selects.forEach((select) => {
      const key = select.dataset.sectionKey;
      const col = select.value;
      if (key && typeof resumeState === "object" && resumeState) {
        resumeState.sectionColumns = resumeState.sectionColumns || {};
        resumeState.sectionColumns[key] = col;
      }
    });

    if (typeof renderPreview === "function") {
      renderPreview();
    }
  }

  function updateMoveButtonsState() {
    const form = document.getElementById("resume-form");
    if (!form) return;

    const reorderableSections = Array.from(form.querySelectorAll(".form-section-reorderable"));
    reorderableSections.forEach((sec, idx) => {
      const upBtn = sec.querySelector(".btn-move-up");
      const downBtn = sec.querySelector(".btn-move-down");

      if (upBtn) upBtn.disabled = idx === 0;
      if (downBtn) downBtn.disabled = idx === reorderableSections.length - 1;
    });
  }

  function moveSection(sectionEl, direction) {
    if (!sectionEl) return;

    if (direction === "up") {
      const prev = sectionEl.previousElementSibling;
      if (prev && prev.classList.contains("form-section-reorderable")) {
        sectionEl.parentNode.insertBefore(sectionEl, prev);
        updateStateSectionOrder();
      }
    } else if (direction === "down") {
      const next = sectionEl.nextElementSibling;
      if (next && next.classList.contains("form-section-reorderable")) {
        sectionEl.parentNode.insertBefore(next, sectionEl);
        updateStateSectionOrder();
      }
    }
  }

  function setupDragAndDrop() {
    const form = document.getElementById("resume-form");
    if (!form) return;

    let draggedItem = null;

    form.addEventListener("dragstart", (e) => {
      const sec = e.target.closest(".form-section-reorderable");
      if (!sec) return;

      draggedItem = sec;
      sec.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", sec.dataset.section || "");
    });

    form.addEventListener("dragover", (e) => {
      e.preventDefault();
      const targetSec = e.target.closest(".form-section-reorderable");
      if (!targetSec || targetSec === draggedItem) return;

      e.dataTransfer.dropEffect = "move";
      targetSec.classList.add("drag-over");

      const rect = targetSec.getBoundingClientRect();
      const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;

      if (next) {
        targetSec.parentNode.insertBefore(draggedItem, targetSec.nextSibling);
      } else {
        targetSec.parentNode.insertBefore(draggedItem, targetSec);
      }
    });

    form.addEventListener("dragleave", (e) => {
      const targetSec = e.target.closest(".form-section-reorderable");
      if (targetSec) {
        targetSec.classList.remove("drag-over");
      }
    });

    form.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetSec = e.target.closest(".form-section-reorderable");
      if (targetSec) {
        targetSec.classList.remove("drag-over");
      }
    });

    form.addEventListener("dragend", () => {
      if (draggedItem) {
        draggedItem.classList.remove("dragging");
        draggedItem = null;
      }

      const reorderable = form.querySelectorAll(".form-section-reorderable");
      reorderable.forEach((el) => el.classList.remove("drag-over"));

      updateStateSectionOrder();
    });

    // Delegate Up/Down Move Buttons
    form.addEventListener("click", (e) => {
      const upBtn = e.target.closest(".btn-move-up");
      const downBtn = e.target.closest(".btn-move-down");

      if (upBtn) {
        e.preventDefault();
        const sec = upBtn.closest(".form-section-reorderable");
        moveSection(sec, "up");
      } else if (downBtn) {
        e.preventDefault();
        const sec = downBtn.closest(".form-section-reorderable");
        moveSection(sec, "down");
      }
    });

    // Delegate Column Assignment Dropdowns
    form.addEventListener("change", (e) => {
      if (e.target.classList.contains("column-select")) {
        updateStateSectionColumns();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupDragAndDrop();
    updateMoveButtonsState();
    updateStateSectionColumns();
  });

  window.initSectionReordering = function () {
    setupDragAndDrop();
    updateMoveButtonsState();
    updateStateSectionColumns();
  };
})();
