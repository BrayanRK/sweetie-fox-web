const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();

// Pterodactyl usa SERVER_PORT o PORT asignado por el panel
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);

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
