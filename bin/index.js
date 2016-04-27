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

var updateStatsObj = function(statsObj, eventType, count) {
  switch (eventType) {
    case 1:
      statsObj.login = count;
      break;
    case 2:
      statsObj.logout = count;
      break;
    case 3:
      statsObj.bookView = count;
      break;
    case 5:
      statsObj.pageView = count;
      break;
    case 6:
      statsObj.pdfView = count;
      break;
    case 7:
      statsObj.pageDownload = count;
      break;
  }
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
      data.push([ "User","Login","Logout","Book View","Page View", "Page PDF View","Page Download" ] );
      var userStats = {};
      async.eachSeries(gStats, (gStat, cbStat) => {
        User.findOne({_id: gStat.user}).
          then( (user) => {
            var userName = "**NO USER**";
            if (user) { userName = user.name };
            if (! userStats[userName]) {
              userStats[userName] = {};
            }
            updateStatsObj(userStats[userName], gStat.eventType, gStat.total);
            cbStat();
          }).
          catch( cbStat );
      }, (err) => {
        if (err) {
          console.log(err);
        }
        for (var i in userStats) {
          data.push([i, 
                    userStats[i].login, 
                    userStats[i].logout, 
                    userStats[i].bookView, 
                    userStats[i].pageView, 
                    userStats[i].pdfView, 
                    userStats[i].pageDownload]);
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

