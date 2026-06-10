class TelegramBot {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
    };
    return text.replace(/[&<>]/g, m => map[m]);
  }
  /**
   * Универсальный метод отправки сообщения.
   * @param {object} params
   * @param {number|string} params.chatId - ID чата или @username
   * @param {string} params.text - Текст сообщения
   * @param {object} [params.button] - Опциональная кнопка-ссылка { text: string, url: string }
   * @param {string} [params.parseMode] - 'HTML' или 'MarkdownV2'
   * @param {boolean} [params.disableNotification] - Без звука
   * @returns {Promise<object>} Ответ API
   */
  async sendMessage({
    chatId = "94899148",
    text,
    button,
    parseMode = "HTML",
    disableNotification = false,
  }) {
    // 1. Извлекаем участки, которые не нужно экранировать
    const htmlBlocks = [];
    const preparedText = text.replace(/html(.*?)html/g, (_, content) => {
      htmlBlocks.push(content);
      return `%%HTML_${htmlBlocks.length - 1}%%`;
    });

    // 2. Экранируем основной текст
    const escapedText = this.escapeHtml(preparedText);

    // 3. Возвращаем HTML-блоки на место
    const finalText = escapedText.replace(/%%HTML_(\d+)%%/g, (_, index) => {
      return htmlBlocks[parseInt(index)];
    });
    // 4. Формируем payload
    const payload = {
      chat_id: chatId,
      text: finalText,
      parse_mode: parseMode,
      disable_notification: disableNotification,
    };

    // Если передана кнопка, создаём inline-клавиатуру с одной кнопкой
    if (button?.text && button?.url) {
      payload.reply_markup = {
        inline_keyboard: [[{ text: button.text, url: button.url }]],
      };
    }

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || "Telegram API error");
    }
    return data.result;
  }
}
// Экспортируем готовый экземпляр
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
export default bot;
