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

const fileName = 'semi-activity-nw-' + program.today.toISOString() + '.xlsx';

const RangeStart = new Date(Date.UTC(2017, 2, 1, 7, 0, 0));
const RangeEnd = new Date(Date.UTC(2018, 2, 4, 7, 0, 0));

mongoose.connect(config.database.url);

const userActivity = require('../lib/user-activity');
const acctActivity = require('../lib/account-activity');

var wb = new workbook.Workbook();
var ws_userActivity = null;
var ws_userActivityName = "User Activity";
var ws_acctActivity = null;
var ws_acctActivityName = "Account Activity";
var userActivityData = [];
var acctActivityData = [];
const FmtDateRange = `${dateFormat(RangeStart, DFormat)} - ${dateFormat(RangeEnd, DFormat)}`;

console.log("Date range: %j", FmtDateRange);

/**
 * We want to use the same range for both user groupings and 
 * account groupings
 */
userActivity.groupByUserWOWeekend(RangeStart, RangeEnd).
  then( (gStats) => { 

    userActivityData.push([ dateFormat(RangeStart, DFormat) ]); 
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
    return acctActivity.groupByAccountWOWeekend(RangeStart, RangeEnd).
      then( (gStats) => {
        acctActivityData.push([ dateFormat(RangeStart, DFormat) ]); 
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
            // cb(); // Done with range...
          });
      });
  }).
  then( () => {
    var ws_userActivity = workbook.sheet_from_array_of_arrays(userActivityData);
    var ws_acctActivity = workbook.sheet_from_array_of_arrays(acctActivityData);

    /* add worksheets to workbook */
    wb.SheetNames.push(ws_userActivityName);
    wb.Sheets[ws_userActivityName] = ws_userActivity;

    wb.SheetNames.push(ws_acctActivityName);
    wb.Sheets[ws_acctActivityName] = ws_acctActivity;

    workbook.writeFile(wb, fileName);

    if (program.recipients) {
      var mailOptions = {
        from: 'vault@bighornimaging.com',
        to: program.recipients.split(','),
        subject: "New NOWeekend Activity report for " + FmtDateRange,
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

