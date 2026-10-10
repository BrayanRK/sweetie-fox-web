// comandos.js — Catálogo dinámico de comandos para comandos.html
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.CONFIG?.API_URL || 'https://mitsuri-bot.brayanrk.info';

    const searchInput = document.getElementById('search-input-field');
    const tabsContainer = document.getElementById('horizontal-tabs-container');
    const cardsGrid = document.getElementById('cards-layout-grid');
    const chipTotalCmds = document.getElementById('chip-total-cmds');

    let allLoadedCommands = [];
    let activeCategory = 'all';

    const CATEGORY_LABELS = {
        all: '🌟 Todos',
        downloads: '📥 Descargas',
        ia: '🤖 Inteligencia Artificial',
        groups: '🛡️ Grupos',
        moderation: '🔨 Moderación',
        economy: '💰 Economía',
        juegos: '🎮 Juegos',
        entretenimiento: '🎉 Entretenimiento',
        tools: '🔧 Herramientas',
        search: '🔍 Búsqueda',
        nsfw: '🔞 NSFW',
        sfw: '🌸 Anime / SFW',
        premium: '👑 VIP / Premium',
        owner: '🛠️ Creador',
        profile: '👤 Perfil',
        main: '📋 Principal',
        matematicas: '📐 Matemáticas',
        subbots: '🤖 Subbots'
    };

    function renderCards() {
        if (!cardsGrid) return;
        const q = (searchInput?.value || '').trim().toLowerCase();

        const filtered = allLoadedCommands.filter(cmd => {
            const matchesCat = (activeCategory === 'all') || (cmd.category === activeCategory);
            const matchesSearch = !q ||
                cmd.name.toLowerCase().includes(q) ||
                (cmd.description && cmd.description.toLowerCase().includes(q)) ||
                (cmd.aliases && cmd.aliases.some(a => a.toLowerCase().includes(q)));
            return matchesCat && matchesSearch;
        });

        cardsGrid.innerHTML = '';

        if (filtered.length === 0) {
            cardsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.3rem; margin-bottom: 8px;">😿 Sin resultados</p>
                    <p style="font-size: 0.9rem;">No encontramos ningún comando que coincida con "${q}".</p>
                </div>
            `;
            return;
        }

        filtered.forEach(cmd => {
            const card = document.createElement('div');
            card.className = 'single-cmd-card';

            const aliasText = (cmd.aliases && cmd.aliases.length > 0)
                ? `Alias: ${cmd.aliases.slice(0, 3).map(a => `!${a}`).join(', ')}`
                : 'Sin alias adicionales';

            let tagHtml = '';
            if (cmd.isPremiumOnly) {
                tagHtml = '<span class="badge-tag-vip">VIP</span>';
            } else if (cmd.isOwnerOnly) {
                tagHtml = '<span class="badge-tag-owner">Owner</span>';
            } else if (cmd.isGroupOnly) {
                tagHtml = '<span class="badge-tag-group">Grupos</span>';
            }

            card.innerHTML = `
                <div>
                    <div class="cmd-card-header">
                        <span class="cmd-syntax-name">!${cmd.name}</span>
                        ${tagHtml}
                    </div>
                    <p class="cmd-card-desc">${cmd.description || 'Comando disponible en Sweetie Fox.'}</p>
                </div>
                <div class="cmd-card-footer">
                    <span class="cmd-alias-list" title="${aliasText}">${aliasText}</span>
                    <button class="btn-cmd-copy" type="button" title="Copiar comando">
                        <span>Copiar</span>
                    </button>
                </div>
            `;

            const btnCopy = card.querySelector('.btn-cmd-copy');
            btnCopy.addEventListener('click', async () => {
                await navigator.clipboard.writeText(`!${cmd.name}`);
                if (navigator.vibrate) navigator.vibrate(40);
                btnCopy.innerHTML = '<span>✓ Copiado</span>';
                setTimeout(() => {
                    btnCopy.innerHTML = '<span>Copiar</span>';
                }, 1500);
            });

            cardsGrid.appendChild(card);
        });
    }

    function renderTabs(categories) {
        if (!tabsContainer) return;
        tabsContainer.innerHTML = '';

        const counts = { all: allLoadedCommands.length };
        allLoadedCommands.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });

        // Tab "Todos"
        const allBtn = document.createElement('button');
        allBtn.className = `category-tab-btn ${activeCategory === 'all' ? 'active' : ''}`;
        allBtn.innerHTML = `<span>🌟 Todos</span><span class="tab-badge-num">${allLoadedCommands.length}</span>`;
        allBtn.addEventListener('click', () => {
            activeCategory = 'all';
            document.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            renderCards();
        });
        tabsContainer.appendChild(allBtn);

        // Tabs por categoría
        categories.forEach(cat => {
            const count = counts[cat] || 0;
            if (count === 0) return;

            const btn = document.createElement('button');
            btn.className = `category-tab-btn ${activeCategory === cat ? 'active' : ''}`;
            const label = CATEGORY_LABELS[cat] || `📁 ${cat}`;
            btn.innerHTML = `<span>${label}</span><span class="tab-badge-num">${count}</span>`;
            btn.addEventListener('click', () => {
                activeCategory = cat;
                document.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderCards();
            });
            tabsContainer.appendChild(btn);
        });
    }

    async function loadCommandsLive() {
        try {
            const res = await fetch(`${API_BASE}/api/commands`);
            const data = await res.json();

            if (!data.ok || !data.commands) {
                cardsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">Error al cargar la lista de comandos.</p>`;
                return;
            }

            allLoadedCommands = data.commands;

            if (chipTotalCmds) {
                chipTotalCmds.textContent = `⚡ ${allLoadedCommands.length} Comandos Activos en Vivo`;
            }

            renderTabs(data.categories || []);
            renderCards();

        } catch (err) {
            console.error('[Comandos Error]', err);
            if (cardsGrid) {
                cardsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">No se pudo conectar con el bot para obtener los comandos.</p>`;
            }
        }
    }

    searchInput?.addEventListener('input', () => {
        renderCards();
    });

    loadCommandsLive();
});
