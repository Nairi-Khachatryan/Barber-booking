require('dotenv').config();
const { MongoClient } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const CHANNEL_ID = process.env.CHANNEL_ID;

const buttonText = {
  watch: 'Посмотреть расписание',
  cancel: 'Отменить запись',
  settings: 'Настройки',
};

const listTimeButtons = {
  button_1: '12:00',
  button_2: '13:00',
  button_3: '14:00',
  button_4: '15:00',
  button_5: '16:00',
  button_6: '17:00',
};

const uri = process.env.MONGODB_URI; // Убедись, что MONGODB_URI определена в .env
const client = new MongoClient(uri); // Просто передаем URI без дополнительных параметров

async function saveAppointment(chatId, userName, selectedTime) {
  try {
    await client.connect();
    const database = client.db('telegram_bot');
    const appointments = database.collection('appointments');
    await appointments.insertOne({
      chatId,
      userName,
      selectedTime,
      timestamp: new Date(),
    });
    console.log(`Запись сохранена: ${userName} - ${selectedTime}`);
  } catch (error) {
    console.error('Ошибка при сохранении в MongoDB:', error);
  } finally {
    await client.close();
  }
}

bot.onText(/\/start/, (msg) => {
  console.log('Mongo Connect');

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

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userName =
    query.from.first_name || query.from.username || 'Неизвестный пользователь';
  const message =
    buttonText[query.data] ||
    listTimeButtons[query.data] ||
    'Неизвестная кнопка';

  if (query.data === 'watch') {
    const options = {
      reply_markup: {
        inline_keyboard: Object.keys(listTimeButtons).map((key) => [
          { text: listTimeButtons[key], callback_data: key },
        ]),
      },
    };
    return bot.sendMessage(chatId, 'Выберите время:', options);
  }

  if (listTimeButtons[query.data]) {
    await saveAppointment(chatId, userName, listTimeButtons[query.data]);
    bot.sendMessage(chatId, `Вы записались на ${listTimeButtons[query.data]}`);
  }

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
