import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { IntlDatetimeFormatMixin } from '../../intl-datetime-format-mixin.js';

class BasicIntlDatetimeFormatElement extends IntlDatetimeFormatMixin(PolymerElement) {
  static get is() {
    return 'basic-intl-datetime-format-element';
  }
}

customElements.define(BasicIntlDatetimeFormatElement.is, BasicIntlDatetimeFormatElement);
