const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const mobileLinks = document.querySelectorAll(".mobile-nav a");

function closeMobileMenu() {
  menuButton?.setAttribute("aria-expanded", "false");
  mobileNav?.classList.remove("open");
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileNav?.classList.toggle("open", !isOpen);
});

mobileLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

const tokenButton = document.querySelector(".token-button");
const tokenWords = ["more", "better", "wisely"];
let currentToken = 0;

tokenButton?.addEventListener("click", () => {
  currentToken = (currentToken + 1) % tokenWords.length;
  tokenButton.textContent = tokenWords[currentToken];
});

const sections = [...document.querySelectorAll("main section[id]")];
const desktopLinks = [...document.querySelectorAll(".desktop-nav a")];

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      desktopLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${visibleEntry.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.2, 0.5] },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
