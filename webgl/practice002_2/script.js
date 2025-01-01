import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';
import { Pane } from '../lib/webgl/tweakpane-4.0.3.min.js';

window.addEventListener(
  'DOMContentLoaded',
  async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    await app.load();
    await app.init();
    app.setupPane();
    app.render();
  },
  false
);

class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 500.0,
    position: new THREE.Vector3(0.0, -2.0, 5.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x111111,
    width: window.innerWidth,
    height: window.innerHeight
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xedb200,
    intensity: 2.0,
    position: new THREE.Vector3(-1.0, 1.0, 1.0)
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xedb200,
    intensity: 0.5
  };
  /**
   * インスタンシング関連の定数
   */
  static INSTANCE_PARAM = {
    count: 150, // インスタンスの数
    randomScale: 7.5, // ランダムに散らばる範囲のスケール
    startY: 7.5, // 落下開始位置
    resetY: -12.5 // 落下リセット位置
  };

  wrapper; // canvas の親要素
  renderer; // レンダラ
  scene; // シーン
  camera; // カメラ
  directionalLight; // 平行光源
  ambientLight; // アンビエントライト
  geometry; // ジオメトリ
  material; // マテリアル
  instancedMesh; // インスタンシング用メッシュ
  controls; // オービットコントロール
  axesHelper; // 軸ヘルパー
  gltf; // glTF ファイルのデータ
  shader; // シェーダ
  clock; // 時間管理
  speedScale; // 時間のスケール
  rotationScale; // 回転のスケール

  constructor(wrapper) {
    this.wrapper = wrapper;

    this.render = this.render.bind(this);

    window.addEventListener(
      'resize',
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  async init() {
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);

    // 初期値の設定
    this.speedScale = 1.0;
    this.rotationScale = 0.25;

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // 背景画像の設定
    const loader = new THREE.CubeTextureLoader();
    const texture = await loader.load([
      './img/px.jpg',
      './img/nx.jpg',
      './img/py.jpg',
      './img/ny.jpg',
      './img/pz.jpg',
      './img/nz.jpg'
    ]);
    this.scene.background = texture;

    // glTFからインスタンス用のジオメトリを取得
    this.geometry = this.gltf.scene.children[0].geometry;
    this.geometry = new THREE.InstancedBufferGeometry();

    // モデル共通のAttributeをコピーして設定
    const position = this.gltf.scene.children[0].geometry.attributes.position.clone();
    const normal = this.gltf.scene.children[0].geometry.attributes.normal.clone();
    const uv = this.gltf.scene.children[0].geometry.attributes.uv.clone();
    const indices = this.gltf.scene.children[0].geometry.index.clone();
    this.geometry.setAttribute('position', position);
    this.geometry.setAttribute('normal', normal);
    this.geometry.setAttribute('uv', uv);
    this.geometry.setIndex(indices);

    // インスタンス用のマテリアル
    this.material = this.gltf.scene.children[0].material; // MeshPhysicalMaterial

    // onBeforeCompileでシェーダを書き換える
    this.material.onBeforeCompile = shader => {
      // uniform変数を追加
      Object.assign(shader.uniforms, {
        time: { value: 0.0 },
        startY: { value: ThreeApp.INSTANCE_PARAM.startY },
        resetY: { value: ThreeApp.INSTANCE_PARAM.resetY },
        speedScale: { value: this.speedScale },
        rotationScale: { value: this.rotationScale }
      });

      // シェーダを保存しておく
      this.shader = shader;

      // 頂点シェーダーにAttribute変数の追加
      const additionalDefine = `
      attribute float fallSpeed;
      attribute float rotation;
      uniform float time;
      uniform float startY;
      uniform float resetY;
      uniform float speedScale;
      uniform float rotationScale;

      // 乱数生成器
      float random(float seed) {
        return fract(sin(seed) * 43758.5453);
      }
      `;
      const keywordVert1 = 'void main() {'; // 置換するキーワード
      shader.vertexShader = shader.vertexShader.replace(keywordVert1, `${additionalDefine}\n${keywordVert1}`);

      // 頂点シェーダでインスタンスを動かす処理を追加
      const keywordVert2 = '#include <project_vertex>'; // 置換するキーワード
      const additionalVert2 = `
      vec4 mvPosition = vec4( transformed, 1.0 );

      mvPosition.x = position.x + sin(time) * 0.25;

      // 落下処理
      float fallSpeed = fallSpeed * speedScale;
      float offsetY = startY - mod(fallSpeed * time, startY - resetY);
      mvPosition.y += offsetY;

      // 回転処理
      float angle = rotation + time * rotationScale;
      float c = cos(angle);
      float s = sin(angle);
      mat2 rotationMatrix = mat2(c, -s, s, c); // 回転行列
      mvPosition.xz = rotationMatrix * mvPosition.xz;

      #ifdef USE_BATCHING

        mvPosition = batchingMatrix * mvPosition;

      #endif

      #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

      #endif

      mvPosition = modelViewMatrix * mvPosition;

      gl_Position = projectionMatrix * mvPosition;
      `;
      shader.vertexShader = shader.vertexShader.replace(keywordVert2, `${additionalVert2}`);
    };

    // メッシュの生成
    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, ThreeApp.INSTANCE_PARAM.count);

    // ダミーデータを使用してインスタンス固有の情報を設定
    const dummy = new THREE.Object3D();
    const fallSpeeds = new Float32Array(ThreeApp.INSTANCE_PARAM.count);
    const rotations = new Float32Array(ThreeApp.INSTANCE_PARAM.count);
    for (let i = 0; i < ThreeApp.INSTANCE_PARAM.count; i++) {
      // インスタンスの位置をランダムに設定
      dummy.position.set(
        (Math.random() * 2.0 - 1.0) * ThreeApp.INSTANCE_PARAM.randomScale,
        ThreeApp.INSTANCE_PARAM.startY,
        (Math.random() * 2.0 - 1.0) * ThreeApp.INSTANCE_PARAM.randomScale
      );

      // インスタンスの回転
      dummy.rotation.set(0.0, Math.PI / 2, 0.0);

      // インスタンスのスケールをランダムに設定
      const rdm = Math.random();
      dummy.scale.set(rdm * 2.0, rdm * 2.0, rdm * 2.0);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);

      // 落下速度をランダムに設定(0.25 ~ 1.0)
      fallSpeeds[i] = Math.random() * 0.75 + 0.25;

      // インスタンスの回転をランダムに設定
      rotations[i] = Math.random() * Math.PI * 2.0;
    }
    // Attribute変数に追加
    this.geometry.setAttribute('fallSpeed', new THREE.InstancedBufferAttribute(fallSpeeds, 1));
    this.geometry.setAttribute('rotation', new THREE.InstancedBufferAttribute(rotations, 1));

    // uniform変数の設定

    // シーンに追加
    this.scene.add(this.instancedMesh);

    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.clock = new THREE.Clock();
  }

  /**
   * tweakpane の初期化設定
   */
  setupPane() {
    const pane = new Pane();
    const parameter = {
      speedScale: this.speedScale,
      rotationScale: this.rotationScale
    };
    // 落下速度のスケール
    pane
      .addBinding(parameter, 'speedScale', {
        min: 0.0,
        max: 5.0
      })
      .on('change', v => {
        this.speedScale = v.value;
      });
    // 回転のスケール
    pane
      .addBinding(parameter, 'rotationScale', {
        min: 0.0,
        max: 5.0
      })
      .on('change', v => {
        this.rotationScale = v.value;
      });
  }

  load() {
    return new Promise(resolve => {
      const gltfPath = './RedLeaf.glb';
      const loader = new GLTFLoader();
      loader.load(gltfPath, gltf => {
        this.gltf = gltf;
        resolve();
      });
    });
  }

  render() {
    // 経過時間を uniform 変数に反映する
    if (this.shader) {
      this.shader.uniforms.time.value = this.clock.getElapsedTime();
      this.shader.uniforms.speedScale.value = this.speedScale;
      this.shader.uniforms.rotationScale.value = this.rotationScale;
    }

    requestAnimationFrame(this.render);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
