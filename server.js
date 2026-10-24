const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();

const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
const BOT_API_URL = (process.env.BOT_API_URL || 'https://bot.brayanrk.com').replace(/\/+$/, '');

function gitCmd(cmd) {
    try {
        return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    } catch (_) {
        return null;
    }
}

// Auto-sincronizacion Git al iniciar el servidor (Pterodactyl / Docker)
try {
    gitCmd('git config --global --add safe.directory /home/container');
    gitCmd('git config --global --add safe.directory "*"');

    const REPO = 'https://github.com/BrayanRK/sweetie-fox-web.git';

    if (!fs.existsSync(path.join(__dirname, '.git'))) {
        console.log('[Git] Conectando con GitHub...');
        gitCmd('git init');
        gitCmd(`git remote add origin ${REPO}`);
        gitCmd('git fetch origin main');
        gitCmd('git reset --hard origin/main');
        console.log('[Git] Repositorio vinculado.');
    } else {
        console.log('[Git] Sincronizando con GitHub al iniciar...');
        gitCmd('git fetch origin main');
        gitCmd('git reset --hard origin/main');
        console.log('[Git] Repositorio sincronizado.');
    }
} catch (e) {
    console.error('[Git Sync Note]:', e.message);
}

// Endpoint de actualizacion remota bajo demanda
app.get(['/api/actualizar', '/actualizar', '/update'], (req, res) => {
    try {
        console.log('[Git] Ejecutando actualizacion desde origin/main...');
        gitCmd('git config --global --add safe.directory /home/container');
        gitCmd('git config --global --add safe.directory "*"');
        gitCmd('git fetch origin main');
        const out = gitCmd('git reset --hard origin/main') || 'Actualizado correctamente.';

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
                <title>Servidor Actualizado</title>
                <style>
                    body { background: #1C1917; color: #FAF3E8; font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; padding: 40px 20px; text-align: center; }
                    .box { background: #24201D; border: 1px solid #3A342F; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px 24px; text-align: left; }
                    h1 { color: #FAF3E8; font-size: 1.25rem; font-weight: 600; margin: 0 0 12px 0; }
                    p { color: #A89F95; font-size: 0.9375rem; line-height: 1.5; margin: 0 0 20px 0; }
                    pre { background: #1C1917; border: 1px solid #3A342F; padding: 14px; border-radius: 6px; color: #E8742A; font-family: monospace; font-size: 0.8125rem; overflow-x: auto; }
                    a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 24px; color: #FFFFFF; background: #E8742A; text-decoration: none; padding: 0 20px; border-radius: 8px; font-weight: 500; font-size: 0.875rem; }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>Sweetie Fox Actualizado</h1>
                    <p>El servidor descargo la version mas reciente y se reiniciara de inmediato.</p>
                    <pre>${out}</pre>
                    <a href="/">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);

        setTimeout(() => {
            process.exit(0);
        }, 1200);
    } catch (err) {
        res.status(500).send(`<h1>Error al actualizar</h1><pre>${err.message}</pre>`);
    }
});

// ─── SEGURIDAD: RATE LIMITING & ANTI-SCRAPING ───────────────────
const imageRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 120; // Maximo 120 imagenes/min por IP

// Limpieza periodica de memoria cada 2 minutos
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of imageRateLimitMap.entries()) {
        if (now > data.resetTime) {
            imageRateLimitMap.delete(ip);
        }
    }
}, 2 * 60 * 1000).unref();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
}

