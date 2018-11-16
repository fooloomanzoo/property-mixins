import {
  dedupingMixin
} from '@polymer/polymer/lib/utils/mixin.js';
import {
  safeAdd,
  safeMult,
  normalizedClamp,
  mathMod
} from './number-utilities.js';

/**
 * @typedef {Object} rgbObject rgb object
 * @property {Number} r - The red part of the rgb color
 * @property {Number} g - The green part of the rgb color
 * @property {Number} b - The blue part of the rgb color
 */

/**
 * @typedef {Object} hslObject hsl object
 * @property {Number} h The hue part of the hsl color
 * @property {Number} s The saturation part of the hsl color
 * @property {Number} l The lightness part of the hsl color
 */

/**
 * generate random rgb-color
 * @return {rgbObject} rgb-color object
 */
export const randomRgb = function() {
  return {
    r: Math.round(255 * Math.random()),
    g: Math.round(255 * Math.random()),
    b: Math.round(255 * Math.random())
  };
}

/**
 * RegularExpression for parsing color strings by format
 */
export const regexpRgb = /^\s*rgb(a)?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)(?:\s*,\s*(-?\d*(?:\.(?:\d*)?)?))?\s*\)\s*$/;
export const regexpHsl = /^\s*hsl(a)?\(\s*(-?\d+(?:\.\d*)?)\s*,\s*(-?\d*(?:\.(?:\d*)?)?%?)\s*,\s*(-?\d*(?:\.(?:\d*)?)?%?)(?:\s*,\s*(-?\d*(?:\.(?:\d*)?)?))?\s*\)\s*$/;
export const regexpHex = /^\s*(?:(#[A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?|(#[A-Fa-f0-9]{3})([A-Fa-f0-9])?)\s*$/;
export const regexpAuto = /^\s*(?:[\w]*|#[A-Fa-f0-9]{3,8}|rgba?\([\d,.\s]+\)|hsla?\([\d,.%\s]+\))\s*$/;

/**
 * RegularExpression for percent
 */
export const regexpPercent = /(-?\d*(?:\.(?:\d*)?)?)%/;

/**
 * normalize rgb properties
 * @param  {rgbObject} rgb - The rgb-object of which the values should be normalized
 * @return {rgbObject}     The normalized rgb-object.
 */
export const normalizeRgb = function(rgb) {
  rgb.r = mathMod(Math.round(rgb.r), 256);
  rgb.g = mathMod(Math.round(rgb.g), 256);
  rgb.b = mathMod(Math.round(rgb.b), 256);
  return rgb;
}

/**
 * normalize hsl values
 * @param  {hslObject} hsl - The hsl-object of which the values should be normalized
 * @param  {number} hslPrecision - The precision of the hsl properties
 * @return {hslObject}     The normalized hsl-object.
 */
export const normalizeHsl = function(hsl, hslPrecision) {
  hslPrecision = hslPrecision || 0;
  hsl.h = mathMod(+(+hsl.h).toFixed(hslPrecision), 360);
  hsl.s = normalizedClamp(+(+hsl.s).toFixed(hslPrecision + 2));
  hsl.l = normalizedClamp(+(+hsl.l).toFixed(hslPrecision + 2));
  return hsl;
}

/**
 * convert hex to rgb
 * @param  {string} hex The hex string without alpha
 * @return {rgbObject}     the rgb object
 */
export const hexToRgb = function(hex) {
  if (hex === undefined) {
    return;
  }
  hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
  }
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16)
  };
}

/**
 * convert rgb component to partial hex-string
 * @param  {number} component rgb-component
 * @return {string} hex-string
 */
const rgbComponentToHex = function(component) {
  const _hex = component.toString(16);
  if (_hex.length === 1) {
    return `0${_hex}`;
  } else {
    return _hex.slice(0, 2);
  }
}

/**
 * convert hex to rgb
 * @param  {string} hex The hex string without alpha
 * @return {rgbObject}     the rgb object
 */
export const rgbToHex = function(rgb) {
  if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) {
    return;
  }
  return '#' + rgbComponentToHex(Math.round(rgb.r)) + rgbComponentToHex(Math.round(rgb.g)) + rgbComponentToHex(Math.round(rgb.b));
}

