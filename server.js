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

var reqTranspAPI = function(localidade, res) {
	var url = `http://transportapi.com/v3/uk/places.json?query=${localidade}`+
		`&type=train_station&app_id=${transportapi.appid}&app_key=${transportapi.key}`
	http.get(url, function(resTransp) {
		// encaminhar saida
		//resTransp.pipe(res);
		var body = '';
		resTransp.on('data', function(chunk) {
			body += chunk;
		});
		resTransp.on('end', function() {

			var transp = JSON.parse(body);
			var botoes = [];
			var text = `Está aqui as estações encontradas próximas a ${localidade}!`;
			if (transp.member && transp.member.length > 0) {
				for (var i = 0; i < Math.min(2,transp.member.length); i++) {
					var station = transp.member[i];
					var botao = {
						"type": "web_url",
						"url": `https://www.google.com/maps/place/${station.name} Station/@${station.latitude},${station.longitude},15z`,
						"title": `Estação ${station.name}`
					}
					botoes.push(botao);
				}
			} else {
				text = `Não foram encontradas estações usando como parâmetro ${localidade}`;
			}
			botoes.push({
				"type": "show_block",
				"block_names": ["Localidade"],
				"title": "Fazer nova pesquisa..."
			});

			// enviar resposta
			res.json({"messages" : [
				{
					"attachment": {
						"type": "template",
						"payload": {
							"template_type": "button",
							"text": text,
							"buttons": botoes
						}
					}
				}
			]});
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.json({"messages" : [
			{
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "button",
						"text": "Algum erro ocorreu... tente novamente",
						"buttons": [
							{
								"type": "show_block",
								"block_names": ["Localidade"],
								"title": "Pesquisar novamente"
							}
						]
					}
				}
			}
		]});
	});
}

app.get('/find/:place', function(req, res) {
	//var localidade = encodeURIComponent(req.params.place)
	var localidade = req.params.place
	reqTranspAPI(localidade, res);
});

chttp.listen(3002, function() {
	console.log('listening on *:3002');
});