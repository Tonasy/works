import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

window.addEventListener(
  'DOMContentLoaded',
  async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    await app.load();
    app.init();
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
    position: new THREE.Vector3(0.0, 2.0, 10.0),
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
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0)
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.1
  };
  /**
   * インスタンシング関連の定数
   */
  static INSTANCE_COUNT = 200; // インスタンスの数
  static RANDOM_SCALE = 7.5; // ランダムに散らばる範囲のスケール

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

  init() {
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);

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

    // glTFからインスタンス用のジオメトリを取得
    this.geometry = this.gltf.scene.children[0].geometry;
    this.geometry = new THREE.InstancedBufferGeometry();
    console.log(this.gltf);
    

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
    this.material = this.gltf.scene.children[0].material;

    // メッシュの生成
    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, ThreeApp.INSTANCE_COUNT);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < ThreeApp.INSTANCE_COUNT; i++) {
      // インスタンスの位置をランダムに設定
      dummy.position.set(
        (Math.random() * 2.0 - 1.0) * ThreeApp.RANDOM_SCALE,
        (Math.random() * 2.0 - 1.0) * ThreeApp.RANDOM_SCALE,
        (Math.random() * 2.0 - 1.0) * ThreeApp.RANDOM_SCALE
      );
      // インスタンスの回転をランダムに設定
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      // インスタンスのスケールをランダムに設定
      const rdm = Math.random();
      dummy.scale.set(
        rdm * 2.0,
        rdm * 2.0,
        rdm * 2.0
      );
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(this.instancedMesh);

    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
    requestAnimationFrame(this.render);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
