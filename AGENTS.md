# AGENTS.md

## Project Overview

- **Project:** DSD 2025–2026 · Team V1 Website
- **Team:** V1 – AI & Motion Recognition
- **Context:** International project between UTAD and Jilin University.
- **Website purpose:** Present Team V1, publish project progress, and make team documents easy to access by all teams.
- **Deployment:** Static website hosted with GitHub Pages.
- **Main users:** Team V1 members, other DSD teams, team leaders, professors, and project reviewers.

This repository is the official website for Team V1. The website must be simple, readable, stable, and easy to update.

The site should clearly show:

- who Team V1 is;
- what Team V1 is responsible for;
- the current progress of the team;
- official documents such as Requirement Analysis;
- updates that help other teams understand V1 inputs, outputs, and interfaces.

---

## Important Project Context

Team V1 is responsible for the AI and motion-recognition part of the Server area.

Team V1 does **not** build the physical sensors, mobile application, clinical dashboard, or V2 database.

Current project understanding:

- V1 communicates directly with **V2 – Backend API & Storage**.
- V1 does not communicate directly with S1, S2, M1, or M2.
- S2 remains an indirect upstream source of sensor-data meaning.
- M1 and M2 consume V1 results indirectly through V2.
- The current V2 API for Generation 1 uses `jointAngles + isCorrect + timestamp + sessionId`.
- A future generation may use a richer format such as `targetAngles + sensorData + errors`.
- V1 output should go to V2, mainly through `POST /recommendations`.

For website content, keep this distinction clear:

```text
Generation 1:
V2 -> V1: jointAngles + isCorrect + timestamp + sessionId
V1 -> V2: recommendations

Future Generation:
V2 -> V1: targetAngles + sensorData + errors
V1 -> V2: richer AI/recommendation results
```

---

## Repository Type

This is a static website repository.

Expected stack:

- HTML
- CSS
- JavaScript
- Static assets
- GitHub Pages

Do not introduce unnecessary frameworks, build tools, package managers, or backend code unless explicitly requested.

Avoid adding:

- React
- Vue
- Angular
- Node build systems
- server-side rendering
- database logic
- authentication systems

The site should remain simple and deployable directly through GitHub Pages.

---

## General Development Rules

Before changing anything:

- Inspect the full repository structure.
- Understand the existing page layout.
- Check how navigation works.
- Check how documents are currently displayed.
- Check how progress items are structured.
- Reuse existing styles and patterns.
- Avoid changing unrelated files.

When implementing changes:

- Keep the existing visual identity.
- Preserve the current navigation.
- Use relative paths compatible with GitHub Pages.
- Do not break existing pages.
- Do not remove working functionality.
- Do not rewrite the whole site unless explicitly asked.
- Prefer small, targeted changes.
- Keep code readable and easy to maintain.

---

## Language Rules

Most website content should be written in simple English because this is an international project.

Use clear, direct wording.

Avoid:

- complex academic phrasing;
- long paragraphs;
- unnecessary technical jargon;
- ambiguous interface descriptions.

When describing technical content, be precise but simple.

Good example:

> V1 receives measurements from V2, processes them, and sends recommendation results back to V2.

Bad example:

> The artificial intelligence component performs sophisticated computational operations upon distributed biomechanical telemetry.

---

## Website Pages

### Home Page

The Home page should give a high-level explanation of:

- the project;
- Team V1;
- V1’s role in the system;
- how V1 fits into the wider architecture.

Keep it concise. Do not overload the Home page with full documents.

### Team Page

The Team page should show:

- team members;
- role;
- nationality;
- avatar if available;
- short work responsibility.

If detailed member pages exist, keep them consistent in layout and wording.

Do not invent contributions. If a member has not yet provided work details, use neutral wording such as:

> Prepared to start working on assigned V1 tasks.

### Progress Page

The Progress page is one of the most important pages.

It should clearly show:

