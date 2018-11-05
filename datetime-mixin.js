import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { IntlDatetimeFormatMixin } from './intl-datetime-format-mixin.js';
import { isNegative } from './number-utilities.js';

/**
 * Regular Expression for parsing a datetime-string
 */
export const regexpDatetime = /^([+-]?\d+-?\d\d-?\d\d)?(?:T?(?:(\d\d:?\d\d(?::?\d\d(?:\.?\d\d\d)?)?)([+-]\d\d:?\d\d|Z)?)?)$/;

/**
 * Regular Expression for parsing a timezone-string
 */
export const regexpTimezone = /(?:([+-]\d\d):?(\d\d)|Z)$/;

/**
 * pad a string with 0
 * @param  {number} n         number to pad
 * @param  {number} padLength total length of strings
 * @return {string}           padded string
 */
export const pad = function(n, padLength) {
  const sign = n < 0 ? '-' : '';
  let str = '' + Math.abs(n);
  while (str.length < padLength)
    str = '0' + str;
  return sign + str;
}

/**
 * get date string from date components
 * @param  {number} year
 * @param  {number} month
 * @param  {number} day
 * @return {string}       date string
 */
export const toDateStringByComponents = function(year, month, day) {
  return pad(year, year < 0 ? 6 : 4) + '-' + pad(month, 2) + '-' + pad(day, 2);
}

/**
 * get time string from date components
 * @param  {number} hour
 * @param  {number} minute
 * @param  {number} second
 * @param  {number} millisecond
 * @return {string}             time string
 */
export const toTimeStringByComponents = function(hour, minute, second, millisecond) {
  return pad(hour || 0, 2) + ':' + pad(minute || 0, 2) + (second !== undefined ? (':' + pad(second, 2) + (millisecond !== undefined ? ('.' + pad(millisecond, 3)) : '')) : '');
}

/**
 * @typedef {object} TimeZoneProperties
 * @property {string} timezone The timezone-string
 * @property {number} offsetMinutes The offset minutes
 * @property {number} _timeZoneHours The hours of the timezone
 * @property {number} _timeZoneMinutes The minutes of the timezone
 */

 /**
  * compute the timezone properties from given offset minutes
  * @param {number} offsetMinutes The offset minutes
  * @return {TimeZoneProperties} The timezone properties
  */
export const computeTimezone = function(offsetMinutes) { // offset in minute
  if (isNaN(offsetMinutes)) {
    return {};
  }
  const offsetIsNegative = isNegative(offsetMinutes);
  if (offsetMinutes === 0) {
    return {
      timezone: '+00:00',
      offsetMinutes: offsetMinutes,
      _timeZoneHours: offsetIsNegative ? 0 : -0,
      _timeZoneMinutes: 0
    };
  }
  const hour = (offsetIsNegative ? 1 : -1) * Math.floor(Math.abs(offsetMinutes) / 60),
    minute = Math.abs(offsetMinutes) % 60;

  return {
    timezone: (offsetIsNegative ? '+' : '-') + pad(Math.abs(hour), 2) + ':' + pad(minute, 2),
    offsetMinutes: offsetMinutes,
    _timeZoneHours: hour,
    _timeZoneMinutes: minute
  }
}

/**
 * compute the timezone properties from a given timezone-string
 * @param {string} timezone The timezone-string
 * @return {TimeZoneProperties} The timezone properties
 */
export const computeTimezoneOffset = function(timezone) {
  if (timezone === 'Z') {
    return {
      timezone: '+00:00',
      offsetMinutes: 0,
      _timeZoneHours: 0,
      _timeZoneMinutes: 0
    };
  }
  const match = regexpTimezone.exec(timezone);
  if (match) {
    const hour = +match[1],
      minute = +match[2],
      hourIsNegative = isNegative(hour),
      offsetMinutes = (hourIsNegative ? 1 : -1) * (Math.abs(hour) * 60 + minute);
    if (offsetMinutes === 0) {
      return {
        timezone: '+00:00',
        offsetMinutes: offsetMinutes,
        _timeZoneHours: hourIsNegative ? -0 : 0,
        _timeZoneMinutes: 0
      };
    }
    return {
      timezone: timezone,
      offsetMinutes: offsetMinutes,
      _timeZoneHours: hour,
      _timeZoneMinutes: minute
    };
  }
}

