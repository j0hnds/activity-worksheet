'use strict'
module.exports = (function () {
  const BillingActivity = require('../lib/billing-activity-model');
  const Book = require('../lib/book-model')
  const User = require('../lib/user-model')
  const filterSVC = require('./filter-utils')

  const getActivitiesForRange = (startTime, endTime) => {
    return new Promise((resolve, reject) => {
      BillingActivity.aggregate([
        {
          $match: { 
            $and: [
                    { createdAt: { $gte: startTime} }, 
                    { createdAt: { $lt:  endTime} },
                    { eventType: { $in:  [ 3, 5, 6, 7 ] } } 
            ] 
          }
        },
        {
          $group: {                                                                            
            _id: { book: "$book", user: "$user", eventType: "$eventType" },                                   
            //book: { $first: "$book" },
            //user: { $first: "$user" },
            //eventType: { $first: "$eventType" },                                               
            total: {
              $sum: {
                $cond: { if: { $eq: [ "$eventType", 7 ] }, then: "$pageCount", else: 1 }
              }
            }
          }
        }
      ],
      (err, values) => {
        if (err) return reject(err)
        resolve(values)
      })
    })
    //return BillingActivity.find({
      //$and: [
        //{ createdAt: { $gte: startTime} }, 
        //{ createdAt: { $lt:  endTime} },
        //{ eventType: { $in:  [ 3, 5, 6, 7 ] } } 
      //]}).exec()
    //return new Promise((resolve, reject) => {
      //BillingActivity.aggregate([
        //{
          //$match: { 
            //$and: [
                    //{ createdAt: { $gte: startTime} }, 
                    //{ createdAt: { $lt:  endTime} },
                    //{ eventType: { $in:  [ 3, 5, 6, 7 ] } } 
            //] 
          //}
        //},
        //{
            //$project: {
                //user: 1,
                //book: 1,
                //eventType: 1,
                //createdAt: 1,
                //pageCount: 1,
                //dow: { $dayOfWeek: "$createdAt" }
            //}
        //}
      //],
      //(err, values) => {
        //if (err) return reject(err)
        //resolve(values)
      //})
    //})
  } 

  const getSupportData = (activities) => {
    //let uniqueUsers = filterSVC.uniqueElements(activities.map((activity) => activity.user.toString()))
    //let uniqueBooks = filterSVC.uniqueElements(activities.map((activity) => activity.book.toString()))
    let uniqueUsers = filterSVC.uniqueElements(activities.map((activity) => activity._id.user.toString()))
    let uniqueBooks = filterSVC.uniqueElements(activities.map((activity) => activity._id.book.toString()))
    return User.find({ _id: { $in: uniqueUsers }})
      .select({ _id: 1, name: 1 })
      .exec()
      .then((users) => {
        return {
          userCollection: users
        }
      })
      .then((data) => {
        return Book.find({_id: { $in: uniqueBooks }})
          .select({ _id: 1, county: 1 })
          .exec()
          .then((books) => {
            data.bookCollection = books
            return data
          })
      })
      .then((data) => {
        console.log(`Found ${data.userCollection.length} users`)
        console.log(`Found ${data.bookCollection.length} books`)
        return data
      })
  }

  var mod = {
    getActivitiesForRange: getActivitiesForRange,
    getSupportData: getSupportData
  }

  return mod
}())
