// Monitor de Actividad en Vivo — Sweetie Fox
(function () {
  const activityList = document.getElementById('activity-list');
  const statSummary = document.getElementById('stat-summary');
  const searchInput = document.getElementById('activity-search');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentFilter = 'all';
  let searchQuery = '';
  let allActivities = [];
  let pollTimer = null;
  let isFetching = false;

  // Formato relativo de tiempo en español
  function timeAgo(timestamp) {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsed < 3) return 'Justo ahora';
    if (elapsed < 60) return `Hace ${elapsed}s`;
    const mins = Math.floor(elapsed / 60);
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `Hace ${hours}h`;
  }

  // Escape HTML básico para prevenir XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Censura parcial para números telefónicos (Subbots y usuarios)
  function maskNumber(str) {
    if (!str) return '';
    return String(str).replace(/\b(\d{4,5})(\d{2,6})(\d{3})\b/g, '$1••••$3');
  }

  // Renderizar una tarjeta de actividad
  function renderCard(item) {
    const isOwnerGlobal = item.user.role === 'owner_global';
    const cardClass = isOwnerGlobal ? 'activity-card is-owner-global' : 'activity-card';

    let roleBadgeHtml = '';
    if (isOwnerGlobal) {
      roleBadgeHtml = `<span class="role-badge role-owner-global">👑 OWNER GLOBAL</span>`;
    } else if (item.user.role === 'sub_owner') {
      roleBadgeHtml = `<span class="role-badge role-sub-owner">⭐ SUB-OWNER</span>`;
    } else if (item.user.role === 'admin') {
      roleBadgeHtml = `<span class="role-badge role-admin">🛡️ ADMIN</span>`;
    } else if (item.user.registeredName) {
      roleBadgeHtml = `<span class="role-badge role-registrado">👤 REGISTRADO</span>`;
    } else {
      roleBadgeHtml = `<span class="role-badge role-user">USUARIO</span>`;
    }

    const userNameClass = isOwnerGlobal ? 'user-name owner-gold' : 'user-name';
    const rawUserName = isOwnerGlobal ? (item.user.name || 'BrayanRK') : (item.user.name || item.user.pushName || 'Usuario');
    const userName = maskNumber(rawUserName);
    const avatarUrl = item.user.avatarUrl || `/api/avatar/${encodeURIComponent(userName)}`;

    const isSuccess = item.status === 'success';
    const statusBadge = isSuccess
      ? `<span class="status-badge-ok">✅ Respondido bien (${item.durationMs || 40}ms)</span>`
      : `<span class="status-badge-err">❌ Falló comando</span>`;

    const safeArgs = maskNumber(item.args);
    const argsHtml = safeArgs ? `<span class="cmd-args" title="${escapeHtml(safeArgs)}">${escapeHtml(safeArgs)}</span>` : '';
    const chatIcon = item.chat.isGroup ? '👥' : '🔒';
    const botDisplayName = maskNumber(item.bot.name || 'Bot');

    return `
      <div class="${cardClass}" data-id="${item.id}">
        <img src="${avatarUrl}" alt="${escapeHtml(userName)}" class="activity-avatar" onerror="this.src='/favicon-32.png'" loading="lazy" />
        <div class="activity-body">
          <div class="activity-top-row">
            <span class="${userNameClass}">${escapeHtml(userName)}</span>
            ${roleBadgeHtml}
            <span style="font-size: 0.76rem; color: var(--text-muted); margin-left: auto;">${timeAgo(item.timestamp)}</span>
          </div>

          <div class="activity-cmd-row">
            <span class="cmd-tag">⚡ /${escapeHtml(item.command)}</span>
            ${argsHtml}
          </div>

          <div class="activity-meta-row">
            <span class="meta-item">${chatIcon} ${escapeHtml(item.chat.name || 'Chat')}</span>
            <span class="meta-item bot-chip">🤖 ${escapeHtml(botDisplayName)}</span>
            <span class="meta-item">${statusBadge}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Filtrar y renderizar elementos en el DOM
  function updateDOM() {
    let filtered = allActivities;

    // Filtro por rol o estado
    if (currentFilter === 'owner_global') {
      filtered = filtered.filter(a => a.user.role === 'owner_global');
    } else if (currentFilter === 'admin') {
      filtered = filtered.filter(a => a.user.role === 'admin' || a.user.role === 'sub_owner');
    } else if (currentFilter === 'user') {
      filtered = filtered.filter(a => a.user.role === 'user' || a.user.role === 'registered');
    } else if (currentFilter === 'success') {
      filtered = filtered.filter(a => a.status === 'success');
    }

    // Filtro por texto de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.user.name && a.user.name.toLowerCase().includes(q)) ||
        (a.command && a.command.toLowerCase().includes(q)) ||
        (a.chat.name && a.chat.name.toLowerCase().includes(q)) ||
        (a.args && a.args.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      if (allActivities.length === 0) {
        activityList.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">📡</div>
            <h3>Esperando actividad...</h3>
            <p>Ejecuta cualquier comando en WhatsApp para verlo aparecer aquí en tiempo real.</p>
          </div>
        `;
      } else {
        activityList.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">🔍</div>
            <h3>Sin resultados</h3>
            <p>No se encontraron registros que coincidan con el filtro actual.</p>
          </div>
        `;
      }
      return;
    }

    activityList.innerHTML = filtered.map(renderCard).join('');
  }

  // Petición a la API para traer actividades recientes
  async function fetchActivities() {
    if (isFetching) return;
    isFetching = true;

    try {
      const res = await fetch('/api/actividad?limit=50', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al consultar /api/actividad');
      const data = await res.json();

      if (data.ok && Array.isArray(data.activities)) {
        allActivities = data.activities;
        updateDOM();

        if (data.stats) {
          const total = data.stats.totalSession || allActivities.length;
          const ok = data.stats.successSession || 0;
          statSummary.textContent = `⚡ ${total} comandos en sesión • ${allActivities.length} recientes`;
        }
      }
    } catch (err) {
      console.warn('[Activity Fetch Note]:', err.message);
    } finally {
      isFetching = false;
    }
  }

  // Event Listeners de Filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      updateDOM();
    });
  });

  // Event Listener del Buscador
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      updateDOM();
    });
  }

  // Actualizar timestamps en pantalla cada 2 segundos
  setInterval(() => {
    const timeElements = document.querySelectorAll('.activity-card');
    timeElements.forEach(card => {
      const id = card.dataset.id;
      const item = allActivities.find(a => a.id === id);
      if (item) {
        const timeSpan = card.querySelector('.activity-top-row span:last-child');
        if (timeSpan) {
          timeSpan.textContent = timeAgo(item.timestamp);
        }
      }
    });
  }, 2000);

  // Iniciar sondeo en vivo (polling cada 2.5s)
  fetchActivities();
  pollTimer = setInterval(fetchActivities, 2500);

})();
