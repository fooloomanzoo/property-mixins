import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { DatetimeMixin } from '../../datetime-mixin.js';

class BasicDatetimeElement extends DatetimeMixin(PolymerElement) {
  static get is() {
    return 'basic-datetime-element';
  }

  static get template() {
    return html`<div>[[datetime]]</div>`
  }
}
customElements.define(BasicDatetimeElement.is, BasicDatetimeElement);
