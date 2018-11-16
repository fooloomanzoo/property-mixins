'use strict';

/* Import WebpackApp */

import '@polymer/iron-demo-helpers/demo-pages-shared-styles.js';
import '@polymer/iron-demo-helpers/demo-snippet.js';
import '../elements/basic-color-element.js';

const $template = document.createElement('template');

$template.innerHTML = `<dom-module id="shared-styles">
  <template>
    <style is="custom-style" include="demo-pages-shared-styles">
      demo-snippet {
        --demo-snippet-code: {
          max-height: 250px;
        }
        --demo-snippet: {
          max-width: 600px;
        }
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($template.content);
