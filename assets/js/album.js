// album.js — Álbum 3D Holográfico de Cartas Sweetie Fox
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.CONFIG?.API_URL !== undefined) ? window.CONFIG.API_URL : '';

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

    // ─── EFECTO HOLOGRÁFICO 3D TILT SUAVE Y ELEGANTE ─────────────────────────
    function setup3dCardTilt(cardEl) {
        const inner = cardEl.querySelector('.card-3d-inner');
        const foil = cardEl.querySelector('.card-holo-foil');
        if (!inner) return;

        let rect = null;
        let rafId = null;
        let targetRotX = 0;
        let targetRotY = 0;
        let currentRotX = 0;
        let currentRotY = 0;
        let isHovered = false;

        function animateTilt() {
            if (!isHovered && Math.abs(currentRotX) < 0.05 && Math.abs(currentRotY) < 0.05) {
                inner.style.transform = '';
                rafId = null;
                return;
            }

            // Interpolación suave y amortiguada (lerp factor 0.12)
            currentRotX += (targetRotX - currentRotX) * 0.12;
            currentRotY += (targetRotY - currentRotY) * 0.12;

            inner.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;

            rafId = requestAnimationFrame(animateTilt);
        }

        function handleMove(clientX, clientY) {
            if (!rect) rect = cardEl.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;

            // Inclinación controlada y elegante (aprox. ±7 grados máx)
            targetRotX = -y * 14;
            targetRotY = x * 14;

            if (foil) {
                foil.style.backgroundPosition = `${50 + x * 80}% ${50 + y * 80}%`;
                foil.style.opacity = '0.75';
            }

            if (!rafId) {
                rafId = requestAnimationFrame(animateTilt);
            }
        }

        cardEl.addEventListener('mouseenter', () => {
            rect = cardEl.getBoundingClientRect();
            isHovered = true;
            inner.style.transition = 'none'; // Evitar conflicto entre transition CSS y requestAnimationFrame
            if (!rafId) rafId = requestAnimationFrame(animateTilt);
        });

        cardEl.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });

        cardEl.addEventListener('mouseleave', () => {
            isHovered = false;
            targetRotX = 0;
            targetRotY = 0;
            rect = null;

            // Retorno suave a la posición neutra
            inner.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
            inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            if (foil) {
                foil.style.transition = 'opacity 0.3s ease';
                foil.style.opacity = '0';
            }
        });

        // Respuesta táctil para móviles (feedback suave sin bloquear ni distorsionar el scroll)
        cardEl.addEventListener('touchstart', () => {
            inner.style.transition = 'transform 0.15s ease-out';
            inner.style.transform = 'scale3d(0.98, 0.98, 0.98)';
        }, { passive: true });

        cardEl.addEventListener('touchend', () => {
            inner.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
            inner.style.transform = 'scale3d(1, 1, 1)';
            if (foil) foil.style.opacity = '0';
        }, { passive: true });

        cardEl.addEventListener('touchcancel', () => {
            inner.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
            inner.style.transform = 'scale3d(1, 1, 1)';
            if (foil) foil.style.opacity = '0';
        }, { passive: true });
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
                <p style="font-size: 1.2rem;">⚡ Consultando carnet oficial de "${username}"...</p>
            </div>
        `;

        try {
            const res = await fetch(`${API_BASE}/api/gacha/user/${encodeURIComponent(username)}`);
            const data = await res.json();

            if (!data.ok || !data.usuario) {
                cardsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <p style="font-size: 1.3rem; margin-bottom: 6px;">😿 Ciudadano no encontrado</p>
                        <p style="font-size: 0.9rem;">El usuario "${username}" no existe o aún no ha registrado cartas en el bot.</p>
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

            // 1. Número de Serie y Código de Barras determinístico
            let hashNum = 0;
            for (let i = 0; i < currentUserData.name.length; i++) {
                hashNum = ((hashNum << 5) - hashNum) + currentUserData.name.charCodeAt(i);
                hashNum |= 0;
            }
            const hexSerial = Math.abs(hashNum).toString(16).toUpperCase().padStart(4, '0');
            const cardSerialEl = document.getElementById('vip-card-serial');
            if (cardSerialEl) cardSerialEl.textContent = `SF-ID • 2026-${hexSerial}`;

            const barcodeEl = document.getElementById('vip-barcode-text');
            if (barcodeEl) barcodeEl.textContent = `SF-${Math.abs(hashNum).toString().slice(0, 6)}-${currentUserData.name.toUpperCase()}-VERIFIED`;

            // 2. Título de Tipo de Carnet
            const cardTypeEl = document.getElementById('vip-card-type-text');
            if (cardTypeEl) {
                cardTypeEl.textContent = currentUserData.isVip ? 'LICENCIA OFICIAL DE COLECCIONISTA VIP 👑' : 'DOCUMENTO DE IDENTIDAD • COLECCIONISTA';
            }

            // 3. Foto de Identificación WhatsApp con fallback
            const avatarImg = document.getElementById('u-avatar-img');
            const avatarIcon = document.getElementById('u-avatar-icon');
            if (avatarImg) {
                avatarImg.style.display = 'block';
                if (avatarIcon) avatarIcon.style.display = 'none';
                avatarImg.src = currentUserData.avatarUrl || `/api/avatar/${encodeURIComponent(currentUserData.name)}`;
                avatarImg.onerror = function() {
                    this.onerror = null;
                    this.src = '/assets/img/default-avatar.svg';
                };
            }

            // 4. Rango del Titular
            const rankBadge = document.getElementById('vip-rank-badge');
            if (rankBadge) {
                let rankTitle = '★ RANGO D • NOVATO';
                if (currentUserData.level >= 35) rankTitle = '★ RANGO SSS • LEYENDA';
                else if (currentUserData.level >= 25) rankTitle = '★ RANGO SS • MAESTRO';
                else if (currentUserData.level >= 15) rankTitle = '★ RANGO S • VETERANO';
                else if (currentUserData.level >= 5) rankTitle = '★ RANGO A • AVENTURERO';
                rankBadge.textContent = rankTitle;
            }

            // 5. Estado del Ciudadano
            const statusLabel = document.getElementById('vip-status-label');
            if (statusLabel) {
                statusLabel.textContent = currentUserData.isVip ? 'MIEMBRO VIP GOLD' : 'CIUDADANO ACTIVO';
            }

            // 6. Nombre del Titular
            if (userTitle) {
                userTitle.innerHTML = `
                    ${currentUserData.name}
                    <span class="vip-verified-badge" title="Titular Oficial Verificado">✓</span>
                `;
            }

            // 7. Nivel y Barra XP
            const levelTag = document.getElementById('u-level-tag');
            const xpText = document.getElementById('u-xp-text');
            const xpBar = document.getElementById('u-xp-bar');
            if (levelTag) levelTag.textContent = `NIVEL ${currentUserData.level}`;
            if (xpText) xpText.textContent = `${Number(currentUserData.xp || 0).toLocaleString()} XP`;
            if (xpBar) {
                const xpProgress = Math.min(100, Math.max(12, ((currentUserData.xp % 3000) / 3000) * 100));
                xpBar.style.width = `${Math.round(xpProgress)}%`;
            }

            // 8. Grid de Atributos
            const valDiamonds = document.getElementById('vip-val-diamonds');
            const valMoney = document.getElementById('vip-val-money');
            const valCards = document.getElementById('vip-val-cards');
            const valCompletion = document.getElementById('vip-val-completion');

            const totalCards = currentUserData.totalCartas || 0;
            const uniqueCards = currentUserData.cartasUnicas || 0;
            const pct = Math.round((uniqueCards / 248) * 100);

            if (valDiamonds) valDiamonds.textContent = Number(currentUserData.diamonds || 0).toLocaleString();
            if (valMoney) valMoney.textContent = `$${Number(currentUserData.dinero || 0).toLocaleString()}`;
            if (valCards) valCards.textContent = `${totalCards} (${uniqueCards} únicas)`;
            if (valCompletion) valCompletion.textContent = `${pct}% del Álbum`;

            // 9. Bio / Lema
            if (userDesc) {
                userDesc.textContent = currentUserData.bio ? `"${currentUserData.bio}"` : '"¡Coleccionista oficial de Sweetie Fox!"';
            }

            // 10. Tags Extras (Pareja, Género, Cumpleaños)
            const extraTagsEl = document.getElementById('vip-extra-tags');
            if (extraTagsEl) {
                extraTagsEl.innerHTML = '';
                if (currentUserData.marriedTo) {
                    extraTagsEl.innerHTML += `<span class="vip-pill-tag">💍 Casado(a) con ${currentUserData.marriedTo}</span>`;
                }
                if (currentUserData.gender) {
                    extraTagsEl.innerHTML += `<span class="vip-pill-tag">⚧️ ${currentUserData.gender}</span>`;
                }
                if (currentUserData.birthDate) {
                    extraTagsEl.innerHTML += `<span class="vip-pill-tag">🎂 ${currentUserData.birthDate}</span>`;
                }
                if (currentUserData.isRegistered) {
                    extraTagsEl.innerHTML += `<span class="vip-pill-tag" style="color: #4ade80;">📋 Registrado</span>`;
                }
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

        const cardSerialEl = document.getElementById('vip-card-serial');
        if (cardSerialEl) cardSerialEl.textContent = 'SF-ID • ARCHIVO-MAESTRO';

        const barcodeEl = document.getElementById('vip-barcode-text');
        if (barcodeEl) barcodeEl.textContent = 'SF-2026-SECURE-DATABASE-VERIFIED';

        const cardTypeEl = document.getElementById('vip-card-type-text');
        if (cardTypeEl) cardTypeEl.textContent = 'LICENCIA OFICIAL • CATÁLOGO GENERAL';

        const avatarImg = document.getElementById('u-avatar-img');
        const avatarIcon = document.getElementById('u-avatar-icon');
        if (avatarImg) {
            avatarImg.style.display = 'none';
        }
        if (avatarIcon) {
            avatarIcon.style.display = 'flex';
            avatarIcon.textContent = '🦊';
        }

        const rankBadge = document.getElementById('vip-rank-badge');
        if (rankBadge) rankBadge.textContent = '★ SISTEMA CENTRAL';

        const statusLabel = document.getElementById('vip-status-label');
        if (statusLabel) statusLabel.textContent = 'BASE DE DATOS ACTIVA';

        if (userTitle) {
            userTitle.innerHTML = `
                Catálogo Global de Cartas
                <span class="vip-verified-badge" title="Verificado">✓</span>
            `;
        }

        const levelTag = document.getElementById('u-level-tag');
        const xpText = document.getElementById('u-xp-text');
        const xpBar = document.getElementById('u-xp-bar');
        if (levelTag) levelTag.textContent = 'ARCHIVO MAESTRO';
        if (xpText) xpText.textContent = '248 Cartas 3D';
        if (xpBar) xpBar.style.width = '100%';

        const valDiamonds = document.getElementById('vip-val-diamonds');
        const valMoney = document.getElementById('vip-val-money');
        const valCards = document.getElementById('vip-val-cards');
        const valCompletion = document.getElementById('vip-val-completion');
        if (valDiamonds) valDiamonds.textContent = 'Diamantes';
        if (valMoney) valMoney.textContent = 'Monedas';
        if (valCards) valCards.textContent = '248 Cartas';
        if (valCompletion) valCompletion.textContent = 'SSR • SR • R';

        if (userDesc) {
            userDesc.textContent = 'Explora la colección 3D holográfica de Sweetie Fox. Busca un jugador arriba para ver su documento oficial.';
        }

        const extraTagsEl = document.getElementById('vip-extra-tags');
        if (extraTagsEl) {
            extraTagsEl.innerHTML = `
                <span class="vip-pill-tag">🌟 SSR</span>
                <span class="vip-pill-tag">✨ SR</span>
                <span class="vip-pill-tag">🔷 R</span>
                <span class="vip-pill-tag" style="color: var(--gold-vip);">⚔️ Batallas RPG</span>
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
