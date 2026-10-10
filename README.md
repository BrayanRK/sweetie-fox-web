# 🦊 Sweetie Fox Web — Dashboard & Vinculación de WhatsApp

Sitio web moderno, responsivo y de alto rendimiento para **Sweetie Fox (Mitsuri-TS)**. Diseñado con temática oscura neón luxury, conexión en vivo a la API del bot, generación de Pairing Code para WhatsApp y catálogo dinámico de más de 120 comandos en tiempo real.

---

## 🌟 Características

- ⚡ **Estadísticas en Tiempo Real:** Consume `/api/stats` del bot (cupos disponibles, subbots activos, slots VIP, usuarios y tiempo en línea).
- 📱 **Vinculación con Código de 8 Dígitos:** Consume `/api/subbot/solicitar` con selector interactivo de países y banderas.
- 🔄 **Detección Automática de Conexión:** Polling continuo a `/api/subbot/estado/:numero` que avisa en vivo cuando el usuario ya se conectó a WhatsApp.
- 📜 **Comandos 100% Dinámicos:** Consume `/api/commands`. Si agregas o borras un comando en el bot, la web se actualiza sola al instante.
- 🎨 **Estilo Sweetie Fox:** Glassmorphism oscuro, resplandores fucsia/púrpura neón, tipografía moderna y 100% responsivo para celulares y PC.
- 🚀 **Cero Dependencias (Zero-Build):** HTML5, CSS3 y Vanilla JavaScript puro. No requiere Node.js para compilarse en el hosting.

---

## 🚀 Cómo Desplegar en tu Servidor / Hosting

Puedes subir este proyecto a cualquier servicio en menos de 2 minutos:

### Opción 1: Vercel (Recomendado)
1. Sube esta carpeta a tu nuevo repositorio de GitHub (ej. `sweetie-fox-web`).
2. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
3. Haz clic en **"Add New" > "Project"** y selecciona tu repositorio `sweetie-fox-web`.
4. Deja la configuración por defecto y dale a **"Deploy"**.
5. ¡Listo! Vercel te dará tu enlace HTTPS gratis (ej. `sweetie-fox.vercel.app`).

### Opción 2: Netlify
1. Arrastra la carpeta `sweetie-fox-web` directamente a [app.netlify.com/drop](https://app.netlify.com/drop).
2. O conéctalo a tu repositorio de GitHub en Netlify.
3. Despliegue automático instantáneo.

### Opción 3: Cloudflare Pages / GitHub Pages
- Es un proyecto estático puro, por lo que funciona de inmediato en GitHub Pages o Cloudflare Pages sin ningún ajuste adicional.

---

## ⚙️ Configuración de la API

La URL base del bot está en `assets/js/config.js`:
```javascript
const CONFIG = {
    API_URL: 'https://mitsuri-bot.brayanrk.info', // Tu backend oficial
    BOT_NAME: 'Sweetie Fox',
    POLL_INTERVAL_MS: 3000,
    STATS_REFRESH_MS: 30000
};
```
Si en algún momento cambias de dominio o VPS tu bot, solo editas esa línea y toda la web apuntará al nuevo servidor.

---

Desarrollado para la comunidad de **Sweetie Fox & Mitsuri-TS**.
