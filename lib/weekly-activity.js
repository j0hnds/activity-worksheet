module.exports = ( () => {

  const async = require('async');
  const BillingActivity = require('../lib/billing-activity-model');
  const User = require('../lib/user-model');
  const Book = require('../lib/book-model');
  const support = require('../lib/support');

  var getBookCounty = (bookId) => {
    if (! bookId) { return Promise.resolve({ }) }
    return Book.findOne(bookId).
      then( (book) => { 
        return { bookNumber: book.bookNumber, county: book.county }; 
      });
  };

  var processWeeklyStats = (uStats) => {
    var userStats = {}
    return new Promise( (resolve, reject) => {
      async.eachSeries(uStats, (uStat, cbStat) => {
        User.findOne({_id: uStat.user}).
          then( (user) => {
            var userName = "**NO USER**";
            if (user) { userName = user.name }
            getBookCounty(uStat.book).
              then( (bookObj) => {
                var key = userName + ',' + bookObj.bookNumber + ',' + bookObj.county;
                if (! userStats[key]) {
                  userStats[key] = {}
                }
                support.updateStatsObj(userStats[key], uStat.eventType, uStat.total);
                cbStat();
              });
          });
      }, (err) => {
        if (err) { return reject(err) }
        resolve(userStats);
      });
    });
  };

  var groupByUser = (startTime, endTime) => {
    return new Promise( (resolve, reject) => {
      BillingActivity.collection.group(
        [ 'user', 'book', 'eventType' ],
        { $and:  [ { createdAt: { $gte: startTime} },
                   { createdAt: { $lt:  endTime} },
                   { eventType: { $in:  [ 3, 5, 6, 7 ] } } ] },
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
    groupByUser: groupByUser,
    processWeeklyStats: processWeeklyStats
  };

  return mod;
}());
