const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionDots = document.querySelectorAll(".section-nav a");
const sections = document.querySelectorAll("main section[id]");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");

document.querySelector("#year").textContent = new Date().getFullYear();

const closeMenu = () => {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("open");
  document.body.classList.remove("menu-open");
};

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Open navigation menu" : "Close navigation menu",
  );
  navLinks.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navItems.forEach((link) => link.addEventListener("click", closeMenu));

const updatePageState = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progress.style.width = `${percentage}%`;
  header.classList.toggle("scrolled", window.scrollY > 24);

  let currentSection = "home";
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - window.innerHeight * 0.36) {
      currentSection = section.id;
    }
  });

  navItems.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${currentSection}`,
    );
  });

  sectionDots.forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.section === currentSection);
  });
};

window.addEventListener("scroll", updatePageState, { passive: true });
window.addEventListener("resize", updatePageState);
updatePageState();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

revealItems.forEach((item) => revealObserver.observe(item));

const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const duration = 900;
      const startedAt = performance.now();

      const animate = (now) => {
        const progressValue = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        counter.textContent = Math.round(target * eased);

        if (progressValue < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
      observer.unobserve(counter);
    });
  },
  { threshold: 0.7 },
);

counters.forEach((counter) => counterObserver.observe(counter));

const repositoriesContainer = document.querySelector("#github-repositories");
const githubProfileUrl = "https://github.com/kdeepakkartik-cloud";

const renderRepositoryStatus = (message, includeProfileLink = false) => {
  repositoriesContainer.replaceChildren();

  const status = document.createElement("p");
  status.className = "repo-status";
  status.append(document.createTextNode(message));

  if (includeProfileLink) {
    status.append(document.createTextNode(" "));
    const link = document.createElement("a");
    link.href = githubProfileUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "View repositories on GitHub.";
    status.append(link);
  }

  repositoriesContainer.append(status);
};

const renderRepositories = (repositories) => {
  repositoriesContainer.replaceChildren();

  repositories.forEach((repository) => {
    const card = document.createElement("a");
    card.className = "repo-card";
    card.href = repository.html_url;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.setAttribute("aria-label", `View ${repository.name} on GitHub`);

    const details = document.createElement("p");
    const updated = new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric",
    }).format(new Date(repository.updated_at));
    details.textContent = `${repository.language || "Repository"} · Updated ${updated}`;

    const name = document.createElement("h3");
    name.textContent = repository.name;

    const description = document.createElement("span");
    description.textContent =
      repository.description || "No repository description provided.";

    const meta = document.createElement("div");
    meta.className = "repo-meta";

    const stars = document.createElement("span");
    stars.textContent = `★ ${repository.stargazers_count}`;

    const action = document.createElement("strong");
    action.textContent = "View repository ↗";

    meta.append(stars, action);
    card.append(details, name, description, meta);
    repositoriesContainer.append(card);
  });
};

const loadRepositories = async () => {
  renderRepositoryStatus("Loading public repositories…");

  try {
    const response = await fetch(
      "https://api.github.com/users/kdeepakkartik-cloud/repos?type=owner&sort=updated&per_page=6",
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const repositories = (await response.json()).filter(
      (repository) => !repository.archived,
    );

    if (repositories.length === 0) {
      renderRepositoryStatus(
        "No public repositories are available yet.",
        true,
      );
      return;
    }

    renderRepositories(repositories);
  } catch (error) {
    console.error("Unable to load GitHub repositories.", error);
    renderRepositoryStatus(
      "Repositories could not be loaded automatically.",
      true,
    );
  } finally {
    repositoriesContainer.setAttribute("aria-busy", "false");
  }
};

loadRepositories();
