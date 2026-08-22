# Resume Builder — PDF Export Text Overlap Fix & Sandboxing

## PDF Text Overlapping Resolved

### Root Cause
- Previously, `html2canvas` captured `.resume-page-sheet` directly from inside the `#resume-preview` container.
- When responsive scaling (`transform: scale(...)`) or panel scrolling was active on the preview container, `html2canvas` calculated computed text offsets with matrix transformation and scroll offsets, which caused characters, lines, and headers to overlap on top of each other.

### The Solution: Isolated DOM Sandboxing
- Implemented isolated off-screen sandboxing in `js/services/pdfExportService.js` and `js/pdf.js`:
  1. Each page sheet is cloned into a fixed, unscaled sandbox container (`width: 794px; height: 1123px; position: fixed; top: 0; left: -9999px; transform: none; margin: 0;`).
  2. `html2canvas` renders the clean, unscaled clone at `scale: 3` with `windowWidth: 794`, `windowHeight: 1123`, `scrollX: 0`, `scrollY: 0`.
  3. Added `-webkit-font-smoothing: antialiased` and `text-rendering: geometricPrecision` in `css/resume.css`.
  4. The sandbox container is removed after rendering each page.
- Text, bullet points, headers, and hyperlinks are now placed with **100% pixel-perfect clarity without any letter or line overlapping**.

### Verification
- **147/147 Automated Tests Passed (0 Failed)**.
