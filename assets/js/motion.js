// motion.js — Orquestación de animaciones de scroll y micro-interacciones hápticas
// Cumple con GPU-safe guardrails y Emil Kowalski design engineering principles

document.addEventListener('DOMContentLoaded', () => {
  // 1. Observer de entrada escalonada al hacer scroll
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Seleccionar todas las secciones y tarjetas que deben revelarse suavemente
  const revealElements = document.querySelectorAll(
    '.hero-section, .metrics-section, .features-section, .community-section, .bento-card, .metric-item, .community-card, .single-cmd-card, .activity-card, .podium-card, .rank-row, .glass-box, .vip-id-card, [data-reveal]'
  );

  revealElements.forEach((el, index) => {
    // Si no tiene clase explícita, se la asignamos
    if (!el.classList.contains('reveal-fade-up')) {
      el.classList.add('reveal-fade-up');
    }
    // Asignar retardo escalonado si está dentro de una grilla
    const parentGrid = el.closest('.metrics-grid, .bento-grid, .cards-layout-grid, .community-banner-grid, .steps-grid');
    if (parentGrid) {
      const siblingIndex = Array.from(parentGrid.children).indexOf(el);
      el.style.transitionDelay = `${(siblingIndex % 6) * 75}ms`;
    }
    revealObserver.observe(el);
  });

  // 2. Reflejo dinámico de foco (Spotlight) en tarjetas al mover el mouse
  const interactiveCards = document.querySelectorAll('.bento-card, .metric-item, .community-card, .doppelrand-card, .step-card, .single-cmd-card');
  interactiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 3. Feedback táctil háptico en móviles para botones principales
  const actionButtons = document.querySelectorAll('.btn-primary-action, .btn-wa-group, .btn-wa-channel, .btn-cmd-copy, .btn-share-collection, .filter-btn, .category-tab-btn');
  actionButtons.forEach(btn => {
    btn.addEventListener('touchstart', () => {
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }, { passive: true });
  });
});
