import { loadTelegramBotConfig } from "./config.ts";

function main(): void {
  try {
    loadTelegramBotConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown configuration error";
    console.error(`Telegram bot configuration error: ${message}`);
    process.exit(1);
  }

  // TODO: Telegram polling and message handling are implemented in later tasks (3.x).
}

main();
