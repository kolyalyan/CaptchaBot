import { MongoClient } from 'mongodb';
const mongoURL = 'mongodb://127.0.0.1:27017/';
const mongoOptions = {
    socketTimeoutMS: 0,
    keepAlive: true,
    useNewUrlParser: true,
    dbName: 'CaptchaBot'
};
const initDB = async () => {
    let client = await MongoClient.connect(mongoURL, mongoOptions);
    return client.db('CaptchaBot');
};
export default initDB;
