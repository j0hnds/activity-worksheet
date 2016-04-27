#!/usr/bin/env node

/**
 * Invoke this to generate the activity spreadsheets.
 */

const mongoose = require('mongoose');
require('../lib/bootstrap');
const workbook = require('../lib/workbook');

mongoose.connect(config.database.url);

const BillingActivity = require('../lib/billing-activity-model');

const groupByUser = function(startTime, endTime) {
  console.log("From: %j to %j", startTime, endTime);
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

groupByUser(new Date(2015, 0, 1), new Date(2016, 3, 24)).
  then( (gStats) => { 
    console.log("Stats: %j", gStats); 

    var data = [ [ "User", "Event Type", "Total" ] ];
    for (var i=0; i<gStats.length; i++) {
      data.push([ gStats[i].user, gStats[i].eventType, gStats[i].total ]);
    }
    var ws_name = "User Activity";

    var wb = new workbook.Workbook(), ws = workbook.sheet_from_array_of_arrays(data);

    /* add worksheet to workbook */
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;

    /* write file */
    workbook.writeFile(wb, 'test.xlsx');

    process.exit();
  });

/* original data */
// var data = [[1,2,3],[true, false, null, "sheetjs"],["foo","bar",new Date("2014-02-19T14:30Z"), "0.3"], ["baz", null, "qux"]]

