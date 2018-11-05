/**
 * Utilities for number operations
 */
/**
 * emulating handwritten addition to keep precision
 * @param  {Number} a summand
 * @param  {Number} b summand
 * @return {Number}   sum
 */
export const safeAdd = function(a, b) {
  const decimalA = decimalPrecision(a),
    decimalB = decimalPrecision(b),
    decimal = Math.max(decimalA, decimalB);

  if (decimal === 0) {
    return a + b;
  }

  let whole = Math.round(Math.pow(10, decimal) * a + Math.pow(10, decimal) * b);

  const sign = isNegative(whole) ? '-' : '';
  whole = '' + Math.abs(whole);

  for (let i = whole.length; i < decimal; i++) {
    whole = '0' + whole;
  }

  return +(sign + whole.slice(0, whole.length - decimal) + '.' + whole.slice(whole.length - decimal));
}

/**
 * emulating handwritten multiplication to keep precision
 * @param  {number} a factor
 * @param  {number} b factor
 * @return {type}   product
 */
export const safeMult = function(a, b) {
  const decimalA = decimalPrecision(a),
    decimalB = decimalPrecision(b),
    decimal = decimalA + decimalB;

  if (decimal === 0) {
    return a * b;
  }
  const sign = (isNegative(a) ? !isNegative(b) : isNegative(b)) ? '-' : '';

  a = Math.round(Math.pow(10, decimalA) * Math.abs(a));
  b = '' + Math.round(Math.pow(10, decimalB) * Math.abs(b));

  let whole = 0;
  for (let i = b.length - 1; i >= 0; i--) {
    whole += a * (+b[i]);
    a *= 10;
  }
  whole = '' + whole;
  for (let i = whole.length; i < decimal; i++) {
    whole = '0' + whole;
  }
  return +(sign + whole.slice(0, whole.length - decimal) + '.' + whole.slice(whole.length - decimal));
}

/**
  * get decimal precision of a number (of decimal and exponential notation)
  * @param  {number} a [number]
  * @return {type}   [precision]
 **/
export const decimalPrecision = function(a) {
  const exp_parts = (a || 0).toExponential().split('e');
  // in exponential notation: exponential part + decimal part
  const precision = -exp_parts[1] + (exp_parts[0].slice(exp_parts[0].indexOf('.')).length - 1)
  return precision > 0 ? precision : 0
}

/**
 * mathematical modulor
 * @param  {Number} dividend
 * @param  {Number} divisor
 * @return {Number}
 */
export const mathMod = function(dividend, divisor) {
  return ((dividend % divisor) + divisor) % divisor;
}

/**
 * clamp to 0 or 1
 * @param  {Number} n
 * @return {Number}
 */
export const normalizedClamp = function(n) {
  return n > 1 ? 1 : n < 0 ? 0 : n;
}

/**
 * computes, if a number is negative (including -0)
 * @param  {Number} n
 * @return {Boolean}
 */
export const isNegative = function(n) {
  return n < 0 || 1/n === -Infinity;
}

/**
 * computes if a number is negative zero
 * @param  {Number} n
 * @return {Boolean}
 */
export const isNegative0 = function(n) {
  return n === 0 && (1/n) === -Infinity;
}
