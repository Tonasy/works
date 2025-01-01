import * as THREE from '../../../lib/three.module.js';
import Common from './Common.js';
import ShaderFiles from './ShaderFiles.js';
import ShaderPass from './ShaderPass.js';

export default class ExternalForce extends ShaderPass {
  constructor(simProps) {
    super({
      output: simProps.dest
    });

    // マウスの情報
    this.mouseMoved = false;
    this.coords = new THREE.Vector2();
    this.coords_old = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.timer = null;
    this.count = 0;

    // マウスイベントの設定
    this.mouseInit();

    this.init(simProps);
  }

  init(simProps) {
    super.init();

    // シェーダソースの取得
    this.mouseVS = ShaderFiles.getShader('mouseVS');
    this.externalForceFS = ShaderFiles.getShader('externalForceFS');

    // マウス用のメッシュ生成
    const mouseGeometry = new THREE.PlaneGeometry(1, 1);
    const mouseMaterial = new THREE.RawShaderMaterial({
      vertexShader: this.mouseVS,
      fragmentShader: this.externalForceFS,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPx: { value: simProps.cellScale },
        uForce: { value: new THREE.Vector2(0.0, 0.0) },
        uCenter: { value: new THREE.Vector2(0.0, 0.0) },
        uScale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
      }
    });
    this.mousePlane = new THREE.Mesh(mouseGeometry, mouseMaterial);
    this.scene.add(this.mousePlane);
  }

  update(props) {
    // 力の計算
    const forceX = (this.diff.x / 2) * props.mouse_force;
    const forceY = (this.diff.y / 2) * props.mouse_force;

    // カーソルのサイズ
    const cursorSizeX = props.cursor_size * props.cellScale.x;
    const cursorSizeY = props.cursor_size * props.cellScale.y;

    // カーソルの中心座標
    const centerX = Math.min(
      Math.max(this.coords.x, -1 + cursorSizeX + props.cellScale.x * 2),
      1 - cursorSizeX - props.cellScale.x * 2
    );
    const centerY = Math.min(
      Math.max(this.coords.y, -1 + cursorSizeY + props.cellScale.y * 2),
      1 - cursorSizeY - props.cellScale.y * 2
    );

    const uniforms = this.mousePlane.material.uniforms;

    // これらの名前を、init()で定義したuniformsの名前に合わせる
    uniforms.uForce.value.set(forceX, forceY);
    uniforms.uCenter.value.set(centerX, centerY);
    uniforms.uScale.value.set(props.cursor_size, props.cursor_size);

    // マウス座標の更新も追加
    this.updateMouseCoords();

    super.update();
  }

  /**
   * マウスイベントのリスナーを登録する
   */
  mouseInit() {
    document.body.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.body.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    document.body.addEventListener('touchmove', this.onTouchMove.bind(this), false);
  }

  /**
   * マウス座標の設定
   * @param {number} x - x 座標
   * @param {number} y - y 座標
   */
  setMouseCoords(x, y) {
    if (this.timer) clearTimeout(this.timer); // タイマーのリセット
    this.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1); // 座標の正規化（-1 〜 1）
    this.mouseMoved = true;
    this.timer = setTimeout(() => {
      // 100ms 後にフラグをリセット
      this.mouseMoved = false;
    }, 100);
  }

  /**
   * マウス移動のイベントハンドラ
   * @param {MouseEvent} e - マウスイベント
   */
  onMouseMove(e) {
    this.setMouseCoords(e.clientX, e.clientY);
  }
  /**
   * タッチ開始のイベントハンドラ
   * @param {TouchEvent} e - タッチイベント
   */
  onTouchStart(e) {
    this.setMouseCoords(e.touches[0].pageX, e.touches[0].pageY);
  }
  /**
   * タッチ移動のイベントハンドラ
   * @param {TouchEvent} e - タッチイベント
   */
  onTouchMove(e) {
    if (e.touches.length === 1) {
      this.setMouseCoords(e.touches[0].pageX, e.touches[0].pageY);
    }
  }

  /**
   * マウスの移動量を計算し、座標を更新する
   */
  updateMouseCoords() {
    // 座標の差から移動量を計算
    this.diff.subVectors(this.coords, this.coords_old);
    // マウス座標の更新
    this.coords_old.copy(this.coords);
    // 初期状態の場合は差を 0 にする
    if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
  }
}
