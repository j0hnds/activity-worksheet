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

  var mod = {
    updateStatsObj: updateStatsObj
  }

  return mod
}())
