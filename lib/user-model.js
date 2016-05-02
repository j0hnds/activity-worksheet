const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

const UserSchema = new Schema({

  name: {
    type: String
  },

  email: {
    type: String,
    unique: true,
    uniqueCaseInsensitive: true,
    required: true
  },

  encryptedPassword: {
    type: String
  },

  locked: {
    type: Boolean,
    required: true,
    default: false
  },

  accountLocked: {
    type: Boolean,
    required: true,
    default: false
  },

  permissions: {
    type: Schema.Types.Mixed
  },

  termsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },

  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },

  accountOwner: {
    type: Boolean,
    required: true,
    default: false
  },

  contractor: {
    type: Boolean,
    required: true,
    default: false
  },

  createdAt: {
    type: Date
  },

  updatedAt: {
    type: Date
  }
}, { collection: 'user' })

UserSchema.plugin(uniqueValidator)

// Deal with the toJSON transformation
UserSchema.options.toJSON = {

  transform: (doc, ret, options) => {
    ret.id = ret._id
    delete ret.__v
    delete ret.encryptedPassword
    delete ret._id

    return ret
  }

}

// Deal with the createdAt and updatedAt fields
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  if (!this.createdAt) {
    this.createdAt = this.updatedAt
  }
  next()
})

// Encrypt the user's password
UserSchema.pre('save', function (next) {
  var user = this

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('encryptedPassword')) { return next() }

  bcrypt.hash(user.encryptedPassword, 10, (err, encryptedPassword) => {
    if (err) { return next(err) }
    user.encryptedPassword = encryptedPassword
    next()
  })
})

// Now add some methods
UserSchema.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.encryptedPassword, (err, valid) => {
    if (err) { return cb(err) }
    cb(null, valid)
  })
}

UserSchema.methods.isUserManager = function () {
  return this.permissions.manageUsers
}

module.exports = mongoose.model('User', UserSchema)

