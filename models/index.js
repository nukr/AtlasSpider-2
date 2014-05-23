require('./coupon');
var config = require('../config');
var mongoose = require('mongoose');

mongoose.connect(config.dbUrl, function (err) {
  if (err) {
    console.error('connect to %s error: ', dbUrl, err.message);
    process.exit(1);
  }
});

exports.Coupon = mongoose.model('Coupon');
