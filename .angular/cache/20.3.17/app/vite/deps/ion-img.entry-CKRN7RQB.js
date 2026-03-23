import {
  getIonMode
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-7ST2PKNW.js
} from "./chunk-64ZD6UHQ.js";
import {
  inheritAttributes
} from "./chunk-IAIW5OFA.js";
========
} from "./chunk-NHY6JM3D.js";
import {
  inheritAttributes
} from "./chunk-QVPAWLQG.js";
>>>>>>>> Monybbranch:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-CKRN7RQB.js
import {
  Host,
  createEvent,
  getElement,
  h,
  registerInstance
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-7ST2PKNW.js
} from "./chunk-MKEXY72Z.js";
import "./chunk-N3534FJA.js";
========
} from "./chunk-QNHT3IYI.js";
import "./chunk-XCTEB7MY.js";
>>>>>>>> Monybbranch:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-CKRN7RQB.js

// node_modules/@ionic/core/dist/esm/ion-img.entry.js
var imgCss = ":host{display:block;-o-object-fit:contain;object-fit:contain}img{display:block;width:100%;height:100%;-o-object-fit:inherit;object-fit:inherit;-o-object-position:inherit;object-position:inherit}";
var Img = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionImgWillLoad = createEvent(this, "ionImgWillLoad", 7);
    this.ionImgDidLoad = createEvent(this, "ionImgDidLoad", 7);
    this.ionError = createEvent(this, "ionError", 7);
    this.inheritedAttributes = {};
    this.onLoad = () => {
      this.ionImgDidLoad.emit();
    };
    this.onError = () => {
      this.ionError.emit();
    };
  }
  srcChanged() {
    this.addIO();
  }
  componentWillLoad() {
    this.inheritedAttributes = inheritAttributes(this.el, ["draggable"]);
  }
  componentDidLoad() {
    this.addIO();
  }
  addIO() {
    if (this.src === void 0) {
      return;
    }
    if (typeof window !== "undefined" && "IntersectionObserver" in window && "IntersectionObserverEntry" in window && "isIntersecting" in window.IntersectionObserverEntry.prototype) {
      this.removeIO();
      this.io = new IntersectionObserver((data) => {
        if (data[data.length - 1].isIntersecting) {
          this.load();
          this.removeIO();
        }
      });
      this.io.observe(this.el);
    } else {
      setTimeout(() => this.load(), 200);
    }
  }
  load() {
    this.loadError = this.onError;
    this.loadSrc = this.src;
    this.ionImgWillLoad.emit();
  }
  removeIO() {
    if (this.io) {
      this.io.disconnect();
      this.io = void 0;
    }
  }
  render() {
    const { loadSrc, alt, onLoad, loadError, inheritedAttributes } = this;
    const { draggable } = inheritedAttributes;
    return h(Host, { key: "da600442894427dee1974a28e545613afac69fca", class: getIonMode(this) }, h("img", { key: "16df0c7069af86c0fa7ce5af598bc0f63b4eb71a", decoding: "async", src: loadSrc, alt, onLoad, onError: loadError, part: "image", draggable: isDraggable(draggable) }));
  }
  get el() {
    return getElement(this);
  }
  static get watchers() {
    return {
      "src": ["srcChanged"]
    };
  }
};
var isDraggable = (draggable) => {
  switch (draggable) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return void 0;
  }
};
Img.style = imgCss;
export {
  Img as ion_img
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-img.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
<<<<<<<< HEAD:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-7ST2PKNW.js
//# sourceMappingURL=ion-img.entry-7ST2PKNW.js.map
========
//# sourceMappingURL=ion-img.entry-CKRN7RQB.js.map
>>>>>>>> Monybbranch:.angular/cache/20.3.17/app/vite/deps/ion-img.entry-CKRN7RQB.js
