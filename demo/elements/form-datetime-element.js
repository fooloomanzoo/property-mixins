import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { FormElementMixin } from '@fooloomanzoo/input-picker-pattern/form-element-mixin.js';
import { DatetimeMixin } from '../../datetime-mixin.js';

class FormDatetimeElement extends FormElementMixin(DatetimeMixin(PolymerElement)) {
  static get is() {
    return 'form-datetime-element';
  }
  static get properties() {
    return {
      propertyForValue: {
        type: String,
        value: 'valueAsNumber'
      }
    }
  }
  static get template() {
    return html`<div>[[value]]</div>`
  }
}

customElements.define(FormDatetimeElement.is, FormDatetimeElement);
