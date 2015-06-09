var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var OverdueAirQualitySchema = new Schema({
    air_quality_id : {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('OverdueAirQuality', OverdueAirQualitySchema);