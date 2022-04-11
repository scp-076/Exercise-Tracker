const express = require('express');
const app = express();
const cors = require('cors');
const util = require("util");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");
const bp = require('body-parser');
require('dotenv').config();

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

function guidGenerator() {
    const S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
}

function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if(!dateString.match(regEx)) return false;  // Invalid format
    const d = new Date(dateString);
    const dNum = d.getTime();
    if(!dNum && dNum !== 0) return false; // NaN value, Invalid date
    return d.toISOString().slice(0,10) === dateString;
}

async function getUsers() {
  return await SQL3.all('SELECT username, _id from users');
}

async function getUser(prop, value) {
  return await SQL3.get(`SELECT username, _id FROM users WHERE ${prop}=?`, value);
}

async function createUser(username) {
  await SQL3.run('INSERT INTO users (username, _id) VALUES (?, ?);', username, guidGenerator());
  return await getUser('username', username);
}

async function createExercise(id, description, duration, date) {
  await SQL3.run('INSERT INTO exercises (_id, description, duration, date) VALUES (?, ?, ?, ?);', id, description, duration, date.length ? new Date(date).getTime() : new Date().getTime());
  const exercises = await getExercises(id);
  const user = await getUser('_id', id);
  user.exercises = [...exercises];
  return user;
}

async function getExercises(id, from, to, limit) {
  if (from || to || limit) {
    const fromparsed = from.length && new Date(from).getTime();
    const toparsed = to.length && new Date(to).getTime();
    return await SQL3.all(`SELECT description, duration, date FROM exercises WHERE _id=? AND date >= ? AND date <= ? LIMIT ?`, id, fromparsed, toparsed, limit);
  }
  return await SQL3.all('SELECT description, duration, date FROM exercises WHERE _id=?', id);
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await getUsers();
    res.send(result);
  } catch (e) {console.error(e)}
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.url.split('/')[3];
  try {
    const user = await getUser('_id', id);
    if (req.query.FROM || req.query.TO || req.query.LIMIT) {
      const exercises = await getExercises(id, req.query.FROM, req.query.TO, req.query.LIMIT);
      exercises.forEach(ex => ex.date = new Date(ex.date).toDateString());
      user.log = [...exercises];
      res.send(user);
      return true;
    }
    const exercises = await getExercises(id);
    exercises.forEach(ex => ex.date = new Date(ex.date).toDateString());
    user.count = exercises.length;
    user.log = [...exercises];
    res.send(user);
  } catch (e) {console.error(e)}
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await getUser('username', req.body.username);
    if (user) {
      res.send('User with this username already exists');
      return false;
    }
    if (req.body.username.length) {
      const result = await createUser(req.body.username);
      res.send(result);
    } else res.send('Incorrect user name');
  } catch (e) {console.error(e)};
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.url.split('/')[3];
  try {
    const user = getUser('_id', id);
    if (req.body.date && !isValidDate(req.body.date)) {
      res.send('Invalid date format, validation pattern is yyyy-mm-dd');
      return false;
    }
    if (!user || !req.body.description || !req.body.duration) {
      res.send('You have to fill all form fields');
    }
    const result = await createExercise(id, req.body.description, req.body.duration, req.body.date);
    res.send(result);
  } catch (e) {console.error(e)}
});

app.use((req, res) => {
  res.status(404).send("Route doesn't exist. Probably, there was some form data flaw before it was posted");
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
