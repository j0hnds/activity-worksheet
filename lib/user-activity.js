"use strict"

module.exports = (function () {
  const async = require('async')
  const BillingActivity = require('../lib/billing-activity-model')
  const User = require('../lib/user-model')
  const support = require('../lib/support')

  const processUserStats = (gStats) => {
    let userStats = {}
    return new Promise((resolve, reject) => {
      async.eachSeries(gStats, (gStat, statComplete) => {
        User.findOne({ _id: gStat.user })
          .then((user) => {
            let userName = (user) ? user.name : '**NO USER**'
            userStats[userName] = userStats[userName] || {}
            support.updateStatsObj(userStats[userName], gStat.eventType, gStat.total)
            statComplete()
          })
          .catch(statComplete)
      }, (err) => {
        if (err) return reject(err)
        resolve(userStats)
      })
    })
  }

  const groupByUser = (startTime, endTime) => {
    return new Promise((resolve, reject) => {
      BillingActivity.collection.group(
        [ 'user', 'eventType' ],
        {
          $and: [ { createdAt: { $gte: startTime } },
                  { createdAt: { $lt: endTime } },
                  { eventType: { $ne: 4 } } ]
        },
        { total: 0 },
        support.calculateResult,
        null,
        null,
        {},
        function (err, values) {
          if (err) return reject(err)
          resolve(values)
        })
    })
  }

  var mod = {
    groupByUser: groupByUser,
    processUserStats: processUserStats
  }

  return mod
}())
