/* eslint-disable linebreak-style */
import {
  MILLISECONDS_A_DAY,
  MILLISECONDS_A_HOUR,
  MILLISECONDS_A_MINUTE,
  MILLISECONDS_A_SECOND,
  MILLISECONDS_A_WEEK,
  REGEX_FORMAT
} from '../../constant'

const MILLISECONDS_A_YEAR = MILLISECONDS_A_DAY * 365
const MILLISECONDS_A_MONTH = MILLISECONDS_A_DAY * 30

const durationRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/

const unitToMS = {
  years: MILLISECONDS_A_YEAR,
  months: MILLISECONDS_A_MONTH,
  days: MILLISECONDS_A_DAY,
  hours: MILLISECONDS_A_HOUR,
  minutes: MILLISECONDS_A_MINUTE,
  seconds: MILLISECONDS_A_SECOND,
  milliseconds: 1,
  weeks: MILLISECONDS_A_WEEK
}

const isDuration = d => d instanceof Duration // eslint-disable-line no-use-before-define

let $d
let $u

const wrapper = (input, instance, unit) =>
  new Duration(input, unit, instance.$l) // eslint-disable-line no-use-before-define

const prettyUnit = unit => `${$u.p(unit)}s`
const isNegative = number => number < 0
const roundNumber = Math.trunc
const absolute = Math.abs
const getNumberUnitFormat = (number, unit) => {
  if (!number) {
    return {
      negative: false,
      format: ''
    }
  }

  return {
    negative: isNegative(number),
    format: `${absolute(number)}${unit}`
  }
}

class Duration {
  constructor(input, unit, locale) {
    this.$d = {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    }
    this.$l = locale
    if (input === undefined) {
      this.$ms = 0
      this.parseFromMilliseconds()
    }
    if (unit) {
      // return wrapper(input * unitToMS[prettyUnit(unit)], this)
      const object = {}
      object[prettyUnit(unit)] = input
      return wrapper(object, this)
    }
    if (typeof input === 'number') {
      this.$ms = input
      this.parseFromMilliseconds()
      return this
    }
    if (typeof input === 'object') {
      Object.keys(input).forEach((k) => {
        this.$d[prettyUnit(k)] = input[k]
      })
      this.calMilliseconds()
      return this
    }
    if (typeof input === 'string') {
      const d = input.match(durationRegex)
      if (d) {
        const properties = d.slice(2)
        const numberD = properties.map(value => (value != null ? Number(value) : 0));
        [
          this.$d.years,
          this.$d.months,
          this.$d.weeks,
          this.$d.days,
          this.$d.hours,
          this.$d.minutes,
          this.$d.seconds
        ] = numberD
        this.calMilliseconds()
        return this
      }
    }
    return this
  }

  calMilliseconds() {
    this.$ms = Object.keys(this.$d).reduce((total, unit) => (
      total + ((this.$d[unit] || 0) * (unitToMS[unit]))
    ), 0)
  }

  parseFromMilliseconds() {
    let { $ms } = this
    this.$d.years = roundNumber($ms / MILLISECONDS_A_YEAR)
    $ms %= MILLISECONDS_A_YEAR
    this.$d.months = roundNumber($ms / MILLISECONDS_A_MONTH)
    $ms %= MILLISECONDS_A_MONTH
    this.$d.days = roundNumber($ms / MILLISECONDS_A_DAY)
    $ms %= MILLISECONDS_A_DAY
    this.$d.hours = roundNumber($ms / MILLISECONDS_A_HOUR)
    $ms %= MILLISECONDS_A_HOUR
    this.$d.minutes = roundNumber($ms / MILLISECONDS_A_MINUTE)
    $ms %= MILLISECONDS_A_MINUTE
    this.$d.seconds = roundNumber($ms / MILLISECONDS_A_SECOND)
    $ms %= MILLISECONDS_A_SECOND
    this.$d.milliseconds = $ms
  }

  toISOString() {
    const Y = getNumberUnitFormat(this.$d.years, 'Y')
    const M = getNumberUnitFormat(this.$d.months, 'M')

    let days = +this.$d.days || 0
    if (this.$d.weeks) {
      days += this.$d.weeks * 7
    }

    const D = getNumberUnitFormat(days, 'D')
    const H = getNumberUnitFormat(this.$d.hours, 'H')
    const m = getNumberUnitFormat(this.$d.minutes, 'M')

    let seconds = this.$d.seconds || 0
    if (this.$d.milliseconds) {
      seconds += this.$d.milliseconds / 1000
    }

    const S = getNumberUnitFormat(seconds, 'S')

    const negativeMode =
      Y.negative ||
      M.negative ||
      D.negative ||
      H.negative ||
      m.negative ||
      S.negative

    const T = H.format || m.format || S.format ? 'T' : ''
    const P = negativeMode ? '-' : ''

    const result = `${P}P${Y.format}${M.format}${D.format}${T}${H.format}${m.format}${S.format}`
    return result === 'P' || result === '-P' ? 'P0D' : result
  }

  toJSON() {
    return this.toISOString()
  }