/**
 * compute the last day of a month in a year
 * @param  {number} year  the year
 * @param  {number} month the month
 * @return {number}       the last day of the month
 */
export const maxDayOfMonth = function(year, month) {
  const d = new Date(year, month, 0);

  if (!isNaN(d)) {
    d.setFullYear(year);
    return d.getDate();
  }
  return 31;
}
/**
 * @typedef {object} DateTimezone
 * @property {Date} valueAsDate The date object
 * @property {number} offsetMinutes The offset minutes
 */

/**
 * compute a date object
 * @param  {string|number|object} datetime
 * @param  {number} offsetMinutes
 * @param  {boolean} timeOnly Defies weather the the datetime-string should be treated as timeOnly
 * @return {DateTimezone} date
 */
export const fromDatetime = function(datetime, offsetMinutes, timeOnly) {
  let d;
  switch (typeof datetime) {
    case 'object': // falls through
      if (datetime && datetime.getDate) {
        d = new Date(datetime);
      }
      break;
    case 'number':
      if (!isNaN(datetime)) {
        d = new Date(datetime);
      }
      break;
    case 'string':
      const match = regexpDatetime.exec(datetime);
      if (match) {
        d = new Date(`${match[1] || '1970-01-01'}T${match[2] || '00:00:00'}${match[3] || 'Z'}`);
        if (match[3]) {
          offsetMinutes = computeTimezoneOffset(match[3]).offsetMinutes;
        } else {
          if (isNaN(offsetMinutes)) {
            if (match[1] || !timeOnly) {
              // apply local offset minutes
              offsetMinutes = d.getTimezoneOffset();
            } else {
              offsetMinutes = 0;
            }
          }
          d.setMinutes(d.getMinutes() + offsetMinutes);
        }
      }
    }
  if (!isNaN(d)) {
    if (isNaN(offsetMinutes)) {
      offsetMinutes = d.getTimezoneOffset();
    }
  }
  return {
    valueAsDate: d,
    offsetMinutes: offsetMinutes
  }
}

/**
 * Mixin that provides datetime-properties
 *
 * @mixinFunction
 * @polymer
 *
 * @appliesMixin IntlDatetimeFormatMixin
 *
 * @demo demo/datetime-demo.html
 */
