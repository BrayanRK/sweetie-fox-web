const express = require('express');
const path = require('path');

const app = express();

// Pterodactyl usa SERVER_PORT o PORT asignado por el panel
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);

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
