// vincular.js — Lógica de generación de código y polling para vincular.html
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.CONFIG?.API_URL || 'https://mitsuri-bot.brayanrk.info';

    // 1. Selector de País
    const countryTrigger = document.getElementById('country-trigger');
    const countryMenu = document.getElementById('country-menu');
    const countrySearch = document.getElementById('country-search-input');
    const countryList = document.getElementById('country-items-list');
    const flagDisplay = document.getElementById('flag-display');
    const countryDisplay = document.getElementById('country-display');
    const prefixDisplay = document.getElementById('prefix-display');
    const userPhone = document.getElementById('user-phone');

    let currentSelectedCountry = (window.PAISES && window.PAISES[0]) || { nombre: 'Colombia', dial: '57', bandera: '🇨🇴' };

    function renderCountries(query = '') {
        if (!countryList || !window.PAISES) return;
        const q = query.trim().toLowerCase();
        const matches = window.PAISES.filter(p => p.nombre.toLowerCase().includes(q) || p.dial.includes(q));
        countryList.innerHTML = '';

        matches.forEach(p => {
            const li = document.createElement('li');
            li.className = 'country-item';
            li.innerHTML = `
                <span>${p.bandera} ${p.nombre}</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--ruby-light);">+${p.dial}</span>
            `;
            li.addEventListener('click', () => {
                currentSelectedCountry = p;
                flagDisplay.textContent = p.bandera;
                countryDisplay.textContent = p.nombre;
                prefixDisplay.textContent = `+${p.dial}`;
                countryMenu.classList.remove('open');
                userPhone.focus();
            });
            countryList.appendChild(li);
        });

        if (matches.length === 0) {
            countryList.innerHTML = '<li class="country-item" style="color: #64748b; justify-content: center;">Sin resultados</li>';
        }
    }

    if (countryTrigger && countryMenu) {
        countryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            countryMenu.classList.toggle('open');
            if (countryMenu.classList.contains('open')) {
                countrySearch.value = '';
                renderCountries('');
                countrySearch.focus();
            }
        });

        countrySearch?.addEventListener('input', (e) => {
            renderCountries(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!countryMenu.contains(e.target) && e.target !== countryTrigger) {
                countryMenu.classList.remove('open');
            }
        });
    }

    renderCountries('');

    // 2. Formulario de Vinculación y Polling
    const formVincular = document.getElementById('form-vincular');
    const btnGenerate = document.getElementById('btn-generate');
    const uiAlert = document.getElementById('ui-alert');
    const codeResultPanel = document.getElementById('code-result-panel');
    const codeTextBig = document.getElementById('code-text-big');
    const btnCopyCode = document.getElementById('btn-copy-code');
    const radarPing = document.getElementById('radar-ping');
    const radarStatusText = document.getElementById('radar-status-text');

    let pollingTimer = null;

    function showAlert(msg, isError = true) {
        if (!uiAlert) return;
        uiAlert.textContent = msg;
        uiAlert.className = 'ui-alert ' + (isError ? 'error' : 'success');
        uiAlert.style.display = 'block';
    }

    function hideAlert() {
        if (!uiAlert) return;
        uiAlert.style.display = 'none';
        uiAlert.textContent = '';
    }

    function stopPolling() {
        if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
        }
    }

    async function checkSubbotStatus(targetNumber) {
        try {
            const res = await fetch(`${API_BASE}/api/subbot/estado/${targetNumber}`);
            const data = await res.json();
            if (!data.ok) return;

            if (data.connected) {
                stopPolling();
                radarPing.classList.add('connected');
                radarStatusText.textContent = `¡Subbot conectado exitosamente! (${data.name || 'WhatsApp'})`;
                showAlert(`¡Excelente! Tu WhatsApp (${data.name || targetNumber}) se ha vinculado como Subbot.`, false);
                return;
            }

            if (data.connecting) {
                radarStatusText.textContent = 'WhatsApp detectó el código... sincronizando sesión...';
            } else {
                radarStatusText.textContent = 'Esperando que ingreses el código de 8 dígitos en WhatsApp...';
            }
        } catch (e) {
            // Ignorar errores puntuales de red durante polling
        }
    }

    if (formVincular) {
        formVincular.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();
            stopPolling();
            radarPing.classList.remove('connected');

            const phoneRaw = (userPhone.value || '').replace(/\D/g, '');
            if (!phoneRaw || phoneRaw.length < 6 || phoneRaw.length > 13) {
                showAlert('Por favor ingresa un número de teléfono válido (sin incluir el prefijo).');
                return;
            }

            const fullPhoneNumber = `${currentSelectedCountry.dial}${phoneRaw}`;

            btnGenerate.disabled = true;
            btnGenerate.innerHTML = '<span>Solicitando código a WhatsApp...</span>';

            try {
                const res = await fetch(`${API_BASE}/api/subbot/solicitar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ numero: fullPhoneNumber })
                });

                const data = await res.json();

                if (!data.ok) {
                    showAlert(data.message || 'No se pudo generar el código en este momento.');
                    return;
                }

                // Mostrar el código recibido
                codeTextBig.textContent = data.code || data.rawCode;
                codeResultPanel.classList.add('active');
                radarStatusText.textContent = 'Esperando que ingreses el código en tu celular...';

                // Iniciar polling cada 3 segundos
                pollingTimer = setInterval(() => checkSubbotStatus(fullPhoneNumber), window.CONFIG?.POLL_INTERVAL_MS || 3000);
                checkSubbotStatus(fullPhoneNumber);

                // Scroll suave hacia el código generado
                codeResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } catch (err) {
                showAlert('Error de conexión con el bot. Por favor verifica tu red e intenta nuevamente.');
            } finally {
                btnGenerate.disabled = false;
                btnGenerate.innerHTML = '<span>Generar Código de 8 Dígitos</span>';
            }
        });
    }

    // Copiar código con feedback
    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', async () => {
            const raw = codeTextBig.textContent.trim().replace(/-/g, '');
            if (!raw || raw.includes('-')) return;

            try {
                await navigator.clipboard.writeText(raw);
                btnCopyCode.innerHTML = '<span>¡Copiado! ✓</span>';
                if (navigator.vibrate) navigator.vibrate(50);
                setTimeout(() => {
                    btnCopyCode.innerHTML = '<span>Copiar</span>';
                }, 2000);
            } catch (err) {
                alert('Código: ' + raw);
            }
        });
    }
});
