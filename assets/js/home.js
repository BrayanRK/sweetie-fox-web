// home.js — Métricas en vivo para la página principal
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.CONFIG?.API_URL !== undefined) ? window.CONFIG.API_URL : '';

    async function updateHomeStats() {
        try {
            const res = await fetch(`${API_BASE}/api/stats`);
            const data = await res.json();
            if (!data.ok) return;

            // Cupos libres normales
            const normalUsed = data.slots?.normal?.used ?? data.subbotsFree ?? 0;
            const normalMax = data.slots?.normal?.max ?? 100;
            const libres = Math.max(0, normalMax - normalUsed);
            const elCupos = document.getElementById('stat-cupos');
            if (elCupos) elCupos.textContent = `${libres} disponibles`;

            // Subbots activos
            const elSubbots = document.getElementById('stat-subbots');
            if (elSubbots) elSubbots.textContent = `${data.subbotsActivos} / ${data.subbotsMax}`;

            // Slots VIP
            const vipUsed = data.slots?.vip?.used ?? data.subbotsPremium ?? 0;
            const vipMax = data.slots?.vip?.max ?? 20;
            const elVip = document.getElementById('stat-vip');
            if (elVip) elVip.textContent = `${vipUsed} / ${vipMax}`;

            // Usuarios totales
            const elUsers = document.getElementById('stat-users');
            if (elUsers) elUsers.textContent = data.totalUsuarios ? Number(data.totalUsuarios).toLocaleString() : '1,500+';

        } catch (e) {
            console.warn('[Home Stats] Error obteniendo estadísticas:', e);
        }
    }

    updateHomeStats();
    setInterval(updateHomeStats, window.CONFIG?.STATS_REFRESH_MS || 20000);
});
