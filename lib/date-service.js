"use strict"

module.exports = (function () {
  const firstOfCurrentMonth = (currentDate) => {
    let dt = currentDate || new Date()
    let startDate = new Date(Date.UTC(dt.getFullYear(),
                                      dt.getMonth(),
                                      1, 7, 0, 0))
    return startDate
  }

  const lastMonth = (currentDate) => {
    let dt = firstOfCurrentMonth(currentDate)
    dt.setUTCHours(dt.getUTCHours() - 24)
    return dt
  }

  const dayRange = (currentDate) => {
    let startDate = new Date(Date.UTC(currentDate.getFullYear(),
                                      currentDate.getMonth(),
                                      currentDate.getDate(), 7, 0, 0))
    let endDate = new Date(startDate)
    endDate.setUTCHours(endDate.getUTCHours() + 24)
    endDate.setUTCSeconds(endDate.getUTCSeconds() - 1)

    return { startDate: startDate, endDate: endDate }
  }

  const determineMonthRange = (dateInMonth) => {
    let startDate = new Date(Date.UTC(dateInMonth.getFullYear(),
                                      dateInMonth.getMonth(),
                                      1, 7, 0, 0))
    let endDate = new Date(startDate)
    endDate.setUTCMonth(endDate.getUTCMonth() + 1)
    endDate.setUTCSeconds(endDate.getUTCSeconds() - 1)

    return { startDate: startDate, endDate: endDate }
  }

  const determineDateRanges = (noEarlierThan, currentDate) => {
    let monthRanges = []
    let monthRange = null
    let prevDate = null
    let done = false

    monthRange = determineMonthRange(currentDate)
    monthRanges.push(monthRange)

    while (!done) {
      prevDate = new Date(monthRange.startDate)
      prevDate.setHours(prevDate.getHours() - 24)
      monthRange = determineMonthRange(prevDate)
      if (monthRange.endDate >= noEarlierThan) {
        monthRanges.push(monthRange)
      } else {
        done = true
      }
    }

    return monthRanges
  }

  const determineMonthRanges = (dateInCurrentQuarter) => {
    let monthRanges = []
    let prevDate = null
    let monthRange = null

    monthRange = determineMonthRange(dateInCurrentQuarter)
    monthRanges.push(monthRange)

    prevDate = new Date(monthRange.startDate)
    prevDate.setHours(prevDate.getHours() - 24)
    monthRange = determineMonthRange(prevDate)
    monthRanges.push(monthRange)

    prevDate = new Date(monthRange.startDate)
    prevDate.setHours(prevDate.getHours() - 24)
    monthRange = determineMonthRange(prevDate)
    monthRanges.push(monthRange)

    return monthRanges
  }

  const pastWeekRanges = (time) => {
    let today = time || new Date()
    let weekRanges = []
    time = new Date(Date.UTC(today.getFullYear(),
                             today.getMonth(),
                             today.getDate(),
                             6 - 24 * 7,
                             0,
                             0))

    weekRanges.push(new Date(time))
    for (let i = 0; i < 7; i++) {
      time.setHours(time.getHours() + 24)
      weekRanges.push(new Date(time))
    }

    let ranges = []
    for (let i = 0; i < 7; i++)
      ranges.push({ from: weekRanges[i], to: weekRanges[i + 1] })
    
    return ranges
  }

  const parseDate = (value) => {
    return new Date(Date.parse(value))
  }

  var mod = {
    dayRange: dayRange,
    determineDateRanges: determineDateRanges,
    determineMonthRange: determineMonthRange,
    determineMonthRanges: determineMonthRanges,
    firstOfCurrentMonth: firstOfCurrentMonth,
    lastMonth: lastMonth,
    pastWeekRanges: pastWeekRanges,
    parseDate: parseDate

  }

  return mod
}())
