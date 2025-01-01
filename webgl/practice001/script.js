import { WebGLUtility } from "../lib/webgl/webgl.js";
import { Vec3, Mat4 } from "../lib/webgl/math.js";
import { WebGLGeometry } from "../lib/webgl/geometry.js";
import { WebGLOrbitCamera } from "../lib/webgl/camera.js";
import { Pane } from "../lib/webgl/tweakpane-4.0.3.min.js";

window.addEventListener(
  "DOMContentLoaded",
  async () => {
    const app = new App();
    app.init();
    await app.load();
    app.setupGeometry();
    app.setupLocation();
    app.start();
  },
  false
);

/**
 * アプリケーション管理クラス
 */
class App {
  canvas; // WebGL で描画を行う canvas 要素
  gl; // WebGLRenderingContext （WebGL コンテキスト）
  program; // WebGLProgram （プログラムオブジェクト）
  attributeLocation; // attribute 変数のロケーション
  attributeStride; // attribute 変数のストライド
  planeGeometry; // プレーンのジオメトリ情報
  planeVBO; // プレーンの頂点バッファ
  planeIBO; // プレーンのインデックスバッファ
  uniformLocation; // uniform 変数のロケーション
  startTime; // レンダリング開始時のタイムスタンプ
  isRendering; // レンダリングを行うかどうかのフラグ
  isRotation; // オブジェクトを Y 軸回転させるかどうか
  camera; // WebGLOrbitCamera のインスタンス
  frontTex; // 表面用テクスチャのインスタンス
  backTex; // 裏面用テクスチャのインスタンス

  constructor() {
    // this を固定するためのバインド処理
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
  }

  /**
   * 初期化処理を行う
   */
  init() {
    // canvas エレメントの取得と WebGL コンテキストの初期化
    this.canvas = document.getElementById("webgl-canvas");
    this.gl = WebGLUtility.createWebGLContext(this.canvas);

    // カメラ制御用インスタンスを生成する
    const cameraOption = {
      distance: 7.5, // Z 軸上の初期位置までの距離
      min: 1.0, // カメラが寄れる最小距離
      max: 10.0, // カメラが離れられる最大距離
      move: 2.0, // 右ボタンで平行移動する際の速度係数
    };
    this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);

    // 最初に一度リサイズ処理を行っておく
    this.resize();

    // リサイズイベントの設定
    window.addEventListener("resize", this.resize, false);

    // バックフェイスカリングと深度テストは初期状態で有効
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  /**
   * リサイズ処理
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * 各種リソースのロードを行う
   * @return {Promise}
   */
  load() {
    return new Promise(async (resolve, reject) => {
      const gl = this.gl;
      if (gl == null) {
        // もし WebGL コンテキストがない場合はエラーとして Promise を reject する
        const error = new Error("not initialized");
        reject(error);
      } else {
        // シェーダのソースコードを読み込みシェーダとプログラムオブジェクトを生成する
        const VSSource = await WebGLUtility.loadFile("./main.vert");
        const FSSource = await WebGLUtility.loadFile("./main.frag");
        const vertexShader = WebGLUtility.createShaderObject(
          gl,
          VSSource,
          gl.VERTEX_SHADER
        );
        const fragmentShader = WebGLUtility.createShaderObject(
          gl,
          FSSource,
          gl.FRAGMENT_SHADER
        );
        this.program = WebGLUtility.createProgramObject(
          gl,
          vertexShader,
          fragmentShader
        );

        // 画像を読み込み、テクスチャを初期化する
        const textures = [
          { path: "./front_img.png", name: "frontTex" },
          { path: "./back_img.png", name: "backTex" },
        ];

        for (const { path, name } of textures) {
          const image = await WebGLUtility.loadImage(path);
          this[name] = WebGLUtility.createTexture(gl, image);
        }

        // Promsie を解決
        resolve();
      }
    });
  }

