// Two-way SMS Bot

const express = require('express')
const bodyParser = require('body-parser')
const twilio = require('twilio')

const app = express()
app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am SMS bot.')
})

//Twilio webhook
app.post('/sms/', function (req, res) {
    var botSays = 'You said: ' + req.body.Body;
    var twiml = new twilio.TwimlResponse();
    twiml.message(botSays);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
})