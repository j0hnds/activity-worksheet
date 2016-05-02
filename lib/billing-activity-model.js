const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BillingActivitySchema = new Schema({

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },

  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },

  eventType: {
    type: Number,
    required: true
  },

  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book'
  },

  page: {
    type: Schema.Types.ObjectId,
    ref: 'Page'
  },

  pages: {
    type: Schema.Types.Mixed
  },

  pageCount: {
    type: Number,
    required: true,
    default: 0
  },

  createdAt: {
    type: Date
  },

  updatedAt: {
    type: Date
  }

}, { collection: 'billingactivity' })

// Deal with the toJSON transformation
BillingActivitySchema.options.toJSON = {

  transform: (doc, ret, options) => {
    ret.id = ret._id
    delete ret.__v
    delete ret._id

    return ret
  }
}

// Deal with the createdAt and updatedAt fields
BillingActivitySchema.pre('save', function (next) {
  this.updatedAt = new Date()
  if (!this.createdAt) {
    this.createdAt = this.updatedAt
  }
  next()
})

module.exports = mongoose.model('BillingActivity', BillingActivitySchema)
