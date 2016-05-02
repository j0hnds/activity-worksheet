module.exports = (function () {
  var requireDir = require('require-dir')

  var configurations = requireDir('../config')

  global.config = configurations

  global._ = require('lodash')
}())
