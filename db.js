// const { MongoClient } = require('mongodb');
// const uri =
//   'mongodb+srv://nairikhachatryan357:ld3DkaV4zSFITqUp@cluster0.kdmcg.mongodb.net/';
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log('✅ Успешно подключено к MongoDB Atlas');
    
//     const database = client.db('telegram_bot'); // Заменил на реальное имя
//     const collection = database.collection('appointments'); // Заменил на реальное имя

//     // Выведем все записи, чтобы убедиться, что данные есть
//     const users = await collection.find().toArray();
//     console.log('🗂 Содержимое коллекции:', users);
//   } catch (error) {
//     console.error('❌ Ошибка подключения:', error);
//   } finally {
//     await client.close();
//   }
// }

// run().catch(console.dir);
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI; // Убедись, что у тебя в .env есть MONGO_URI
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('✅ Успешно подключено к MongoDB Atlas');

    const database = client.db('telegram_bot'); // Имя базы
    const collection = database.collection('appointments'); // Имя коллекции

    const users = await collection.find().toArray(); // Получаем всех пользователей
    console.log('🗂 Содержимое коллекции:', users);
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  } finally {
    await client.close();
  }
}

// run().catch(console.dir);
export default run