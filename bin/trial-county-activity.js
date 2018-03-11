#!/usr/bin/env node
'use strict'

const mongoose = require('mongoose');
const workbook = require('../lib/workbook');
const dateFormat = require('dateformat');
mongoose.Promise = global.Promise
require('../lib/bootstrap');

// 2 months completed
const DFormat = 'ddd dd-mmm-yyyy';
const RangeStart = new Date(Date.UTC(2018, 2, 10, 7, 0, 0));
// const RangeStart = new Date(Date.UTC(2017, 2, 1, 7, 0, 0));
const RangeEnd = new Date(Date.UTC(2018, 2, 12, 7, 0, 0));

mongoose.connect(config.database.url);

const dbAccess = require('../lib/db-access')
const filterSVC = require('../lib/filter-utils')

const FmtDateRange = `${dateFormat(RangeStart, DFormat)} - ${dateFormat(RangeEnd, DFormat)}`;

dbAccess.getActivitiesForRange(RangeStart, RangeEnd)
  .then((activities) => {
    console.log(`Number of summarized activities: ${activities.length}`)
    return dbAccess.getSupportData(activities)
    .then((supportData) => {
      let cActivities = filterSVC.assignCountiesToActivities(activities, supportData.bookCollection)
      console.log(`First activity: ${JSON.stringify(cActivities[1])}`)
      let uniqueCounties = filterSVC.uniqueElements(supportData.bookCollection.map((book) => book.county))
      let countyUserSummaries = filterSVC.summarizeActivitiesByCountyUser(uniqueCounties, supportData.userCollection, cActivities)
      return countyUserSummaries
    })
  })
  .then((summaries) => {
    // console.log(`Summaries: ${JSON.stringify(summaries)}`)
    // process.exit(0)
    let wb = new workbook.Workbook()
    summaries.forEach((countySummary) => {
      let userSummaryData = []
      userSummaryData.push([ FmtDateRange ]); 
      // userSummaryData.push([ dateFormat(RangeStart, DFormat) ]); 
      // header row
      userSummaryData.push([ 'User', 'Book View', 'Page View', 'Page PDF View', 'Page Download' ])
      countySummary.userSummaries.forEach((userSummary) => {
        userSummaryData.push([ userSummary.userName, userSummary.summary.bookView, userSummary.summary.pageView, userSummary.summary.pdfView, userSummary.summary.pageDownload ])
      })

      let userSheet = workbook.sheet_from_array_of_arrays(userSummaryData)

      wb.SheetNames.push(countySummary.county)
      wb.Sheets[countySummary.county] = userSheet
    })

    workbook.writeFile(wb, `ByCounty-${new Date().toISOString()}.xlsx`)
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
