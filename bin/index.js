#!/usr/bin/env node

/**
 * Invoke this to generate the activity spreadsheets.
 */

const mongoose = require('mongoose');
require('../lib/bootstrap');

mongoose.connect(config.database.url);

const BillingActivity = require('../lib/billing-activity-model');

const groupByUser = function(startTime, endTime) {
  console.log("From: %j to %j", startTime, endTime);
  return new Promise( (resolve, reject) => {
    BillingActivity.collection.group(
      [ 'user', 'eventType' ],
      { $and:  [ { createdAt: { $gte: startTime} }, 
                 { createdAt: { $lt:  endTime} },
                 { eventType: { $ne:  4 } } ] },
      { total: 0 },
      function(curr, result) { if (curr.eventType === 7) { result.total += curr.pageCount; } else { result.total += 1; } },
      null,
      null,
      {},
      function(err, values) {
        if (err) { return reject(err) }
        resolve(values);
      });
  });
};

groupByUser(new Date(2015, 0, 1), new Date(2016, 3, 24)).
  then( (gStats) => { 
    console.log("Stats: %j", gStats); 
    process.exit();
  });