  format(formatStr) {
    const str = formatStr || 'YYYY-MM-DDTHH:mm:ss'
    const matches = {
      Y: roundNumber(this.asYears()),
      YY: $u.s(roundNumber(this.asYears()), 2, '0'),
      YYYY: $u.s(roundNumber(this.asYears()), 4, '0'),
      M: roundNumber(this.asMonths()),
      MM: $u.s(roundNumber(this.asMonths()), 2, '0'),
      D: roundNumber(this.asDays()),
      DD: $u.s(roundNumber(this.asDays()), 2, '0'),
      H: roundNumber(this.asHours()),
      HH: $u.s(roundNumber(this.asHours()), 2, '0'),
      m: roundNumber(this.asMinutes()),
      mm: $u.s(roundNumber(this.asMinutes()), 2, '0'),
      s: roundNumber(this.asSeconds()),
      ss: $u.s(roundNumber(this.asSeconds()), 2, '0'),
      SSS: $u.s(roundNumber(this.asMilliseconds()), 3, '0')
    }
    return str.replace(REGEX_FORMAT, (match, $1) => $1 || String(matches[match]))
  }

  as(unit) {
    return this.$ms / (unitToMS[prettyUnit(unit)])
  }

  get(unit) {
    let base = this.$ms
    const pUnit = prettyUnit(unit)
    if (pUnit === 'milliseconds') {
      base %= 1000
    } else if (pUnit === 'weeks') {
      base = roundNumber(base / unitToMS[pUnit])
    } else {
      base = this.$d[pUnit]
    }
    return base === 0 ? 0 : base // a === 0 will be true on both 0 and -0
  }

  add(input, unit, isSubtract) {
    const another = {}
    if (unit) {
      another[prettyUnit(unit)] = input
    } else if (isDuration(input)) {
      another.years = input.years()
      another.months = input.months()
      another.days = input.days()
      another.hours = input.hours()
      another.minutes = input.minutes()
      another.seconds = input.seconds()
      another.milliseconds = input.milliseconds()
    } else {
      return this.add.bind(this)(new Duration(input))
    }

    Object.keys(another).forEach((k) => {
      another[k] *= isSubtract ? -1 : 1
    })

    Object.keys(this.$d).forEach((k) => {
      if (another[k]) another[k] += this.$d[k]
    })

    return wrapper(another, this)
  }

  subtract(input, unit) {
    return this.add(input, unit, true)
  }

  locale(l) {
    const that = this.clone()
    that.$l = l
    return that
  }

  clone() {
    return wrapper(this.$ms, this)
  }

  humanize(withSuffix) {
    return $d()
      .add(this.$ms, 'ms')
      .locale(this.$l)
      .fromNow(!withSuffix)
  }

  milliseconds() { return this.get('milliseconds') }
  asMilliseconds() { return this.as('milliseconds') }
  seconds() { return this.get('seconds') }
  asSeconds() { return this.as('seconds') }
  minutes() { return this.get('minutes') }
  asMinutes() { return this.as('minutes') }
  hours() { return this.get('hours') }
  asHours() { return this.as('hours') }
  days() { return this.get('days') }
  asDays() { return this.as('days') }
  weeks() { return this.get('weeks') }
  asWeeks() { return this.as('weeks') }
  months() { return this.get('months') }
  asMonths() { return this.as('months') }
  years() { return this.get('years') }
  asYears() { return this.as('years') }
}

export default (option, Dayjs, dayjs) => {
  $d = dayjs
  $u = dayjs().$utils()
  dayjs.duration = function (input, unit) {
    const $l = dayjs.locale()
    return wrapper(input, { $l }, unit)
  }
  dayjs.isDuration = isDuration

  const oldAdd = Dayjs.prototype.add
  const oldSubtract = Dayjs.prototype.subtract
  Dayjs.prototype.add = function (value, unit) {
    if (isDuration(value)) {
      let endDate = dayjs(this.clone())
      if (value.years()) endDate = endDate.add(value.years(), 'years')
      if (value.months()) endDate = endDate.add(value.months(), 'months')
      if (value.days()) { endDate = endDate.add(value.days(), 'days') }
      if (value.hours()) endDate = endDate.add(value.hours(), 'hours')
      if (value.minutes()) endDate = endDate.add(value.minutes(), 'minutes')
      if (value.seconds()) endDate = endDate.add(value.seconds(), 'seconds')
      if (value.milliseconds()) endDate = endDate.add(value.milliseconds, 'milliseconds')
      return endDate
    }
    return oldAdd.bind(this)(value, unit)
  }

  Dayjs.prototype.subtract = function (value, unit) {
    if (isDuration(value)) {
      let endDate = dayjs(this.clone())
      if (value.years()) endDate = endDate.subtract(value.years(), 'years')
      if (value.months()) endDate = endDate.subtract(value.months(), 'months')
      if (value.days()) { endDate = endDate.subtract(value.days(), 'days') }
      if (value.hours()) endDate = endDate.subtract(value.hours(), 'hours')
      if (value.minutes()) endDate = endDate.subtract(value.minutes(), 'minutes')
      if (value.seconds()) endDate = endDate.subtract(value.seconds(), 'seconds')
      if (value.milliseconds()) endDate = endDate.subtract(value.milliseconds, 'milliseconds')
      return endDate
    }
    return oldSubtract.bind(this)(value, unit)
  }
}