export const DatetimeMixin = dedupingMixin( superClass => {

  return class extends IntlDatetimeFormatMixin(superClass) {
    /**
     * overwritten of polymer to handle -0
     */
    _shouldPropertyChange(property, value, old) {
      if (value === 0 && old === 0) {
        // differs if sign is different
        return (1/value !== 1/old)
      }
      return super._shouldPropertyChange(property, value, old);
    }

    static get properties() {
      return {
        /**
         * The year of the selected date
         */
        year: {
          type: Number,
          notify: true
        },

        /**
         * The month of the selected date (starts with 1)
         */
        month: {
          type: Number,
          notify: true
        },

        /**
         * The day of the selected date
         */
        day: {
          type: Number,
          notify: true
        },

        /**
         * The hour of the selected time
         */
        hour: {
          type: Number,
          notify: true
        },

        /**
         * hour in 12-hour-format
         * @type {number}
         */
        hour12: {
          type: Number,
          notify: true,
          observer: '_hour12Changed'
        },

        /**
         * true, when A.M. (when `hour` < 12)
         * @type {boolean}
         */
        isAm: {
          type: Boolean,
          notify: true,
          observer: '_isAmChanged'
        },

        /**
         * The minute of the selected time
         */
        minute: {
          type: Number,
          notify: true
        },

        /**
         * The second of the selected time
         */
        second: {
          type: Number,
          notify: true
        },

        /**
         * The millisecond of the selected time
         */
        millisecond: {
          type: Number,
          notify: true
        },

        /**
         * the selected date and time (format: iso8601)
         */
        datetime: {
          type: String,
          notify: true
        },

        /**
         * the selected date (format: iso8601)
         */
        date: {
          type: String,
          notify: true
        },

        /**
         * the selected time (format: iso8601)
         */
        time: {
          type: String,
          notify: true
        },

        /**
         * The date-object of the selected date
         */
        valueAsDate: {
          type: Date,
          notify: true,
          observer: '_valueAsDateChanged'
        },

        /**
         * The value of the selected date
         */
        valueAsNumber: {
          type: Number,
          notify: true,
          observer: '_valueAsNumberChanged'
        },

        /**
         * The default value of the input, could be a number, a date-object or an iso-string in time, date or datetime-notation
         */
        default: {
          type: Object,
          observer: '_defaultChanged'
        },

        /**
         * The minimal date, could be a number, a date-object or an iso-string in time, date or datetime-notation
         */
        min: {
          type: Object,
          notify: true,
          observer: '_minChanged'
        },

        /**
         * value if the minimum date
         */
        _minValue: {
          type: Number
        },

        /**
         * The maximal date, could be a number, a date-object or an iso-string in time, date or datetime-notation
         */
        max: {
          type: Object,
          notify: true,
          observer: '_maxChanged'
        },

        /**
         * value if the maximum date
         */
        _maxValue: {
          type: Number
        },

        /**
         * when true, 12-hour time format, else 24-hour
         * @type {boolean}
         */
        hour12Format: {
          type: Boolean,
          reflectToAttribute: true,
          notify: true
        },

        /**
         * Clamp datetime to a property
         * possible values:'month', 'day', 'hour', 'minute', 'second', 'millisecond'
         */
        clamp: {
          type: String,
          notify: true,
          observer: '_clampChanged'
        },

        /**
         * The timezone offset in '±hh:mm' format
         */
        timezone: {
          type: String,
          notify: true,
          observer: '_timezoneChanged'
        },

        /**
         * The offset minutes of the set timezone
         */
        offsetMinutes: {
          type: Number,
          notify: true,
          observer: '_offsetMinutesChanged'
        },

        _timeZoneHours: {
          type: Number
        },

        _timeZoneMinutes: {
          type: Number
        },

        /**
         * The offset minute of the current datetime
         */
        _recentLocalTimezoneOffset: {
          type: Number
        },

        /**
         * if true perspective starts at 0 (1970-01-01)
         */
        _timeOnly: {
          type: Boolean,
          value: false
        },

        /**
         * if true, time will be `00:00:00.000`
         */
        _dateLocked: {
          type: Boolean,
          computed: '_ifClamped(clamp, "hour")'
        }
      }
    }

    static get observers() {
      return [
        '_computeDatetime(year, month, day, hour, minute, second, millisecond)',
        '_datetimeChanged(datetime)',
        '_dateTimeChanged(date, time)',
        '_timeZoneHoursMinutesChanged(_timeZoneHours, _timeZoneMinutes)',
        '_minMaxValueChanged(_minValue, _maxValue)'
      ]
    }

    /**
     *  Sets value to the actual date
     **/
    now() {
      let d = new Date();
      if (!this.timezone) {
        if (this._timeOnly && !this.date) {
          this.__updatingTimezoneOffset = true;
          this.offsetMinutes = 0;
          this.__updatingTimezoneOffset = false;
          d.setUTCFullYear(1970);
          d.setUTCMonth(0);
          d.setUTCDate(1);
        } else {
          this._checkDefaultTimezone(d);
        }
      }
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + this.offsetMinutes);
      this.setDate(d);
    }

    /**
     * sets date to all necessary properties
     * @param {Date} d [the date to set]
     */
    setDate(d) {
      if (!isNaN(d)) {
        d = this._checkThreshold(d);
        this._checkDefaultTimezone(d);
        let toSet = {}, value = +d;
        let offsetMinutes = this._computeTimezoneShift(d);
        if (offsetMinutes !== this.offsetMinutes) {
          // timezone shift occured
          // NOTE: timezone and offsetMinutes change before other values, so it is unsave to bind to them
          toSet = computeTimezone(offsetMinutes);
        }
        if (this.valueAsNumber !== value) {
          toSet.valueAsNumber = value;
        }
        if (+this.valueAsDate !== value) {
          toSet.valueAsDate = new Date(value);
        }
        // shift date, so that utc-date-properties are according to timezone
        let transformedDate = new Date(value);
        transformedDate.setMinutes(d.getMinutes() - offsetMinutes);

        transformedDate = this._clampUTCComponents(transformedDate, this.clamp);

        const year = transformedDate.getUTCFullYear(),
          month = transformedDate.getUTCMonth() + 1,
          day = transformedDate.getUTCDate(),
          hour = this._dateLocked ? 0 : transformedDate.getUTCHours(),
          minute = this._dateLocked ? 0 : transformedDate.getUTCMinutes(),
          second = this._dateLocked ? 0 : transformedDate.getUTCSeconds(),
          millisecond = this._dateLocked ? 0 : transformedDate.getUTCMilliseconds(),
          hour12 = (hour === 0) ? 12 : (hour > 12 ? hour - 12 : hour),
          isAm = hour < 12,
          date = toDateByComponents(year, month, day),
          time = this._dateLocked ? '00:00:00.000' : toTimeByComponents(hour, minute, second, millisecond),
          datetime = date + 'T' + time + (toSet.timezone || this.timezone);

        if(!(year === this.year && month === this.month && day === this.day && hour === this.hour && hour12 === this.hour12 && isAm === this.isAm && minute === this.minute && second === this.second && millisecond === this.millisecond)) {
          toSet.year = year;
          toSet.month = month;
          toSet.day = day;
          toSet.hour = hour;
          toSet.hour12 = hour12;
          toSet.minute = minute;
          toSet.second = second;
          toSet.millisecond = millisecond;
          toSet.isAm = isAm;
        }

        if (!(datetime === this.datetime && date === this.date && time === this.time)) {
          toSet.date = date;
          toSet.time = time;
          toSet.datetime = datetime;
        }
        this.setProperties(toSet);
      } else if (!isNaN(this._defaultValue)) {
        this.resetDate();
      }
    }

    /**
     * resets the date (if `default` is set, it will be used for the new value)
     * @param {Event} e [a causing event will not propagated]
     */
    resetDate(e) {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      this.setProperties({
        valueAsDate: undefined,
        valueAsNumber: undefined,
        datetime: undefined,
        date: undefined,
        time: undefined,
        year: undefined,
        month: undefined,
        day: undefined,
        hour: undefined,
        hour12: undefined,
        isAm: undefined,
        minute: undefined,
        second: undefined,
        millisecond: undefined,
        timezone: undefined,
        offsetMinutes: undefined,
        _timeZoneHours: undefined,
        _timeZoneMinutes: undefined,
        _recentLocalTimezoneOffset: undefined
      });
      const def = fromDatetime(this.default, undefined, this._timeOnly);
      if (!isNaN(def.valueAsDate)) {
        this.__updatingTimezoneOffset = true;
        this.setProperties(computeTimezone(def.offsetMinutes));
        this._recentLocalTimezoneOffset = def.valueAsDate.getTimezoneOffset();
        this.__updatingTimezoneOffset = false;
        this.setDate(def.valueAsDate);
      }
    }

    _defaultChanged(def) {
      if (def === undefined) {
        return;
      }
      if (isNaN(this.valueAsDate) || isNaN(this.valueAsNumber)) {
        this.resetDate();
      }
    }

    /**
     * compute date by date properties
     * @param  {number} year
     * @param  {number} month
     * @param  {number} day
     * @param  {number} hour
     * @param  {number} minute
     * @param  {number} second
     * @param  {number} millisecond
     */
    _computeDatetime(year, month, day, hour, minute, second, millisecond) {
      if (this.__updatingTimezoneOffset) {
        return;
      }
      if (isNaN(year) && isNaN(month) && isNaN(day) && isNaN(hour) && isNaN(minute) && isNaN(second) && isNaN(millisecond)) {
        if (this.valueAsDate !== undefined) {
          this.resetDate();
        }
        return;
      }
      // if existent modify the set date
      let d = new Date(this.valueAsDate);
      if (isNaN(d)) {
        d = new Date(this.valueAsNumber !== undefined ? this.valueAsNumber : this.datetime);
        if (isNaN(d)) {
          // when a component is timeOnly and no date is set
          if (this._timeOnly && !this.date) {
            if (this.time) {
              d = new Date('1970-01-01T' + this.time + 'Z');
            } else {
              d = new Date(0);
            }
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          } else if (this.date) {
            d = new Date(this.date + 'T' + (this.time || '00:00') + (this.timezone || 'Z'));
            if (!this.timezone) {
              d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            }
          }
          if (isNaN(d)) {
            d = new Date((new Date).getFullYear(), 0, 1, 0, 0, 0, 0);
          }
        }
      }
      let localTimezoneOffset = d.getTimezoneOffset();
      let offsetMinutes = this.offsetMinutes;
      if (isNaN(offsetMinutes)) {
        offsetMinutes = localTimezoneOffset;
      }
      // shift to UTC
      d.setMinutes(d.getMinutes() - offsetMinutes);

      if (year !== undefined) {
        d.setUTCFullYear(year);
      }
      if (month !== undefined) {
        d.setUTCMonth(month - 1);
      }
      if (day !== undefined) {
        d.setUTCDate(day);
      }
      if (hour !== undefined) {
        d.setUTCHours(hour);
      }
      if (minute !== undefined) {
        d.setUTCMinutes(minute);
      }
      if (second !== undefined) {
        d.setUTCSeconds(second);
      }
      if (millisecond !== undefined) {
        d.setUTCMilliseconds(millisecond);
      }
      // correct timezone shift and shift back from UTC to timezone
      d.setMinutes(d.getMinutes() + offsetMinutes - localTimezoneOffset + d.getTimezoneOffset());
      this.setDate(d);
    }

    _dateTimeChanged(date, time) {
      if (this.__updatingTimezoneOffset) {
        return;
      }

      if (date === undefined && time === undefined) {
        if (this.valueAsDate !== undefined) {
          this.resetDate();
        }
        return;
      }

      // when a component is timeOnly and date is not set use GMT
      if (!date && this._timeOnly) {
        this.__updatingTimezoneOffset = true;
        this.offsetMinutes = 0;
        this.__updatingTimezoneOffset = false;
      }

      date = date || '1970-01-01';
      time = time || '00:00:00.000';

      if (!this.timezone) {
        this._checkDefaultTimezone(new Date(date + 'T' + time + 'Z'));
      }

      this.datetime = date + 'T' + time + this.timezone;
    }

    _datetimeChanged(datetime) {
      if (this.__updatingTimezoneOffset) {
        return;
      }

      if (datetime === undefined) {
        if (this.valueAsDate !== undefined) {
          this.resetDate();
        }
        return;
      }

      if (typeof datetime === 'object' && datetime instanceof Date) {
        // 'date' is a Date Object
        this._recentLocalTimezoneOffset = datetime.getTimezoneOffset();
        this.setDate(datetime);
        return;
      }

      let d;
      const match = regexpDatetime.exec(datetime);
      if (match === null) {
        return;
      }

      if (match[3] === undefined) {
        d = new Date((match[1] || '1970-01-01') + 'T' + match[2] + 'Z');
        this._checkDefaultTimezone(d);
        d.setMinutes(d.getMinutes() + this.offsetMinutes);
      } else {
        if (match[1] === undefined) {
          match[0] = '1970-01-01T' + match[2] + match[3];
        }
        d = new Date(match[0]);
        if (match[3] !== this.timezone) {
          this.__updatingTimezoneOffset = true;
          this.setProperties(computeTimezoneOffset(match[3]));
          this.__updatingTimezoneOffset = false;
        }
      }
      this._recentLocalTimezoneOffset = d.getTimezoneOffset();
      this.setDate(d);
    }

    _valueAsNumberChanged(value) {
      if (isNaN(value) || value === '' || typeof value === 'boolean') {
        this.resetDate();
        return;
      }
      this.setDate(new Date(+value));
    }

    _valueAsDateChanged(d) {
      switch (typeof d) {
        case 'number': // falls through
        case 'string': // falls through
          d = new Date(d);
      }
      if (isNaN(d)) {
        this.resetDate();
        return;
      }
      this.setDate(new Date(d));
    }

    /**
     * test date object against thresholds
     * @param  {Date} d
     * @return {Date}   ether the threshold when the date is exceeding or the date object itself
     */
    _checkThreshold(d) {
      if (isNaN(d)) {
        return;
      }
      if (this._minValue > d) {
        return new Date(this._minValue);
      }
      if (this._maxValue < d) {
        return new Date(this._maxValue);
      }
      return d;
    }

    /**
     * clamp UTC values
     * @param  {Date} d     The Date to clamp
     * @param  {string} clamp The date component to clamp
     * @return {Date}       The clamped date
     */
    _clampUTCComponents(d, clamp) {
      switch (clamp) {
        case 'year':
        case 'month':
          d.setUTCMonth(0); // falls through
        case 'day':
          d.setUTCDate(1); // falls through
        case 'hour':
          d.setUTCHours(0); // falls through
        case 'minute':
          d.setUTCMinutes(0); // falls through
        case 'second':
          d.setUTCSeconds(0); // falls through
        case 'millisecond':
          d.setUTCMilliseconds(0);
      }
      return d;
    }

    /**
     * clamp to date component
     */
    _ifClamped(clamp, comp, hidden) {
      const features = ['month', 'day', 'hour', 'minute', 'second', 'millisecond'];
      const pos = features.indexOf(clamp);
      return hidden || (pos !== -1 && pos <= features.indexOf(comp));
    }
    /**
     * clamp to date component
     */
    _ifNotClamped(clamp, comp, hidden) {
      return !this._ifClamped(clamp, comp, hidden);
    }

    /**
     * set the default timezone if needed
     * @param  {Date} d
     */
    _checkDefaultTimezone(d) {
      if (isNaN(this.offsetMinutes) || this.timezone === undefined) {
        this.__updatingTimezoneOffset = true;
        if (this.timezone) {
          this.setProperties(computeTimezoneOffset(this.timezone));
        } else {
          this.setProperties(computeTimezone((d !== undefined ? d : new Date()).getTimezoneOffset()));
        }
        this.__updatingTimezoneOffset = false;
      }
      if (isNaN(this._recentLocalTimezoneOffset)) {
        this._recentLocalTimezoneOffset = (d !== undefined ? d : new Date()).getTimezoneOffset();
      }
    }

    /**
     * correct a timezone shift when date changes from winter to summertime (locally)
     * @param  {Date} d
     */
    _computeTimezoneShift(d) {
      const localTimezoneOffset = d.getTimezoneOffset();
      let offsetMinutes = this.offsetMinutes;

      if (this._recentLocalTimezoneOffset !== localTimezoneOffset) {
        offsetMinutes = offsetMinutes - this._recentLocalTimezoneOffset + localTimezoneOffset;
      }
      this._recentLocalTimezoneOffset = localTimezoneOffset;
      return offsetMinutes;
    }

    _clampChanged(clamp) {
      if (clamp === undefined) {
        return;
      }

      if (!isNaN(this.valueAsNumber)) {
        this.setDate(new Date(this.valueAsNumber));
      }
    }

    _minChanged(min) {
      const d = fromDatetime(min, this.offsetMinutes, this._timeOnly).valueAsDate;
      if (isNaN(d)) {
        this._minValue = undefined;
        return;
      }
      if (!isNaN(this._maxValue) && d > this._maxValue) {
        // switch min and max
        this.setProperties({
          min: this.max,
          max: min,
          _minValue: this._maxValue,
          _maxValue: +d
        });
        return;
      }
      this._minValue = +d;
    }

    _maxChanged(max) {
      const d = fromDatetime(max, this.offsetMinutes, this._timeOnly).valueAsDate;
      if (isNaN(d)) {
        this._maxValue = undefined;
        return;
      }
      if (!isNaN(this._minValue) && this._minValue > d) {
        // switch min and max
        this.setProperties({
          min: max,
          max: this.min,
          _minValue: +d,
          _maxValue: this._minValue
        });
        return;
      }
      this._maxValue = +d;
    }

    _minMaxValueChanged() {
      if (!isNaN(this.valueAsNumber)) {
        this.setDate(new Date(this.valueAsNumber));
      }
    }

    _hour12Changed(hour12, old) {
      if (hour12 === undefined || hour12 === old) return;
      /**
       * `hour12` is the hour in hour12-format, that starts is minimal 1 and maximal 12, midnight is at 12am and noon is 12pm
       */
      this.hour = (hour12 === 12) ? (this.isAm ? 0 : 12) : (this.isAm ? hour12 : hour12 + 12);
    }

    _isAmChanged(isAm, old) {
      if (isAm === undefined || isAm === old) return;

      this._hour12Changed(this.hour12);
    }

    _timezoneChanged(timezone, oldValue) {
      if (timezone === undefined) {
        if (this.valueAsDate !== undefined) {
          this.resetDate();
        }
        return;
      } else if (!(regexpTimezone.exec(timezone))) {
        if (regexpTimezone.exec(oldValue)) {
          this.setProperties(computeTimezoneOffset(oldValue));
          return;
        }
        this.setProperties(computeTimezone((isNaN(this.valueAsDate) ? new Date() : this.valueAsDate.getTimezoneOffset())));
        return;
      }
      const toSet = computeTimezoneOffset(timezone);
      if (toSet.offsetMinutes !== this.offsetMinutes || toSet.timezone !== timezone) {
        this.__updatingTimezoneOffset = true;
        this.setProperties(toSet);
        this.__updatingTimezoneOffset = false;
      } else if (this.valueAsDate) {
        // NOTE: binding to datetime and timezone properties on one element to another element could cause stackoverflow
        this.datetime = this.date + 'T' + this.time + timezone;
      }
    }

    _offsetMinutesChanged(offsetMinutes) {
      if (isNaN(offsetMinutes)) {
        return;
      }
      const toSet = computeTimezone(offsetMinutes);
      this.setProperties(toSet);
      if (this.date && this.time) {
        // NOTE: binding to datetime and timezone properties on one element to another element could cause stackoverflow
        this.datetime = this.date + 'T' + this.time + toSet.timezone;
      }
    }

    _timeZoneHoursMinutesChanged(hour, minute) {
      if (isNaN(hour) || isNaN(minute)) {
        return;
      }
      const hourIsNegative = isNegative(hour)
      if (hour === 0 && minute === 0) {
        this.setProperties({
          offsetMinutes: hourIsNegative ? 0 : -0,
          timezone: '+00:00'
        });
        return;
      }
      const offsetMinutes = (hourIsNegative ? 1 : -1) * (Math.abs(hour) * 60 + minute),
        timezone = (hourIsNegative ? '-' : '+') + pad(Math.abs(hour), 2) + ':' + pad(minute, 2);

      this.setProperties({
        offsetMinutes: offsetMinutes,
        timezone: timezone
      });
    }
  }
});
