import express from 'express';
import { db, connecttoDb } from './db.js';

const app = express();
app.use(express.json());

app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const article = await db.collection('articles').findOne({ name });
    if (article) {
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

app.put('/api/articles/:name/upvote', async(req, res) => {
    const { name } = req.params;
    await db.collection('articles').updateOne({ name }, {
        $inc: { upvotes: 1 },  //increments the upvote count by 1 for the article with the same name. $inc is one of the mongodb operators.
    });
    const article = await db.collection('articles').findOne({ name });

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
        
        res.send(article.comments);
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
