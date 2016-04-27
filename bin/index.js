#!/usr/bin/env node

/**
 * Invoke this to generate the activity spreadsheets.
 */

const mongoose = require('mongoose');
require('../lib/bootstrap');
const dateSVC = require('../lib/date-service');
const workbook = require('../lib/workbook');
const async = require('async');

mongoose.connect(config.database.url);

const BillingActivity = require('../lib/billing-activity-model');
const User = require('../lib/user-model');

const eventTypeMap = [
  'Invalid Event Type', // 0
  'Login', // 1
  'Logout', // 2
  'Book View', // 3
  'Page Thumbnail View', // 4
  'Page View', // 5
  'Page PDF View', // 6
  'Page Download' 
];

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

var dates = dateSVC.pastWeekRanges(new Date(2015, 9, 8, 0, 0, 0));
var ranges = [];
for (var i=0; i<7; i++) {
  ranges.push({ from: dates[i], to: dates[i+1]});
}

var wb = new workbook.Workbook();
var ws = null;
var ws_name = "User Activity";
var data = [];

async.eachSeries(ranges, (range, cb) => {
  groupByUser(range.from, range.to).
    then( (gStats) => { 
      console.log("Stats: %j", gStats); 
      console.log("From: %j to: %j", range.from, range.to);

      data.push([ range.from, range.to ]); 
      data.push([ "User", "Event Type", "Total" ] );
      async.eachSeries(gStats, (gStat, cbStat) => {
        User.findOne({_id: gStat.user}).
          then( (user) => {
            data.push([ user.name, eventTypeMap[gStat.eventType], gStat.total ]);
            cbStat();
          }).
          catch( cbStat );
      }, (err) => {
        if (err) {
          console.log(err);
        }
        data.push([]);

        cb();
      });
    })

}, (err) => {
  if (err) {
    console.error(err);
    process.exit();
  }

  var ws = workbook.sheet_from_array_of_arrays(data);

  /* add worksheet to workbook */
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;

  /* write file */
  workbook.writeFile(wb, 'test.xlsx');
  process.exit();
});


/* original data */
// var data = [[1,2,3],[true, false, null, "sheetjs"],["foo","bar",new Date("2014-02-19T14:30Z"), "0.3"], ["baz", null, "qux"]]

