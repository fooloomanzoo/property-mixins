import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

/**
 * Regular Expression of a duration string
 */
export const regexpDuration = /(-)?(\d+y)?(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+ms)?/g;

/**
 * computes from a number the duration string
 * @param  {number} value The duration as a number in milliseconds
 * @return {string}       The duration string
 */
export const toDurationString = function(value) {
  if (isNaN(value)) {
    return;
  }
  // one year = 365.25 days = 315576E5ms (Julian Calendar)
  const ry = value % 315576E5,
    y = (value - ry) / 315576E5,
    rw = ry % 6045E5,
    w = (ry - rw) / 6045E5,
    rd = rw % 864E5,
    d = (rw - rd) / 864E5,
    rh = rd % 36E5,
    h = (rd - rh) / 36E5,
    rm = rh % 6E4,
    m = (rh - rm) / 6E4,
    rs = rm % 1E3,
    s = (rm - rs) / 1E3;
  let ret = '';
  if (y)
    ret += y + 'y';
  if (w)
    ret += w + 'w';
  if (d)
    ret += d + 'd';
  if (h)
    ret += h + 'h';
  if (m)
    ret += m + 'm';
  if (s)
    ret += s + 's';
  if (rs)
    ret += rs + 'ms';
  return ret;
}

/**
 * computes from a duration string the number of milliseconds of the duration
 * @param  {string} valueString The duration string
 * @return {number}             The number of milliseconds of the duration
 */
export const toDurationNumber = function(valueString) {
  if (!valueString) {
    return;
  }
  const match = regexpDuration.exec(valueString);
  if (match !== null) {
    return (match[1] ? -1 : 1) * ((+match[2] || 0) * 315576E5 + (+match[3] || 0) * 6045E5 + (+match[4] || 0) * 864E5 + (+match[5] || 0) * 36E5 + (+match[6] || 0) * 6E4 + (+match[7] || 0) * 1E3 + (+match[8] || 0));
  }
}

/**
 * Mixin that extends duration properties of a time period to an element.
 *
 * @mixinFunction
 * @polymer
 */
export const DurationMixin = dedupingMixin( superClass => {

  return class extends superClass {

    static get properties() {
      return {
        /**
         * start of the time period
         */
        start: {
          type: Object
        },

        /**
         * end of the time period
         */
        end: {
          type: Object
        },

        /**
         * string representation of the time period
         */
        valueAsString: {
          type: String,
          observer: '_valueAsStringChanged'
        },

        /**
         * value of the time period in milliseconds
         */
        valueAsNumber: {
          type: Number,
          observer: '_valueAsNumberChanged'
        }
      }
    }

    static get observers() {
      return [
        '_startEndChanged(start, end)'
      ]
    }

    _startEndChanged(start, end) {
      if (typeof start === 'string') {
        start = new Date(start);
      }
      if (typeof end === 'string') {
        end = new Date(end);
      }

      if (isNaN(start) && isNaN(end)) {
        this.setProperties({
          valueAsString: '',
          value: undefined
        })
        return;
      } else if (isNaN(end) && !isNaN(this.value)) {
        this.set('end', new Date(start + this.value));
        return;
      } else if (isNaN(start) && !isNaN(this.value)) {
        this.set('start', new Date(end - this.value));
        return;
      } else if (end < start) {
        this.setProperties({
          start: end,
          end: start
        })
        return;
      }

      this.value = +end - start;
    }

    _valueAsNumberChanged(value) {
      if (value === undefined) {
        return;
      }
      if (value < 0) {
        this.value = -value;
        return;
      }

      let start = this.start,
        end = this.end;

      if (typeof start === 'string') {
        start = new Date(start);
      }
      if (typeof end === 'string') {
        end = new Date(end);
      }

      if (isNaN(start) && isNaN(end)) {
        return;
      } else if (isNaN(end)) {
        this.set('end', new Date(start + value));
        return;
      } else if (isNaN(start)) {
        this.set('start', new Date(end - value));
        return;
      } else if (end < start) {
        this.setProperties({
          start: end,
          end: start
        })
        return;
      }

      this.valueAsString = toDurationString(value);
    }

    _valueAsStringChanged(valueAsString) {
      this.value = toDurationNumber(valueAsString);
    }
  }
});
