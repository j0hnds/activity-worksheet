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
const weeklyActivity = require('../lib/weekly-activity');

var ranges = dateSVC.pastWeekRanges(new Date(2015, 9, 12, 0, 0, 0));

var wb = new workbook.Workbook();
var ws_userActivity = null;
var ws_userActivityName = "User Activity";
var ws_acctActivity = null;
var ws_acctActivityName = "Account Activity";
var ws_weeklyActivity = null;
var ws_weeklyActivityName = "Weekly Activity";
var userActivityData = [];
var acctActivityData = [];
var weeklyActivityData = [];

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

  // Now, do the weekly stuff
  weeklyActivity.groupByUser(ranges[0].from, ranges[6].to).
    then( (wStats) => {
      return weeklyActivity.processWeeklyStats(wStats).
        then( (stats) => {
          weeklyActivityData.push(["User","Book","County","Book View","Page View","Page PDF View","Page Download" ]);
          for (var i in stats) {
            var fields = i.split(',');
            weeklyActivityData.push([
              fields[0],
              fields[1],
              fields[2],
              stats[i].bookView,
              stats[i].pageView,
              stats[i].pdfView,
              stats[i].pageDownload]);
          }

        });
    }).
    then( () => {
      var ws_userActivity = workbook.sheet_from_array_of_arrays(userActivityData);
      var ws_acctActivity = workbook.sheet_from_array_of_arrays(acctActivityData);
      var ws_weeklyActivity = workbook.sheet_from_array_of_arrays(weeklyActivityData);

      /* add worksheet to workbook */
      wb.SheetNames.push(ws_userActivityName);
      wb.Sheets[ws_userActivityName] = ws_userActivity;

      wb.SheetNames.push(ws_acctActivityName);
      wb.Sheets[ws_acctActivityName] = ws_acctActivity;

      wb.SheetNames.push(ws_weeklyActivityName);
      wb.Sheets[ws_weeklyActivityName] = ws_weeklyActivity;

      /* write file */
      workbook.writeFile(wb, 'test.xlsx');
      process.exit();
    }).
    catch( (err) => {
      console.error(err);
    });

});

