"use strict"
require('./models/coupon')
var fs          = require('fs');
var request     = require('request');
var xml2js      = require('xml2js');
var mongoose    = require('mongoose');
var Coupon      = mongoose.model('Coupon');
var ProgressBar = require('progress');

mongoose.connect('mongodb://admin:3345678@127.0.0.1/coupon', function (err) {
  if (err) {
    console.error('connect to %s error: ', 'mongodb://127.0.0.1/coupon', err.message);
    process.exit(1);
  }
});

function newCoupon(coupon) {
    var display = coupon.data[0].display[0]
    var nuomi = new Coupon({
        title      : display.title[0],
        disc       : '',
        start      : new Date(display.startTime[0] * 1000),
        expire     : new Date(display.endTime[0] * 1000),
        keywords   : display.firstCategory[0],
        web_url    : coupon.loc,
        mobile_url : display.wapGoodsURL[0],
        pic_url    : display.image[0]
    });
    nuomi.save(function (err, data, numberAffected) {
        //if (--counter === 0) {
            //console.log('parsing and inserting done');
            //mongoose.connection.close();
        //}
    });
}
function xml2db(onsuccess, onfailure) {
    console.log('parsing xml and inserting into db');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/nuomi.xml', function (err, data) {
        if (err) throw err;
        parser.parseString(data, function (err, result) {
            if (err) throw err;
            var coupons = result.urlset.url;
            var pending = coupons.length;
            var bar = new ProgressBar('  processing [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: pending
            });
            coupons.forEach(function (coupon, i) {
                Coupon.find({web_url: coupon.loc, title: coupon.data[0].display[0].title[0]}, function (err, doc) {
                    if (doc.length === 0) { // doc is not found
                        bar.tick(1)
                        newCoupon(coupon);
                        if (--pending === 0){
                            console.log('done');
                            mongoose.connection.close();
                        }
                    } else if (doc[0].expire < new Date()){
                        doc[0].active = false;
                        doc[0].last_updated = new Date();
                        doc[0].save();
                        bar.tick(1)
                        if (--pending === 0){
                            console.log('done');
                            mongoose.connection.close();
                        }
                    } else {
                        bar.tick(1)
                        if (--pending === 0){
                            console.log('done');
                            mongoose.connection.close();
                        }
                    }
                });
            });
        });
    })
}

console.log('starting download xml');
request.get('http://www.nuomi.com/api/dailydeal?version=v1&city=shanghai').pipe(fs.createWriteStream(__dirname + '/nuomi.xml'))
.on('close', function (err) {
    console.log('download done');
    xml2db();
});
