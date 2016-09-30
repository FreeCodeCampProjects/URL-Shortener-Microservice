/* Node modules:
  --------------
   express - Middleware
   mongodb - Database platform
   config - Credentials (hidden)
   mLab - Database storage
   MongoClient - Database driver
 *************************************************************/

var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var config = require('../config');
var mLab = config.dbHost;
var MongoClient = mongodb.MongoClient


/* 'shortid' is a URL-friendly ID generator:
 *************************************************************/

var shortid = require('shortid');

/* Default character list leaves out underscores and dashes: */

shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');


/* 'validUrl' validates URIs:
 *************************************************************/

var validUrl = require('valid-url');


/* GET root route:
 *************************************************************/

router.get('/', function (req, res, next) {
  res.render('index', { host: req.get('host') });
});


/* GET 'new' route with the URL part of the path containing
   only valid URIs:
 *************************************************************/

router.get('/new/:url(*)', function (req, res, next) {
  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log('Unable to connect to server', err);
    } else {
      console.log('Connected to server');

      /* Use the collection 'links' */

      var collection = db.collection('links');
      var params = req.params.url;

      /* Sets current hostname to var local: */

      var local = req.get('host') + '/';

      /* Create a new shortened link:  */

      var newLink = function (db, callback) {
        collection.findOne({ 'url': params }, { short: 1, _id: 0 }, function (err, doc) {
          if (doc != null) {

            /* Return JSON of original URL and shortened URL: */

            res.json({ original_url: params, short_url: local + doc.short });
          } else {
            if (validUrl.isUri(params)) {
              
              /* Shortened ID code: */

              var shortCode = shortid.generate();
              var newUrl = { url: params, short: shortCode };
              collection.insert([newUrl]);
              res.json({ original_url: params, short_url: local + shortCode });
            } else {

              /* If URL is invalid: */

              res.json({ error: 'Invalid URL format. Please re-input.' });
            };
          };
        });
      };

      /* Close connection to database after request:  */

      newLink(db, function () {
        db.close();
      });
    };
  });
});


/* GET shortened URL:
 *************************************************************/

router.get('/:short', function (req, res, next) {

  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log('Unable to connect to server', err);
    } else {
      console.log('Connected to server');

      /* Use the collection 'links' */

      var collection = db.collection('links');
      var params = req.params.short;

      /* Search database for this shortened URL param:  */

      var findLink = function (db, callback) {
        collection.findOne({ 'short': params }, { url: 1, _id: 0 }, function (err, doc) {
          if (doc != null) {

            /* Return JSON of original URL and shortened URL: */

            res.redirect(doc.url);
          } else {
            res.json({ error: 'No shortened URL found in database.' });
          };
        });
      };

      /* Close connection to database after request:  */

      findLink(db, function () {
        db.close();
      });
    };
  });
});

module.exports = router;