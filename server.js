const
	http = require('http'),
	https = require('https'),
	fs = require('fs'),
	express = require('express'),
	app = express(),
	chttp = http.Server(app),
	path = require('path');

app.use(express.json());

var transportapi = {
	appid: "81b79adc",
	key: "336b598890a04c0f60515cea116a2781"
}

app.get('/find/:place', function(req, res) {
	var localidade = encodeURIComponent(req.params.place)
	var url = `http://transportapi.com/v3/uk/places.json?query=${localidade}&type=train_station&app_id=${transportapi.appid}&app_key=${transportapi.key}`
	console.log(url);
	res.json({"messages" : [
		{
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "button",
					"text": "Estação tal!",
					"buttons": [
						{
							"type": "show_block",
							"block_names": ["Localidade"],
							"title": "Pesquisar novamente"
						},
						{
							"type": "web_url",
							"url": "https://rockets.chatfuel.com",
							"title": "Visit Website"
						}
					]
				}
			}
		}
	]});
});

chttp.listen(3002, function() {
	console.log('listening on *:3002');
});