  /**
   * 頂点属性（頂点ジオメトリ）のセットアップを行う
   */
  setupGeometry() {
    // プレーンジオメトリ情報を取得
    const width = 2.0;
    const height = 3.0;
    const color = [1.0, 1.0, 1.0, 1.0];
    this.planeGeometry = WebGLGeometry.plane(width, height, color);

    // テクスチャ座標を設定
    this.planeGeometry.texCoord = [
      0.135, 0.0, 0.865, 0.0, 0.135, 1.0, 0.865, 1.0,
    ];

    // VBO と IBO を生成する
    this.planeVBO = [
      WebGLUtility.createVBO(this.gl, this.planeGeometry.position),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.normal),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.color),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.texCoord),
    ];
    this.planeIBO = WebGLUtility.createIBO(this.gl, this.planeGeometry.index);
  }

  /**
   * 頂点属性のロケーションに関するセットアップを行う
   */
  setupLocation() {
    const gl = this.gl;
    // attribute location の取得
    this.attributeLocation = [
      gl.getAttribLocation(this.program, "position"),
      gl.getAttribLocation(this.program, "normal"),
      gl.getAttribLocation(this.program, "color"),
      gl.getAttribLocation(this.program, "texCoord"),
    ];
    // attribute のストライド
    this.attributeStride = [3, 3, 4, 2];
    // uniform location の取得
    this.uniformLocation = {
      mvpMatrix: gl.getUniformLocation(this.program, "mvpMatrix"),
      modelMatrix: gl.getUniformLocation(this.program, "modelMatrix"),
      normalMatrix: gl.getUniformLocation(this.program, "normalMatrix"),
      lightPosition: gl.getUniformLocation(this.program, "lightPosition"),
      lightColor: gl.getUniformLocation(this.program, "lightColor"),
      ambient: gl.getUniformLocation(this.program, "ambient"),
      eyePosition: gl.getUniformLocation(this.program, "eyePosition"),
      texture: gl.getUniformLocation(this.program, "texture"),
    };
  }

  /**
   * レンダリングのためのセットアップを行う
   */
  setupRendering() {
    const gl = this.gl;
    // ビューポートを設定する
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // クリアする色と深度を設定する
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    // 色と深度をクリアする
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /**
   * 描画を開始する
   */
  start() {
    // レンダリング開始時のタイムスタンプを取得しておく
    this.startTime = Date.now();
    // レンダリングを行っているフラグを立てておく
    this.isRendering = true;
    // レンダリングの開始
    this.render();
  }

  /**
   * 描画を停止する
   */
  stop() {
    this.isRendering = false;
  }

  /**
   * レンダリングを行う
   */
  render() {
    const gl = this.gl;

    // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める
    if (this.isRendering === true) {
      requestAnimationFrame(this.render);
    }

    // 現在までの経過時間
    const nowTime = (Date.now() - this.startTime) * 0.001;

    // レンダリングのセットアップ
    this.setupRendering();

    // ビュー・プロジェクション座標変換行列
    const v = this.camera.update();
    const fovy = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 10.0;
    const p = Mat4.perspective(fovy, aspect, near, far);
    const vp = Mat4.multiply(p, v);

    // 視点情報を取得
    const eyePosition = this.camera.position;

    // VBO と IBO を設定し、描画する
    WebGLUtility.enableBuffer(
      gl,
      this.planeVBO,
      this.attributeLocation,
      this.attributeStride,
      this.planeIBO
    );

    // プログラムオブジェクトを選択
    gl.useProgram(this.program);

    // uniform 変数を設定
    gl.uniform3fv(this.uniformLocation.lightPosition, [0.0, 0.5, 0.5]);
    gl.uniform3fv(this.uniformLocation.lightColor, [0.9, 0.5, 0.7]);
    gl.uniform3fv(this.uniformLocation.ambient, [0.3, 0.3, 0.3]);
    gl.uniform3fv(this.uniformLocation.eyePosition, eyePosition);

    {
      // 表面の描画
      const m = Mat4.rotate(
        Mat4.rotate(Mat4.identity(), nowTime, Vec3.create(0.0, 1.0, 0.0)),
        Math.PI / 6,
        Vec3.create(0.0, 0.0, 1.0)
      );
      const mvp = Mat4.multiply(vp, m);
      const normalMatrix = Mat4.transpose(Mat4.inverse(m));

      gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
      gl.uniformMatrix4fv(this.uniformLocation.modelMatrix, false, m);
      gl.uniformMatrix4fv(
        this.uniformLocation.normalMatrix,
        false,
        normalMatrix
      );

      // テクスチャのバインド
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.frontTex);
      gl.uniform1i(this.uniformLocation.texture, 0);

      gl.drawElements(
        gl.TRIANGLES,
        this.planeGeometry.index.length,
        gl.UNSIGNED_SHORT,
        0
      );
    }

    {
      // 裏面の描画
      const m = Mat4.rotate(
        Mat4.rotate(
          Mat4.rotate(
            Mat4.translate(Mat4.identity(), Vec3.create(-0.001, 0.0, 0.0)),
            nowTime,
            Vec3.create(0.0, 1.0, 0.0)
          ),
          Math.PI / 6,
          Vec3.create(0.0, 0.0, 1.0)
        ),
        Math.PI,
        Vec3.create(1.0, 0.0, 0.0)
      );
      const mvp = Mat4.multiply(vp, m);
      const normalMatrix = Mat4.transpose(Mat4.inverse(m));

      gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
      gl.uniformMatrix4fv(this.uniformLocation.modelMatrix, false, m);
      gl.uniformMatrix4fv(
        this.uniformLocation.normalMatrix,
        false,
        normalMatrix
      );

      // テクスチャのバインド
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.backTex);
      gl.uniform1i(this.uniformLocation.texture, 0);

      gl.drawElements(
        gl.TRIANGLES,
        this.planeGeometry.index.length,
        gl.UNSIGNED_SHORT,
        0
      );
    }
  }
}
