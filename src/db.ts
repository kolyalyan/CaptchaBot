import { MongoClient } from 'mongodb';

const mongoURL: string = 'mongodb://127.0.0.1:27017/';

interface DbOptions {
    socketTimeoutMS: number;
    keepAlive: boolean;
    useNewUrlParser: boolean;
    dbName?: string;
}
  
const mongoOptions: DbOptions = {
    socketTimeoutMS: 0,
    keepAlive: true,
    useNewUrlParser: true,
    dbName: 'CaptchaBot'
};
  
const initDB = async () => {
    let client: MongoClient = await MongoClient.connect(mongoURL, mongoOptions);
  
    return client.db('CaptchaBot');
};
  
export default initDB;