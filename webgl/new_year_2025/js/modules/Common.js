import * as THREE from '../../../lib/three.module.js';
import ShaderFiles from './ShaderFiles.js';


class Common {
  constructor() {
    // 画面・端末の情報
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    this.isMobile = false;
    this.breakpoint = 768;

    // FBO のサイズ
    this.fboWidth = null;
    this.fboHeight = null;

    // 時間計測
    this.time = 0;
    this.delta = 0;
  }

init(wrapper) {
    // リサイズ
    this.resize();

    // レンダラー
    const color = new THREE.Color(0xffffff);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(color);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    wrapper.appendChild(this.renderer.domElement);

    // 時間計測
    this.clock = new THREE.Clock();
    this.clock.start();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    if (this.renderer) this.renderer.setSize(this.width, this.height);
  }

  update() {
    // 時間の更新
    this.delta = this.clock.getDelta();
    this.time += this.delta;
  }
}

export default new Common();
