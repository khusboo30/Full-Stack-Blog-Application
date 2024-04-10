import { MongoClient } from 'mongodb';

let db;
async function connecttoDb(cb) {
    //const client = new MongoClient('mongodb://127.0.0.1:27017');  //27017 is the default port on mongodb in the local

    const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster1.vcq0hiv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`);
    await client.connect();
    db = client.db('react-blog-db');
    cb();
}

export {
    connecttoDb,
    db,
};