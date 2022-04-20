const express = require('express');
const app = express();
const cors = require('cors');
const util = require("util");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");
const bp = require('body-parser');
const {isValidDate} = require('./utils');
require('dotenv').config();

const User = require('./User');
const Exercises = require('./Exercises');

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

const DB_SQL_PATH = path.join(__dirname,"mydb.sql");

const myDB = new sqlite3.Database('./my.db');
const SQL3 = {
    run(...args) {
      return new Promise(function c(resolve,reject){
        myDB.run(...args,function onResult(err){
          if (err) reject(err);
          else resolve(this);
        });
      });
    },
    get: util.promisify(myDB.get.bind(myDB)),
    all: util.promisify(myDB.all.bind(myDB)),
    exec: util.promisify(myDB.exec.bind(myDB)),
};

const initSQL = fs.readFileSync(DB_SQL_PATH,"utf-8");
(async () => await SQL3.exec(initSQL))();

const user = new User(SQL3);
const exercises = new Exercises(SQL3, user);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await user.getUsers();
    res.send(result);
  } catch (e) {console.error(e)}
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params && req.params['_id'];
  try {
    const currentUser = await user.getUser('_id', id);
    if (!currentUser) {
      res.status('400');
      res.send('Incorrect user id');
      return false;
    }
    if (req.query.FROM || req.query.TO || req.query.LIMIT) {
      const currentUserExercises = await exercises.getExercises(id, req.query.FROM, req.query.TO, req.query.LIMIT);
      currentUserExercises.forEach(ex => ex.date = new Date(ex.date).toDateString());
      currentUser.log = [...currentUserExercises];
      res.send(currentUser);
      return true;
    }
    const currentUserExercises = await exercises.getExercises(id);
    currentUserExercises.forEach(ex => ex.date = new Date(ex.date).toDateString());
    currentUser.count = currentUserExercises.length;
    currentUser.log = [...currentUserExercises];
    res.send(currentUser);
  } catch (e) {console.error(e)}
});

app.post('/api/users', async (req, res) => {
  try {
    if (req.body && req.body.username.length) {
      const result = await user.createUser(req.body.username);
      res.send(result);
    } else res.send('Incorrect user name');
  } catch (e) {
      res.status('400');
      res.send('Username is already taken');
      console.error(e);
  };
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.body && req.body[':_id'];
  if (id.length < 32) {
    res.status('400');
    res.send('Incorrect id');
    return false;
  }
  try {
    const currentUser = user.getUser('_id', id);
    if (req.body && req.body.date && !isValidDate(req.body.date)) {
      res.status('400');
      res.send('Invalid date format, validation pattern is yyyy-mm-dd');
      return false;
    }
    if (!currentUser || !req.body.description.trim().length || !req.body.duration.trim().length) {
      res.status('400');
      res.send('You have to fill all form fields');
    }
    const result = await exercises.createExercise(id, req.body.description, req.body.duration, req.body.date);
    res.send(result);
  } catch (e) {console.error(e)}
});

app.use((req, res) => {
  res.status(404).send("Route doesn't exist. Probably, there was some form data flaw before it was posted");
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
