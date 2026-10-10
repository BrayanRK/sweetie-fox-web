// app.js — Lógica de Sweetie Fox (Stats, Vinculación y Comandos Dinámicos)

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.CONFIG?.API_URL !== undefined) ? window.CONFIG.API_URL : '';

    // ──────────────────────────────────────────────────────────────────────────
    // 1. SELECTOR DE PAÍSES Y TELÉFONO
    // ──────────────────────────────────────────────────────────────────────────
    const countryBtn = document.getElementById('country-btn');
    const countryDropdown = document.getElementById('country-dropdown');
    const countrySearch = document.getElementById('country-search');
    const countryList = document.getElementById('country-list');
    const countryFlag = document.getElementById('country-flag');
    const countryName = document.getElementById('country-name');
    const countryDial = document.getElementById('country-dial');
    const phoneInput = document.getElementById('phone-number');

    let currentCountry = (window.PAISES && window.PAISES[0]) || { nombre: 'Colombia', dial: '57', bandera: '🇨🇴' };

    function renderCountries(filter = '') {
        if (!countryList || !window.PAISES) return;
        const q = filter.trim().toLowerCase();
        const filtered = window.PAISES.filter(p => p.nombre.toLowerCase().includes(q) || p.dial.includes(q));
        countryList.innerHTML = '';

        filtered.forEach(p => {
            const li = document.createElement('li');
            li.className = 'country-option';
            li.innerHTML = `
                <span>${p.bandera} ${p.nombre}</span>
                <span class="country-dial">+${p.dial}</span>
            `;
            li.addEventListener('click', () => {
                currentCountry = p;
                countryFlag.textContent = p.bandera;
                countryName.textContent = p.nombre;
                countryDial.textContent = `+${p.dial}`;
                countryDropdown.classList.remove('open');
                phoneInput.focus();
            });
            countryList.appendChild(li);
        });

        if (filtered.length === 0) {
            countryList.innerHTML = '<li class="country-option" style="color: #94a3b8; justify-content: center;">Sin resultados</li>';
        }
    }

    if (countryBtn && countryDropdown) {
        countryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            countryDropdown.classList.toggle('open');
            if (countryDropdown.classList.contains('open')) {
                countrySearch.value = '';
                renderCountries('');
                countrySearch.focus();
            }
        });

        countrySearch?.addEventListener('input', (e) => {
            renderCountries(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!countryDropdown.contains(e.target) && e.target !== countryBtn) {
                countryDropdown.classList.remove('open');
            }
        });
    }

    // Inicializar países
    renderCountries();

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ESTADÍSTICAS EN TIEMPO REAL (/api/stats)
    // ──────────────────────────────────────────────────────────────────────────
    async function loadStats() {
        try {
            const res = await fetch(`${API_BASE}/api/stats`);
            const data = await res.json();
            if (!data.ok) return;

            // Slots normales
            const normalUsed = data.slots?.normal?.used ?? data.subbotsFree ?? 0;
            const normalMax = data.slots?.normal?.max ?? 100;
            const freeSlotsLeft = Math.max(0, normalMax - normalUsed);

            const elCupos = document.getElementById('stat-cupos');
            if (elCupos) elCupos.textContent = `${freeSlotsLeft} libres`;

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
            if (elUsers) elUsers.textContent = data.totalUsuarios ? Number(data.totalUsuarios).toLocaleString() : '1,000+';

            // Uptime
            const elUptime = document.getElementById('stat-uptime');
            if (elUptime && data.uptimeSeconds) {
                const h = Math.floor(data.uptimeSeconds / 3600);
                const m = Math.floor((data.uptimeSeconds % 3600) / 60);
                elUptime.textContent = `${h}h ${m}m en línea`;
            }

            // RAM
            const elRam = document.getElementById('stat-ram');
            if (elRam && data.ramTotalMb) elRam.textContent = `${data.ramTotalMb} MB`;

        } catch (err) {
            console.warn('[Stats] No se pudo actualizar estadísticas:', err);
        }
    }

    loadStats();
    setInterval(loadStats, window.CONFIG?.STATS_REFRESH_MS || 30000);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. VINCULACIÓN DE SUBBOT (/api/subbot/solicitar + polling estado)
    // ──────────────────────────────────────────────────────────────────────────
    const formPairing = document.getElementById('form-pairing');
    const btnSubmit = document.getElementById('btn-submit');
    const alertMsg = document.getElementById('alert-msg');
    const pairingResult = document.getElementById('pairing-result');
    const codeValue = document.getElementById('code-value');
    const btnCopy = document.getElementById('btn-copy');
    const radarDot = document.getElementById('radar-dot');
    const radarText = document.getElementById('radar-text');

    let pollInterval = null;

    function showAlert(text, isError = true) {
        if (!alertMsg) return;
        alertMsg.textContent = text;
        alertMsg.className = 'alert-msg ' + (isError ? 'alert-error' : 'alert-success');
        alertMsg.style.display = 'block';
    }

    function clearAlert() {
        if (!alertMsg) return;
        alertMsg.style.display = 'none';
        alertMsg.textContent = '';
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    async function pollEstado(fullNumber) {
        try {
            const res = await fetch(`${API_BASE}/api/subbot/estado/${fullNumber}`);
            const data = await res.json();
            if (!data.ok) return;

            if (data.connected) {
                stopPolling();
                radarDot.classList.add('connected');
                radarText.textContent = `¡Subbot conectado exitosamente! 🎉 (${data.name || 'WhatsApp'})`;
                showAlert(`¡Felicidades! Tu Subbot (${data.name || fullNumber}) ya está en línea y funcionando.`, false);
                return;
            }

            if (data.connecting) {
                radarText.textContent = 'WhatsApp detectó el código... sincronizando sesión...';
            } else {
                radarText.textContent = 'Esperando que ingreses el código de 8 dígitos en WhatsApp...';
            }
        } catch (e) {
            // Silencioso para no romper la UX
        }
    }

    if (formPairing) {
        formPairing.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            stopPolling();
            radarDot.classList.remove('connected');

            const localRaw = (phoneInput.value || '').replace(/\D/g, '');
            if (!localRaw || localRaw.length < 6 || localRaw.length > 13) {
                showAlert('Por favor ingresa un número de teléfono válido.');
                return;
            }

            const fullNumber = `${currentCountry.dial}${localRaw}`;

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>Solicitando código a WhatsApp...</span>';

            try {
                const res = await fetch(`${API_BASE}/api/subbot/solicitar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ numero: fullNumber })
                });

                const data = await res.json();

                if (!data.ok) {
                    showAlert(data.message || 'No se pudo generar el código. Intenta de nuevo.');
                    return;
                }

                // Mostrar el código recibido
                codeValue.textContent = data.code || data.rawCode;
                pairingResult.classList.add('active');
                radarText.textContent = 'Esperando que ingreses el código en tu celular...';

                // Iniciar polling
                pollInterval = setInterval(() => pollEstado(fullNumber), window.CONFIG?.POLL_INTERVAL_MS || 3000);
                pollEstado(fullNumber);

                // Scroll suave a la tarjeta del código
                pairingResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } catch (err) {
                showAlert('Error al conectar con el servidor del bot. Verifica tu conexión.');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Generar Código de Vinculación</span>';
            }
        });
    }

    // Copiar código al portapapeles
    if (btnCopy) {
        btnCopy.addEventListener('click', async () => {
            const raw = codeValue.textContent.trim().replace(/-/g, '');
            if (!raw || raw.includes('-')) return;

            try {
                await navigator.clipboard.writeText(raw);
                btnCopy.innerHTML = `<span>¡Copiado! ✓</span>`;
                setTimeout(() => {
                    btnCopy.innerHTML = `<span>Copiar</span>`;
                }, 2000);
            } catch (err) {
                alert('Código: ' + raw);
            }
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. COMANDOS DINÁMICOS EN VIVO (/api/commands)
    // ──────────────────────────────────────────────────────────────────────────
    const commandsGrid = document.getElementById('commands-grid');
    const categoryPills = document.getElementById('category-pills');
    const searchInput = document.getElementById('search-commands');
    const totalCommandsEl = document.getElementById('total-commands-count');

    let allCommands = [];
    let selectedCategory = 'all';

    const CATEGORY_NAMES = {
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

    function renderCommandCards() {
        if (!commandsGrid) return;
        const q = (searchInput?.value || '').trim().toLowerCase();

        const filtered = allCommands.filter(cmd => {
            const matchesCat = (selectedCategory === 'all') || (cmd.category === selectedCategory);
            const matchesSearch = !q ||
                cmd.name.toLowerCase().includes(q) ||
                (cmd.description && cmd.description.toLowerCase().includes(q)) ||
                (cmd.aliases && cmd.aliases.some(a => a.toLowerCase().includes(q)));
            return matchesCat && matchesSearch;
        });

        commandsGrid.innerHTML = '';

        if (filtered.length === 0) {
            commandsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 1.2rem; margin-bottom: 8px;">😿 No se encontraron comandos</p>
                    <p style="font-size: 0.9rem;">Prueba con otra palabra o selecciona "Todos"</p>
                </div>
            `;
            return;
        }

        filtered.forEach(cmd => {
            const card = document.createElement('div');
            card.className = 'cmd-card';

            const aliasesText = (cmd.aliases && cmd.aliases.length > 0)
                ? `Alias: ${cmd.aliases.slice(0, 3).map(a => `!${a}`).join(', ')}`
                : 'Sin alias';

            let badgeHtml = '';
            if (cmd.isPremiumOnly) {
                badgeHtml = '<span class="cmd-badge badge-vip">VIP</span>';
            } else if (cmd.isOwnerOnly) {
                badgeHtml = '<span class="cmd-badge badge-owner">Owner</span>';
            } else if (cmd.isGroupOnly) {
                badgeHtml = '<span class="cmd-badge badge-group">Grupos</span>';
            }

            card.innerHTML = `
                <div>
                    <div class="cmd-top">
                        <span class="cmd-name">!${cmd.name}</span>
                        ${badgeHtml}
                    </div>
                    <p class="cmd-desc">${cmd.description || 'Comando disponible en Sweetie Fox.'}</p>
                </div>
                <div class="cmd-bottom">
                    <span class="cmd-aliases" title="${aliasesText}">${aliasesText}</span>
                    <button class="btn-copy" style="padding: 4px 10px; font-size: 0.75rem;" title="Copiar sintaxis">
                        <span>Copiar</span>
                    </button>
                </div>
            `;

            // Botón copiar sintaxis
            const btnCopyCmd = card.querySelector('.btn-copy');
            btnCopyCmd.addEventListener('click', async () => {
                await navigator.clipboard.writeText(`!${cmd.name}`);
                btnCopyCmd.innerHTML = `<span>✓</span>`;
                setTimeout(() => { btnCopyCmd.innerHTML = `<span>Copiar</span>`; }, 1500);
            });

            commandsGrid.appendChild(card);
        });
    }

    function renderCategoryPills(categories) {
        if (!categoryPills) return;
        categoryPills.innerHTML = '';

        const counts = { all: allCommands.length };
        allCommands.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });

        // Pill "Todos"
        const allPill = document.createElement('button');
        allPill.className = `cat-pill ${selectedCategory === 'all' ? 'active' : ''}`;
        allPill.innerHTML = `<span>🌟 Todos</span><span class="cat-count">${allCommands.length}</span>`;
        allPill.addEventListener('click', () => {
            selectedCategory = 'all';
            document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            allPill.classList.add('active');
            renderCommandCards();
        });
        categoryPills.appendChild(allPill);

        // Pills por cada categoría
        categories.forEach(cat => {
            const count = counts[cat] || 0;
            if (count === 0) return;

            const pill = document.createElement('button');
            pill.className = `cat-pill ${selectedCategory === cat ? 'active' : ''}`;
            const label = CATEGORY_NAMES[cat] || `📁 ${cat}`;
            pill.innerHTML = `<span>${label}</span><span class="cat-count">${count}</span>`;
            pill.addEventListener('click', () => {
                selectedCategory = cat;
                document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                renderCommandCards();
            });
            categoryPills.appendChild(pill);
        });
    }

    async function loadDynamicCommands() {
        if (!commandsGrid) return;
        try {
            commandsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: var(--text-muted);">
                    <p>⚡ Cargando comandos en vivo desde el servidor...</p>
                </div>
            `;

            const res = await fetch(`${API_BASE}/api/commands`);
            const data = await res.json();

            if (!data.ok || !data.commands) {
                commandsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">Error al cargar comandos del bot.</p>`;
                return;
            }

            allCommands = data.commands;

            if (totalCommandsEl) {
                totalCommandsEl.textContent = `${allCommands.length} comandos`;
            }

            renderCategoryPills(data.categories || []);
            renderCommandCards();

        } catch (err) {
            console.error('[Commands Error]', err);
            if (commandsGrid) {
                commandsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">No se pudo conectar con la API de comandos.</p>`;
            }
        }
    }

    searchInput?.addEventListener('input', () => {
        renderCommandCards();
    });

    loadDynamicCommands();
});
