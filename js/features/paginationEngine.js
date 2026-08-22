/**
 * Pagination Engine
 * Deterministic A4 multi-page distribution with orphan heading prevention.
 */

(function () {
  const PaginationEngine = {
    paginate(rawHtml, templateKey) {
      if (!rawHtml || !rawHtml.trim()) {
        return "";
      }

      // Node environment fallback for unit tests
      if (typeof document === "undefined" || !document.body) {
        return `
          <div class="resume-page-wrapper" data-page-number="1">
            <div class="resume-page-header-badge">Page 1 of 1</div>
            <div class="resume resume--${templateKey} resume-page-sheet" data-page="1">
              ${rawHtml}
            </div>
          </div>
        `;
      }

      // Measure content in an off-screen staging container with standard A4 width
      const staging = document.createElement("div");
      staging.className = `resume resume--${templateKey} resume-staging-measure`;
      staging.style.cssText =
        "position: absolute; left: -9999px; top: 0; width: 794px; min-width: 794px; max-width: 794px; padding: 2.5rem; box-sizing: border-box; visibility: hidden; pointer-events: none; height: auto;";
      staging.innerHTML = rawHtml;
      document.body.appendChild(staging);

      const PAGE_HEIGHT_PX = window.AppConstants?.A4?.HEIGHT_PX || 1123;
      const computedStyle = window.getComputedStyle ? window.getComputedStyle(staging) : null;
      const paddingTop = computedStyle ? parseFloat(computedStyle.paddingTop) || 40 : 40;
      const paddingBottom = computedStyle ? parseFloat(computedStyle.paddingBottom) || 40 : 40;
      const usableHeight = PAGE_HEIGHT_PX - (paddingTop + paddingBottom);

      const totalHeight = staging.scrollHeight;

      // Single page optimization: if fits within one A4 page sheet
      if (totalHeight <= PAGE_HEIGHT_PX) {
        document.body.removeChild(staging);
        return `
          <div class="resume-page-wrapper" data-page-number="1">
            <div class="resume-page-header-badge">Page 1 of 1</div>
            <div class="resume resume--${templateKey} resume-page-sheet" data-page="1">
              ${rawHtml}
            </div>
          </div>
        `;
      }

      // Multi-page distribution
      const topLevelChildren = Array.from(staging.children);
      const pages = [];
      let currentPageElements = [];
      let currentPageHeight = 0;

      for (let i = 0; i < topLevelChildren.length; i++) {
        const node = topLevelChildren[i];
        const nodeHeight = node.offsetHeight;
        const nodeMarginBottom = computedStyle
          ? parseFloat(window.getComputedStyle(node).marginBottom) || 0
          : 18;
        const totalNodeHeight = nodeHeight + nodeMarginBottom;

        if (currentPageHeight + totalNodeHeight <= usableHeight) {
          currentPageElements.push(node.cloneNode(true));
          currentPageHeight += totalNodeHeight;
        } else {
          const isSection = node.classList.contains("resume-section");
          const titleEl = isSection ? node.querySelector(".resume-section-title") : null;
          const entryEls = isSection
            ? Array.from(
                node.querySelectorAll(
                  ".resume-entry, .resume-grid-entry, .resume-list, .resume-summary, .resume-skills-list, .resume-languages-list, .resume-certifications-list, .resume-skill-group"
                )
              )
            : [];

          if (isSection && titleEl && entryEls.length > 1) {
            const titleHeight =
              titleEl.offsetHeight +
              (parseFloat(window.getComputedStyle(titleEl).marginBottom) || 8);
            let fittedEntries = [];
            let remainingEntries = [];
            let splitHeight = currentPageHeight + titleHeight;

            for (let j = 0; j < entryEls.length; j++) {
              const entry = entryEls[j];
              const entryH =
                entry.offsetHeight +
                (parseFloat(window.getComputedStyle(entry).marginBottom) || 12);
              if (splitHeight + entryH <= usableHeight) {
                fittedEntries.push(entry.cloneNode(true));
                splitHeight += entryH;
              } else {
                remainingEntries.push(entry.cloneNode(true));
              }
            }

            if (fittedEntries.length > 0 && remainingEntries.length > 0) {
              const page1Sec = document.createElement("section");
              page1Sec.className = node.className;
              page1Sec.appendChild(titleEl.cloneNode(true));
              fittedEntries.forEach((e) => page1Sec.appendChild(e));
              currentPageElements.push(page1Sec);

              pages.push(currentPageElements);

              const page2Sec = document.createElement("section");
              page2Sec.className = node.className;
              const continuationTitle = titleEl.cloneNode(true);
              continuationTitle.innerHTML += ' <span style="font-size: 0.8em; opacity: 0.75; font-weight: normal;">(Continued)</span>';
              page2Sec.appendChild(continuationTitle);
              remainingEntries.forEach((e) => page2Sec.appendChild(e));

              currentPageElements = [page2Sec];
              currentPageHeight = page2Sec.offsetHeight || 100;
              continue;
            }
          }

          if (currentPageElements.length > 0) {
            pages.push(currentPageElements);
          }
          currentPageElements = [node.cloneNode(true)];
          currentPageHeight = totalNodeHeight;
        }
      }

      if (currentPageElements.length > 0) {
        pages.push(currentPageElements);
      }

      document.body.removeChild(staging);

      const totalPages = pages.length;
      return pages
        .map((pageEls, index) => {
          const pageNum = index + 1;
          const pageInnerHtml = pageEls.map((el) => el.outerHTML).join("");
          const subsequentClass = pageNum > 1 ? " resume-page-sheet--subsequent" : "";

          return `
            <div class="resume-page-wrapper" data-page-number="${pageNum}">
              <div class="resume-page-header-badge">Page ${pageNum} of ${totalPages}</div>
              <div class="resume resume--${templateKey} resume-page-sheet${subsequentClass}" data-page="${pageNum}">
                ${pageInnerHtml}
              </div>
            </div>
          `;
        })
        .join("");
    },
  };

  window.PaginationEngine = PaginationEngine;
  window.paginateResumeHtml = PaginationEngine.paginate;
})();
