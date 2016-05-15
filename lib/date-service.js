'use strict'

module.exports = (function () {
  const moment = require('moment-timezone')
  const TZ = 'America/Denver'

  const firstOfCurrentMonth = (currentDate) => {
    let dt = currentDate || moment.tz(TZ)
    return dt.clone().startOf('month')
  }

  const lastOfCurrentMonth = (currentDate) => {
    return firstOfCurrentMonth(currentDate).clone().subtract(1, 'days')
  }

  const dayRange = (currentDate) => {
    let dt = currentDate || moment.tz(TZ)
    return {
      startDate: dt.clone().startOf('day'),
      endDate: dt.clone().endOf('day')
    }
  }

  const determineMonthRange = (dateInMonth) => {
    let dt = dateInMonth || moment.tz(TZ)
    return {
      startDate: dt.clone().startOf('month'),
      endDate: dt.clone().endOf('month')
    }
  }

  const determineDateRanges = (noEarlierThan, currentDate) => {
    let monthRanges = []
    let monthRange = null
    let prevDate = null
    let done = false

    monthRange = determineMonthRange(currentDate)
    monthRanges.push(monthRange)

    while (!done) {
      prevDate = monthRange.startDate.clone().subtract(1, 'days')
      // prevDate = new Date(monthRange.startDate)
      // prevDate.setHours(prevDate.getHours() - 24)
      monthRange = determineMonthRange(prevDate)
      if (monthRange.endDate.isAfter(noEarlierThan)) {
      // if (monthRange.endDate >= noEarlierThan) {
        monthRanges.push(monthRange)
      } else {
        done = true
      }
    }

    return monthRanges
  }

  const pastThreeMonths = (currentDate) => {
    let dt = currentDate || moment.tz(TZ)
    let monthRanges = []

    monthRanges.push(determineMonthRange(dt))
    monthRanges.push(determineMonthRange(monthRanges[0].startDate.clone().subtract(1, 'days')))
    monthRanges.push(determineMonthRange(monthRanges[1].startDate.clone().subtract(1, 'days')))

    return monthRanges
  }

  const pastWeekRanges = (currentDate) => {
    let dt = currentDate || moment.tz(TZ)
    let weekRanges = []

    for (let i = 7; i > 0; i--) {
      weekRanges.push(dayRange(dt.clone().subtract(i, 'days')))
    }

    return weekRanges
  }

  const parseDate = (value) => {
    return moment(value)
  }

  const today = () => {
    return moment.tz(TZ)
  }

  var mod = {
    dayRange: dayRange,
    determineDateRanges: determineDateRanges,
    determineMonthRange: determineMonthRange,
    firstOfCurrentMonth: firstOfCurrentMonth,
    lastOfCurrentMonth: lastOfCurrentMonth,
    pastThreeMonths: pastThreeMonths,
    pastWeekRanges: pastWeekRanges,
    parseDate: parseDate,
    today: today

  }

  return mod
}())
