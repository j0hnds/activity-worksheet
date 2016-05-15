'use strict'

const test = require('blue-tape')
const dateSVC = require('../lib/date-service')
const moment = require('moment-timezone')

test('firstOfCurrentMonth', (assert) => {
  let testDate = moment.tz([ 2016, 2, 14 ], 'America/Denver')
  let focm = dateSVC.firstOfCurrentMonth(testDate)

  assert.deepEqual(
    focm.toArray(),
    [ testDate.year(), testDate.month(), 1, 0, 0, 0, 0 ],
    'All date/time components must match first day of month')

  assert.end()
})

test('lastOfCurrentMonth', (assert) => {
  let testDate = moment.tz([ 2016, 2, 14 ], 'America/Denver')
  let lm = dateSVC.lastOfCurrentMonth(testDate)

  assert.deepEqual(
    lm.toArray(),
    [ testDate.year(), testDate.month() - 1, lm.date(), 0, 0, 0, 0 ],
    'All date/time components must match last day of previous month')

  assert.ok(
    lm.date() >= 28,
    'Must be a reasonable day of the month')

  assert.end()
})

test('dayRange', (assert) => {
  let testDate = moment.tz([ 2016, 2, 14, 8, 14, 23 ], 'America/Denver')
  let dr = dateSVC.dayRange(testDate)

  assert.deepEqual(
    dr.startDate.toArray(),
    [ testDate.year(), testDate.month(), testDate.date(), 0, 0, 0, 0 ],
    'Must match start of today at midnight')

  assert.deepEqual(
    dr.endDate.toArray(),
    [ testDate.year(), testDate.month(), testDate.date(), 23, 59, 59, 999 ],
    'Must match end of today just before midnight')

  assert.end()
})

test('determineMonthRange', (assert) => {
  let testDate = moment.tz([ 2016, 2, 14, 8, 14, 23 ], 'America/Denver')
  let mr = dateSVC.determineMonthRange(testDate)

  assert.deepEqual(
    mr.startDate.toArray(),
    [ testDate.year(), testDate.month(), 1, 0, 0, 0, 0 ],
    'Must be first day of month at midnite')

  assert.deepEqual(
    mr.endDate.toArray(),
    [ testDate.year(), testDate.month(), 31, 23, 59, 59, 999 ],
    'Must be last day of month just before midnight')

  assert.end()
})

test('determineDateRanges', (assert) => {
  let testDate = moment.tz([ 2016, 1, 14, 8, 14, 23 ], 'America/Denver')
  let noEarlierThan = moment.tz([ 2015, 10, 14, 8, 14, 23 ], 'America/Denver')

  let ranges = dateSVC.determineDateRanges(noEarlierThan, testDate)

  assert.equal(
    ranges.length,
    4,
    'Should be four months worth of ranges')

  assert.deepEqual(
    ranges[0].startDate.toArray(),
    [ testDate.year(), testDate.month(), 1, 0, 0, 0, 0 ],
    'Must match the start date of the current month')

  assert.deepEqual(
    ranges[0].endDate.toArray(),
    [ testDate.year(), testDate.month(), 29, 23, 59, 59, 999 ],
    'Must match the end date of the current month')

  assert.deepEqual(
    ranges[1].startDate.toArray(),
    [ testDate.year(), 0, 1, 0, 0, 0, 0 ],
    'Must match the start date of the current month')

  assert.deepEqual(
    ranges[1].endDate.toArray(),
    [ testDate.year(), 0, 31, 23, 59, 59, 999 ],
    'Must match the end date of the current month')

  assert.deepEqual(
    ranges[2].startDate.toArray(),
    [ 2015, 11, 1, 0, 0, 0, 0 ],
    'Must match the start date of the current month')

  assert.deepEqual(
    ranges[2].endDate.toArray(),
    [ 2015, 11, 31, 23, 59, 59, 999 ],
    'Must match the end date of the current month')

  assert.deepEqual(
    ranges[3].startDate.toArray(),
    [ 2015, 10, 1, 0, 0, 0, 0 ],
    'Must match the start date of the current month')

  assert.deepEqual(
    ranges[3].endDate.toArray(),
    [ 2015, 10, 30, 23, 59, 59, 999 ],
    'Must match the end date of the current month')

  assert.end()
})

test('pastThreeMonths', (assert) => {
  let testDate = moment.tz([ 2016, 1, 14, 8, 14, 23 ], 'America/Denver')

  let months = dateSVC.pastThreeMonths(testDate)

  assert.deepEqual(
    months[0].startDate.toArray(),
    [ 2016, 1, 1, 0, 0, 0, 0 ],
    'Must be first day of current month')

  assert.deepEqual(
    months[0].endDate.toArray(),
    [ 2016, 1, 29, 23, 59, 59, 999 ],
    'Must be last day of current month')

  assert.deepEqual(
    months[1].startDate.toArray(),
    [ 2016, 0, 1, 0, 0, 0, 0 ],
    'Must be first day of previous month')

  assert.deepEqual(
    months[1].endDate.toArray(),
    [ 2016, 0, 31, 23, 59, 59, 999 ],
    'Must be last day of previous month')

  assert.deepEqual(
    months[2].startDate.toArray(),
    [ 2015, 11, 1, 0, 0, 0, 0 ],
    'Must be first day of pen-previous month')

  assert.deepEqual(
    months[2].endDate.toArray(),
    [ 2015, 11, 31, 23, 59, 59, 999 ],
    'Must be last day of pen-previous month')

  assert.end()
})

test('pastWeekRanges', (assert) => {
  let testDate = moment.tz([ 2016, 1, 14, 8, 14, 23 ], 'America/Denver')
  let ranges = dateSVC.pastWeekRanges(testDate)

  for (let i = 0; i < 7; i++) {
    assert.deepEqual(
      ranges[i].startDate.toArray(),
      [ 2016, 1, 7 + i, 0, 0, 0, 0 ],
      `Must be start of day ${i} of week`)

    assert.deepEqual(
      ranges[i].endDate.toArray(),
      [ 2016, 1, 7 + i, 23, 59, 59, 999 ],
      `Must be end of day ${i} week`)
  }

  assert.end()
})
