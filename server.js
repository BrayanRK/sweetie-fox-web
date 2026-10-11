const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();

// Pterodactyl usa SERVER_PORT o PORT asignado por el panel
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SINCRONIZACIÓN GIT (Pterodactyl / Docker)
// ─────────────────────────────────────────────────────────────────────────────
try {
    // 1. Evitar error de ownership en Docker ("dubious ownership in repository")
    try { execSync('git config --global --add safe.directory /home/container', { stdio: 'ignore' }); } catch (_) {}
    try { execSync('git config --global --add safe.directory "*"', { stdio: 'ignore' }); } catch (_) {}

    // 2. Si no existe la carpeta .git en Pterodactyl, vincularla automáticamente
    if (!fs.existsSync(path.join(__dirname, '.git'))) {
        console.log('📦 [.git no encontrado en Pterodactyl] Conectando automáticamente con GitHub...');
        execSync('git init && git remote add origin https://github.com/BrayanRK/sweetie-fox-web.git && git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
        console.log('✅ Repositorio oficial vinculado con éxito.');
    } else {
        try {
            console.log('🔄 Sincronizando con GitHub al iniciar...');
            execSync('git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
            console.log('✅ Sincronizado con GitHub.');
        } catch (pullErr) {
            console.log('ℹ️ [Git Pull Note]:', pullErr.message);
        }
    }
} catch (e) {
    console.error('⚠️ [Git Sync Note]:', e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT: ACTUALIZAR EL SERVIDOR AL INSTANTE (Sin entrar al panel)
// ─────────────────────────────────────────────────────────────────────────────
app.get(['/api/actualizar', '/actualizar', '/update'], (req, res) => {
    try {
        console.log('🔄 Ejecutando actualización forzada desde GitHub...');
        try {
            execSync('git config --global --add safe.directory /home/container', { stdio: 'ignore' });
            execSync('git config --global --add safe.directory "*"', { stdio: 'ignore' });
        } catch (_) {}
        const out = execSync('git fetch origin main && git reset --hard origin/main', { encoding: 'utf-8' });

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Servidor Actualizado</title>
                <style>
                    body { background: #09080d; color: #fff; font-family: sans-serif; padding: 40px 20px; text-align: center; }
                    .box { background: #181224; border: 1px solid rgba(225,29,72,0.3); border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 30px; }
                    h1 { color: #fb7185; margin-bottom: 10px; font-size: 1.5rem; }
                    pre { background: #0e0a16; border: 1px solid rgba(255,255,255,0.08); padding: 15px; border-radius: 10px; text-align: left; color: #4ade80; font-size: 0.85rem; overflow-x: auto; }
                    a { display: inline-block; margin-top: 20px; color: #fff; background: #e11d48; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>🦊 Sweetie Fox Actualizado</h1>
                    <p>El servidor descargó la última versión de GitHub y se está reiniciando...</p>
                    <pre>${out}</pre>
                    <a href="/">← Volver al Inicio</a>
                </div>
            </body>
            </html>
        `);

        // Reiniciar el proceso para que Pterodactyl recargue con los nuevos archivos
        setTimeout(() => {
            process.exit(0);
        }, 1200);
    } catch (err) {
        res.status(500).send(`<h1>Error al actualizar</h1><pre>${err.message}</pre>`);
    }
});

// 1. SERVIR IMÁGENES DE CARTAS GACHA DIRECTAMENTE (Sin lag ni sobrecarga)
app.get(['/api/gacha/image/:id', '/assets/gacha/:id'], (req, res) => {
    const rawId = req.params.id || '';
    const cardId = rawId.replace(/\.jpg$/i, '').replace(/^gacha-/i, '').trim().toLowerCase();
    const localImg = path.join(__dirname, 'assets', 'gacha', `gacha-${cardId}.jpg`);

    if (fs.existsSync(localImg)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(localImg);
    }

    // Fallback: Si por alguna razón no está en disco local, solicitar al VPS
    const targetUrl = new URL(`https://brayanrk.info/api/gacha/image/${cardId}`);
    https.get(targetUrl, (proxyRes) => {
        if (proxyRes.statusCode === 200) {
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=86400'
            });
            proxyRes.pipe(res);
        } else {
            res.status(404).sendFile(path.join(__dirname, 'favicon-32.png'));
        }
    }).on('error', () => {
        res.status(404).sendFile(path.join(__dirname, 'favicon-32.png'));
    });
});

// 2. PROXY TRANSPARENTE PARA EL RESTO DE LA API DEL BOT
app.use('/api', (req, res) => {
    const targetUrl = new URL(`https://brayanrk.info/api${req.url}`);
    const headers = { ...req.headers, host: targetUrl.host };

    const proxyReq = https.request(targetUrl, {
        method: req.method,
        headers: headers
    }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Error en proxy /api:', err.message);
        res.status(502).json({ ok: false, message: 'No se pudo conectar con el backend del bot' });
    });

    req.pipe(proxyReq);
});

// Servir todos los archivos estáticos
app.use(express.static(__dirname));

// Rutas amigables limpias para móvil y navegador
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/vincular', '/vincular.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'vincular.html'));
});

app.get(['/comandos', '/comandos.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'comandos.html'));
});

app.get(['/ranking', '/ranking.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'ranking.html'));
});

app.get(['/album', '/album.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'album.html'));
});

// Fallback por defecto a index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦊 [Sweetie Fox Web] Servidor web iniciado exitosamente en http://0.0.0.0:${PORT}`);
});
