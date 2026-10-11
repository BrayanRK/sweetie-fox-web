// ranking.js — Lógica del Salón de la Fama
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.CONFIG?.API_URL !== undefined) ? window.CONFIG.API_URL : '';

    const tabEconomia = document.getElementById('tab-economia');
    const tabDiamantes = document.getElementById('tab-diamantes');
    const tabNivel = document.getElementById('tab-nivel');
    const tabColeccion = document.getElementById('tab-coleccion');
    const searchInput = document.getElementById('search-player');
    const podiumContainer = document.getElementById('podium-container');
    const rankingList = document.getElementById('ranking-list');

    let currentCategory = 'economia'; // economia | diamantes | nivel | coleccion
    let leaderboardData = {
        topEconomia: [],
        topDiamantes: [],
        topNivel: [],
        topColeccionistas: []
    };

    function formatNumber(num) {
        return Number(num || 0).toLocaleString();
    }

    function renderLeaderboard() {
        if (!podiumContainer || !rankingList) return;

        let items = [];
        let scoreLabel = '';
        let subLabelFn = (item) => '';
        let mainValFn = (item) => '';

        if (currentCategory === 'economia') {
            items = leaderboardData.topEconomia || [];
            mainValFn = (item) => `$${formatNumber(item.total_dinero)}`;
            subLabelFn = (item) => `Nivel ${item.nivel} • 💎 ${item.diamantes || 0}`;
        } else if (currentCategory === 'diamantes') {
            items = leaderboardData.topDiamantes || [];
            mainValFn = (item) => `💎 ${formatNumber(item.diamantes)}`;
            subLabelFn = (item) => `Nivel ${item.nivel} • ${formatNumber(item.xp)} XP`;
        } else if (currentCategory === 'nivel') {
            items = leaderboardData.topNivel || [];
            mainValFn = (item) => `Nivel ${item.nivel}`;
            subLabelFn = (item) => `${formatNumber(item.xp)} XP • 💎 ${item.diamantes || 0}`;
        } else if (currentCategory === 'coleccion') {
            items = leaderboardData.topColeccionistas || [];
            mainValFn = (item) => `${item.total_cartas} Cartas`;
            subLabelFn = (item) => `${item.cartas_unicas} únicas • Nivel ${item.nivel}`;
        }

        const q = (searchInput?.value || '').trim().toLowerCase();
        const filtered = items.filter(it => it.nombre.toLowerCase().includes(q));

        if (filtered.length === 0) {
            podiumContainer.innerHTML = '';
            rankingList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 1.2rem; margin-bottom: 6px;">😿 Jugador no encontrado</p>
                    <p style="font-size: 0.85rem;">No hay ningún usuario en el Top con el apodo "${q}".</p>
                </div>
            `;
            return;
        }

        // Render Podio Top 3 (Solo si no hay filtro de búsqueda activo)
        if (!q && filtered.length >= 3) {
            const first = filtered[0];
            const second = filtered[1];
            const third = filtered[2];

            podiumContainer.innerHTML = `
                <div class="podium-card podium-second" onclick="window.location.href='/album.html?user=${encodeURIComponent(second.nombre)}'" style="cursor: pointer;" title="Toca para ver el álbum de ${second.nombre}">
                    <span class="podium-medal">🥈</span>
                    <div class="podium-name" title="${second.nombre}">${second.nombre}</div>
                    <div class="podium-score">${mainValFn(second)}</div>
                    <div class="podium-sub">${subLabelFn(second)}</div>
                    <div style="font-size: 0.7rem; color: var(--ruby-light); margin-top: 6px;">Ver Álbum 🃏</div>
                </div>

                <div class="podium-card podium-first" onclick="window.location.href='/album.html?user=${encodeURIComponent(first.nombre)}'" style="cursor: pointer;" title="Toca para ver el álbum de ${first.nombre}">
                    <span class="podium-medal">👑</span>
                    <div class="podium-name" title="${first.nombre}">${first.nombre}</div>
                    <div class="podium-score">${mainValFn(first)}</div>
                    <div class="podium-sub">${subLabelFn(first)}</div>
                    <div style="font-size: 0.72rem; color: var(--gold-vip); margin-top: 6px; font-weight: 700;">Ver Álbum 🃏</div>
                </div>

                <div class="podium-card podium-third" onclick="window.location.href='/album.html?user=${encodeURIComponent(third.nombre)}'" style="cursor: pointer;" title="Toca para ver el álbum de ${third.nombre}">
                    <span class="podium-medal">🥉</span>
                    <div class="podium-name" title="${third.nombre}">${third.nombre}</div>
                    <div class="podium-score">${mainValFn(third)}</div>
                    <div class="podium-sub">${subLabelFn(third)}</div>
                    <div style="font-size: 0.7rem; color: var(--ruby-light); margin-top: 6px;">Ver Álbum 🃏</div>
                </div>
            `;
        } else {
            podiumContainer.innerHTML = '';
        }

        // Render Lista (desde el 4 en adelante si no hay búsqueda, o todos si hay búsqueda)
        const listItems = (!q && filtered.length >= 3) ? filtered.slice(3) : filtered;

        rankingList.innerHTML = '';
        listItems.forEach((item, idx) => {
            const pos = (!q && filtered.length >= 3) ? idx + 4 : idx + 1;
            const row = document.createElement('div');
            row.className = 'rank-row';
            row.style.cursor = 'pointer';
            row.title = `Toca para ver el álbum de ${item.nombre}`;
            row.onclick = () => {
                window.location.href = `/album.html?user=${encodeURIComponent(item.nombre)}`;
            };

            row.innerHTML = `
                <div class="rank-left">
                    <span class="rank-num">#${pos}</span>
                    <div>
                        <div class="rank-player-name">${item.nombre}</div>
                        <div class="rank-value-sub">${subLabelFn(item)}</div>
                    </div>
                </div>
                <div class="rank-right" style="display: flex; align-items: center; gap: 12px;">
                    <div>
                        <div class="rank-value-main">${mainValFn(item)}</div>
                    </div>
                    <span style="font-size: 1.1rem; opacity: 0.7;" title="Inspeccionar Álbum">🃏</span>
                </div>
            `;
            rankingList.appendChild(row);
        });
    }

    function setActiveTab(cat, btn) {
        currentCategory = cat;
        [tabEconomia, tabDiamantes, tabNivel, tabColeccion].forEach(b => b?.classList.remove('active'));
        btn.classList.add('active');
        renderLeaderboard();
    }

    tabEconomia?.addEventListener('click', () => setActiveTab('economia', tabEconomia));
    tabDiamantes?.addEventListener('click', () => setActiveTab('diamantes', tabDiamantes));
    tabNivel?.addEventListener('click', () => setActiveTab('nivel', tabNivel));
    tabColeccion?.addEventListener('click', () => setActiveTab('coleccion', tabColeccion));
    searchInput?.addEventListener('input', () => renderLeaderboard());

    async function fetchLeaderboard() {
        try {
            const res = await fetch(`${API_BASE}/api/leaderboard`);
            const data = await res.json();
            if (!data.ok) return;

            leaderboardData = data;
            renderLeaderboard();
        } catch (err) {
            console.error('[Leaderboard Error]', err);
            rankingList.innerHTML = `<p style="text-align: center; color: #f87171;">Error al conectar con la base de datos de ranking.</p>`;
        }
    }

    fetchLeaderboard();
});
