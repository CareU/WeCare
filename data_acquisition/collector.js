'use strict';
var needle = require('needle');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Parser = require('./parser');

var options = {
  decode : false,
  parse : true
}


function Collector () {
	console.log("initializing Collector ... ");
	EventEmitter.call(this);
};

util.inherits(Collector, EventEmitter);

Collector.prototype.start = function () {
	var self = this;
	load_all_city(function (error) {
		if (error) {
			self.emit("error");
		} else {
			self.emit("success");
		}
	});
}

function load_all_city (callback) {
	var url = "http://pm25.in/";
	needle.get(url, options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//console.log(response.body);
			Parser.parseAllCities(response.body, callback);
		} else {
			callback('error');
		}
	});
}

module.exports = Collector;