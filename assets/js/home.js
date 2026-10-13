// home.js — Métricas en vivo para la página principal
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.CONFIG?.API_URL !== undefined) ? window.CONFIG.API_URL : '';

    function formatUptime(seconds) {
        if (!seconds) return 'En línea';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m en línea`;
    }

    async function updateHomeStats() {
        try {
            const res = await fetch(`${API_BASE}/api/stats`);
            const data = await res.json();
            if (!data.ok) return;

            // 1. Cupos libres normales
            const normalUsed = data.slots?.normal?.used ?? data.subbotsFree ?? 0;
            const normalMax = data.slots?.normal?.max ?? 100;
            const libres = Math.max(0, normalMax - normalUsed);
            const elCupos = document.getElementById('stat-cupos');
            if (elCupos) elCupos.textContent = `${libres} disponibles`;

            // 2. Subbots activos
            const elSubbots = document.getElementById('stat-subbots');
            if (elSubbots) elSubbots.textContent = `${data.subbotsActivos} / ${data.subbotsMax}`;

            // 3. Slots VIP
            const vipUsed = data.slots?.vip?.used ?? data.subbotsPremium ?? 0;
            const vipMax = data.slots?.vip?.max ?? 20;
            const elVip = document.getElementById('stat-vip');
            if (elVip) elVip.textContent = `${vipUsed} / ${vipMax}`;

            // 4. Usuarios totales
            const elUsers = document.getElementById('stat-users');
            if (elUsers) elUsers.textContent = data.totalUsuarios ? Number(data.totalUsuarios).toLocaleString() : '1,500+';

            // 5. Métricas ampliadas que la API entrega (sin dejar datos fuera)
            const elRegUsers = document.getElementById('stat-reg-users');
            if (elRegUsers) elRegUsers.textContent = data.usuariosRegistrados ? `${Number(data.usuariosRegistrados).toLocaleString()} registrados` : '—';

            const elGroups = document.getElementById('stat-groups');
            if (elGroups) elGroups.textContent = data.totalGrupos !== undefined ? `${data.totalGrupos} activos` : '—';

            const elUptime = document.getElementById('stat-uptime');
            if (elUptime) elUptime.textContent = formatUptime(data.uptimeSeconds);

            const elNormalDetail = document.getElementById('stat-normal-detail');
            if (elNormalDetail) {
                const dias = data.slots?.normal?.duracionDias || 7;
                const mb = data.slots?.normal?.limiteDescargaMb || 150;
                elNormalDetail.textContent = `Límite ${mb}MB • ${dias} días`;
            }

            const elVipDetail = document.getElementById('stat-vip-detail');
            if (elVipDetail) {
                const mb = data.slots?.vip?.limiteDescargaMb || 300;
                elVipDetail.textContent = `Límite ${mb}MB • Acceso VIP`;
            }

        } catch (e) {
            console.warn('[Home Stats] Error obteniendo estadísticas:', e);
        }
    }

    updateHomeStats();
    setInterval(updateHomeStats, window.CONFIG?.STATS_REFRESH_MS || 20000);
});
