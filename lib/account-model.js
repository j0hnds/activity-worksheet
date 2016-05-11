"use strict"

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountSchema = new Schema({

  name: {
    type: String,
    required: true
  },

  accountType: {
    type: Schema.Types.ObjectId,
    ref: 'AccountType'
  },

  bookViewPrice: {
    type: Number,
    min: 0.0
  },

  pageViewPrice: {
    type: Number,
    min: 0.0
  },

  pagePdfPrice: {
    type: Number,
    min: 0.0
  },

  pageDownloadPrice: {
    type: Number,
    min: 0.0
  },

  hourlyPrice: {
    type: Number,
    min: 0.0
  },

  weeklyPrice: {
    type: Number,
    min: 0.0
  },

  monthlyPrice: {
    type: Number,
    min: 0.0
  },

  locked: {
    type: Boolean,
    required: true,
    default: false
  },

  projectsEnabled: {
    type: Boolean,
    required: true,
    default: false
  },

  downloadsEnabled: {
    type: Boolean,
    required: true,
    default: true
  },

  createdAt: {
    type: Date
  },

  updatedAt: {
    type: Date
  }
}, { collection: 'account' })

//
// Deal with the toJSON transformation
AccountSchema.options.toJSON = {

  transform: (doc, ret, options) => {
    ret.id = ret._id
    delete ret.__v
    delete ret._id

    return ret
  }
}

// Deal with the createdAt and updatedAt fields
AccountSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  if (!this.createdAt) {
    this.createdAt = this.updatedAt
  }
  next()
})

AccountSchema.methods.pricing = function () {
  return {
    bookViewPrice: this.bookViewPrice,
    pageViewPrice: this.pageViewPrice,
    pagePdfPrice: this.pagePdfPrice,
    pageDownloadPrice: this.pageDownloadPrice,
    hourlyPrice: this.hourlyPrice,
    weeklyPrice: this.weeklyPrice,
    monthlyPrice: this.monthlyPrice
  }
}

module.exports = mongoose.model('Account', AccountSchema)
