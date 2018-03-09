module.exports = ( () => {

  const async = require('async');
  const BillingActivity = require('../lib/billing-activity-model');
  const User = require('../lib/user-model');
  const support = require('../lib/support');

  const processUserStats = (gStats) => {
    var userStats = {};
    return new Promise( (resolve, reject) => {
      async.eachSeries(gStats, (gStat, cbStat) => {
        User.findOne({_id: gStat.user}).
          then( (user) => {
            var userName = "**NO USER**";
            if (user) { userName = user.name };
            if (! userStats[userName]) {
              userStats[userName] = {};
            }
            support.updateStatsObj(userStats[userName], gStat.eventType, gStat.total);
            cbStat();
          }).
          catch( cbStat );
      }, (err) => {
        if (err) { return reject(err) }
        resolve(userStats);
      });
    });
  };

  const groupByUser = (startTime, endTime) => {
    return new Promise( (resolve, reject) => {
      BillingActivity.collection.group(
        [ 'user', 'eventType' ],
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

  const groupByUserWOWeekend = (startTime, endTime) => {
    return new Promise( (resolve, reject) => {
      BillingActivity.aggregate([
        {
          $match: { 
            $and: [
                    { createdAt: { $gte: startTime} }, 
                    { createdAt: { $lt:  endTime} },
                    { eventType: { $ne:  4 } } 
            ] 
          }
        },
        {
            $project: {
                user: 1,
                eventType: 1,
                createdAt: 1,
                pageCount: 1,
                dow: { $dayOfWeek: "$createdAt" }
            }
        },
        {
            $match: {
                dow: { $in: [ 2, 3, 4, 5, 6 ] }
            }
        },
        {
          $group: {
            _id: { user: "$user", eventType: "$eventType" },
            user: { $first: "$user" },
            eventType: { $first: "$eventType" },
            total: { 
              $sum: {
                $cond: { if: { $eq: [ "$eventType", 7 ] }, then: "$pageCount", else: 1 }
              }
            }
          }
        }
      ],
      function(err, values) {
        if (err) { return reject(err) }
        resolve(values)
      })
      //BillingActivity.collection.group(
        //[ 'user', 'eventType' ],
        //{ $and:  [ { createdAt: { $gte: startTime} }, 
                   //{ createdAt: { $lt:  endTime} },
                   //{ eventType: { $ne:  4 } } ] },
        //{ total: 0 },
        //function(curr, result) { if (curr.eventType === 7) { result.total += curr.pageCount; } else { result.total += 1; } },
        //null,
        //null,
        //{},
        //function(err, values) {
          //if (err) { return reject(err) }
          //resolve(values);
        //});
    });
  };

  var mod = {
    groupByUser: groupByUser,
    groupByUserWOWeekend: groupByUserWOWeekend,
    processUserStats: processUserStats
  };

  return mod;

}());
