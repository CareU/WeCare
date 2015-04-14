'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var _ = require('lodash');
var Summary = require('./quality_summary');
var DateUtil = require('../utils/date_util');

var AirQualitySchema = new Schema({
    city: {
        type: String,
        required: true,
        trim: true
    },
    time_update : {
    	type: Date
    },
    unit : {
    	type: String,
        trim: true
    },
    summary : {
    	type: ObjectId,
		ref: 'Summary',
        required: true
    },
    stations: [{
		type: ObjectId,
		ref: 'Station'
	}],
});

AirQualitySchema.static('loadDataXDaysBefore', function(day, callback) {
    var startTime = DateUtil.getStartOfXDayBefore(day);
    var endTime = DateUtil.getStartOfXDayBefore(day-1);
    console.log("Try to load AirQuality from " + startTime + " to " + endTime);
    var query = {
        "time_update" : {
            "$gte" : startTime,
            "$lt" : endTime
        }
    };
    this.find(query).populate('summary', 'aqi -_id')
        .select('city time_update summary -_id')
        .exec(function(err, qualityArray) {
        if (err) {
            return callback(err);
        } else {
            console.log("Loaded AirQuality : " + JSON.stringify(qualityArray));
            return callback(null, qualityArray);
        }
    });
});

module.exports = mongoose.model('AirQuality', AirQualitySchema);