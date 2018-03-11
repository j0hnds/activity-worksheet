#!/usr/bin/env node
'use strict'

const program = require('commander');
const mongoose = require('mongoose');
const workbook = require('../lib/workbook');
const dateFormat = require('dateformat');
const fs = require('fs');

mongoose.Promise = global.Promise
require('../lib/bootstrap');

const email = require('../lib/email');

const dateSVC = require('../lib/date-service');

program
  .version('1.0.0')
  .option('-t --today <today>', 'The value to use for today', dateSVC.parseDate, new Date())
  .option('-r --recipients <recipients>', 'The emails to which the report should be delivered')
  .parse(process.argv)

const fileName = 'county-activity-' + program.today.toISOString() + '.xlsx';

// 2 months completed
const DFormat = 'ddd dd-mmm-yyyy';

mongoose.connect(config.database.url);

const dbAccess = require('../lib/db-access')
const filterSVC = require('../lib/filter-utils')

const range = dateSVC.dayRange(program.today);

const FmtDateRange = `${dateFormat(range.startDate, DFormat)} - ${dateFormat(range.endDate, DFormat)}`;

console.log("Date range: %j", FmtDateRange);

const deleteFile = (fName) => {
  return new Promise((resolve, reject) => {
    fs.unlink(fileName, (err) => {
      if (err) { reject(err) }
      resolve()
    });
  })
}

dbAccess.getActivitiesForRange(range.startDate, range.endDate)
  .then((activities) => {
    console.log(`Number of summarized activities: ${activities.length}`)
    return dbAccess.getSupportData(activities)
    .then((supportData) => {
      let cActivities = filterSVC.assignCountiesToActivities(activities, supportData.bookCollection)
      let uniqueCounties = filterSVC.uniqueElements(supportData.bookCollection.map((book) => book.county))
      let countyUserSummaries = filterSVC.summarizeActivitiesByCountyUser(uniqueCounties, supportData.userCollection, cActivities)
      return countyUserSummaries
    })
  })
  .then((summaries) => {
    let wb = new workbook.Workbook()
    summaries.forEach((countySummary) => {
      let userSummaryData = []
      userSummaryData.push([ dateFormat(range.startDate, DFormat)]); 
      // header row
      userSummaryData.push([ 'User', 'Book View', 'Page View', 'Page PDF View', 'Page Download' ])
      countySummary.userSummaries.forEach((userSummary) => {
        userSummaryData.push([ userSummary.userName, userSummary.summary.bookView, userSummary.summary.pageView, userSummary.summary.pdfView, userSummary.summary.pageDownload ])
      })

      let userSheet = workbook.sheet_from_array_of_arrays(userSummaryData)

      wb.SheetNames.push(countySummary.county)
      wb.Sheets[countySummary.county] = userSheet
    })

    workbook.writeFile(wb, fileName)
    if (program.recipients) {
      var mailOptions = {
        from: 'vault@bighornimaging.com',
        to: program.recipients.split(','),
        subject: "County activity report for " + FmtDateRange,
        html: "<p>The county activity report for the dates including " + FmtDateRange + " is attached.</p><p><strong>Do not reply to this email.</strong> It has been sent by the vault application server.</p>",
        attachments: [ { path: fileName } ]
      };

      return email.deliver(mailOptions).
        then( (info) => {
          console.log("Email sent: %j", info);
          return deleteFile(fileName)
        }).
        catch( (err) => {
          console.log("Error sending email: %j", err);
          process.exit(1)
        });
    }
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
