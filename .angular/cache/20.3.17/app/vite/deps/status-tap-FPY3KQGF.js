import {
  findClosestIonContent,
  scrollToTop
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/status-tap-RTO4T4VQ.js
} from "./chunk-BT47KCBG.js";
import {
  readTask,
  writeTask
} from "./chunk-AZBLTKCP.js";
========
} from "./chunk-MMB4JZV3.js";
import {
  readTask,
  writeTask
} from "./chunk-77UNVSHX.js";
>>>>>>>> main:.angular/cache/20.3.17/app/vite/deps/status-tap-FPY3KQGF.js
import {
  componentOnReady
} from "./chunk-4554YRK6.js";
import "./chunk-2H3NLAAY.js";
import {
  __async
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/status-tap-RTO4T4VQ.js
} from "./chunk-SCNEKAWF.js";
========
} from "./chunk-XCTEB7MY.js";
>>>>>>>> main:.angular/cache/20.3.17/app/vite/deps/status-tap-FPY3KQGF.js

// node_modules/@ionic/core/components/status-tap.js
var startStatusTap = () => {
  const win = window;
  win.addEventListener("statusTap", () => {
    readTask(() => {
      const width = win.innerWidth;
      const height = win.innerHeight;
      const el = document.elementFromPoint(width / 2, height / 2);
      if (!el) {
        return;
      }
      const contentEl = findClosestIonContent(el);
      if (contentEl) {
        new Promise((resolve) => componentOnReady(contentEl, resolve)).then(() => {
          writeTask(() => __async(null, null, function* () {
            contentEl.style.setProperty("--overflow", "hidden");
            yield scrollToTop(contentEl, 300);
            contentEl.style.removeProperty("--overflow");
          }));
        });
      }
    });
  });
};
export {
  startStatusTap
};
/*! Bundled license information:

@ionic/core/components/status-tap.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/status-tap-RTO4T4VQ.js
//# sourceMappingURL=status-tap-RTO4T4VQ.js.map
========
//# sourceMappingURL=status-tap-FPY3KQGF.js.map
>>>>>>>> main:.angular/cache/20.3.17/app/vite/deps/status-tap-FPY3KQGF.js
