require('dotenv').config();

const { MongoClient } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');

const uri = process.env.MONGODB_URI;
const CHANNEL_ID = process.env.CHANNEL_ID;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const client = new MongoClient(uri);

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

// Connect MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Подключение к MongoDB Atlas');
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  }
}

// Запись в MongoDB
async function saveAppointment(chatId, userName, selectedTime) {
  try {
    const database = client.db('telegram_bot');
    const appointments = database.collection('appointments');

    // Проверяем, есть ли уже запись на это время
    const existingAppointment = await appointments.findOne({ selectedTime });

    if (existingAppointment) {
      if (existingAppointment.chatId === chatId) {
        return bot.sendMessage(chatId, 'Вы уже записаны на это время!');
      } else {
        return bot.sendMessage(chatId, 'Это время уже занято!');
      }
    }

    // Если слот свободен, записываем пользователя
    await appointments.insertOne({
      chatId,
      userName,
      selectedTime,
      timestamp: new Date(),
    });

    console.log(`✅ Запись сохранена: ${userName} - ${selectedTime}`);
    return bot.sendMessage(chatId, `Вы записались на ${selectedTime}`);
  } catch (error) {
    console.error('❌ Ошибка при сохранении в MongoDB:', error);
  }
}

// Обработчик команды /start
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

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userName =
    query.from.first_name || query.from.username || 'Неизвестный пользователь';

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
    const selectedTime = listTimeButtons[query.data];

    // Проверяем, создалась ли запись
    const database = client.db('telegram_bot');
    const appointments = database.collection('appointments');
    const existingAppointment = await appointments.findOne({ selectedTime });

    if (existingAppointment) {
      if (existingAppointment.chatId === chatId) {
        return bot.sendMessage(chatId, 'Вы уже записаны на это время!');
      } else {
        return bot.sendMessage(chatId, 'Это время уже занято!');
      }
    }

    // Если слот свободен, записываем пользователя
    await appointments.insertOne({
      chatId,
      userName,
      selectedTime,
      timestamp: new Date(),
    });

    console.log(`✅ Запись сохранена: ${userName} - ${selectedTime}`);
    await bot.sendMessage(chatId, `Вы записались на ${selectedTime}`);

    // Теперь уведомляем барбера ТОЛЬКО если запись создана
    await bot.sendMessage(
      CHANNEL_ID,
      `Пользователь ${userName} записался на: ${selectedTime}`
    );
    console.log(`Уведомление отправлено: ${userName} - ${selectedTime}`);
  }

  bot.answerCallbackQuery(query.id, { text: 'Вы нажали кнопку!' });
});

connectDB().catch((err) => console.error(err));

console.log('Бот запущен...');
