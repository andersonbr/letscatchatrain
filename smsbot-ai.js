// API.AI

// express
const express = require('express')
const bodyParser = require('body-parser')

// twilio
const twilio = require('twilio')

// biblioteca API.AI
const apiai = require('apiai')('f05b946260934e3f980b9f00dfd82939')


// transport api
const transportapi = {
	appid: "81b79adc",
	key: "336b598890a04c0f60515cea116a2781"
}

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
	// enviar para o bot
	var sessionId = req.body.Body;
	var userUtterance = req.body.Body;

	// API.AI
	var requestAPIAI = apiai.textRequest(userUtterance, { sessionId: sessionId })
	var botSays = ''
	requestAPIAI.on('response', function(response) {
		console.log(response)
		if (response.result.actionIncomplete) {
			botSays = reponse.result.fulfillment.speech
			console.log(`Botsays: ${botSays}`)

			//var twiml = new twilio.TwimlResponse(); // funcao mudada
			var twiml = new twilio.twiml.MessagingResponse();
			console.log(twiml)
			twiml.message(botSays);
			res.writeHead(200, {'Content-Type': 'text/xml'});
			res.end(twiml.toString());
		} else {
			getTrainInfo(
				response.result.metadata.intentName, // diferente do livro
				response.result.parameters, res
			)
		}
	})
	requestAPIAI.on('error', function(error) {
		console.log(error)
	})
	requestAPIAI.end();
})


function getTrainInfo(intent, parameters, res) {
	if (intent == 'request_live_departures') {
		return getLiveDepartures(parameters.Station, res); 
	} else if (intent == 'request_next_train') {
		return getNextTrain (
			parameters.fromStation, 
			parameters.toStation,
			res
		);
	} else {
		var botSays = 'Working on it...';
		console.log('BotSays: ' + botSays);
		var twiml = new twilio.twiml.MessagingResponse();
		twiml.message(botSays);
		res.writeHead(200, {'Content-Type': 'text/xml'});
		res.end(twiml.toString());
	}
}

function getLiveDepartures(source, res){

	var request = require('request');
	var url = 'http://transportapi.com/v3/uk/train/station/' + source +
				'/live.json?app_id=' +
				transportapi.appid + '&app_key=' + transportapi.key;

	request(url, function (error, response, body) {
	   if (response){
			var json = JSON.parse(body);
			if (json.departures){

				var botSays = summarize(json.departures.all, 5);
				console.log('BotSays: ' + botSays);

				var twiml = new twilio.twiml.MessagingResponse();
				twiml.message(botSays);
				res.writeHead(200, {'Content-Type': 'text/xml'});
				res.end(twiml.toString());

			} else {
				var botSays = 'No Departures found!'
				console.log('BotSays: ' + botSays);

				var twiml = new twilio.twiml.MessagingResponse();
				twiml.message(botSays);
				res.writeHead(200, {'Content-Type': 'text/xml'});
				res.end(twiml.toString());
			} 
		} else {
			console.log('error:', error); // Print the error if one  
										   // occurred 

			var botSays = 'Error in fetching trains info. Sorry!';
			console.log('BotSays: ' + botSays);

			var twiml = new twilio.twiml.MessagingResponse();
			twiml.message(botSays);
			res.writeHead(200, {'Content-Type': 'text/xml'});
			res.end(twiml.toString());
		}
	});
}


function summarize(departures, n) {
	var out = '';
	if (departures.length > 0) {
		out = 'Live departures:\n';
		for (var i=0; i < n; i++) {
			var service = departures[i];
			var serviceSummary = service.operator_name + ":" + 
			service.destination_name + "@" +  
			service.expected_departure_time; 
			out += serviceSummary + "\n";
		}
	} else {
		out = 'There are no trains from ' + source;
	}
	return out;
}

function getNextTrain(source, destination, res){
	
	var request = require('request');
	var url = 'http://transportapi.com/v3/uk/train/station/' + 
			   source + '/live.json?app_id=' +
			   transportapi.appid + '&app_key=' + transportapi.key;

	request(url, function (error, response, body) {
	   if (response){
			var json = JSON.parse(body);
			if (json.departures){
				var botSays = getNextTrainToDestination(
									  destination,  
							  json.departures.all);
				console.log('BotSays: ' + botSays);

				var twiml = new twilio.twiml.MessagingResponse();
				twiml.message(botSays);
				res.writeHead(200, {'Content-Type': 'text/xml'});
				res.end(twiml.toString());
				
			} else {
				var botSays = 'No Departures found!'
				console.log('BotSays: ' + botSays);

				var twiml = new twilio.twiml.MessagingResponse();
				twiml.message(botSays);
				res.writeHead(200, {'Content-Type': 'text/xml'});
				res.end(twiml.toString());
			} 
		} else {
			console.log('error:', error); 
			// Print the error if one				   
			// occurred 

			var botSays = 'Error in fetching trains info. ' 
						   + 'Sorry!';
			console.log('BotSays: ' + botSays);

			var twiml = new twilio.twiml.MessagingResponse();
			twiml.message(botSays);
			res.writeHead(200, {'Content-Type': 'text/xml'});
			res.end(twiml.toString());
		}
	});
}

function getNextTrainToDestination(destination, allDepartures){

	if (allDepartures){
		for (var i=0; i < allDepartures.length; i++){
			var service = allDepartures[i];
			if (service.destination_name == 
				getStationName(destination)){
				var serviceSummary = service.operator_name + ":"							   
				+ service.destination_name + "@" + 
					service.expected_departure_time + "\n"; 
				return serviceSummary;
			}
		}
	}
	return null;
}

function getStationName(stationCode){
	if (stationCode == 'GLC'){
		return 'Glasgow Central';
	}
	else if (stationCode == 'EDB'){
		return 'Edinburgh';
	}
}
