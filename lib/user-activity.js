module.exports = (function () {
  const async = require('async')
  const BillingActivity = require('../lib/billing-activity-model')
  const User = require('../lib/user-model')
  const support = require('../lib/support')

  const processUserStats = (gStats) => {
    var userStats = {}
    return new Promise((resolve, reject) => {
      async.eachSeries(gStats, (gStat, cbStat) => {
        User.findOne({ _id: gStat.user })
          .then((user) => {
            var userName = '**NO USER**'
            if (user) { userName = user.name }
            if (!userStats[userName]) {
              userStats[userName] = {}
            }
            support.updateStatsObj(userStats[userName], gStat.eventType, gStat.total)
            cbStat()
          })
          .catch(cbStat)
      }, (err) => {
        if (err) { return reject(err) }
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
                  { eventType: { $ne: 4 } } ] },
        { total: 0 },
        function (curr, result) { if (curr.eventType === 7) { result.total += curr.pageCount } else { result.total += 1 } },
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
    groupByUser: groupByUser,
    processUserStats: processUserStats
  }

  return mod
}())