- what is done;
- what is currently being worked on;
- what is upcoming;
- timestamps/dates where useful.

Use simple status categories such as:

- Done
- Doing
- Upcoming

When a new document or milestone is completed, update the Progress page accordingly.

For example, when Requirement Analysis v1.3 is published, add or update a Done item such as:

> Requirement Analysis v1.3 updated and published.

Use the same visual style already used by the page.

Do not create duplicate progress items. If an old item says Requirement Analysis is upcoming or in progress, update it instead of adding a conflicting item.

### Documents Page

The Documents page should act as a document hub.

Documents should be displayed as cards or blocks, following the existing visual design.

Each document card should include:

- title;
- short description;
- date/version if useful;
- a See button;
- optional download button if already supported.

Do not put the full document content directly inside documents.html unless the existing site already does this and there is no better static alternative.

Preferred approach:

```text
documents.html
  -> document cards
assets/docs/
  -> document HTML/Markdown/PDF files
```

If the site already has a fullscreen document viewer, reuse it.

If Markdown files are not rendered directly by the site, create an HTML version of the Markdown document and link to that HTML file.

Do not rely on external CDNs just to render Markdown.

---

## Document Handling Rules

Official documents should live under:

```text
assets/docs/
```

Examples:

```text
assets/docs/requirement-analysis.html
assets/docs/V1_Requirement_Analysis_v1_3_Updated.md
assets/docs/v1-requirement-analysis-v1-3.html
```

When adding a new official document:

- Place the document in assets/docs/.
- Add a document card to documents.html.
- Make the See button open the document correctly.
- Keep styling consistent with existing documents.
- Update progress.html if the document represents a completed milestone.
- Test paths as they will appear on GitHub Pages.

For important project documents, prefer an HTML view on the website rather than relying only on PDF embedding. This avoids access or rendering problems for international teammates.

---

## Requirement Analysis Rules

The current Requirement Analysis version is:

**V1 Requirement Analysis v1.3**

The website should treat this as the current version unless a newer version is provided.

Important content that must remain clear:

- V1 communicates directly with V2.
- V1 does not receive data directly from S2.
- Generation 1 uses the current V2 API format:
  - `jointAngles`
  - `isCorrect`
  - `timestamp`
  - `sessionId`
- Future generation may use:
  - `targetAngles`
  - `sensorData`
  - `errors`
- V1 sends results to V2 through recommendations.
- S2 is an indirect upstream source of data meaning.
- M1 and M2 consume V1 results through V2.

If updating the Requirement Analysis page, do not reintroduce the old direct S2 -> V1 dependency.

Do not use unclear or duplicated interface names such as IF1 for V1 unless explicitly required. Prefer clear names:

- `IF-V2-V1`
- `IF-V1-V2`

All V1 use cases should communicate externally only with V2.

---

## System Design Rules

If System Design content is added later, keep it consistent with:

```text
S2 -> M1 -> V2 -> V1 -> V2 -> M1/M2
```

V1 internal flow may be described as:

```text
V2
  -> V1 Data Preprocessing
  -> V1 Analysis / Inference
  -> V1 Result Post-processing
  -> V2
```

Do not show V1 receiving data directly from S2 unless the project officially changes again.

---

## Styling Rules

Preserve the existing design.

Do not change the global theme unless explicitly requested.

When adding new sections or cards:

- reuse existing classes;
- match spacing;
- match fonts;
- match button style;
- match colors;
- keep responsive behavior.

If new CSS is required, add minimal CSS and keep it consistent with the current style.css.

Avoid inline styles unless the project already uses them for similar components.

---

## JavaScript Rules

Only add JavaScript when needed.

If the site already has JavaScript for:

- navigation highlighting;
- mobile menu;
- document fullscreen view;
- document modal opening;

reuse the existing logic.

Do not add large libraries.

Do not break existing document-viewing functionality.

After changes, check browser console for errors.

