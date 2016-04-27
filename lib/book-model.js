var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookSchema = new Schema({

  // The state where the book is from
  state: {
    type: String,
    required: true,
    default: 'WY'
  },

  // The county where the book is from
  county: {
    type: String,
    required: true,
    default: 'Campbell'
  },

  // The actual book number
  bookNumber: {
    type: String,
    required: true
  },

  // The original file name
  originalFileName: {
    type: String,
    required: true
  },

  // Notes that can be specified on the book. Allows the curators
  // to track what's been done and what the issues are.
  notes: {
    type: String
  },

  // Flag indicating that curation is complete
  curationComplete: {
    type: Boolean,
    required: true,
    default: false
  },

  // Flag indicating if the book is still being processed.
  processingComplete: {
    type: Boolean,
    required: true,
    default: false
  },

  fileSize: {
    type: Number
  },

  // If true, this book has been OCR'ed
  needsOCR: {
    type: Boolean,
    required: true,
    default: true
  },

  // If true, this book has been blank-page-checked
  blankChecked: {
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

}, { collection: 'book' });

// Deal with the toJSON transformation
BookSchema.options.toJSON = {

  transform: (doc, ret, options) => {
    ret.id = ret._id;
    delete ret.__v;
    delete ret.needsOCR;
    delete ret.blankChecked;
    delete ret._id;

    return ret;
  }
  
};

// Deal with the createdAt and updatedAt fields
BookSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (! this.createdAt) {
    this.createdAt = this.updatedAt;
  }
  next();
});

module.exports = mongoose.model('Book', BookSchema);
