//Index.js - SMSBot

//Add your Account SID 
var accountSid = 'ACd605adfee2a06b2cdcd5585146af55da'; 
//Add your Auth Token here
var authToken = '0bcce373128dea394d181726171bb76d';   
const twilio = require('twilio');
const clientTwilio = new twilio(accountSid, authToken);
var yourNumber = '+5585996784759';
var numberTwilio = '+17193987001';

// transport api
const transportapi = {
	appid: "81b79adc",
	key: "336b598890a04c0f60515cea116a2781"
}

function sendSMS(msg, userPhoneNumber){
	clientTwilio.messages.create({
		body: msg,
		to: userPhoneNumber, 
		from: numberTwilio
	})
	.then((message) => console.log(message.sid));
}

//sendSMS("teste", yourNumber)

function getTrains(sourceStation, sourceStationCode, 
								 destinationStation, 
								 userPhoneNumber){
	var request = require('request');
	var url = 'http://transportapi.com/v3/uk/train/station/' + 
			   sourceStationCode + '/live.json?app_id=' +
			   transportapi.appid + '&app_key=' + transportapi.key;
	request(url, function (error, response, body) {
	   if (response){
			var json = JSON.parse(body);
			if (json.departures){
				//console.log('Departures:', 
				//JSON.stringify(json.departures)); 
				var dep = 
				getTrainsToDestination(destinationStation,
				json.departures.all);
				var summary = summarize(destinationStation, 
										sourceStation, dep);
				console.log('Summary: ' + summary);
				//sendSMS(summary, userPhoneNumber);
			} else {
				console.log('No Departures found!');
			} 
		} else {
			console.log('error:', error); // Print the error if one 
										  // occurred 
		}
	});
}


function getTrainsToDestination(destination, allDepartures){
	var d = [];
	if (allDepartures){
		for (var i=0; i < allDepartures.length; i++){
			var service = allDepartures[i];
			if (service.destination_name == destination){
				d.push(service)
			}
		}
	}
	return d;
}


function summarize(destinationStation, sourceStation, departures){
	var out = '';
	if (departures.length > 0){
		out = 'Here are the departures this morning to ' + 
			   destinationStation 
								 + ".\n";
		for (var i=0; i< departures.length; i++){
			var service = departures[i];
			var serviceSummary = service.operator_name 
								 + " at " +	
			service.expected_departure_time; 
			out += serviceSummary + "\n"
		}
	} else {
		out = 'There are no trains to ' + destinationStation + 
												' from ' + 
										  sourceStation;
	}
	return out;
}


var destinationStation = 'Glasgow Queen Street';
var sourceStationCode = 'EDB';
var sourceStation = 'Edinburgh Waverley';
getTrains(sourceStation, sourceStationCode, destinationStation, yourNumber);