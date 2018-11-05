import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { ColorMixin } from '../../color-mixin.js';

class BasicColorElement extends ColorMixin(PolymerElement) {
  static get is() {
    return 'basic-color-element';
  }
  static get template() {
    return html`<div style="background:[[colorString]]">[[colorString]]</div>`
  }
}
customElements.define(BasicColorElement.is, BasicColorElement);
