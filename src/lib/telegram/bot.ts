import { getServerCredentials } from "@/config/credentials";

export async function sendTelegramBotMessage(params: {
  telegramId: string;
  text: string;
}): Promise<void> {
  const creds = getServerCredentials();
  const token = creds.telegram.botToken;
  if (!token) throw new Error("Falta variable de entorno TELEGRAM_BOT_TOKEN");
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.telegramId,
      text: params.text,
      disable_web_page_preview: true,
    }),
  });
}
