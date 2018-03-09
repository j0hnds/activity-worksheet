'use strict'

module.exports = (function () {
  const uniqueElements = (ary) => {
    let uniqueSet = new Set(ary)
    return Array.from(uniqueSet)
  }

  const assignCountiesToActivities = (activities, bookCollection) => {
    // let i = 0
    activities.forEach((activity) => {
      if (activity._id.book) {
        let bookCounty = bookCollection.find((book) => book._id.toString() === activity._id.book.toString())
        // console.log(`${i} - bookCounty: ${JSON.stringify(bookCounty)}`)
        // i += 1
        if (bookCounty) {
          activity.county = bookCounty.county
        }
      }
    })
    return activities
    //return activities.map((activity) => {
      //let cActivity = JSON.parse(JSON.stringify(activity))

      //if (cActivity._id.book) {
        //let bookCounty = bookCollection.find((book) => book._id.toString() === cActivity._id.book)
        //if (bookCounty) {
          //cActivity.county = bookCounty.county
        //}
      //}

      //return cActivity
    //})
  }

  const summarizeActivities = (activities) => {
    let usageSummary = {
      login: 0,
      logout: 0,
      bookView: 0,
      pageView: 0,
      pdfView: 0,
      pageDownload: 0
    }

    let activityReducer = (summary, activity) => {
      switch (activity._id.eventType) {
        case 1: // Login
          summary.login++
          break
        case 2: // Logout
          summary.logout++
          break
        case 3: // Book View
          summary.bookView += activity.total
          break
        case 5: // Page View
          summary.pageView += activity.total
          break
        case 6: // PDF View
          summary.pdfView += activity.total
          break
        case 7: // Page download
          summary.pageDownload += activity.total
          break
      }

      return summary
    }

    return activities.reduce(activityReducer, usageSummary)
  }

  const summarizeActivitiesByCountyUser = (counties, userObjects, activities) => {
    return counties.map((county) => {
      let countyActivities = activities.filter((activity) => activity.county === county)
      let uniqueCountyUsers = uniqueElements(countyActivities.map((activity) => activity._id.user.toString()))
      return {
        county: county,
        userSummaries: summarizeActivitiesByUser(uniqueCountyUsers, userObjects, countyActivities)
      }
    })
  }

  const summarizeActivitiesByUser = (users, userObjects, activities) => {
    // console.log(`Users: ${JSON.stringify(users)}`)
    // console.log(`UserObjects: ${JSON.stringify(userObjects)}`)
    return users.map((user) => {
      // console.log(`Finding user: ${user}...`)
      let userObject = userObjects.find((userO) => userO._id.toString() === user.toString())
      // console.log('Finding user activities...')
      let userActivities = activities.filter((activity) => activity._id.user.toString() === user.toString())
      // console.log('Summarizing user activities...')
      let userSummary = summarizeActivities(userActivities)
      return {
        user: user,
        userName: userObject.name,
        summary: userSummary
      }
    })
  }

  var mod = {
    assignCountiesToActivities: assignCountiesToActivities,
    summarizeActivities: summarizeActivities,
    summarizeActivitiesByCountyUser: summarizeActivitiesByCountyUser,
    summarizeActivitiesByUser: summarizeActivitiesByUser,
    uniqueElements: uniqueElements
  }

  return mod
}())
