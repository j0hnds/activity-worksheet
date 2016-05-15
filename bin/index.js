#!/usr/bin/env node
'use strict'

/**
 * Invoke this to generate the activity spreadsheets.
 */

const program = require('commander')
const mongoose = require('mongoose')
const dateSVC = require('../lib/date-service')
const workbook = require('../lib/workbook')
const async = require('async')
const dateFormat = require('dateformat')
const email = require('../lib/email')
const database = require('../config/database')
const fs = require('fs')

const DFormat = 'ddd dd-mmm-yyyy'

program
  .version('1.0.0')
  .option('-t --today <today>', 'The value to use for today', dateSVC.parseDate, dateSVC.today())
  .option('-r --recipients <recipients>', 'The emails to which the report should be delivered')
  .option('-c --clear', 'Clear the created file')
  .parse(process.argv)

const fileName = `activity-${program.today.toISOString()}.xlsx`

mongoose.connect(database.url)

const userActivity = require('../lib/user-activity')
const acctActivity = require('../lib/account-activity')
const weeklyActivity = require('../lib/weekly-activity')

const ranges = dateSVC.pastWeekRanges(program.today)

const wb = new workbook.Workbook()
const wsUserActivityName = 'User Activity'
const wsAcctActivityName = 'Account Activity'
const wsWeeklyActivityName = 'Weekly Activity'
const userActivityData = []
const acctActivityData = []
const weeklyActivityData = []
const FmtDateRange = `${dateFormat(ranges[0].startDate, DFormat)} - ${dateFormat(ranges[6].startDate, DFormat)}`

console.log('Date range: %j', FmtDateRange)

async.eachSeries(ranges, (range, rangeComplete) => {
  /**
   * We want to use the same range for both user groupings and
   * account groupings
   */
  userActivity.groupByUser(range.startDate.toDate(), range.endDate.toDate())
    .then((gStats) => {
      userActivityData.push([ dateFormat(range.startDate, DFormat) ])
      userActivityData.push([ 'User', 'Login', 'Logout', 'Book View', 'Page View', 'Page PDF View', 'Page Download' ])
      return userActivity.processUserStats(gStats)
    })
    .then((userStats) => {
      for (let i in userStats) {
        userActivityData.push([i,
                  userStats[i].login,
                  userStats[i].logout,
                  userStats[i].bookView,
                  userStats[i].pageView,
                  userStats[i].pdfView,
                  userStats[i].pageDownload])
      }
      userActivityData.push([])
    })
    .then(() => acctActivity.groupByAccount(range.startDate.toDate(), range.endDate.toDate()))
    .then((gStats) => {
      acctActivityData.push([ dateFormat(range.startDate.toDate(), DFormat) ])
      acctActivityData.push([ 'Account', 'Login', 'Logout', 'Book View', 'Page View', 'Page PDF View', 'Page Download' ])
      return acctActivity.processAccountStats(gStats)
    })
    .then((aStats) => {
      for (let i in aStats) {
        acctActivityData.push([i,
                  aStats[i].login,
                  aStats[i].logout,
                  aStats[i].bookView,
                  aStats[i].pageView,
                  aStats[i].pdfView,
                  aStats[i].pageDownload])
      }
      acctActivityData.push([])
      rangeComplete() // Done with range...
    })
    .catch((err) => {
      console.error(err)
    })
}, (err) => {
  if (err) {
    console.error(err)
    process.exit()
  }

  // Now, do the weekly stuff
  weeklyActivity.groupByUser(ranges[0].startDate.toDate(), ranges[6].endDate.toDate())
    .then((wStats) => weeklyActivity.processWeeklyStats(wStats))
    .then((stats) => {
      weeklyActivityData.push([ 'User', 'Book', 'County', 'Book View', 'Page View', 'Page PDF View', 'Page Download' ])
      for (let i in stats) {
        let fields = i.split(',')
        weeklyActivityData.push([
          fields[0],
          fields[1],
          fields[2],
          stats[i].bookView,
          stats[i].pageView,
          stats[i].pdfView,
          stats[i].pageDownload])
      }
    })
    .then(() => {
      let wsUserActivity = workbook.sheetFromArrayOfArrays(userActivityData)
      let wsAcctActivity = workbook.sheetFromArrayOfArrays(acctActivityData)
      let wsWeeklyActivity = workbook.sheetFromArrayOfArrays(weeklyActivityData)

      /* add worksheets to workbook */
      wb.SheetNames.push(wsUserActivityName)
      wb.Sheets[wsUserActivityName] = wsUserActivity

      wb.SheetNames.push(wsAcctActivityName)
      wb.Sheets[wsAcctActivityName] = wsAcctActivity

      wb.SheetNames.push(wsWeeklyActivityName)
      wb.Sheets[wsWeeklyActivityName] = wsWeeklyActivity

      workbook.writeFile(wb, fileName)

      if (program.recipients) {
        let mailOptions = {
          from: 'vault@bighornimaging.com',
          to: program.recipients.split(','),
          subject: 'Activity report for ' + FmtDateRange,
          html: '<p>The activity report for the dates including ' + FmtDateRange + ' is attached.</p><p><strong>Do not reply to this email.</strong> It has been sent by the vault application server.</p>',
          attachments: [ { path: fileName } ]
        }

        email.deliver(mailOptions)
          .then((info) => {
            console.log('Email sent: %j', info)
            fs.unlink(fileName, (err) => {
              if (err) console.error(err)
              process.exit()
            })
          })
          .catch((err) => {
            console.log('Error sending email: %j', err)
            process.exit()
          })
      } else {
        if (program.clear) {
          fs.unlink(fileName, (err) => {
            if (err) console.error(err)
            process.exit()
          })
        } else {
          process.exit()
        }
      }
    })
    .catch((err) => {
      console.error(err)
      process.exit()
    })
})

