# Sweetie Fox Web

Plataforma web modular para Sweetie Fox (WhatsApp Multi-Device):
- Dashboard editorial con telemetria en vivo.
- Vinculacion de subbots mediante codigo de 8 digitos.
- Catalogo filtrable de comandos en tiempo real.
- Salon de la Fama y clasificacion de Batallas de Grupos.
- Album interactivo de cartas coleccionables anime.

## Despliegue

```bash
npm install --production
npm start
```

Puerto configurable mediante variables de entorno:
- SERVER_PORT o PORT (por defecto: 3000)
- BOT_API_URL (por defecto: https://bot.brayanrk.com)
