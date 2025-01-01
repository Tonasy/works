import * as THREE from '../lib/three.module.js';
import { WebGLUtility } from '../lib/webgl/webgl.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { Pane } from '../lib/webgl/tweakpane-4.0.3.min.js';

window.addEventListener(
  'DOMContentLoaded',
  async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);

    await app.load();
    app.init();
    app.createEvents();
    app.setupPane();
    app.setCaretToEndOfInput();
    app.handleInput();
    app.refreshText();
    app.render();
  },
  false
);

class ThreeApp {
  /**
   * テクスチャ用テキストのための定数
   */
  static TEXT_TEX_PARAM = {
    fontName: 'system-ui',
    textureFontSize: 80
  };
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 45,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 750.0,
    position: new THREE.Vector3(0.0, 0.0, 10.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x777777,
    width: window.innerWidth,
    height: window.innerHeight
  };
  /**
   * パーティクル生成のための定数
   */
  static PLANE_PARAM = {
    width: 1.0,
    height: 1.0,
  };

  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: '0xffffff',
    depthTest: false,
    opacity: 0.3,
    transparent: true,
  };

  /**
   * カーソル生成のための定数
   */
  static CURSOR_PARAM = {
    width: 0.12,
    height: 4.5,
    depth: 0.03,
    tlX: 0.1,
    tlY: -2.35,
    color: 'oxefefef'
  };

  wrapper; // canvasの親要素
  ctx; // canvas2dのコンテキスト
  textCanvas; // テキスト用のキャンバス
  textInput; // テキストのインプット要素
  string; // テキストの文字列
  renderer; // レンダラー
  scene; // シーン
  camera; // カメラ
  controls; // オービットコントロール
  textureCoordinates; // テクスチャ座標
  stringBox; // 文字列情報を格納する
  fontScaleFactor; // フォントのスケールファクター
  particleGeometry; // パーティクルのジオメトリ
  particleMaterial; // パーティクルのマテリアル
  cursorMesh; // カーソルのメッシュ
  clock; // クロック
  particles; // パーティクル
  texture; // テクスチャ
  background; // 背景

  /**
   * @constructor
   * @param {HTMLElement} wrapper - ラッパー要素
   */
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.render = this.render.bind(this);

    // 入力テキストの初期設定
    this.textInput = document.querySelector('#text-input');
    this.textInput.style.fontSize = ThreeApp.TEXT_TEX_PARAM.textureFontSize + 'px';
    this.textInput.style.font =
      '100 ' + ThreeApp.TEXT_TEX_PARAM.textureFontSize + 'px ' + ThreeApp.TEXT_TEX_PARAM.fontName;
    this.textInput.style.lineHeight = 1.1 * ThreeApp.TEXT_TEX_PARAM.textureFontSize + 'px';

    // 文字列の初期設定
    this.string = '温泉の<div>季節</div>';

    // 文字列情報の初期化
    this.stringBox = {
      wTexture: 0,
      wScene: 0,
      hTexture: 0,
      hScene: 0,
      caretPosScene: []
    };
    this.fontScaleFactor = 0.05;

    // テキストの設定
    this.textInput.innerHTML = this.string;
    this.textInput.focus();
  }

  /**
   * 初期化
   */
  init() {
    // canvas2dのセットアップ
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = this.textCanvas.height = 0;
    this.ctx = this.textCanvas.getContext('2d');
    document.body.appendChild(this.textCanvas);

    // テクスチャ座標の初期化
    this.textureCoordinates = [];

    // レンダラーのセットアップ
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    this.renderer.setClearColor(color);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);

    // シーンのセットアップ
    this.scene = new THREE.Scene();
    this.scene.background = this.background;

    // カメラのセットアップ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    // オービットコントロールのセットアップ
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;

    // パーティクルのセットアップ
    this.particleGeometry = new THREE.PlaneGeometry(
      ThreeApp.PLANE_PARAM.width,
      ThreeApp.PLANE_PARAM.height
    );
    this.particleMaterial = new THREE.MeshBasicMaterial({
      color: ThreeApp.MATERIAL_PARAM.color,
      alphaMap: this.texture,
      depthTest: ThreeApp.MATERIAL_PARAM.depthTest,
      opacity: ThreeApp.MATERIAL_PARAM.opacity,
      transparent: ThreeApp.MATERIAL_PARAM.transparent,
    });
    this.particles = [];

    // カーソルのセットアップ
    const cursorGeometry = new THREE.BoxGeometry(
      ThreeApp.CURSOR_PARAM.width,
      ThreeApp.CURSOR_PARAM.height,
      ThreeApp.CURSOR_PARAM.depth
    );
    cursorGeometry.translate(ThreeApp.CURSOR_PARAM.tlX, ThreeApp.CURSOR_PARAM.tlY, 0);
    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: ThreeApp.CURSOR_PARAM.color,
      transparent: true
    });
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
    this.scene.add(this.cursorMesh);

    // クロックの初期化
    this.clock = new THREE.Clock();
  }

  /**
   * tweakpane の初期化処理
   */
  setupPane() {
    // // Tweakpane を使った GUI の設定
    // const pane = new Pane();
    // const parameter = {
    //   geometry: this.selectedGeometry
    // };
    // // テクスチャの表示・非表示
    // pane
    //   .addBinding(parameter, 'geometry', {
    //     options: {
    //       box: 'box',
    //       torus: 'torus',
    //       cone: 'cone',
    //       capsule: 'capsule'
    //     }
    //   })
    //   .on('change', v => {
    //     this.selectedGeometry = v.value;
    //     this.recreateInstancedMesh();
    //   });
  }

  /**
   * イベントの登録
   */
  createEvents() {
    // リサイズイベントの登録
    window.addEventListener(
      'resize',
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );

    // クリックイベントの登録
    document.addEventListener('click', () => {
      this.textInput.focus();
      this.setCaretToEndOfInput();
    });

    // フォーカスイベントの登録
    this.textInput.addEventListener('focus', () => {
      this.clock.elapsedTime = 0;
    });

    // キーアップイベントの登録
    document.addEventListener('keyup', () => {
      this.handleInput();
      this.refreshText();
    });
  }

  /**
   * ロード
   */
  async load() {
    return new Promise(async (resolve, reject) => {
      this.texture = await new THREE.TextureLoader().load('./img/smoke.png');
      this.background = await new THREE.TextureLoader().load('./img/background.jpg');
      resolve();
    });
  }

  /**
   * インプット要素の操作
   */
  handleInput() {
    if (isNewLine(this.textInput.firstChild)) {
      this.textInput.firstChild.remove();
    }
    if (isNewLine(this.textInput.lastChild)) {
      if (isNewLine(this.textInput.lastChild.previousSibling)) {
        this.textInput.lastChild.remove();
      }
    }
    this.string = this.textInput.innerHTML
      .replaceAll('<p>', '\n')
      .replaceAll('</p>', '')
      .replaceAll('<div>', '\n')
      .replaceAll('</div>', '')
      .replaceAll('<br>', '')
      .replaceAll('<br/>', '')
      .replaceAll('&nbsp;', ' ');

    this.stringBox.wTexture = this.textInput.clientWidth;
    this.stringBox.wScene = this.stringBox.wTexture * this.fontScaleFactor;
    this.stringBox.hTexture = this.textInput.clientHeight;
    this.stringBox.hScene = this.stringBox.hTexture * this.fontScaleFactor;

    // カーソルの座標を取得
    this.stringBox.caretPosScene = getCaretCoordinates().map(c => c * this.fontScaleFactor);

    /**
     * 新しい行かどうかを判定
     * @param {HTMLElement} el - 要素
     */
    function isNewLine(el) {
      if (el) {
        if (el.tagName) {
          if (el.tagName.toUpperCase() === 'DIV' || el.tagName.toUpperCase() === 'P') {
            if (el.innerHTML === '<br>' || el.innerHTML === '</br>') {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     *  カーソルの座標を取得
     */
    function getCaretCoordinates() {
      const range = window.getSelection().getRangeAt(0);
      // 一部のブラウザでの例外処理
      const needsToWorkAroundNewlineBug =
        range.startContainer.nodeName.toLowerCase() === 'div' && range.startOffset === 0;
      if (needsToWorkAroundNewlineBug) {
        return [range.startContainer.offsetLeft, range.startContainer.offsetTop];
      } else {
        // 選択範囲の矩形情報を取得
        const rects = range.getClientRects();
        if (rects[0]) {
          // 矩形の左上の座標を返す
          return [rects[0].left, rects[0].top];
        } else {
          // ファイアフォックスでの例外処理
          document.execCommand('selectAll', false, null);
          return [0, 0];
        }
      }
    }
  }

  /**
   * インプットのカーソルを末尾に移動
   */
  setCaretToEndOfInput() {
    document.execCommand('selectAll', false, null);
    document.getSelection().collapseToEnd();
  }

  /**
   *  テキストのリフレッシュ
   */
  refreshText() {
    // 座標のサンプリング
    this.sampleCoordinates();

    // テクスチャ座標をもとにパーティクルの更新
    this.particles = this.textureCoordinates.map((c, cIdx) => {
      const x = c.x * this.fontScaleFactor;
      const y = c.y * this.fontScaleFactor;
      // パーティクルの生成
      // oldがtrueの場合は古いパーティクルをそのまま利用、falseの場合は新しく生成
      let p = c.old && this.particles[cIdx] ? this.particles[cIdx] : new Particle([x, y]);
      // テクスチャ座標が削除された場合はパーティクルも削除フラグを立てる
      if (c.toDelete) {
        p.toDelete = true;
        p.scale = p.maxScale;
      }
      return p;
    });

    // instancedMeshの再生成
    this.recreateInstancedMesh();
    this.updateParticlesMatrices();
    this.makeTextFitScreen();

    // カーソルの位置の更新
    this.updateCursorPos();
  }

  /**
   * テクスチャ座標のサンプリング
   */
  sampleCoordinates() {
    // フォントの設定
    const fontName = ThreeApp.TEXT_TEX_PARAM.fontName;
    const textureFontSize = ThreeApp.TEXT_TEX_PARAM.textureFontSize;

    // テキストの描画
    const lines = this.string.split('\n'); // 改行で分割
    const linesNumber = lines.length;
    this.textCanvas.width = this.stringBox.wTexture;
    this.textCanvas.height = this.stringBox.hTexture;
    this.ctx.font = '100 ' + textureFontSize + 'px ' + fontName; // weight size font
    this.ctx.fillStyle = '#ffffff';
    this.ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height); // キャンバスのクリア
    for (let i = 0; i < linesNumber; i++) {
      // テキストの描画(テキスト, x座標, y座標)
      this.ctx.fillText(lines[i], 0, ((i + 0.8) * this.stringBox.hTexture) / linesNumber);
    }

    // 座標のサンプリング
    if (this.stringBox.wTexture > 0) {
      const imageData = this.ctx.getImageData(0, 0, this.textCanvas.width, this.textCanvas.height);
      const imageMask = Array.from(Array(this.textCanvas.height), () => new Array(this.textCanvas.width));
      for (let i = 0; i < this.textCanvas.height; i++) {
        for (let j = 0; j < this.textCanvas.width; j++) {
          //     // rチャンネルを参照し、0より大きい場合はテクスチャ座標として追加
          imageMask[i][j] = imageData.data[(j + i * this.textCanvas.width) * 4] > 0;
        }
      }

      // テクスチャ座標の更新
      if (this.textureCoordinates.length !== 0) {
        this.textureCoordinates = this.textureCoordinates.filter(c => !c.toDelete); // 削除フラグが立っているものを削除
        this.particles = this.particles.filter(p => !p.toDelete); // 削除フラグが立っているものを削除

        this.textureCoordinates.forEach(c => {
          if (imageMask[c.y]) {
            if (imageMask[c.y][c.x]) {
              // 座標がテキスト内にある場合はoldでマーク
              c.old = true;
              if (!c.toDelete) {
                // 後続で新しく座標が追加されないようにfalseにする
                imageMask[c.y][c.x] = false;
              }
            } else {
              c.toDelete = true;
            }
          } else {
            c.toDelete = true;
          }
        });
      }

      // 新規座標の追加
      for (let i = 0; i < this.textCanvas.height; i++) {
        for (let j = 0; j < this.textCanvas.width; j++) {
          if (imageMask[i][j]) {
            this.textureCoordinates.push({
              x: j,
              y: i,
              old: false,
              toDelete: false
            });
          }
        }
      }

    } else {
      this.textureCoordinates = [];
    }
  }

  /**
   * テキストを画面にフィットさせる
   */
  makeTextFitScreen() {
    const fov = this.camera.fov * (Math.PI / 180); // 垂直方向のfov
    const fovH = 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect); // 水平方向のfov
    const dx = Math.abs((this.stringBox.wScene * 0.55) / Math.tan(fovH / 2)); // 水平方向を映すために必要な距離
    const dy = Math.abs((this.stringBox.hScene * 0.55) / Math.tan(fov / 2)); // 垂直方向を映すために必要な距離
    const factor = Math.max(dx, dy) / this.camera.position.length(); // 必要な距離と現在のカメラ位置の比率
    if (factor > 1) {
      // カメラ位置の更新
      this.camera.position.multiplyScalar(factor);
    }
  }

  /**
   * カーソルの位置の更新
   */
  updateCursorPos() {
    this.cursorMesh.position.x = this.stringBox.wScene * -0.5 + this.stringBox.caretPosScene[0];
    this.cursorMesh.position.y = this.stringBox.hScene * 0.5 - this.stringBox.caretPosScene[1];
  }

  /**
   * カーソルの点滅
   */
  updateCursorOpacity() {
    // パルス関数
    let roundPulse = t => Math.sign(Math.sin(t * Math.PI)) * Math.pow(Math.sin((t % 1) * 3.14), 0.2);

    // カーソルの点滅
    if (document.hasFocus() && document.activeElement === this.textInput) {
      this.cursorMesh.material.opacity = roundPulse(2 * this.clock.getElapsedTime());
    } else {
      this.cursorMesh.material.opacity = 0;
    }
  }

  /**
   * instancedMeshの生成
   */
  recreateInstancedMesh() {
    // シーンから一度削除
    this.scene.remove(this.instancedMesh);

    // instancedMeshの生成
    this.instancedMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.particles.length
    );
    this.scene.add(this.instancedMesh);

    // 文字列全体を中央寄せ
    this.instancedMesh.position.x = this.stringBox.wScene * -0.5;
    this.instancedMesh.position.y = this.stringBox.hScene * -0.5;
  }

  /**
   * パーティクルの行列更新
   */
  updateParticlesMatrices() {
    const dummy = new THREE.Object3D();
    let idx = 0;
    this.particles.forEach(p => {
      p.grow();
      dummy.quaternion.copy(this.camera.quaternion);
      dummy.rotation.z = p.rotationZ;
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.position.set(p.x, this.stringBox.hScene - p.y, p.z);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(idx, dummy.matrix);
      idx++;
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * レンダリング
   */
  render() {
    requestAnimationFrame(this.render);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // パーティクルの行列更新
    this.updateParticlesMatrices();

    // カーソルの点滅
    this.updateCursorOpacity();
  }
}

/**
 * パーティクルの生成
 */
class Particle {
  /**
   * @constructor
   */
  constructor([x, y]) {
    
    // 位置の初期化
    this.x = x + 0.15 * (Math.random() - 0.5);
    this.y = y + 0.15 * (Math.random() - 0.5);
    this.z = 0;

    // スケールの初期化
    this.scale = Math.random() * 0;
    this.maxScale = 0.2 + 1.0 * Math.pow(Math.random(), 10.0); // 最大スケール
    this.deltaScale = 0.03 + 0.03 * Math.random(); // スケールの変化量

    // 寿命の初期化
    this.age = Math.PI * Math.random();
    this.ageDelta = 0.01 + 0.02 * Math.random();

    // 回転の初期化
    this.rotationZ = 0.5 * Math.random() * Math.PI;
    this.deltaRotation = 0.01 * (Math.random() - 0.5);

    // 削除フラグ
    this.toDelete = false;

    // 発散フラグ
    this.isGrowing = true;
  }

  grow() {
    this.age += this.ageDelta; // 寿命の更新
    this.rotationZ += this.deltaRotation; // 回転の更新
    
    // 発散中
    if(this.isGrowing) {
      this.scale += this.deltaScale; // スケールの拡大
      if(this.scale >= this.maxScale) {
        this.isGrowing = false;
      }
    } else if(this.toDelete) {
      this.scale -= this.deltaScale; // スケールの縮小
      if(this.scale <= 0) {
        this.scale = 0;
        this.deltaScale = 0;
      }
    } else {
      this.scale = this.maxScale + 0.2 * Math.sin(this.age); // スケールの更新
    }
  }
}
