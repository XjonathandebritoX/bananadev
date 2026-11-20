import { initTheme } from './theme';

function initMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-mobile-nav]');
  if (!toggle || !panel) return;

  const close = () => {
    panel.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu de navegação');
  };

  const open = () => {
    panel.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu de navegação');
  };

  close();

  toggle.addEventListener('click', () => {
    if (panel.dataset.open === 'true') close();
    else open();
  });

  panel.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.dataset.open === 'true') {
      close();
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) close();
  });
}

function initBackToTop(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-to-top]');
  if (!button) return;

  const update = () => {
    button.dataset.visible = String(window.scrollY > 720);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
}

function initActiveSection(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-section-link]')];
  if (links.length === 0 || !('IntersectionObserver' in window)) return;
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.getAttribute('href') ?? ''))
    .filter((section): section is HTMLElement => section !== null);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        for (const link of links) {
          link.setAttribute('aria-current', String(link.getAttribute('href') === id));
        }
      }
    },
    { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
  );

  for (const section of sections) observer.observe(section);
}

export function initShell(): void {
  initTheme();
  initMobileNav();
  initBackToTop();
  initActiveSection();
}
