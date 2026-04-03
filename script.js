const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  document.querySelectorAll("#mainNav a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

// NAV ACTIVE
const currentPath = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-link").forEach(link => {
  const linkPath = link.getAttribute("href");

  if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  } else {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  }
});

// TEAM PAGE
function renderTeamCards() {
  const container = document.getElementById("teamCards");

  if (!container || typeof teamMembers === "undefined") {
    return;
  }

  container.innerHTML = teamMembers.map(member => `
    <a class="card member-card member-link-card" href="member.html?id=${member.id}">
      <img class="avatar-img" src="${member.avatar}" alt="${member.name}" />
      <h3>${member.name}</h3>
      <p class="role">${member.role}</p>
      <p class="member-meta">${member.nationality}</p>
      <p>${member.shortFocus}</p>
    </a>
  `).join("");
}

// MEMBER PAGE
function renderMemberPage() {
  const container = document.getElementById("memberDetail");

  if (!container || typeof teamMembers === "undefined") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");
  const member = teamMembers.find(item => item.id === memberId);

  if (!member) {
    container.innerHTML = `
      <div class="card">
        <h2>Member not found</h2>
        <p>Please return to the team page and select a valid member.</p>
      </div>
    `;
    return;
  }

  document.title = `V1 · ${member.name}`;

  container.innerHTML = `
    <section class="member-detail-section card">
      <div class="member-detail-header compact-header">
        <img class="avatar-img avatar-small" src="${member.avatar}" alt="${member.name}" />
        <div>
          <h2>${member.name}</h2>
          <p class="role">${member.role}</p>
          <p class="member-meta">${member.nationality}</p>
          <p class="detail-last-updated">Last updated: ${member.lastUpdated}</p>
        </div>
      </div>

      <p class="member-summary">${member.summary}</p>

      <div class="grid two detail-grid">
        <div class="detail-box">
          <h3>Responsibilities</h3>
          <ul class="detail-list">
            ${member.responsibilities.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="detail-box">
          <h3>Current Focus</h3>
          <ul class="detail-list">
            ${member.currentFocus.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="detail-box worklog-box">
        <h3>Detailed Work Done So Far</h3>
        <div class="worklog-list">
          ${member.workLog.map(item => `
            <div class="worklog-item">
              <div class="worklog-date">${item.date}</div>
              <div class="worklog-content">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="detail-box">
        <h3>Next Steps</h3>
        <ul class="detail-list">
          ${member.nextSteps.map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

// CALLS
renderTeamCards();
renderMemberPage();