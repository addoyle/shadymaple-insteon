var async = require('async');
var devices = require('./devices.json');
var _ = require('underscore');

var Home = module.exports = function Home(insteon) {
	this.insteon = insteon;
};

var loadDevices = function(home, callback) {
	home.insteon.links(function(err, links) {
		var rawDevices = {};
		links.forEach(function(link) {
			rawDevices[link.id || link] = [link];
		});

		oDevices = {};

		for(var i in devices) {
			var device = devices[i];
			var ids = device.id || i;

			if (!Array.isArray(ids)) {
				ids = [ids];
			}

			oDevices[i] = ids.map(function(id) {
				var device = rawDevices[id][0];
				delete rawDevices[id];

				return device;
			});
		}

		callback(_.extend({}, oDevices, rawDevices));
	});
};

var getIds = function(device) {
	var devs = devices[device] || [device];
	devs = devs.id || devs;

	devs = Array.isArray(devs) ? devs : [devs];

	return devs;
}

Home.prototype.getDevices = function(callback) {
	loadDevices(this, callback);
};

Home.prototype.isDimmable = function(device) {
	return !!devices[device].dimmable;
};

Home.prototype.getInfo = function(device, callback) {
	var self = this;

	async.map(getIds(device), function(id, next) {
		self.insteon.info(id, function(err, info) {
			next(err, info);
		});
	}, function(err, results) {
		callback(results);
	});
};

Home.prototype.action = function(device, action, callback) {
	var self = this;

	//if (callback == undefined) {
	//	callback = params;
	//	params = undefined;
	//}

	async.map(getIds(device), function(id, next) {
		var light = self.insteon.light(id);
		if (light[action]) {
			light[action](function(err, res) {
				next(err, {id: id, res: res});
			});	
		} else {
			next(new Error('Action not found'));
		}
	}, function(err, results) {
		callback(err, results);
	});
};
