
const { Collection, ButtonBuilder } = require("discord.js");
const { AtivarIntents } = require("./dist/FunctionsAll/PermissionAPI/StartIntents.js");
const loadSlashCommands = require("./dist/util/SlashHandler.js");
const loadEvents = require("./dist/util/EventsHandler.js");
const MainClient = require("./dist/util/client.js");
const deploy = require("./deploy.json");

global.urlAPI = deploy?.server === "simple"
  ? "apimanagersimples.squareweb.app"
  : "dev.promisse.app";

global.server = deploy?.server || "default";

// Patch: substitui IDs de emojis customizados de outros servidores por emoji Unicode genérico
// Evita o erro "Invalid Form Body - Invalid emoji" e "Non-premium buttons must have a label and/or an emoji"
const _originalSetEmoji = ButtonBuilder.prototype.setEmoji;
ButtonBuilder.prototype.setEmoji = function(emoji) {
  try {
    // ID numérico puro = emoji de outro servidor/aplicação → usa emoji Unicode seguro
    if (emoji && typeof emoji === 'string' && /^\d{15,20}$/.test(emoji)) {
      return _originalSetEmoji.call(this, '🔹');
    }
    // Número mas não em formato <:name:id> → também fallback
    if (emoji && typeof emoji === 'number') {
      return _originalSetEmoji.call(this, '🔹');
    }
    return _originalSetEmoji.call(this, emoji);
  } catch (e) {
    try { return _originalSetEmoji.call(this, '🔹'); } catch (_) { return this; }
  }
};

// Patch de segurança: aumenta limite de listeners para evitar warning
require('events').EventEmitter.defaultMaxListeners = 20;

async function startBot() {
  try {
    console.log(`\x1b[31m[Version BOT]\x1b[0m Versão atual do BOT: ${deploy.version || "Desconhecida"}`);

    await AtivarIntents();
    console.log("\x1b[32m[INFO]\x1b[0m Intents ativadas com sucesso!");

    const client = new MainClient();
    client.slashCommands = new Collection();

    await client.connect();
    loadSlashCommands.run(client);
    loadEvents.run(client);

  } catch (error) {
    console.error("Erro ao iniciar o bot:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (error) => {
  // Ignora erros de interação expirada (causados por comandos duplicados)
  if (error?.code === 10062) return;
  console.error("Unhandled Promise Rejection:", error);
});
process.on("uncaughtException", (error) => {
  if (error?.code === 10062) return;
  console.error("Uncaught Exception:", error);
});

startBot();
