const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const crypto = require('crypto')

app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

function generateRandomHex(length) {
  return crypto.randomBytes(length / 2).toString('hex');
}

const users = []
const logs = {}

app.post('/api/users', (req, res) => {
  const user = req.body.username
  const id = generateRandomHex(24)
  users.push({username: user, _id: id})

  res.json({username: user, _id: id})
})

app.get('/api/users', (req, res) => {
  res.send(users)
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id
  const des = req.body.description
  const duration = req.body.duration
  let date = req.body.date

  if (!des || !duration) {
    console.log('No des or duration')
    return res.json({ error: 'Description and duration are required' });
  }

  if (!date) {
    date = new Date()
  }
  else {
    date = new Date(`${date}T00:00:00`)
  }

  if (isNaN(date.getTime())) {
    console.log('Invalid date')
    return res.json({ error: 'Invalid date' });
  }

  const exercises = {'description': String(des), 'duration': Number(duration), 'date': String(date.toDateString())}

  const user_obj = users.find(data => data._id === id)

  if (!user_obj) {
    return res.json({ error: 'User not found' });
  }

  if (!logs[id]) {
    logs[id] = []
  }

  logs[id].push({...exercises})
  
  const username = user_obj['username']
  const new_id = user_obj['_id']

  const obj = {'username': String(username), ...exercises, '_id': String(new_id)}
  
  return res.json(obj)
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  const user = users.find(data => data._id === id )
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit

  function isDateBetween(date, start, end) {
    const currentDate = new Date(`${date}`);
    return currentDate >= start && currentDate <= end;
  }

  const log_obj = logs[id]

  let log_length
  if (log_obj) {
    log_length = Number(log_obj.length)
  }
  else {
    res.json({...user, count: 0, log: []})
  }

  let filteredDates;
  if (from) {
    if (to) {
      filteredDates = log_obj.filter(date => isDateBetween(date.date, new Date(`${from}T00:00:00`), new Date(`${to}T00:00:00`)));
    }
    else {
      filteredDates = log_obj.filter(date => isDateBetween(date.date, new Date(`${from}T00:00:00`), new Date()));
    }

    log_length = Number(filteredDates.length)

    const limitedDates = filteredDates.slice(0, Number(limit))
    
    const log = {...user, from: new Date(`${from}T00:00:00`).toDateString(), to: new Date(`${to}T00:00:00`).toDateString(), count: log_length, log: limit ? limitedDates : filteredDates}

    return res.json(log)
  }

  if (limit && !from) {
    const limitedDates = log_obj.slice(0, Number(limit))

    const log = {...user, count: log_length, log: limitedDates}

    return res.json(log)
  }

  else {
    return res.json({...user, count: log_length, log: log_obj})
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
