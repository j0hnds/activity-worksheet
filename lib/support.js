"use strict"

module.exports = (function () {
  const updateStatsObj = (statsObj, eventType, count) => {
    switch (eventType) {
      case 1:
        statsObj.login = count
        break
      case 2:
        statsObj.logout = count
        break
      case 3:
        statsObj.bookView = count
        break
      case 5:
        statsObj.pageView = count
        break
      case 6:
        statsObj.pdfView = count
        break
      case 7:
        statsObj.pageDownload = count
        break
    }
  }

  const calculateResult = function (curr, result) {
    if (curr.eventType === 7) {
      result.total += curr.pageCount
    } else {
      result.total += 1
    }
  }

  var mod = {
    calculateResult: calculateResult,
    updateStatsObj: updateStatsObj
  }

  return mod
}())