---

## GitHub Pages Compatibility

All links must work on GitHub Pages.

Use relative paths such as:

```html
<a href="assets/docs/v1-requirement-analysis-v1-3.html">See</a>
```

Avoid absolute local paths such as:

```text
C:\Users\...
/home/user/...
```

Avoid links that only work on localhost.

Before finishing, verify:

- index.html works;
- documents.html works;
- progress.html works;
- document links work;
- CSS loads correctly;
- images load correctly;
- no broken relative paths.

---

## File Naming Rules

Use simple, predictable file names.

Good examples:

- `v1-requirement-analysis-v1-3.html`
- `V1_Requirement_Analysis_v1_3_Updated.md`
- `v1-system-design.html`
- `v1-data-flow-diagram.png`

Avoid names with spaces when possible.

Avoid overly long names for files used directly in URLs.

---

## Progress Update Rules

When updating progress.html, use clear status language.

Examples:

- Done — Requirement Analysis v1.3 updated and published.
- Done — V1 input/output flow aligned with V2 for Generation 1.
- Doing — Preparing first implementation plan based on current V2 API.
- Upcoming — Future IMU-based extension after Generation 1.

Do not overstate completion. If something is planned but not implemented, mark it as future or upcoming.

Use cautious wording for uncertain items:

- Future extension planned
- Pending confirmation
- Depends on V2 schema support

---

## Content Accuracy Rules

Do not invent project facts.

If the existing repository or documents do not confirm a claim, mark it as:

- Pending confirmation
- Future extension
- Assumption

Do not claim that V1 has a complete AI model if it only has a rule-based or planning version.

Use the correct distinction:

- Current version: integration-focused and angle-based.
- Future version: IMU-based AI pipeline.

---

## Current Technical Interpretation for V1

For the website, describe V1 like this:

> Team V1 processes movement data received from V2 and produces recommendation or analysis results back to V2.

For Generation 1:

> V1 works with processed joint angle data from the current V2 API.

For future development:

> V1 may use richer sensor data, including accelerometer, gyroscope, orientation values, timestamps, sensor identifiers, and error events, if the interface is extended after the first generation.

---

## Do Not Do

Do not:

- change unrelated pages;
- redesign the whole site without being asked;
- remove existing documents;
- break Requirement Analysis access;
- replace working document links with PDF-only access;
- add external dependencies unnecessarily;
- use direct S2-to-V1 communication in new V1 documentation;
- mark future IMU features as already implemented;
- treat targetAngles + sensorData + errors as Generation 1 API if V2 has not implemented it yet;
- expose private or irrelevant chat context on the website.

---

## Validation Checklist

After every change, check:

- [ ] The website opens locally.
- [ ] Navigation still works.
- [ ] Active page highlighting still works.
- [ ] Documents page loads.
- [ ] Requirement Analysis v1.3 appears correctly.
- [ ] The See button works.
- [ ] Existing Requirement Analysis document is not broken.
- [ ] Progress page reflects the latest milestone.
- [ ] No outdated duplicate progress items remain.
- [ ] No broken images.
- [ ] No broken CSS paths.
- [ ] No console errors.
- [ ] Paths are compatible with GitHub Pages.

---

## Expected Response After Work

After making changes, summarize briefly:

- which files were changed;
- what was added;
- what was updated;
- what assumptions were made;
- what still needs manual review.

Keep the summary short and practical.

Example:

```text
Changed:
- documents.html
- progress.html
- assets/docs/v1-requirement-analysis-v1-3.html

Added:
- Requirement Analysis v1.3 card on Documents page
- Done item on Progress page

Assumptions:
- The document path is assets/docs/v1-requirement-analysis-v1-3.html
```

---

## Main Principle

Keep the website simple, stable, readable, and useful for cross-team coordination.

The goal is not to make the most complex website possible.

The goal is to make Team V1’s work clear to other teams.
