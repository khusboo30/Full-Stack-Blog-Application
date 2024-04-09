import express from 'express';
import { db, connecttoDb } from './db.js';
import fs from 'fs';
import admin from 'firebase/admin';

const credentials = JSON.parse(
    fs.readFileSync('../credentials.json')
);
// Initialize Firebase Admin SDK with the credentials file
admin.intializeApp({
    credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json());

//Middleware for checking if user is authenticated (has a valid token)
app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        }
        catch (e) {
            res.sendStatus(400);
        }
    }    
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
    if (article) {
        const upvotesIds = article.upvoteIds || [];
        // Check if current user has already up votes
        const canUpvote = uid && !upvotesIds.includes(uid);
        if (canUpvote) {
            await db.collection('articles').updateOne({ name }, {
                $inc: { upvotes: 1 },  //increments the upvote count by 1 for the article with the same name. $inc is one of the mongodb operators.
            });
        }
    }

    if (article) {
        res.json(article);
    }
    else {
        res.send('The article doesn\'t exist');
    }
   
});

app.post('/api/articles/:name/comments',async (req, res) => {
    const { postedBy, text } = req.body;
    const { name } = req.params;

    await db.collection('articles').updateOne({ name }, {
        $push: {comments: { postedBy, text },}
    });

    const article = await db.collection('articles').findOne({ name });
    if (article) {
        
        res.json(article);
    }
    else {
        res.send('The article doesn\'t exist');
    }
});

connecttoDb(() => {
    console.log('Successfully connecte to DB');
    app.listen(8000, () => {
        console.log("Server is running on port 8000");
    });
});
