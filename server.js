'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Post} = require('./models');

const app = express();
app.use(bodyParser.json());

//let users look at the entire database
app.get('/posts', (req,res) => {
  Post
    .find()
    // `exec` returns a promise
    .exec()
    // success callback: for each restaurant we got back, we'll
    // call the `.apiRepr` instance method we've created in
    // models.js in order to only expose the data we want the API return.
    .then(posts => {
      res.json({
        posts: posts.map(
          (post) => post.apiRepr())
      });
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      });

});

//let users get a post by id
app.get('/posts/:id', (req,res) => {
  console.log(req.params.id);
  Post
  .findById(req.params.id)
  .exec()
  .then(post => res.json({posts:post.apiRepr()}))
  .catch(
    err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//let users create a new post
app.post('/posts', (req,res) => {
  const requiredFields = ['title','author','content'];
  for (let i=0; i<requiredFields; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)) {
      const message = `Missing\`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Post.create({
    title: req.body.title,
    author: req.body.author,
    content: req.body.content,
  })
  .then(
    post => {
      console.log(post);
      res.status(201).json(post.apiRepr());
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });

});

app.put('/posts/:id', (req,res) => {
  if(!(req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and reques body id
      (${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'author', 'content'];

  updateableFields.forEach(field => {
    if( field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Post
   .findByIdAndUpdate(req.params.id, {$set: toUpdate})
   .exec()
   .then(post => res.status(204).end())
   .catch(err => res.status(500).json({message: 'Internal server error'}));
});
let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};
