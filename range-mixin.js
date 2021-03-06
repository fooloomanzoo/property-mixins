import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { safeAdd, safeMult, isNegative0 } from './number-utilities.js';

/**
 * mixin to provide a range behavior for a given value
 *
 * @mixinFunction
 * @polymer
 */
export const RangeMixin = dedupingMixin( superClass => { // eslint-disable-line no-unused-vars

  return class extends superClass {

    static get properties() {
      return {
        /**
         * minimal input
         * @type {number}
         */
        min: {
          type: Number
        },
        /**
         * maximal input
         * @type {number}
         */
        max: {
          type: Number
        },

        /**
         * step for changing the input (referencing to `min` or `0`)
         * @type {number}
         */
        step: {
          type: Number,
          observer: '_stepChanged'
        },

        /**
         * start where to increment the value
         * @type {number}
         */
        startAt: {
          type: Number
        },
        /**
         * value of the input
         * @type {number}
         */
        valueAsNumber: {
          type: Number,
          notify: true,
          observer: '_valueAsNumberChanged'
        },
        /**
         * default-value of the input
         * @type {number}
         */
        default: {
          type: Number,
          observer: '_defaultChanged'
        },
        /**
         * if true, the value does not revolve the range according to the maximum or the minimum
         * @type {boolean}
         */
        saturate: {
          type: Boolean,
          observer: '_updateValueAsNumber'
        },
        /**
         * if true, the value will break on 0 to -0
         * @type {boolean}
         */
        useNegativeZero: {
          type: Boolean,
          observer: '_updateValueAsNumber'
        },
        /**
         * if true, the value does not clamp according to the given step
         * @type {boolean}
         */
        noClamp: {
          type: Boolean,
          observer: '_updateValueAsNumber'
        }
      }
    }

    static get observers() {
      return [
        '_minMaxChanged(min, max)'
      ]
    }

    _minMaxChanged(min, max) {
      if (+max < +min) {
        this.setProperties({
          min: +max,
          max: +min
        })
      } else {
        this._updateValueAsNumber();
      }
    }

    _valueAsNumberChanged(valueAsNumber, oldValue) {
      if (this.__resettingValueAsNumber === true) return;
      if (this.useNegativeZero && valueAsNumber === 0 && oldValue === 0 && (1/valueAsNumber !== 1/oldValue)) { // negative to positive zero switch
        // intended switch to undefined for data-binding outside this element to be propagated
        // WARNING: might cause unexpected behaviour
        this.__resettingValueAsNumber = true;
        this.valueAsNumber = undefined; // enshure the value is reset so that data-change can take replace
        this.__resettingValueAsNumber = false;
        this.valueAsNumber = valueAsNumber;
        return;
      }
      this.valueAsNumber = this._checkValueAsNumber(valueAsNumber, oldValue);
    }

    _defaultChanged(def) {
      if (isNaN(def)) return;

      if (isNaN(this.valueAsNumber)) {
        this.valueAsNumber = def;
      }
    }

    _computeDefaultValue(value) {
      if (!isNaN(this.default)) {
        return +this.default;
      }
      return value;
    }

    _checkValueAsNumber(value, oldValue) {
      if (isNaN(value)) {
        return this._computeDefaultValue(value);
      }

      const saturate = this.saturate,
        min = this.min,
        max = this.max;

      if (!isNaN(min) && value <= min) {
        if (saturate || value === min || isNaN(max) || oldValue !== min) {
          return min;
        }
        return max;
      }
      if (!isNaN(max) && value >= max) {
        if (saturate || value === max || isNaN(min) || max !== oldValue) {
          return max;
        }
        return min;
      }
      if (this.noClamp) {
        return value;
      }
      return this._checkStep(value, this.step);
    }

    _updateValueAsNumber() {
      if (isNaN(this.valueAsNumber) && isNaN(this.default) && isNaN(this.min) && isNaN(this.max)) {
        return;
      }
      this._valueAsNumberChanged(this.valueAsNumber, this.valueAsNumber);
    }

    _checkStep(value, step) {
      if (!step) {
        return value;
      }
      const safeAdd = this._safeAdd,
        safeMult = this._safeMult;
      const _isNegative0 = (this.useNegativeZero && isNegative0(value));
      if (!isNaN(this.default)) {
        value = safeAdd(safeMult(Math.round((value - this.default) / step), step), this.default);
      } else if (!isNaN(this.min)) {
        value = safeAdd(safeMult(Math.round((value - this.min) / step), step), this.min);
      } else if (!isNaN(this.max)) {
        value = safeAdd(safeMult(-Math.round((this.max - value) / step), step), this.max);
      } else {
        value = safeMult(Math.round(value / step), step);
      }
      return (_isNegative0 && value === 0) ? -0 : value;
    }

    /**
     * Emulating handwritten multiplication to keep precision
     * @param {?number} a First summand
     * @param {?number} b Second summand
     * @return {number} Sum
     */
    _safeMult(a, b) {
      return safeMult(a, b);
    }

    /**
     * Emulating handwritten addition to keep precision
     * @param {?number} a First factor
     * @param {?number} b Second factor
     * @return {number} Product
     */
    _safeAdd(a, b) {
      return safeAdd(a, b);
    }

    _stepChanged(step) {
      step = step || 0;
      // step should be positive
      if (step !== Math.abs(step)) {
        this.step = Math.abs(step);
        return;
      }
      this._updateValueAsNumber();
    }

    /**
     * Increase value by step
     */
    increase() {
      this._increm(this.step || 1);
    }

    /**
     * Decrease value by step
     */
    decrease() {
      this._increm(-(this.step || 1));
    }

    _increm(step) {
      if (this.useNegativeZero && this.valueAsNumber === 0) {
        if ((1/this.valueAsNumber) === Infinity) { // oldValue is +0
          if (step < 0) {
            // switch to -0
            this.valueAsNumber = -0;
            return;
          }
        } else if (step > 0) {  // oldValue is -0
          // switch to +0
          this.valueAsNumber = 0;
          return;
        }
      }
      const value = +this._safeAdd(this.valueAsNumber, step);
      if (isNaN(value)) {
        if (!isNaN(this.startAt)) {
          this.valueAsNumber = +this.startAt;
        } else if (!isNaN(this.default)) {
          this.valueAsNumber = +this.default;
        } else {
          this.valueAsNumber = this.min < 0 ? 0 : this.min || 0;
        }
      } else if (this.useNegativeZero && value === 0) {
        if (step < 0) { // coming from positive
          this.valueAsNumber = 0;
        } else if (step > 0) {  // coming from negative
          this.valueAsNumber = -0;
        }
      } else {
        this.valueAsNumber = value;
      }
    }

    /**
     * overwritten of polymer to handle -0
     */
    _shouldPropertyChange(property, value, old) {
      if (this.useNegativeZero && value === 0 && old === 0) {
        // differs if sign is different
        return (1/value !== 1/old)
      }
      return super._shouldPropertyChange(property, value, old);
    }
  }
});
