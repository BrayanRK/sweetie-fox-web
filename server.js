const express = require('express');
const path = require('path');

const app = express();

// Pterodactyl usa SERVER_PORT o PORT asignado por el panel
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);

// Servir todos los archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(__dirname));

// Cualquier ruta que no sea un archivo estático devuelve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Importante: Escuchar en 0.0.0.0 para que Pterodactyl enrute el puerto hacia afuera
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 [Sweetie Fox Web] Servidor web iniciado exitosamente en http://0.0.0.0:${PORT}`);
});
