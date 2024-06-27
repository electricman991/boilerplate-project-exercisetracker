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

  if (!date) {
    date = new Date()
  }
  else {
    date = new Date(date)
  }

  const exercises = {'duration': duration, 'description': des, 'date': date.toDateString()}

  const user_obj = users.filter(data => data._id === id)

  if (!logs[id]) {
    logs[id] = []
  }

  logs[id].push({...exercises})
  
  res.json({...user_obj, ...exercises})
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  const user = users.filter(data => data._id === id )
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit

  function isDateBetween(date, start, end) {
    const currentDate = new Date(date);
    return currentDate >= start && currentDate <= end;
  }

  const log_obj = logs[id]
  let log_length = Number(log_obj.length)

  if (from && to) {
    const filteredDates = log_obj.filter(date => isDateBetween(date.date, new Date(from), new Date(to)));
    log_length = Number(filteredDates.length)
    
    const limitedDates = filteredDates.slice(0, Number(limit))

    const log = {...user, count: log_length, log: limit ? limitedDates : filteredDates}

    res.json(log)
  }

  else {
    res.json({...user, count: log_length, log: log_obj})
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
