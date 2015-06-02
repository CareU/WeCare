'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var _ = require('lodash');

var Summary = require('./quality_summary');
var Station = require('./station_detail');
var OverdueAirQuality = require('./overdue_air_quality');
var OverdueSummary = require('./overdue_summary');
var OverdueStation = require('./overdue_station');

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

AirQualitySchema.pre('remove', function (next) {
    var airQuality = this;
    //console.log("before remove airQuality : " + JSON.stringify(airQuality));
    //console.log("try to remove summary: " + airQuality.summary);
    Summary.findOneAndRemove({"_id" : airQuality.summary}, function (err) {
        if (err) {
            console.log("fail to remove summary: " + airQuality.summary);
        } else {
            //console.log("success to remove summary: " + airQuality.summary);
        }
        //console.log("try to remove stations: " + JSON.stringify(airQuality.stations));
        var done = _.after(airQuality.stations.length, function() {
            //console.log('done remove stations!');
            return next();
        });
        _.each(airQuality.stations, function (station) {
            Station.findOneAndRemove({"_id" : station}, function (err) {
                if (err) {
                    console.log("fail to remove station: " + station);
                } else {
                    //console.log("success to remove station: " + station);
                }
                done();
            });
        });
    });
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
            //console.log("Loaded AirQuality : " + JSON.stringify(qualityArray));
            return callback(null, qualityArray);
        }
    });
});


AirQualitySchema.static('removeDataXDaysBefore', function(day, callback) {
    var startTime = DateUtil.getStartOfXDayBefore(day);
    //var endTime = DateUtil.getStartOfXDayBefore(day-1);
    console.log("Try to remove AirQuality before " + startTime);
    var query = {
        "time_update" : {
            //"$gte" : startTime,
            "$lt" : startTime
        }
    };
    this.find(query).exec(function (err, qualityArray) {
        //console.log("Try to remove AirQuality : " + JSON.stringify(qualityArray));
        console.log("Try to remove AirQuality, total number : " + qualityArray.length);
        var done = _.after(qualityArray.length, function() {
            console.log('done remove AirQuality list!');
            return callback(null);
        });
        _.each(qualityArray, function (quality) {
            quality.remove(function(err) {
                if (err) {
                    console.log("Fail to remove AirQuality : " + err);
                    
                } else {
                    //console.log("Success to remove AirQuality!");
                }
                done();
            });
        });
        
    });
});

AirQualitySchema.static('prepareDataXDaysBefore', function(day, callback) {
    var startTime = DateUtil.getStartOfXDayBefore(day);
    //var endTime = DateUtil.getStartOfXDayBefore(day-1);
    console.log("Try to prepare AirQuality before " + startTime);
    var query = {
        "time_update" : {
            //"$gte" : startTime,
            "$lt" : startTime
        }
    };
    this.find(query).select('_id summary stations').exec(function (err, qualityArray) {
        //console.log("Try to remove AirQuality : " + JSON.stringify(qualityArray));
        console.log("Try to prepare AirQuality, total number : " + qualityArray.length);
        var done = _.after(qualityArray.length, function() {
            console.log('done insert OverdueAirQuality list!');
            return callback(null);
        });
        _.each(qualityArray, function (quality) {
            //console.log("Try to insert AirQuality : " + quality);
            var overdueAirQuality = { air_quality_id : quality._id };
            OverdueAirQuality.create(overdueAirQuality, function (err, result) {
                if (err) {
                    //console.log("Fail to insert OverdueAirQuality : " + err);
                    done();
                } else {
                    var overdueSummary = { summary_id : quality.summary};
                    OverdueSummary.create(overdueSummary, function (err, result) {
                        if (err) {
                            //console.log("Fail to insert OverdueSummary : " + err);
                            done();
                        } else {
                            var finished = _.after(quality.stations.length, function() {
                                console.log('done insert OverdueStation list!');
                                done();
                            });
                            _.each(quality.stations, function (station) {
                                var overdueStation = { station_id : station};
                                OverdueStation.create(overdueStation, function (err, result) {
                                    if (err) {
                                        //console.log("Fail to insert OverdueStation : " + err);
                                    } else {

                                    }
                                    finished();
                                });
                            });
                        }
                    });
                }
            });
        });
    });
});

module.exports = mongoose.model('AirQuality', AirQualitySchema);
