// album.js — Álbum 3D Holográfico de Cartas Sweetie Fox
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.CONFIG?.API_URL || 'https://mitsuri-bot.brayanrk.info';

    const urlParams = new URLSearchParams(window.location.search);
    const initialUser = urlParams.get('user') || urlParams.get('u') || '';

    // Elementos del DOM
    const userAvatar = document.getElementById('u-avatar');
    const userTitle = document.getElementById('u-title');
    const userDesc = document.getElementById('u-desc');
    const userStatsBadges = document.getElementById('u-stats-badges');
    const btnShare = document.getElementById('btn-share-collection');

    const searchPlayerInput = document.getElementById('search-player-input');
    const searchCardInput = document.getElementById('search-card-input');
    const filterPills = document.querySelectorAll('.filter-pill');
    const cardsGrid = document.getElementById('cards-grid');

    // Modal
    const modal = document.getElementById('card-inspect-modal');
    const inspectCloseBtn = document.getElementById('inspect-close-btn');
    const inspectImg = document.getElementById('inspect-img');
    const inspectBadge = document.getElementById('inspect-badge');
    const inspectQty = document.getElementById('inspect-qty');
    const inspectName = document.getElementById('inspect-name');
    const inspectAtk = document.getElementById('inspect-atk');
    const inspectDef = document.getElementById('inspect-def');
    const inspectHp = document.getElementById('inspect-hp');

    let allMasterCards = [];
    let currentCardsToDisplay = [];
    let currentUserData = null;
    let selectedRarity = 'ALL';

    if (initialUser && searchPlayerInput) {
        searchPlayerInput.value = initialUser;
    }

    // ─── RENDERIZAR GRID DE CARTAS ──────────────────────────────────────────
    function renderCards() {
        if (!cardsGrid) return;

        const cardQuery = (searchCardInput?.value || '').trim().toLowerCase();

        let filtered = currentCardsToDisplay.filter(card => {
            const matchesName = card.name.toLowerCase().includes(cardQuery);
            const matchesRarity = (selectedRarity === 'ALL') || (card.rarity?.toUpperCase() === selectedRarity);
            return matchesName && matchesRarity;
        });

        if (filtered.length === 0) {
            cardsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.3rem; margin-bottom: 8px;">🃏 No se encontraron cartas</p>
                    <p style="font-size: 0.85rem;">Prueba cambiando el filtro de rareza o el texto de búsqueda.</p>
                </div>
            `;
            return;
        }

        cardsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        filtered.forEach(card => {
            const wrap = document.createElement('div');
            const rarityClass = `rarity-${card.rarity || 'R'}`;
            wrap.className = `card-3d-wrap ${rarityClass}`;

            const badgeClass = `badge-${(card.rarity || 'r').toLowerCase()}`;
            const qtyText = (card.quantity !== undefined && card.quantity !== null) ? `x${card.quantity}` : '';

            wrap.innerHTML = `
                <div class="card-3d-inner">
                    <div class="card-holo-foil"></div>
                    <div class="card-image-box">
                        <span class="card-rarity-badge ${badgeClass}">${card.rarity || 'R'}</span>
                        ${qtyText ? `<span class="card-qty-badge">${qtyText}</span>` : ''}
                        <img src="${card.imageUrl}" alt="${card.name}" loading="lazy" onerror="this.src='/favicon-32.png'" />
                    </div>
                    <div class="card-meta-foot">
                        <div class="card-char-name" title="${card.name}">${card.name}</div>
                        <div class="card-stats-row">
                            <span class="stat-atk">⚔️ ${card.attack || 50}</span>
                            <span class="stat-def">🛡️ ${card.defense || 50}</span>
                            <span class="stat-hp">❤️ ${card.health || 50}</span>
                        </div>
                    </div>
                </div>
            `;

            // Efecto 3D Tilt con el cursor o touch
            setup3dCardTilt(wrap);

            // Modal al hacer click
            wrap.addEventListener('click', () => {
                openInspectModal(card);
            });

            fragment.appendChild(wrap);
        });

        cardsGrid.appendChild(fragment);
    }

    // ─── EFECTO HOLOGRÁFICO 3D TILT ─────────────────────────────────────────
    function setup3dCardTilt(cardEl) {
        const foil = cardEl.querySelector('.card-holo-foil');

        function handleMove(clientX, clientY) {
            const rect = cardEl.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;

            const rotX = -y * 22;
            const rotY = x * 22;

            cardEl.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.05, 1.05, 1.05)`;
            if (foil) {
                foil.style.backgroundPosition = `${50 + x * 120}% ${50 + y * 120}%`;
                foil.style.opacity = '0.9';
            }
        }

        cardEl.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });

        cardEl.addEventListener('mouseleave', () => {
            cardEl.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            if (foil) {
                foil.style.opacity = '0';
            }
        });

        // Touch para móviles
        cardEl.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        cardEl.addEventListener('touchend', () => {
            cardEl.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            if (foil) foil.style.opacity = '0';
        });
    }

    // ─── MODAL DE INSPECCIÓN ────────────────────────────────────────────────
    function openInspectModal(card) {
        if (!modal) return;
        inspectImg.src = card.imageUrl;
        inspectName.textContent = card.name;
        inspectBadge.textContent = card.rarity || 'R';
        inspectBadge.className = `card-rarity-badge badge-${(card.rarity || 'r').toLowerCase()}`;
        inspectQty.textContent = (card.quantity !== undefined && card.quantity !== null) ? `x${card.quantity} en inventario` : 'En catálogo';
        inspectAtk.textContent = card.attack || 50;
        inspectDef.textContent = card.defense || 50;
        inspectHp.textContent = card.health || 50;

        modal.style.display = 'flex';
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    inspectCloseBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ─── CARGAR DATOS DE UN JUGADOR ─────────────────────────────────────────
    async function loadUserCollection(username) {
        if (!username) {
            displayGlobalCatalog();
            return;
        }

        cardsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <p style="font-size: 1.2rem;">⚡ Cargando inventario de "${username}"...</p>
            </div>
        `;

        try {
            const res = await fetch(`${API_BASE}/api/gacha/user/${encodeURIComponent(username)}`);
            const data = await res.json();

            if (!data.ok || !data.usuario) {
                cardsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <p style="font-size: 1.3rem; margin-bottom: 6px;">😿 Jugador no encontrado</p>
                        <p style="font-size: 0.9rem;">El usuario "${username}" no existe o aún no ha jugado al Gacha.</p>
                        <button type="button" class="btn-share-collection" id="btn-back-catalog" style="margin-top: 16px;">
                            Ver Catálogo Completo
                        </button>
                    </div>
                `;
                document.getElementById('btn-back-catalog')?.addEventListener('click', () => {
                    if (searchPlayerInput) searchPlayerInput.value = '';
                    displayGlobalCatalog();
                });
                return;
            }

            currentUserData = data.usuario;
            currentCardsToDisplay = data.cards || [];

            // Actualizar Banner de Usuario
            if (userAvatar) userAvatar.textContent = (currentUserData.level >= 20) ? '👑' : '🦊';
            if (userTitle) {
                userTitle.innerHTML = `
                    ${currentUserData.name}
                    <span class="badge-pill-stat gold">Nivel ${currentUserData.level}</span>
                `;
            }
            if (userDesc) {
                userDesc.textContent = currentUserData.bio || '¡Coleccionista oficial de Sweetie Fox!';
            }
            if (userStatsBadges) {
                const totalCards = currentUserData.totalCartas || 0;
                const uniqueCards = currentUserData.cartasUnicas || 0;
                const pct = Math.round((uniqueCards / 248) * 100);

                userStatsBadges.innerHTML = `
                    <span class="badge-pill-stat ruby">🃏 ${totalCards} Cartas (${uniqueCards} Únicas)</span>
                    <span class="badge-pill-stat gold">🏆 ${pct}% Completado</span>
                    <span class="badge-pill-stat">💎 ${currentUserData.diamonds || 0} Diamantes</span>
                    <span class="badge-pill-stat">⚡ ${Number(currentUserData.xp || 0).toLocaleString()} XP</span>
                `;
            }

            renderCards();

            // Actualizar URL sin recargar
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('user', currentUserData.name);
            window.history.replaceState({}, '', newUrl);

        } catch (err) {
            console.error('[Gacha User Error]', err);
            cardsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">Error al consultar la colección del jugador.</p>`;
        }
    }

    // ─── MOSTRAR CATÁLOGO GLOBAL ────────────────────────────────────────────
    function displayGlobalCatalog() {
        currentUserData = null;
        currentCardsToDisplay = allMasterCards;

        if (userAvatar) userAvatar.textContent = '🃏';
        if (userTitle) {
            userTitle.innerHTML = `
                Catálogo Global de Cartas
                <span class="badge-pill-stat gold">Oficial</span>
            `;
        }
        if (userDesc) {
            userDesc.textContent = 'Explora las 248 cartas anime coleccionables del bot con efectos 3D.';
        }
        if (userStatsBadges) {
            userStatsBadges.innerHTML = `
                <span class="badge-pill-stat ruby">248 Cartas Disponibles</span>
                <span class="badge-pill-stat">3 Rarezas (SSR, SR, R)</span>
                <span class="badge-pill-stat gold">⚔️ Batallas RPG</span>
            `;
        }

        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('user');
        newUrl.searchParams.delete('u');
        window.history.replaceState({}, '', newUrl);

        renderCards();
    }

    // ─── CARGAR CATÁLOGO MAESTRO ────────────────────────────────────────────
    async function initCatalog() {
        try {
            const res = await fetch(`${API_BASE}/api/gacha/cards`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.cards)) {
                allMasterCards = data.cards;
            }

            if (initialUser) {
                loadUserCollection(initialUser);
            } else {
                displayGlobalCatalog();
            }
        } catch (err) {
            console.error('[Catalog Error]', err);
            cardsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #f87171;">Error al cargar las cartas desde el servidor.</p>`;
        }
    }

    // ─── FILTROS Y EVENTOS ──────────────────────────────────────────────────
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedRarity = pill.getAttribute('data-rarity') || 'ALL';
            renderCards();
        });
    });

    searchCardInput?.addEventListener('input', () => {
        renderCards();
    });

    let playerSearchTimeout;
    searchPlayerInput?.addEventListener('input', (e) => {
        clearTimeout(playerSearchTimeout);
        playerSearchTimeout = setTimeout(() => {
            const val = e.target.value.trim();
            if (val.length >= 2) {
                loadUserCollection(val);
            } else if (val.length === 0) {
                displayGlobalCatalog();
            }
        }, 600);
    });

    // Botón de Compartir Colección
    btnShare?.addEventListener('click', () => {
        const urlToShare = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(urlToShare).then(() => {
                alert('¡Enlace de tu álbum copiado al portapapeles! 📋 Comparte tu colección en WhatsApp.');
            }).catch(() => {
                prompt('Copia este enlace para compartir tu álbum:', urlToShare);
            });
        } else {
            prompt('Copia este enlace para compartir tu álbum:', urlToShare);
        }
    });

    // Iniciar
    initCatalog();
});
