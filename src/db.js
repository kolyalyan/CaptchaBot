"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const mongoURL = "mongodb://127.0.0.1:27017/";
const mongoOptions = {
    socketTimeoutMS: 0,
    keepAlive: true,
    useNewUrlParser: true,
    dbName: 'CaptchaBot'
};
const initDB = async () => {
    let client = await mongodb_1.MongoClient.connect(mongoURL, mongoOptions);
    return client.db('CaptchaBot');
};
exports.default = initDB;
