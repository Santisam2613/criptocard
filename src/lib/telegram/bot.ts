import { getEnv } from "@/lib/env";

export async function sendTelegramBotMessage(params: {
  telegramId: string;
  text: string;
}): Promise<void> {
  const env = getEnv();
  const token = env.telegramBotToken;
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

