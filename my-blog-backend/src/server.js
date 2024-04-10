import express from 'express';
import { db, connecttoDb } from './db.js';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import 'dotenv/config';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);
// Initialize Firebase Admin SDK with the credentials file
admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname,'../build/index.html'));
})
//Middleware for checking if user is authenticated (has a valid token)
app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        }
        catch (e) {
            return res.sendStatus(400);
        }
    } 
    req.user=req.user || {};
    next();
});

app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });
    if (article) {
        const upvotesIds = article.upvoteIds || [];
        // Check if current user has already up votes
        article.canUpvote = uid && !upvotesIds.includes(uid);
        res.json(article); 
    }
    else {
        res.sendStatus(404);
    }
});

/*app.post('/hello', (req, res) => {
    res.send(`Hello ${req.body.name}!`);
});

app.get('/hello/:name', (req, res) => {
    const { name } = req.params;
    res.send(`Hello ${name}!!`);
})*/

app.use((req, res, next) => {
    if (req.user) {
        next();
    }
    else {
        res.sendStatus(401);
    }
});

app.put('/api/articles/:name/upvote', async(req, res) => {
    const { name } = req.params;
    const article = await db.collection('articles').findOne({ name });
    const { uid } = req.user;
    if (article) {
        const upvotesIds = article.upvoteIds || [];
        // Check if current user has already up votes
        const canUpvote = uid && !upvotesIds.includes(uid);
        if (canUpvote) {
            await db.collection('articles').updateOne({ name }, {
                $inc: { upvotes: 1 },  //increments the upvote count by 1 for the article with the same name. $inc is one of the mongodb operators.
                $push: { 'upvoteIds': uid },
            });
        }
        const updatedArticle = await db.collection('articles').findOne({ name });
        res.json(updatedArticle);
    } else {
        res.send('The article doesn\'t exist');
    }
});

app.post('/api/articles/:name/comments',async (req, res) => {
    const { text } = req.body;
    const { name } = req.params;
    const { email } = req.user;

    await db.collection('articles').updateOne({ name }, {
        $push: {comments: { postedBy:email, text },}
    });

    const article = await db.collection('articles').findOne({ name });
    if (article) {
        
        res.json(article);
    }
    else {
        res.send('The article doesn\'t exist');
    }
});

const PORT = process.env.PORT || 8000;
connecttoDb(() => {
    console.log('Successfully connecte to DB');
    app.listen(PORT, () => {
        console.log('Server is running on port ' + PORT);
    });
});