/**
 * convert rgb to hsl (the values are not rounded)
 * @param  {rgbObject} rgb  rgb object
 * @param  {Number} defaultH hue to set if saturation is 0
 * @return {hslObject}      hsl object
 */
export const rgbToHsl = function(rgb, defaultH) {
  if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) {
    return;
  }
  const max = Math.max(rgb.r, rgb.g, rgb.b),
    min = Math.min(rgb.r, rgb.g, rgb.b);

  const l = (max + min) / (2 * 255);
  const _c = max - min; // not-normalized chroma (for precision)

  if (_c === 0) {
    return {
      h: defaultH || 0,
      s: 0,
      l: normalizedClamp(l)
    };
  }

  const s = _c / (255 - Math.abs(max + min - 255));
  let h;
  switch (max) {
    case rgb.r:
      h = ((rgb.g - rgb.b) * 60) / _c;
      break;
    case rgb.g:
      h = (((rgb.b - rgb.r) * 60) / _c) + 120;
      break;
    case rgb.b:
      h = (((rgb.r - rgb.g) * 60) / _c) + 240;
      break;
  }
  return {
    h: mathMod(h, 360),
    s: normalizedClamp(s),
    l: normalizedClamp(l)
  };
}


/**
 * hsl component to rgb component, part of hsl to rgb algorithm
 * @param  {number} t1
 * @param  {number} t2
 * @param  {number} t3
 * @return {number} rgb component
 */
const hslComponentToRgbComponent = function(t1, t2, t3) {
  if (t3 < 0) t3 += 360;
  if (t3 >= 360) t3 -= 360;
  if (t3 < 60) return (((t2 - t1) * t3) / 60 + t1);
  else if (t3 < 180) return t2;
  else if (t3 < 240) return (((t2 - t1) * (240 - t3)) / 60 + t1);
  else return t1;
}

/**
 * convert hsl to rgb (the values are not rounded)
 * @param  {hslObject} hsl  hsl object
 * @return {rgbObject}      rgb object
 */
export const hslToRgb = function(hsl) { // not rounded yet
  if (isNaN(hsl.h) || isNaN(hsl.s) || isNaN(hsl.l)) {
    return;
  }
  const t2 = ((hsl.l <= 0.5) ? hsl.l * (hsl.s + 1) : hsl.l + hsl.s - (hsl.l * hsl.s)) * 255,
    t1 = hsl.l * 2 * 255 - t2;
  return {
    r: mathMod(hslComponentToRgbComponent(t1, t2, hsl.h + 120), 256),
    g: mathMod(hslComponentToRgbComponent(t1, t2, hsl.h), 256),
    b: mathMod(hslComponentToRgbComponent(t1, t2, hsl.h - 120), 256)
  };
}

/**
 * convert alpha number to hex-alpha-string
 * @param  {number} alpha  The alpha number
 * @param  {number} length The expected string length
 * @return {string}        The computed hex-alpha-string
 */
export const alphaToHex = function(alpha, length) {
  const base = Math.pow(16, length) - 1;
  let hex = (Math.round(alpha * base)).toString(16);
  while (length > hex.length)
    hex = '0' + hex;
  return hex;
}

/**
 * convert hex-alpha-string to alpha number
 * @param  {string} hex    The hex-alpha-string
 * @param  {number} length The concidered string length
 * @return {number}        The computed alpha number
 */
export const hexToAlpha = function(hex, length) {
  const base = Math.pow(16, length) - 1;
  // rounding, because browser do use for
  return safeMult(Math.round(100 * (parseInt(hex, 16) / base)), 0.01);
}

/**
 * compute rgb color properties by data from CanvasContext.getImageData()
 *  @class imgData
 *  @param {Uint8ClampedArray} data The image data created by CanvasContext.getImageData()
 *  @property {number} r The red color rgb property
 *  @property {number} g The green color rgb property
 *  @property {number} b The blue color rgb property
 *  @property {number} alpha The alpha property
 *  @property {boolean} alphaMode True if alpha is unequal 1
 */
function imgData(data) {
  return {
    r: data[0],
    g: data[1],
    b: data[2],
    alpha: hexToAlpha(data[3].toString(16), 2),
    alphaMode: data[3] !== 255
  };
}

