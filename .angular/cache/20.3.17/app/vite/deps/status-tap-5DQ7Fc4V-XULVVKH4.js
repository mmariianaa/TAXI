import {
  findClosestIonContent,
  scrollToTop
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/status-tap-5DQ7Fc4V-RTQOPJZ3.js
} from "./chunk-IQ3O55ID.js";
import {
  componentOnReady
} from "./chunk-IAIW5OFA.js";
import {
  readTask,
  writeTask
} from "./chunk-MKEXY72Z.js";
========
} from "./chunk-T32Y57IW.js";
import {
  componentOnReady
} from "./chunk-QVPAWLQG.js";
import {
  readTask,
  writeTask
} from "./chunk-QNHT3IYI.js";
>>>>>>>> Monybbranch:.angular/cache/20.3.17/app/vite/deps/status-tap-5DQ7Fc4V-XULVVKH4.js
import {
  __async
} from "./chunk-N3534FJA.js";

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
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/status-tap-5DQ7Fc4V-RTQOPJZ3.js
//# sourceMappingURL=status-tap-5DQ7Fc4V-RTQOPJZ3.js.map
========
//# sourceMappingURL=status-tap-5DQ7Fc4V-XULVVKH4.js.map
>>>>>>>> Monybbranch:.angular/cache/20.3.17/app/vite/deps/status-tap-5DQ7Fc4V-XULVVKH4.js
