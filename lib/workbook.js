'use strict'

module.exports = (function () {
  const XLSX = require('xlsx')

  const Workbook = function () {
    if (!(this instanceof Workbook)) return new Workbook()
    this.SheetNames = []
    this.Sheets = {}
  }

  const writeFile = (wb, path) => {
    XLSX.writeFile(wb, path)
  }

  const sheetFromArrayOfArrays = (data, opts) => {
    let ws = {}
    let range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } }
    for (let R = 0; R !== data.length; ++R) {
      for (let C = 0; C !== data[R].length; ++C) {
        if (range.s.r > R) range.s.r = R
        if (range.s.c > C) range.s.c = C
        if (range.e.r < R) range.e.r = R
        if (range.e.c < C) range.e.c = C
        let cell = { v: data[R][C] }
        if (cell.v == null) continue
        let cellRef = XLSX.utils.encode_cell({ c: C, r: R })

        if (typeof cell.v === 'number') cell.t = 'n'
        else if (typeof cell.v === 'boolean') cell.t = 'b'
        else if (cell.v instanceof Date) {
          cell.t = 'n'
          cell.z = XLSX.SSF._table[14]
          cell.v = datenum(cell.v)
        } else cell.t = 's'

        ws[cellRef] = cell
      }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range)
    return ws
  }

  const datenum = (v, date1904) => {
    if (date1904) v += 1462
    let epoch = Date.parse(v)
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000)
  }

  var mod = {

    Workbook: Workbook,
    sheetFromArrayOfArrays: sheetFromArrayOfArrays,
    datenum: datenum,
    writeFile: writeFile

  }

  return mod
}())
