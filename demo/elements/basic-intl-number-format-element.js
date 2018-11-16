import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { IntlNumberFormatMixin } from '../../intl-number-format-mixin.js';

class BasicIntlNumberFormatElement extends IntlNumberFormatMixin(PolymerElement) {
  static get is() {
    return 'basic-intl-number-format-element';
  }
}
customElements.define(BasicIntlNumberFormatElement.is, BasicIntlNumberFormatElement);
