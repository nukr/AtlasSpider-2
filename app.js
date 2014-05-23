"use strict"
require('./models/coupon')
var fs          = require('fs');
var request     = require('request');
var xml2js      = require('xml2js');
var mongoose    = require('mongoose');
var Coupon      = mongoose.model('Coupon');
var ProgressBar = require('progress');
var async = require('async');

function requestNuomiXML(callback) {
    console.log('Starting download xml');
    request.get('http://www.nuomi.com/api/dailydeal?version=v1&city=shanghai').pipe(fs.createWriteStream(__dirname + '/nuomi.xml'))
    .on('close', function (err) {
        console.log('Download Done');
        callback();
    });
}

function parseXML(callback){
    console.log('Parsing XML ...');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/nuomi.xml', function (err, data) {
        if (err) throw err;
        parser.parseString(data, function (err, result) {
            if (err) throw err;
            console.log('Parse Done');
            callback(null, result);
        });
    });
}

function isExist(coupon, callback) {
    Coupon.find({web_url: coupon.loc}, function (err, doc) {
        if (err) throw err;
        if (doc.length === 0) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

function isExpire(date, callback) {
    if (date < new Date()) {
        callback(true);
    } else {
        callback(false);
    }
}

function requestNuomiXML(callback) {
    console.log('Starting download xml');
    request.get('http://www.nuomi.com/api/dailydeal?version=v1&city=shanghai').pipe(fs.createWriteStream(__dirname + '/nuomi.xml'))
    .on('close', function (err) {
        console.log('Download Done');
        callback();
    });
}

function parseXML(callback){
    console.log('Parsing XML ...');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/nuomi.xml', function (err, data) {
        if (err) throw err;
        parser.parseString(data, function (err, result) {
            if (err) throw err;
            console.log('Parse Done');
            callback(null, result);
        });
    });
}

function isExist(coupon, callback) {
    Coupon.find({web_url: coupon.loc}, function (err, doc) {
        if (err) throw err;
        if (doc.length === 0) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

function isExpire(date, callback) {
    if (date < new Date()) {
        callback(true);
    } else {
        callback(false);
    }
}

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

function xml2db(coupons) {
    var pending = coupons.length;
    var bar = new ProgressBar('Inserting ... [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: pending
    });
    coupons.forEach(function (coupon, i) {
        Coupon.find({web_url: coupon.loc, title: coupon.data[0].display[0].title[0]}, function (err, doc) {
            if (doc.length === 0) { // doc is not found
                newCoupon(coupon);
                bar.tick(1);
                if (--pending === 0){
                    console.log('done');
                    mongoose.connection.close();
                }
            } else if (doc[0].expire < new Date()){
                doc[0].active = false;
                doc[0].last_updated = new Date();
                doc[0].save();
                bar.tick(1);
                if (--pending === 0){
                    console.log('done');
                    mongoose.connection.close();
                }
            } else {
                bar.tick(1);
                if (--pending === 0){
                    console.log('done');
                    mongoose.connection.close();
                }
            }
        });
    });
}

async.series([requestNuomiXML, parseXML], function (err, result) {
    xml2db(result[1].urlset.url);
});
