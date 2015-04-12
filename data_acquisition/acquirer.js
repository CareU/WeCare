'use strict';

var CronJob = require('cron').CronJob;

var Collector = require('./collector');
var lastUpdatedHour = 0;
var loading = false;

function Acquirer () {
	this.job = new CronJob('00 15 * * * *', 
		loadData, null, false, 'Asia/Shanghai');
}

Acquirer.prototype.acquire = function () {
	var self = this;
	console.log("acquiring data ... ");
	//loadData();
	//setInterval(loadData, 60*1000);
	self.job.start();
}


function loadData() {
	console.log("before load data ... ");
	var currentHour = new Date().getHours();
	if (currentHour > lastUpdatedHour) {
		if (loading == true) {
			console.log("other guy is loading data ... ");
			return;
		}
		loading = true;
		console.log("loading data ... ");

		var collector = new Collector();
		collector.on('success', function () {
			lastUpdatedHour = currentHour;
			loading = false;
			console.log("success to load data ... ");
		});
		collector.on('error', function () {
			loading = false;
			console.log("fail to load data ... ");
		});

		collector.start();
	}
}


exports.Acquirer = Acquirer;