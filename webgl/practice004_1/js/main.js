import * as THREE from '../../lib/three.module.js';
import Common from './modules/Common.js';
import ShaderFiles from './modules/ShaderFiles.js';
import Simulation from './modules/Simulation.js';

window.addEventListener(
  'DOMContentLoaded',
  () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    app.init();
  },
  false
);

class ThreeApp {
  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // 共通処理の初期化
    Common.init(wrapper);

    // this のバインド
    this.render = this.render.bind(this);
  }

  async init() {
    // シェーダソースの読み込み
    await ShaderFiles.load();

    // 流体シミュレーション
    this.simulation = new Simulation();

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.Camera();

    // 画面を覆う板ポリを作成
    this.mainVs = ShaderFiles.getShader('mainVS');
    this.mainFs = ShaderFiles.getShader('mainFS');

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.uniforms = {
      uVelocity: { value: this.simulation.fbos.vel_0.texture },
      uBoundary: { value: new THREE.Vector2() },
      uTime: { value: Common.time },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: this.mainVs,
      fragmentShader: this.mainFs,
      uniforms: this.uniforms,
    });
    const output = new THREE.Mesh(geometry, material);
    this.scene.add(output);

    // レンダリング開始
    this.render();
  }

  resize() {
    window.addEventListener(
      'resize',
      () => {
        Common.resize();
        this.simulation.resize();
        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  /**
   * 描画処理
   */
  render() {
    // 共通処理の更新
    Common.update();

    // 時間の更新
    this.uniforms.uTime.value = Common.time;
    
    // シミュレーションの更新
    this.simulation.update();
    
    // レンダラーで描画
    Common.renderer.setRenderTarget(null); // デフォルトのレンダーターゲットに戻す
    Common.renderer.render(this.scene, this.camera);

    // 恒常ループの設定
    requestAnimationFrame(this.render);
  }

}