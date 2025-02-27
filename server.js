require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const CHANNEL_ID = process.env.CHANNEL_ID;

const buttonText = {
  watch: 'Посмотреть расписание',
  cancel: 'Отменить запись',
  settings: 'Настройки',
};

// save button names into Objects

const listTimeButtons = {
  button_1: '12:00',
  button_2: '13:00',
  button_3: '14:00',
  button_4: '15:00',
  button_5: '16:00',
  button_6: '17:00',
};

// listener for start button
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: Object.keys(buttonText).map((key) => [
        { text: buttonText[key], callback_data: key },
      ]),
    },
  };

  bot.sendMessage(chatId, 'Выберите кнопку:', options);
});

// Общий обработчик callback_query
bot.on('callback_query', async (query) => {

  // console.log(query)
  //query big objects with more data

  const chatId = query.message.chat.id;
  const userName =
    query.from.first_name || query.from.username || 'Неизвестный пользователь';
  const message =
    buttonText[query.data] ||
    listTimeButtons[query.data] ||
    'Неизвестная кнопка';

  // Если нажали "Посмотреть расписание", показываем список времени
  if (query.data === 'watch') {
    const options = {
      reply_markup: {
        inline_keyboard: Object.keys(listTimeButtons).map((key) => [
          { text: listTimeButtons[key], callback_data: key }, // Исправил ошибку тут
        ]),
      },
    };

    return bot.sendMessage(chatId, 'Выберите время:', options);
  }

// send message to the Telegram Chanel
  try {
    await bot.sendMessage(
      CHANNEL_ID,
      `Пользователь ${userName} нажал: ${message}`
    );
    console.log(`Уведомление отправлено: ${userName} - ${message}`);
  } catch (error) {
    console.error('Ошибка при отправке сообщения в канал:', error.message);
  }

  bot.answerCallbackQuery(query.id, { text: 'Вы нажали кнопку!' });
});

console.log('Бот запущен...');
