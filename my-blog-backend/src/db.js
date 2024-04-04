import { MongoClient } from 'mongodb';

let db;
async function connecttoDb(cb) {
    const client = new MongoClient('mongodb://127.0.0.1:27017');  //27017 is the default port on mongodb
    await client.connect();
    db = client.db('react-blog-db');
    cb();
}

export {
    connecttoDb,
    db,
};