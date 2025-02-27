require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const buttonText = {
  button_1: 'Кнопка 1 нажата',
  button_2: 'Кнопка 2 нажата',
  button_3: 'Кнопка 3 нажата',
};

const CHANNEL_ID = process.env.CHANNEL_ID || '@reserveManager';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: Object.keys(buttonText).map((key) => [
        { text: buttonText[key].replace(' нажата', ''), callback_data: key },
      ]),
    },
  };

  bot.sendMessage(chatId, 'Выберите кнопку:', options);
});

bot.on('callback_query', (query) => {
  const message = buttonText[query.data] || 'Неизвестная кнопка';

  bot
    .sendMessage(CHANNEL_ID, `Пользователь нажал: ${message}`)
    .then(() => console.log(`Уведомление отправлено: ${message}`))
    .catch((err) =>
      console.error('Ошибка при отправке сообщения в канал:', err.message)
    );

  bot.answerCallbackQuery(query.id, { text: 'Вы нажали кнопку!' });
});

console.log('Бот запущен...');