/**
 * test a color string in local browser environment
 * @param {CanvasRenderingContext2D} canvasContext The canvas context to test on
 * @param {string} colorString The color string to tests
 * @return {imgData} The resulted color data of the test
 */
export const testColor = function(canvasContext, colorString) {
  // NOTE: if the color string is not valid, the fill of the canvas might not change
  canvasContext.clearRect(0, 0, 1, 1);
  canvasContext.fillStyle = colorString || '#000';
  canvasContext.fillRect(0, 0, 1, 1);
  const data = canvasContext.getImageData(0, 0, 1, 1).data;
  canvasContext.clearRect(0, 0, 1, 1);
  return imgData(data)
}

/**
 * Mixin that provides web-color-properties. Its `color-string` converts automatically beetween different formats (hex, rgb and hsl) and provides an alpha-colorString.
 *
 * @mixinFunction
 * @polymer
 *
 * @demo demo/color-demo.html
 */
export const ColorMixin = dedupingMixin(superClass => {

  return class extends superClass {

    constructor() {
      super();
      this._validFormats = ['rgb', 'hex', 'hsl', 'auto'];
      this.randomColor = this.randomColor.bind(this);
      this.resetColor = this.resetColor.bind(this);
    }

    static get properties() {
      return {
        /**
         * Hex-color
         */
        hex: {
          type: String,
          notify: true,
          observer: '_hexChanged'
        },

        /**
         * Red
         */
        r: {
          type: Number,
          notify: true
        },

        /**
         * Green
         */
        g: {
          type: Number,
          notify: true
        },

        /**
         * Blue
         */
        b: {
          type: Number,
          notify: true
        },

        /**
         * Hue
         */
        h: {
          type: Number,
          notify: true
        },

        /**
         * Saturation (hsl)
         */
        s: {
          type: Number,
          notify: true
        },

        /**
         * Lightness
         */
        l: {
          type: Number,
          notify: true
        },

        /**
         * Alpha
         */
        alpha: {
          type: Number,
          notify: true,
          value: 1,
          observer: '_alphaChanged'
        },

        /**
         * if true, colorString has alpha
         */
        alphaMode: {
          type: Boolean,
          notify: true,
          observer: '_alphaModeChanged'
        },

        /**
         * if true, alpha won't be used
         */
        withoutAlpha: {
          type: Boolean,
          observer: '_withoutAlphaChanged'
        },

        /**
         * Precision of hsl-colorStrings, if the format is 'hsl' (for saturation and lightness it is applied according to their percentage colorString)
         */
        hslPrecision: {
          type: Number,
          value: 0
        },

        /**
         * format of the colorString (possible colorStrings: 'rgb', 'hex', 'hsl', 'auto')
         */
        format: {
          type: String,
          notify: true,
          value: 'auto',
          observer: '_formatChanged'
        },

        /**
         * format is locked and does not switch according to the colorString
         */
        fixedFormat: {
          type: Boolean
        },

        /**
         * if true, hex alpha is supported by the browser
         */
        _hexAlphaSupported: {
          type: Boolean,
          readOnly: true
        },

        /**
         * value as color-string
         */
        colorString: {
          type: String,
          notify: true,
          observer: '_colorStringChanged'
        }
      }
    }

    static get observers() {
      return [
        '_rgbChanged(r, g, b)',
        '_hslChanged(h, s, l)'
      ];
    }

    ready() {
      super.ready();
      this._createTestCanvas();
    }

    /**
     * generate random color
     */
    randomColor() {
      this.__updateByColorString = this.__updateByColorProperties = false;
      this.setProperties(randomRgb());
    }

    /**
     * reset all color properties
     */
    resetColor() {
      this.__updateByColorString = this.__updateByColorProperties = false;
      this.setProperties({
        colorString: undefined,
        r: undefined,
        g: undefined,
        b: undefined,
        h: undefined,
        s: undefined,
        l: undefined,
        hex: undefined,
        alpha: undefined
      })
    }

    /**
     * creates a canvas for testing a color string and browser capabilities
     */
    _createTestCanvas() {
      const testcanvas = document.createElement('canvas');
      testcanvas.width = 1;
      testcanvas.height = 1;
      testcanvas.style.visibility = 'hidden';
      testcanvas.style.pointerEvents = 'none';
      testcanvas.style.position = 'fixed';
      this.appendChild(testcanvas);
      this._testCanvasContext = testcanvas.getContext("2d");
      this._testCanvasContext.beginPath();
      // test if `#rrggbbaa` is supported
      const rgba = testColor(this._testCanvasContext, '#00000000');
      this._set_hexAlphaSupported(rgba.alpha === 0);
    }

    _colorStringChanged(colorString) {
      if (!colorString || typeof colorString !== 'string') {
        this.resetColor();
        return;
      }
      let toSet = {},
        match,
        format,
        fixedFormat = this.fixedFormat;
      // input-format detection

      // hsl-format
      if (match = colorString.match(regexpHsl)) {
        format = 'hsl';
        if (this.withoutAlpha || match[1] === undefined) { // no alpha
          toSet.alpha = 1;
          toSet.alphaMode = false;
        } else { // with alpha
          toSet.alpha = normalizedClamp(+match[5]);
          toSet.alphaMode = true;
        }
        toSet.h = +match[2];
        let matchPercent;
        if (matchPercent = match[3].match(regexpPercent)) { // s in percentage colorString
          toSet.s = safeMult(+matchPercent[1], 0.01);
        } else {
          toSet.s = +match[3];
        }
        if (matchPercent = match[4].match(regexpPercent)) { // l in percentage colorString
          toSet.l = safeMult(+matchPercent[1], 0.01);
        } else {
          toSet.l = +match[4];
        }
        toSet = normalizeHsl(toSet, this.hslPrecision);
        // rgb-format
      } else if (match = colorString.match(regexpRgb)) {
        format = 'rgb';
        if (this.withoutAlpha || match[1] === undefined) { // no alpha
          toSet.alpha = 1;
          toSet.alphaMode = false;
        } else { // with alpha
          toSet.alpha = normalizedClamp(+match[5]);
          toSet.alphaMode = true;
        }
        Object.assign(toSet, normalizeRgb({
          r: +match[2],
          g: +match[3],
          b: +match[4]
        }));
        // hex-format
      } else if (match = colorString.match(regexpHex)) {
        format = 'hex';
        if (match[1] !== undefined) { // six hex numbers
          toSet.hex = match[1];
          if (!this.withoutAlpha && match[2] !== undefined) { // alpha channel has two hex numbers
            toSet.alpha = hexToAlpha(match[2], 2);
            toSet.alphaMode = true;
            if (!this._hexAlphaSupported) {
              format = 'rgb';
              fixedFormat = false;
            }
          } else { // no alpha channel
            toSet.alpha = 1;
            toSet.alphaMode = false;
          }
        } else if (match[3] !== undefined) { // three hex numbers
          toSet.hex = match[3];
          if (!this.withoutAlpha && match[4] !== undefined) { // alpha channel has one hex number
            toSet.alpha = hexToAlpha(match[4], 1);
            toSet.alphaMode = true;
            if (!this._hexAlphaSupported) {
              format = 'rgb';
              fixedFormat = false;
            }
          } else { // no alpha channel
            toSet.alpha = 1;
            toSet.alphaMode = false;
          }
        }
      } else {
        // last try
        format = 'auto';
        if (!this._testCanvasContext) {
          this._createTestCanvas();
        }
        toSet = testColor(this._testCanvasContext, colorString);
      }

      if (this.format !== format && this.format !== 'auto') {
        // don't automatically change the format, if the format is `auto` or `fixedFormat` is set
        if (!fixedFormat) {
          toSet.format = format;
        }
      }
      this.__updateByColorString = true;
      this.__updateByColorProperties = false;

      this.setProperties(toSet);
    }

    /**
     * compute color string
     * @param  {rgbObject} rgb   The rgb object
     * @param  {hslObject} hsl   The hsl object
     * @param  {string} hex      The hex string
     * @param  {string} oldColor The old color string before setting
     * @return {[type]}          The computed color string
     */
    _computeColorString(rgb, hsl, hex, oldColor) {
      const alpha = isNaN(this.alpha) ? 1 : this.alpha;
      const alphaMode = !this.withoutAlpha && (this.alphaMode === true || alpha !== 1);
      let format = this.format;

      if (format === 'auto') {
        // define output format from oldColorstring or if a named color is set
        if (oldColor) {
          if (!this._testCanvasContext) {
            this._createTestCanvas();
          }
          const testRgb = testColor(this._testCanvasContext, oldColor);
          const rgbIsNotSet = !rgb || isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b);

          // test old color string if it changes in comparisson to the given color properties
          if (!alphaMode && (rgbIsNotSet || (rgb.r === testRgb.r && rgb.b === testRgb.b && rgb.g === testRgb.g))) {
            // keeping color string if possible
            return oldColor;
          }
          if (rgbIsNotSet) {
            // rgb might not been set yet
            rgb = testRgb;
          }
          if (oldColor.split('hsl').length > 1) {
            // oldColor is in hsl format
            format = 'hsl';
          } else if (oldColor.split('rgb').length > 1) {
            // oldColor is in rgb format
            format = 'rgb';
          } else {
            // fallback is hex format
            format = 'hex';
          }
        } else {
          // fallback is hex format
          format = 'hex';
        }
      }

      switch (format) {
        case 'hsl':
          const hslPrecision = this.hslPrecision || 0;
          if ((isNaN(hsl.h) || isNaN(hsl.s) || isNaN(hsl.l)) && !(isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b))) {
            hsl = normalizeHsl(rgbToHsl(rgb, this.h));
          }
          if (!(isNaN(hsl.h) || isNaN(hsl.s) || isNaN(hsl.l))) {
            if (alphaMode) {
              return `hsla(${hsl.h}, ${safeMult(hsl.s,100)}%, ${safeMult(hsl.l,100)}%, ${alpha})`;
            } else {
              return `hsl(${hsl.h}, ${safeMult(hsl.s,100)}%, ${safeMult(hsl.l,100)}%)`;
            }
          } // falls through
        case 'hex':
          if (!hex) {
            if ((isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) && !(isNaN(hsl.h) || isNaN(hsl.s) || isNaN(hsl.l))) {
              rgb = normalizeRgb(hslToRgb(hsl));
            }
            hex = rgbToHex(rgb);
          }
          if (alphaMode) {
            if (this._hexAlphaSupported) {
              return `${hex}${alphaToHex(alpha, hex.length <= 4 ? 1 : 2)}`;
            }
            // if hexAlphaSupported is not supported, fall through to rgb
          } else {
            return hex;
          } // falls through
        default:
          // fallback is rgb
          if ((isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) && !(isNaN(hsl.h) || isNaN(hsl.s) || isNaN(hsl.l))) {
            rgb = normalizeRgb(hslToRgb(hsl));
          }
          if (!(isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b))) {
            if (alphaMode) {
              return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            } else {
              return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            }
          }
      }
    }

    _hexChanged(hex) {
      if (!hex) {
        this.resetColor();
        return;
      }

      const rgb = hexToRgb(hex);
      hex = rgbToHex(rgb);

      // only set hsl values by rgb to avoid conflicting changes
      if (hex !== this.hex) {
        this.hex = hex;
        return;
      }

      this.__updateByColorString = false;

      if (!(this.r === rgb.r && this.g === rgb.g && this.b === rgb.b)) {
        this.setProperties(rgb);
      }
    }

    _rgbChanged(r, g, b) {
      if (isNaN(r) && isNaN(g) && isNaN(b)) {
        this.resetColor();
        return;
      }
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        // single property can be set without triggering property changes
        return;
      }

      const rgb = normalizeRgb({ r: r, g: g, b: b });
      const hex = rgbToHex(rgb);

      // set rgb values again if they don't match their normalized version
      if (!(rgb.r === this.r && rgb.g === this.g && rgb.b === this.b)) {
        // transformed rgb is different than the current rgb, so set the rgb
        this.setProperties(rgb);
        return;
      }

      // avoid computed setting properties again when in '_hslChanged' properties where computed
      if (this.__updateByColorProperties === true) {
        this.__updateByColorProperties = false;
        return;
      }

      let toSet = {};
      const hsl = normalizeHsl(rgbToHsl(rgb, this.h));
      const colorString = this._computeColorString(rgb, hsl, hex, this.colorString);

      if (!(this.h === hsl.h && this.s === hsl.s && this.l === hsl.l)) {
        toSet = hsl;
      }
      if (hex !== this.hex) {
        toSet.hex = hex;
      }
      if (colorString !== this.colorString) {
        toSet.colorString = colorString;
      }

      this.__updateByColorString = false;
      this.__updateByColorProperties = true;

      this.setProperties(toSet);
    }

    _hslChanged(h, s, l) {
      if (isNaN(h) && isNaN(s) && isNaN(l)) {
        this.resetColor();
        return;
      }
      if (isNaN(h) || isNaN(s) || isNaN(l)) {
        // single property can be set without triggering property changes
        return;
      }

      const hsl = normalizeHsl({ h: h, s: s, l: l });

      // set hsl values again if they don't match their normalized version
      if (!(this.h === hsl.h && this.s === hsl.s && this.l === hsl.l)) {
        // transformed hsl is different than the current hsl, so set the hsl
        this.setProperties(hsl);
        return;
      }

      // avoid computed setting properties again when in '_hslChanged' properties where computed
      if (this.__updateByColorProperties === true) {
        this.__updateByColorProperties = false;
        return;
      }

      let toSet = {};
      const rgb = normalizeRgb(hslToRgb(hsl));
      const hex = rgbToHex(rgb);
      const colorString = this._computeColorString(rgb, hsl, hex, this.colorString);

      if (!(rgb.r === this.r && rgb.g === this.g && rgb.b === this.b)) {
        toSet = rgb;
      }
      if (hex !== this.hex) {
        toSet.hex = hex;
      }
      if (colorString !== this.colorString) {
        toSet.colorString = colorString;
      }
      this.__updateByColorString = false;
      this.__updateByColorProperties = true;

      this.setProperties(toSet);
    }

    _formatChanged(format, oldFormat) {
      if (this._validFormats.indexOf(format) === -1) {
        if (oldFormat && this._validFormats.indexOf(oldFormat) !== -1) {
          this.format = oldFormat;
          return;
        }
        this.format = 'auto';
        return;
      }

      if (this.colorString) {
        const colorString = this._computeColorString({ r: this.r, g: this.g, b: this.b }, { h: this.h, s: this.s, l: this.l }, this.hex, this.colorString);
        if (colorString !== this.colorString) {
          this.colorString = colorString;
        }
      }
    }

    _alphaChanged(alpha, oldAlpha) {
      if (alpha === undefined) {
        return;
      }
      if (isNaN(alpha)) {
        this.alpha = 1;
        return;
      }
      alpha = normalizedClamp(alpha);
      if (alpha !== this.alpha) {
        this.alpha = alpha;
        return;
      }
      if (this.withoutAlpha && (alpha !== 1 || this.alphaMode)) {
        let toSet = {};
        toSet.alpha = 1;
        toSet.alphaMode = false;
        this.setProperties(toSet);
        return;
      }
      if (!this.withoutAlpha && alpha !== 1 && !this.alphaMode) {
        this.alphaMode = true;
        return
      }
      if (this.colorString) {
        const colorString = this._computeColorString({r: this.r, g: this.g, b: this.b}, {h: this.h, s: this.s, l: this.l}, this.hex, this.colorString);
        if (colorString !== this.colorString) {
          this.colorString = colorString;
        }
      }
    }

    _alphaModeChanged(alphaMode) {
      if (alphaMode === undefined) {
        return;
      }
      if (this.withoutAlpha && (this.alpha !== 1 || alphaMode)) {
        let toSet = {};
        toSet.alpha = 1;
        toSet.alphaMode = false;
        this.setProperties(toSet);
        return;
      }
      if (!alphaMode && this.alpha !== 1) {
        this.alpha = 1;
        return;
      }
      if (this.colorString) {
        const colorString = this._computeColorString({r: this.r, g: this.g, b: this.b}, {h: this.h, s: this.s, l: this.l}, this.hex, this.colorString);
        if (colorString !== this.colorString) {
          this.colorString = colorString;
        }
      }
    }

    _withoutAlphaChanged(withoutAlpha) {
      if (withoutAlpha === undefined) {
        return;
      }
      if (withoutAlpha === true && (this.alpha !== 1 || this.alphaMode)) {
        let toSet = {};
        toSet.alpha = 1;
        toSet.alphaMode = false;
        this.setProperties(toSet);
      }
    }
  }
});
