#!/usr/bin/env node

/**
 * Invoke this to generate the activity spreadsheets.
 */

const mongoose = require('mongoose');
require('../lib/bootstrap');
const dateSVC = require('../lib/date-service');
const workbook = require('../lib/workbook');
const async = require('async');
const support = require('../lib/support');

mongoose.connect(config.database.url);

const userActivity = require('../lib/user-activity');
const acctActivity = require('../lib/account-activity');

var ranges = dateSVC.pastWeekRanges(new Date(2015, 9, 8, 0, 0, 0));

var wb = new workbook.Workbook();
var ws_userActivity = null;
var ws_userActivityName = "User Activity";
var ws_acctActivity = null;
var ws_acctActivityName = "Account Activity";
var userActivityData = [];
var acctActivityData = [];

async.eachSeries(ranges, (range, cb) => {

  /**
   * We want to use the same range for both user groupings and 
   * account groupings
   */
  console.log("From: %j to: %j", range.from, range.to);
  userActivity.groupByUser(range.from, range.to).
    then( (gStats) => { 

      userActivityData.push([ range.from, range.to ]); 
      userActivityData.push([ "User","Login","Logout","Book View","Page View", "Page PDF View","Page Download" ] );
      return userActivity.processUserStats(gStats).
        then( (userStats) => {
          for (var i in userStats) {
            userActivityData.push([i, 
                      userStats[i].login, 
                      userStats[i].logout, 
                      userStats[i].bookView, 
                      userStats[i].pageView, 
                      userStats[i].pdfView, 
                      userStats[i].pageDownload]);
          }
          userActivityData.push([]);
          // cb();
        });
    }).
    then( () => {
      return acctActivity.groupByAccount(range.from, range.to).
        then( (gStats) => {
          acctActivityData.push([ range.from, range.to ]); 
          acctActivityData.push([ "Account","Login","Logout","Book View","Page View", "Page PDF View","Page Download" ] );
          return acctActivity.processAccountStats(gStats).
            then( (aStats) => {
              for (var i in aStats) {
                acctActivityData.push([i, 
                          aStats[i].login, 
                          aStats[i].logout, 
                          aStats[i].bookView, 
                          aStats[i].pageView, 
                          aStats[i].pdfView, 
                          aStats[i].pageDownload]);
              }
              acctActivityData.push([]);
              cb(); // Done with range...
            });
        });
    }).
    catch( (err) => {
      console.error(err);
    });

}, (err) => {
  if (err) {
    console.error(err);
    process.exit();
  }

  var ws_userActivity = workbook.sheet_from_array_of_arrays(userActivityData);
  var ws_acctActivity = workbook.sheet_from_array_of_arrays(acctActivityData);

  /* add worksheet to workbook */
  wb.SheetNames.push(ws_userActivityName);
  wb.Sheets[ws_userActivityName] = ws_userActivity;

  wb.SheetNames.push(ws_acctActivityName);
  wb.Sheets[ws_acctActivityName] = ws_acctActivity;

  /* write file */
  workbook.writeFile(wb, 'test.xlsx');
  process.exit();
});

