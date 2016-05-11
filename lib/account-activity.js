"use strict"

module.exports = (function () {
  const async = require('async')
  const BillingActivity = require('../lib/billing-activity-model')
  const Account = require('../lib/account-model')
  const support = require('../lib/support')

  const processAccountStats = (aStats) => {
    let acctStats = {}
    return new Promise((resolve, reject) => {
      async.eachSeries(aStats, (aStat, statComplete) => {
        Account.findOne({_id: aStat.account})
          .then((account) => {
            const accountName = (account) ? account.name : '**NO ACCOUNT**'
            acctStats[accountName] = acctStats[accountName] || {}
            support.updateStatsObj(acctStats[accountName], aStat.eventType, aStat.total)
            statComplete()
          })
          .catch(statComplete)
      }, (err) => {
        if (err) return reject(err)
        resolve(acctStats)
      })
    })
  }

  const groupByAccount = (startTime, endTime) => {
    return new Promise((resolve, reject) => {
      BillingActivity.collection.group(
        [ 'account', 'eventType' ],
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
          if (err) { return reject(err) }
          resolve(values)
        })
    })
  }

  var mod = {
    groupByAccount: groupByAccount,
    processAccountStats: processAccountStats
  }

  return mod
}())