function checkRateLimit(req) {
    const ip = getClientIp(req);
    if (ip === '127.0.0.1' || ip === '::1') return true;
    const now = Date.now();
    let entry = imageRateLimitMap.get(ip);
    if (!entry || now > entry.resetTime) {
        entry = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
        imageRateLimitMap.set(ip, entry);
        return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

function isAllowedReferer(req) {
    const referer = (req.headers['referer'] || req.headers['referrer'] || '').toLowerCase();
    const origin = (req.headers['origin'] || '').toLowerCase();
    const secFetchSite = (req.headers['sec-fetch-site'] || '').toLowerCase();

    // Bloquear si el navegador indica solicitud cruzada no autorizada
    if (secFetchSite === 'cross-site') {
        return false;
    }

    const allowedDomains = [
        'fox.brayanrk.com',
        'bot.brayanrk.com',
        'brayanrk.com',
        'localhost',
        '127.0.0.1'
    ];

    if (referer) {
        try {
            const refHost = new URL(referer).hostname.toLowerCase();
            const allowed = allowedDomains.some(d => refHost === d || refHost.endsWith('.' + d));
            if (!allowed) return false;
        } catch (_) {
            return false;
        }
    }

    if (origin) {
        try {
            const origHost = new URL(origin).hostname.toLowerCase();
            const allowed = allowedDomains.some(d => origHost === d || origHost.endsWith('.' + d));
            if (!allowed) return false;
        } catch (_) {
            return false;
        }
    }

    return true;
}

// Servir imagenes gacha locales o fallback a VPS con seguridad por capas
app.get(['/api/gacha/image/:id', '/assets/gacha/:id'], (req, res) => {
    // 1. Anti-Hotlinking
    if (!isAllowedReferer(req)) {
        return res.status(403).json({
            ok: false,
            error: 'Forbidden',
            message: 'Hotlinking no permitido. Imagen protegida por Sweetie Fox.'
        });
    }

    // 2. Anti-Scraping / Rate Limit
    if (!checkRateLimit(req)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
            ok: false,
            error: 'Too Many Requests',
            message: 'Descarga masiva detectada. Acceso temporalmente restringido.'
        });
    }

    const rawId = req.params.id || '';
    const cardId = rawId.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/^gacha-/i, '').trim().toLowerCase();
    
    const candidates = [
        `gacha-${cardId}.png`,
        `gacha-${cardId}.jpg`,
        `gacha-${cardId}.jpeg`,
        `gacha-${cardId}.webp`,
        `${cardId}.png`,
        `${cardId}.jpg`,
        `${cardId}.jpeg`,
        `${cardId}.webp`
    ];

    for (const name of candidates) {
        const localImg = path.join(__dirname, 'assets', 'gacha', name);
        if (fs.existsSync(localImg)) {
            const ext = path.extname(name).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
            return res.sendFile(localImg);
        }
    }

    try {
        const targetUrl = new URL(`${BOT_API_URL}/api/gacha/image/${cardId}`);
        const client = targetUrl.protocol === 'https:' ? https : http;
        client.get(targetUrl, (proxyRes) => {
            if (proxyRes.statusCode === 200) {
                res.writeHead(200, {
                    'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400',
                    'X-Content-Type-Options': 'nosniff',
                    'Cross-Origin-Resource-Policy': 'same-origin'
                });
                proxyRes.pipe(res);
            } else {
                res.status(404).end();
            }
        }).on('error', () => {
            res.status(404).end();
        });
    } catch (_) {
        res.status(404).end();
    }
});

// Proxy transparente para endpoints API
app.use('/api', (req, res) => {
    try {
        const targetUrl = new URL(`${BOT_API_URL}/api${req.url}`);
        const client = targetUrl.protocol === 'https:' ? https : http;
        const headers = { ...req.headers, host: targetUrl.host };

        const proxyReq = client.request(targetUrl, {
            method: req.method,
            headers: headers,
            timeout: 15000
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('timeout', () => {
            proxyReq.destroy(new Error('Timeout de conexion con backend'));
        });

        proxyReq.on('error', (err) => {
            console.error('[Proxy Error]:', err.message);
            if (!res.headersSent) {
                res.status(502).json({ ok: false, message: 'No se pudo conectar con el backend del bot' });
            }
        });

        req.pipe(proxyReq);
    } catch (err) {
        console.error('[Proxy URL Error]:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, message: 'URL de API invalida' });
        }
    }
});

// Servir archivos estaticos
app.use(express.static(__dirname));

// Rutas amigables limpias
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/comandos', '/comandos.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'comandos.html'));
});

app.get(['/vincular', '/vincular.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'vincular.html'));
});

app.get(['/ranking', '/ranking.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'ranking.html'));
});

app.get(['/actividad', '/actividad.html', '/logs', '/logs.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'actividad.html'));
});

app.get(['/cartas', '/cartas.html', '/album', '/album.html'], (req, res) => {
    const targetFile = fs.existsSync(path.join(__dirname, 'cartas.html')) ? 'cartas.html' : 'album.html';
    res.sendFile(path.join(__dirname, targetFile));
});

// Fallback a index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sweetie Fox Web] Servidor web iniciado en http://0.0.0.0:${PORT}`);
    console.log(`[Sweetie Fox Web] Backend proxy conectado a: ${BOT_API_URL}`);
});
