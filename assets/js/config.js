// Configuración global de la Web Sweetie Fox
const CONFIG = {
    // Al usar '', las llamadas a /api/* van directamente al servidor web (api.brayanrk.info)
    // el cual se encarga de comunicarse fluidamente con el VPS sin problemas de CORS ni SSL.
    API_URL: '',
    BOT_NAME: 'Sweetie Fox',
    WHATSAPP_GROUP: 'https://chat.whatsapp.com/HfK6bI56z48AvLPr8aRlZx?s=cl&p=a&mlu=4&ilr=4',
    WHATSAPP_CHANNEL: 'https://whatsapp.com/channel/0029VbDLXzm9MF8zqYNZc03Y',
    POLL_INTERVAL_MS: 3000,
    STATS_REFRESH_MS: 20000
};

window.CONFIG = CONFIG;
