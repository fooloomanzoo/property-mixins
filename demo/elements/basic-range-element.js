import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { RangeMixin } from '../../range-mixin.js';

class BasicRangeElement extends RangeMixin(PolymerElement) {
  static get is() {
    return 'basic-range-element';
  }
  static get template() {
    return html`<div>[[valueAsNumber]]</div>`;
  }
}

customElements.define(BasicRangeElement.is, BasicRangeElement);
