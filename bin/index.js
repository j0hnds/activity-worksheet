#!/usr/bin/env node

/**
 * Invoke this to generate the activity spreadsheets.
 */

const program = require('commander');
const mongoose = require('mongoose');
require('../lib/bootstrap');
const dateSVC = require('../lib/date-service');
const workbook = require('../lib/workbook');
const async = require('async');
const dateFormat = require('dateformat');
const email = require('../lib/email');
const fs = require('fs');

const DFormat = 'ddd dd-mmm-yyyy';

program.
  version('1.0.0').
  option('-t --today <today>', 'The value to use for today', dateSVC.parseDate, new Date()).
  option('-r --recipients <recipients>', 'The emails to which the report should be delivered').
  parse(process.argv);

const fileName = 'activity-' + program.today.toISOString() + '.xlsx';

mongoose.connect(config.database.url);

const userActivity = require('../lib/user-activity');
const acctActivity = require('../lib/account-activity');
const weeklyActivity = require('../lib/weekly-activity');

var ranges = dateSVC.pastWeekRanges(program.today);

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
const FmtDateRange = `${dateFormat(ranges[0].from, DFormat)} - ${dateFormat(ranges[6].from, DFormat)}`;

console.log("Date range: %j", FmtDateRange);

async.eachSeries(ranges, (range, cb) => {

  /**
   * We want to use the same range for both user groupings and 
   * account groupings
   */
  userActivity.groupByUser(range.from, range.to).
    then( (gStats) => { 

      userActivityData.push([ dateFormat(range.from, DFormat) ]); 
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
          acctActivityData.push([ dateFormat(range.from, DFormat) ]); 
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

      /* add worksheets to workbook */
      wb.SheetNames.push(ws_userActivityName);
      wb.Sheets[ws_userActivityName] = ws_userActivity;

      wb.SheetNames.push(ws_acctActivityName);
      wb.Sheets[ws_acctActivityName] = ws_acctActivity;

      wb.SheetNames.push(ws_weeklyActivityName);
      wb.Sheets[ws_weeklyActivityName] = ws_weeklyActivity;

      workbook.writeFile(wb, fileName);

      if (program.recipients) {
        var mailOptions = {
          from: 'vault@bighornimaging.com',
          to: program.recipients.split(','),
          subject: "Activity report for " + FmtDateRange,
          html: "<p>The activity report for the dates including " + FmtDateRange + " is attached.</p><p><strong>Do not reply to this email.</strong> It has been sent by the vault application server.</p>",
          attachments: [ { path: fileName } ]
        };

        email.deliver(mailOptions).
          then( (info) => {
            console.log("Email sent: %j", info);
            fs.unlink(fileName, (err) => {
              if (err) { console.error(err) }
              process.exit();
            });
          }).
          catch( (err) => {
            console.log("Error sending email: %j", err);
            process.exit();
          });
      } else {
        process.exit();
      }

    }).
    catch( (err) => {
      console.error(err);
      process.exit();
    });

});

