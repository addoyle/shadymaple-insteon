var express = require('express');
var app = express();
var bodyparser = require('body-parser');
var config = require('./config.json');

var Insteon = require('home-controller').Insteon;
var insteon = new Insteon();

var Home = require('./home.js');
var home = new Home(insteon);

var nightMode = false;

var getNightMode = function() {
	return nightMode ? 'ON' : 'OFF';
}

//app.use(bodyparser.json());
//app.use(bodyparser.urlencoded({extended:true}));
app.use(function(req, res, next) {
	req.body = '';
	req.setEncoding('utf8');
	req.on('data', function(chunk) { req.body += chunk; });
	req.on('end', next);
});

app.route('/')
	.get(function(req, res) {
		res.send('foo');
	});

app.route('/night')
	.get(function(req, res) {
		res.send(getNightMode());
	})
	.post(function(req, res) {
		nightMode = req.body == 'ON' ? true : false;
		console.log(nightMode);
		res.send(getNightMode());
	});

app.route('/device')
	.get(function(req, res) {
		home.getDevices(function(data) {
			res.json(data);
		});
	});

app.route('/device/:id/info')
	.get(function(req, res) {
		home.getInfo(req.params.id, function(info) {
			res.json(info);
		});
	});

app.route('/device/:id')
	.get(function(req, res) {
		//home.getInfo(req.params.id, function(info) {
		//	res.json(info);
		//});
		//console.log(req);

		var action = req.query.status || 'level';

		home.action(req.params.id, action, function(err, result) {
			res.send(result[0].res > 0 ? 'ON' : 'OFF');
		});
	})
	.post(function(req, res) {
		var offAction = req.query.off || 'turnOff';
		var onAction = req.query.on || 'turnOn';
		var mode = req.body == 'ON';
		var success = !mode ? 'ON' : 'OFF';
		//var params = undefined;

		//if (mode && nightMode && home.isDimmable(req.params.id)) {
		//	params = 1;
		//}

		home.action(req.params.id, mode ? onAction : offAction, function(err, result) {
			res.send(success);
		});
	});


app.route('/device/:id/:action')
	.all(function(req, res) {
		home.action(req.params.id, req.params.action, function(err, result) {
			if (err) {
				res.json(err);
			} else {
				res.json(result);	
			}
		});
	});

insteon.serial('/dev/ttyUSB0', {}, function() {
	console.log('Listening on port', config.port);
	app.listen(config.port);
});
