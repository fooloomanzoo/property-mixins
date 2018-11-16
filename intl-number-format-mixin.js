import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { safeMult, isNegative0 } from './number-utilities.js';


/**
 * Regular Expression for non numeric characters
 */
export const regexpNotInNumber = /[^\d\-+.e]/g;

/**
 * prediscovered and cached locale number-format resolved options
 * @type {Map}
 */
const knownLocaleNumberFormatOptions = new Map();

/**
 * default parse function
 * @param  {string} input
 * @return {number|undefined}  value of the parsed number
 */
const defaultParseNumber = function(input) {
  switch (typeof input) {
    case 'number':
      return input;
    case 'string':
      if (input.length !== 0)
        return input;
    case 'object':
      if (input !== null && input.valueOf) {
        return defaultParseNumber(input.valueOf());
      }
  }
}

/**
 * default format number
 * @param  {number} n
 * @return {string}   the formated number
 */
const defaultFormatNumber = function(n) {
  if (isNaN(n)) return '';
  return String(n)
}

/**
 * Mixin that provides intl-format-locale for numbers and computes some separation strings for usage (only `latn`-numeral-system is possible).
 *
 * @mixinFunction
 * @polymer
 */
export const IntlNumberFormatMixin = dedupingMixin( superClass => {

  return class extends superClass {

    constructor() {
      super();
      this.formatNumber = defaultFormatNumber.bind(this);
      this.parseNumber = defaultParseNumber.bind(this);
    }

    static get properties() {
      return {
        /**
         * The current locale
         */
        locale: {
          type: String,
          value: navigator.language
        },

        /**
         * locale separator for local decimal values
         */
        decimalSeparator: {
          type: String,
          readOnly: true
        },

        /**
         * locale separator for grouping decimal values
         */
        groupingSeparator: {
          type: String,
          readOnly: true
        },

        /**
         * The minimum number of fraction digits to use. Possible values are from 0 to 20; the default for plain number and percent formatting is 0; the default for currency formatting is the number of minor unit digits provided by the ISO 4217 currency code list (2 if the list doesn't provide that information).
         */
        minimumFractionDigits: {
          type: Number
        },

        /**
         * The maximum number of fraction digits to use. Possible values are from 0 to 20; the default for plain number formatting is the larger of minimumFractionDigits and 3; the default for currency formatting is the larger of minimumFractionDigits and the number of minor unit digits provided by the ISO 4217 currency code list (2 if the list doesn't provide that information); the default for percent formatting is the larger of minimumFractionDigits and 0.
         */
        maximumFractionDigits: {
          type: Number
        },

        /**
         * The minimum number of integer digits to use. Possible values are from 1 to 21; the default is 1.
         */
        minimumIntegerDigits: {
          type: Number
        },

        /**
         * The minimum number of significant digits to use. Possible values are from 1 to 21; the default is 1.
         */
        minimumSignificantDigits: {
          type: Number
        },

        /**
         * The maximum number of significant digits to use. Possible values are from 1 to 21; the default is minimumSignificantDigits.
         */
        maximumSignificantDigits: {
          type: Number
        },

        /**
         * unit of the output (only used when `number-style="decimal"`)
         */
        unit: {
          type: String
        },

        /**
         * the separator to separate value and unit (default: '\u202F')
         */
        unitSeparator: {
          type: String,
          value: '\u202F'
        },

        /**
         * always put the sign at the beginning
         */
        alwaysSign: {
          type: Boolean
        },

        /**
         * The formatting style to use. Possible values are "decimal" for plain number formatting, "currency" for currency formatting, and "percent" for percent formatting; the default is "decimal".
         * notice: min, max and step are not in percent (so e.g. if step is 0.01, it means that the step is 1%)
         */
        numberStyle: {
          type: String,
          value: 'decimal'
        },

        /**
         * if true the number will be grouped according to the locale.
         */
        useGrouping: {
          type: Boolean
        },

        /**
         * The currency to use in currency formatting. Possible values are the ISO 4217 currency codes, such as "USD" for the US dollar, "EUR" for the euro, or "CNY" for the Chinese RMB — see http://www.currency-iso.org/en/home/tables/table-a1.html. There is no default value; if the style is "currency", the currency property must be provided.
         */
        currency: {
          type: String
        },

        /**
         * How to display the currency in currency formatting. Possible values are "symbol" to use a localized currency symbol such as €, "code" to use the ISO currency code, "name" to use a localized currency name such as "dollar"; the default is "symbol".
         */
        currencyDisplay: {
          type: String
        },

        /**
         * number format options
         */
        _numberOptions: {
          type: Number,
          computed: '_computeNumberOptions(minimumIntegerDigits, minimumFractionDigits, maximumFractionDigits, minimumSignificantDigits, maximumSignificantDigits, useGrouping, numberStyle, currency, currencyDisplay, unit)'
        },

        /**
         * number format function
         */
        formatNumber: {
          type: Function,
          readOnly: true,
          notify: true
        },

        /**
         * function to parse the input
         */
        parseNumber: {
          type: Function,
          readOnly: true,
          notify: true
        }
      }
    }

    static get observers() {
      return [
        '_localeChanged(locale)',
        '_computeFormatNumber(locale, _numberOptions, unit, unitSeparator, alwaysSign)',
        '_computeParseNumber(decimalSeparator, groupingSeparator, _numberOptions)'
      ]
    }

    _localeChanged(locale) {
      if (!(locale && Intl.NumberFormat && Intl.NumberFormat.supportedLocalesOf(locale))) {
        this.locale = navigator.language;
        return;
      }
      // only `latn`-numeral-system is possible to parse
      const resolvedOptions = new Intl.NumberFormat(locale).resolvedOptions();
      if (resolvedOptions.numberingSystem !== 'latn') {
        // test if numbering system is part of the locale
        if (locale.indexOf('-u-') !== -1) {
          let pos;
          if ((pos = locale.indexOf('-nu-')) !== -1) {
            const end = locale.indexOf('-', pos + 4);
            if (end !== -1) {
              // `latn` is at in beetween
              this.locale = locale.slice(0, pos + 4) + 'latn' + locale.slice(end);
            } else {
              // `latn` is at end position
              this.locale = locale.slice(0, pos + 4) + 'latn';
            }
          } else {
            // numbering-system is not part of locale
            this.locale = locale + '-nu-latn';
          }
        } else {
          // locale has no modifier
          this.locale = locale + '-u-nu-latn';
        }
        return;
      }

      if (!knownLocaleNumberFormatOptions.has(locale)) {
        // decimal separator
        const numberString = (0.5).toLocaleString(locale, {
          minimumIntergerDigits: 1,
          minimumFractionsDigits: 1
        });
        const decimalSeparator = numberString[1];

        // grouping separator
        const nogroupingString = (1000000).toLocaleString(locale, {
          useGrouping: false
        });
        const groupingString = (1000000).toLocaleString(locale, {
          useGrouping: true
        });

        let groupingSeparator;
        for (let i = 0; i < nogroupingString.length; i++) {
          if (groupingString[i] !== nogroupingString[i]) {
            groupingSeparator = groupingString[i];
            break;
          }
        }

        knownLocaleNumberFormatOptions.set(locale, {
          decimalSeparator: decimalSeparator,
          groupingSeparator: groupingSeparator
        });
      }

      this.setProperties(knownLocaleNumberFormatOptions.get(locale), true);
    }

    _computeNumberOptions(minimumIntegerDigits, minimumFractionDigits, maximumFractionDigits, minimumSignificantDigits, maximumSignificantDigits, useGrouping, style, currency, currencyDisplay) {
      let options = {
        minimumIntegerDigits: minimumIntegerDigits || 1,
        minimumFractionDigits: minimumFractionDigits || 0,
        useGrouping: Boolean(useGrouping),
        style: style || 'decimal'
      }

      if (style === 'currency') {
        if (currency) {
          options.currency = currency;
          if (currencyDisplay && ['symbol', 'code', 'name'].indexOf(this.currencyDisplay) !== -1) {
            options.currencyDisplay = currencyDisplay;
          } else {
            options.currencyDisplay = new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency
            }).resolvedOptions().currencyDisplay || 'symbol';;
          }
        } else {
          console.warn('No currency is given. Using number style: \'decimal\'.');
          options.style = 'decimal';
        }
      }
      if (!isNaN(minimumFractionDigits)) {
        options.minimumFractionDigits = minimumFractionDigits >= 0 ? minimumFractionDigits : 0;
        if (!isNaN(maximumFractionDigits)) {
          options.maximumFractionDigits = Math.max(options.minimumFractionDigits, maximumFractionDigits);
        } else {
          options.maximumFractionDigits = 20;
        }
      } else if (!isNaN(maximumFractionDigits)) {
        options.maximumFractionDigits = maximumFractionDigits >= 0 ? maximumFractionDigits : 20;
      }
      if (!isNaN(minimumSignificantDigits)) {
        options.minimumSignificantDigits = minimumSignificantDigits >= 1 ? minimumSignificantDigits : 1;
        if (!isNaN(maximumSignificantDigits)) {
          options.maximumSignificantDigits = Math.max(options.minimumSignificantDigits, maximumSignificantDigits);
        }
      } else if (!isNaN(maximumSignificantDigits)) {
        options.maximumSignificantDigits = maximumSignificantDigits >= 1 ? maximumSignificantDigits : 21;
      }
      return options;
    }

    _computeFormatNumber(locale, numberOptions, unit, unitSeparator, alwaysSign) {
      if (numberOptions && numberOptions.style !== 'decimal') {
        unit = '';
      }
      const format = new Intl.NumberFormat(locale, numberOptions).format;
      let formatNumber;
      if (unit) {
        if (alwaysSign) {
          formatNumber = function(n) {
            if (isNaN(n)) return '';
            return `${n > 0 ? '+' : (n < 0 ? '' : (isNegative0(n) ? '-' : '+'))}${format(n)}${unitSeparator}${unit}`;
          }
        } else {
          formatNumber = function(n) {
            if (isNaN(n)) return '';
            return `${isNegative0(n) ? '-' : ''}${format(n)}${unitSeparator}${unit}`;
          }
        }
      } else if (alwaysSign) {
        formatNumber = function(n) {
          if (isNaN(n)) return '';
          return `${n > 0 ? '+' : (n < 0 ? '' : (isNegative0(n) ? '-' : '+'))}${format(n)}`;
        }
      } else {
        formatNumber = function(n) {
          if (isNaN(n)) return '';
          return `${isNegative0(n) ? '-' : ''}${format(n)}`;
        }
      }
      this._setFormatNumber(formatNumber);
    }

    _computeParseNumber(decimalSeparator, groupingSeparator, numberOptions) {
      const regexpGrouping = new RegExp(`[${(groupingSeparator || '')}]`, 'g');

      let translateInput;
      if (numberOptions.maximumFractionDigits === 0) {
        if (numberOptions.style === 'currency') {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return parseInt(input.replace(regexpGrouping, '').replace(regexpNotInNumber, ''));
            }
          } else {
            translateInput = function(input) {
              return parseInt(input.replace(regexpNotInNumber, ''));
            }
          }
        } else if (numberOptions.style === 'percent') {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return safeMult(parseInt(input.replace(regexpGrouping, '')), 0.01);
            }
          } else {
            translateInput = function(input) {
              return safeMult(parseInt(input), 0.01);
            }
          }
        } else {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return parseInt(input.replace(regexpGrouping, ''));
            }
          } else {
            translateInput = function(input) {
              return parseInt(input);
            }
          }
        }
      } else {
        if (numberOptions.style === 'currency') {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return parseFloat(input.replace(regexpGrouping, '').replace(decimalSeparator, '.').replace(regexpNotInNumber, ''));
            }
          } else {
            translateInput = function(input) {
              return parseFloat(input.replace(decimalSeparator, '.').replace(regexpNotInNumber, ''));
            }
          }
        } else if (numberOptions.style === 'percent') {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return safeMult(parseFloat(input.replace(regexpGrouping, '').replace(decimalSeparator, '.')), 0.01);
            }
          } else {
            translateInput = function(input) {
              return safeMult(parseFloat(input.replace(decimalSeparator, '.')), 0.01);
            }
          }
        } else {
          if (numberOptions.useGrouping) {
            translateInput = function(input) {
              return parseFloat(input.replace(regexpGrouping, '').replace(decimalSeparator, '.'));
            }
          } else {
            translateInput = function(input) {
              return parseFloat(input.replace(decimalSeparator, '.'));
            }
          }
        }
      }

      const parse = function(input) {
        switch (typeof input) {
          case 'number':
            return input;
          case 'string':
            if (input.length === 0) return;
            return translateInput(input);
          case 'object':
            if (input !== null && input.valueOf) {
              return parse(input.valueOf());
            }
        }
      }

      return this._setParseNumber(parse);
    }
  }
});
