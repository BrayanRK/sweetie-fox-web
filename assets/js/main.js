// Logica central compartida para Sweetie Fox Web
// Regla estricta: Cero emojis en mensajes, alertas o interfaz

const CONFIG = {
  API_URL: '',
  BOT_NAME: 'Sweetie Fox',
  WHATSAPP_GROUP: 'https://chat.whatsapp.com/HfK6bI56z48AvLPr8aRlZx?s=cl&p=a&mlu=4&ilr=4',
  WHATSAPP_CHANNEL: 'https://whatsapp.com/channel/0029VbDLXzm9MF8zqYNZc03Y',
  STATS_REFRESH_MS: 15000,
  POLL_INTERVAL_MS: 3000
};

window.CONFIG = CONFIG;

// 1. GESTION DE TEMA OSCURO / CLARO
function initTheme() {
  const saved = localStorage.getItem('sf-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const activeTheme = saved || (prefersDark ? 'dark' : 'dark');

  document.documentElement.setAttribute('data-theme', activeTheme);
  updateThemeIcon(activeTheme);

  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('sf-theme', next);
      updateThemeIcon(next);
    });
  });
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-icon-slot');
  icons.forEach(el => {
    if (theme === 'light') {
      // Icono Sol (18x18, stroke 1.75)
      el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    } else {
      // Icono Luna (18x18, stroke 1.75)
      el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  });
}

// 2. MENU MOVIL
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const drawer = document.querySelector('.mobile-drawer');
  if (!menuBtn || !drawer) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// 3. COPIAR TEXTO CON FEEDBACK
window.copyTextToClipboard = async function (text, btnElement, successMsg = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text);
    if (btnElement) {
      const origText = btnElement.getAttribute('data-original-label') || btnElement.textContent;
      if (!btnElement.hasAttribute('data-original-label')) {
        btnElement.setAttribute('data-original-label', origText);
      }
      btnElement.textContent = successMsg;
      setTimeout(() => {
        btnElement.textContent = btnElement.getAttribute('data-original-label');
      }, 1800);
    }
    return true;
  } catch (_) {
    return false;
  }
};

// 4. TIEMPO RELATIVO FORMATEADO
window.formatRelativeTime = function (timestamp) {
  if (!timestamp) return 'Reciente';
  const sec = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (sec < 5) return 'Ahora mismo';
  if (sec < 60) return `Hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr}h`;
  const day = Math.floor(hr / 24);
  return `Hace ${day}d`;
};

// 5. MASCARA DE NUMERO DE TELEFONO (PRIVACIDAD)
window.maskPhone = function (val) {
  if (!val) return '';
  return String(val).replace(/\b(\d{3,5})(\d{3,6})(\d{2,4})\b/g, '$1...$3');
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
});
