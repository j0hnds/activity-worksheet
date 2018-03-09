module.exports = ( () => {
  const async = require('async');
  const BillingActivity = require('../lib/billing-activity-model');
  const Account = require('../lib/account-model');
  const support = require('../lib/support');

  var processAccountStats = (aStats) => {
    var acctStats = {};
    return new Promise( (resolve, reject) => {
      async.eachSeries(aStats, (aStat, cbStat) => {
        Account.findOne({_id: aStat.account}).
          then( (account) => {
            var accountName = "**NO ACCOUNT**";
            if (account) { accountName = account.name };
            if (! acctStats[accountName]) {
              acctStats[accountName] = {};
            }
            support.updateStatsObj(acctStats[accountName], aStat.eventType, aStat.total);
            cbStat();
          }).
          catch( cbStat );
      }, (err) => {
        if (err) { return reject(err) }
        resolve(acctStats);
      });
    });
  };

  var groupByAccount = (startTime, endTime) => {
    return new Promise( (resolve, reject) => {
      BillingActivity.collection.group(
        [ 'account', 'eventType' ],
        { $and:  [ { createdAt: { $gte: startTime} },
                   { createdAt: { $lt:  endTime} },
                   { eventType: { $ne:  4 } } ] },
        { total: 0 },
        function(curr, result) { if (curr.eventType === 7) { result.total += curr.pageCount; } else { result.total += 1; } },
        null,
        null,
        {},
        function(err, values) {
          if (err) { return reject(err) }
          resolve(values);
        });
    });
  };

  var groupByAccountWOWeekend = (startTime, endTime) => {
    return new Promise( (resolve, reject) => {
      BillingActivity.collection.group(
        [ 'account', 'eventType' ],
        { $and:  [ { createdAt: { $gte: startTime} },
                   { createdAt: { $lt:  endTime} },
                   { $where: function() { return this.createdAt.getDay() > 0 && this.createdAt.getDay() < 6 }},
                   { eventType: { $ne:  4 } } ] },
        { total: 0 },
        function(curr, result) { if (curr.eventType === 7) { result.total += curr.pageCount; } else { result.total += 1; } },
        null,
        null,
        {},
        function(err, values) {
          if (err) { return reject(err) }
          resolve(values);
        });
    });
  };

  var mod = {
    groupByAccount: groupByAccount,
    groupByAccountWOWeekend: groupByAccountWOWeekend,
    processAccountStats: processAccountStats
  };

  return mod;

}());
