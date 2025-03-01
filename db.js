const uri = process.env.MONGODB_URI;
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Подключение к MongoDB Atlas');
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  }
}

async function saveAppointment(chatId, userName, selectedTime, bot) {
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
    return true;
  } catch (error) {
    console.error('❌ Ошибка при сохранении в MongoDB:', error);
    return false;
  }
}

async function cancelAppointment(chatId, bot) {
  try {
    const database = client.db('telegram_bot');
    const appointments = database.collection('appointments');

    // Ищем запись пользователя
    const existingAppointment = await appointments.findOne({ chatId });

    if (!existingAppointment) {
      return bot.sendMessage(chatId, 'У вас нет записей для отмены.');
    }

    const deleted = await appointments.deleteOne({ chatId });

    if (deleted.deletedCount > 0) {
      console.log(
        `✅ Запись отменена: ${existingAppointment.userName} - ${existingAppointment.selectedTime}`
      );
      return bot.sendMessage(
        chatId,
        `Ваша запись на ${existingAppointment.selectedTime} была отменена.`
      );
    } else {
      return bot.sendMessage(chatId, 'Ошибка при удалении записи.');
    }
  } catch (error) {
    console.error('❌ Ошибка при удалении из MongoDB:', error);
    return bot.sendMessage(chatId, 'Произошла ошибка при отмене записи.');
  }
}

connectDB().catch((err) => console.error(err));

module.exports = { connectDB, saveAppointment, cancelAppointment };
