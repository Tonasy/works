import * as THREE from '../../../lib/three.module.js';
import Common from './Common.js';
import ExternalForce from './ExternalForce.js';
import Advection from './Advection.js';
import Divergence from './Divergence.js';
import Poisson from './Poisson.js';
import Pressure from './Pressure.js';

export default class Simulation {
  constructor() {
    // 初期化
    this.cellScale = new THREE.Vector2(); // セルのスケール
    this.fboSize = new THREE.Vector2(); // FBO のサイズ
    this.boundary = new THREE.Vector2(); // 境界

    this.fbos = {
      // FBO のオブジェクト
      // velocity(速度)
      vel_0: null,
      vel_1: null,

      // viscosity(粘性)
      vel_viscosity_0: null,
      vel_viscosity_1: null,

      // divergence(発散)
      div: null,

      // pressure(圧力)
      pressure_0: null,
      pressure_1: null,

      // テキスト
      text: null
    };

    // パラメータ
    this.dt = 0.01;
    this.mouse_force = 60;
    this.cursor_size = 20;
    this.resolution = 0.5;

    this.init();
  }

  init() {
    this.calcSize();
    this.createFBOs();
    this.createShaderPass();
  }

  createFBOs() {
    // iOS 端末の場合はサポートされていないので、精度を落とす
    const type = /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;

    // FBO
    for (let key in this.fbos) {
      this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
        type: type
      });
    }
  }

  calcSize() {
    // Resolution
    const resolution = this.resolution;
    const width = Math.round(Common.width * resolution);
    const height = Math.round(Common.height * resolution);

    // Cell のスケール
    const px_x = 1.0 / width;
    const px_y = 1.0 / height;

    this.cellScale.set(px_x, px_y);
    this.fboSize.set(width, height);
  }

  createShaderPass() {
    // - 移流項 -----------------------
    this.advection = new Advection({
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.dt,
      src: this.fbos.vel_0,
      dest: this.fbos.vel_1
    });

    // - 外力項 -----------------------
    this.externalForce = new ExternalForce({
      cellScale: this.cellScale,
      cursor_size: this.cursor_size,
      dest: this.fbos.vel_1
    });

    // - 圧力項 -----------------------
    // 発散
    this.divergence = new Divergence({
      cellScale: this.cellScale,
      boundary: this.boundary,
      src: this.fbos.vel_1,
      dest: this.fbos.div,
      dt: this.dt,
      time: Common.time
    });

    // ポアソン方程式（圧力場の計算）
    this.poisson = new Poisson({
      cellScale: this.cellScale,
      boundary: this.boundary,
      src: this.fbos.div,
      dest: this.fbos.pressure_1,
      dest_: this.fbos.pressure_0
    });

    // 圧力場の補正
    this.pressure = new Pressure({
      cellScale: this.cellScale,
      boundary: this.boundary,
      src_p: this.fbos.pressure_0,
      src_v: this.fbos.vel_viscosity_0,
      dest: this.fbos.vel_0,
      dt: this.dt
    });
  }

  resize() {
    // リサイズ時は FBO もリサイズ
    this.calcSize();

    for (let key in this.fbos) {
      this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y);
    }
  }

  update() {
    // 境界の初期化
    this.boundary.set(0, 0);

    // - 移流項の計算 -----------------------
    this.advection.update(this.dt);

    // - 外力項の計算 -----------------------
    this.externalForce.update({
      cursor_size: this.cursor_size,
      mouse_force: this.mouse_force,
      cellScale: this.cellScale
    });

    // 外力項、移流項の計算結果を変数に保存
    let vel = this.fbos.vel_1;

    // - 圧力項の計算 -----------------------
    // 発散の計算
    this.divergence.update({ vel });

    // ポアソン方程式の計算
    const pressure = this.poisson.update();

    // 圧力場の補正
    this.pressure.update({ vel, pressure });
  }
}
