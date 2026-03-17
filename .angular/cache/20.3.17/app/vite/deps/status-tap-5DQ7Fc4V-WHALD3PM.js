import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-SLRV4KUQ.js";
import {
  componentOnReady
} from "./chunk-YNRQFFFN.js";
import {
  readTask,
  writeTask
} from "./chunk-Y234AU2B.js";
import {
  __async
} from "./chunk-XCTEB7MY.js";

// node_modules/@ionic/core/dist/esm/status-tap-5DQ7Fc4V.js
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

@ionic/core/dist/esm/status-tap-5DQ7Fc4V.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=status-tap-5DQ7Fc4V-WHALD3PM.js.map
