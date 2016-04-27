module.exports = (() => {

  const firstOfCurrentMonth = (currentDate) => {
    var dt = currentDate || new Date();
    var startDate = new Date(Date.UTC(dt.getFullYear(),
                                      dt.getMonth(),
                                      1, 7, 0, 0));
    return startDate;
  };

  const lastMonth = (currentDate) => {
    var dt = firstOfCurrentMonth(currentDate);
    dt.setUTCHours(dt.getUTCHours() - 24);
    return dt;
  };

  const dayRange = (currentDate) => {
    var startDate = new Date(Date.UTC(currentDate.getFullYear(),
                                      currentDate.getMonth(),
                                      currentDate.getDate(), 7, 0, 0));
    var endDate = new Date(startDate);
    endDate.setUTCHours(endDate.getUTCHours() + 24);
    endDate.setUTCSeconds(endDate.getUTCSeconds() - 1);

    return { startDate: startDate, endDate: endDate };
  };

  const determineMonthRange = (dateInMonth) => {
    var startDate = new Date(Date.UTC(dateInMonth.getFullYear(),
                                      dateInMonth.getMonth(),
                                      1, 7, 0, 0));
    var endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    endDate.setUTCSeconds(endDate.getUTCSeconds() - 1);

    return { startDate: startDate, endDate: endDate };
  };

  const determineDateRanges = (noEarlierThan, currentDate) => {
    var monthRanges = [];
    var monthRange = null;
    var prevDate = null;
    var done = false;

    monthRange = determineMonthRange(currentDate);
    monthRanges.push(monthRange);

    while (! done) {
      prevDate = new Date(monthRange.startDate);
      prevDate.setHours(prevDate.getHours() - 24);
      monthRange = determineMonthRange(prevDate);
      if (monthRange.endDate >= noEarlierThan) {
        monthRanges.push(monthRange);
      } else {
        done = true;
      }
    }

    return monthRanges;
  };

  const determineMonthRanges = (dateInCurrentQuarter) => {
    var monthRanges = [];
    var prevDate = null;
    var monthRange = null;

    monthRange = determineMonthRange(dateInCurrentQuarter);
    monthRanges.push(monthRange);

    prevDate = new Date(monthRange.startDate);
    prevDate.setHours(prevDate.getHours() - 24);
    monthRange = determineMonthRange(prevDate);
    monthRanges.push(monthRange);

    prevDate = new Date(monthRange.startDate);
    prevDate.setHours(prevDate.getHours() - 24);
    monthRange = determineMonthRange(prevDate);
    monthRanges.push(monthRange);

    return monthRanges;
  };

  const pastWeekRanges = (time) => {
    var today = time;
    if (! time) {
      today = new Date();
    }
    console.log("Today is: %j", time);
    var weekRanges = [];
    time = new Date(Date.UTC(today.getFullYear(), 
                             today.getMonth(), 
                             today.getDate(), 
                             6 - 24 * 8, 
                             0, 
                             0));

    weekRanges.push(new Date(time));
    for (var i=0; i<7; i++) {
      time.setHours(time.getHours() + 24);
      weekRanges.push(new Date(time));
    }

    return weekRanges;
  };

  var mod = {
    dayRange: dayRange,
    determineDateRanges: determineDateRanges,
    determineMonthRange: determineMonthRange,
    determineMonthRanges: determineMonthRanges,
    firstOfCurrentMonth: firstOfCurrentMonth,
    lastMonth: lastMonth,
    pastWeekRanges: pastWeekRanges

  };

  return mod;
}());
