import * as THREE from '../../../lib/three.module.js';

class ShaderFiles {
  constructor() {
    // シェーダを格納する連想配列
    this.shaders = {};
  }
  /**
   * シェーダファイルをロードする
   */
  async load() {
    try {
      const shaders = await Promise.all([
        this.loadShader('./shaders/main.vert'),
        this.loadShader('./shaders/mouse.vert'),
        this.loadShader('./shaders/boundary.vert'),
        this.loadShader('./shaders/main.frag'),
        this.loadShader('./shaders/externalForce.frag'),
        this.loadShader('./shaders/advection.frag'),
        this.loadShader('./shaders/viscosity.frag'),
        this.loadShader('./shaders/divergence.frag'),
        this.loadShader('./shaders/poisson.frag'),
        this.loadShader('./shaders/pressure.frag'),
      ]);

      this.shaders = {
        mainVS: shaders[0],
        mouseVS: shaders[1],
        boundaryVS: shaders[2],
        mainFS: shaders[3],
        externalForceFS: shaders[4],
        advectionFS: shaders[5],
        viscosityFS: shaders[6],
        divergenceFS: shaders[7],
        poissonFS: shaders[8],
        pressureFS: shaders[9],
      };

      console.log('All shaders loaded successfully.');
    } catch (error) {
      console.error('Error loading shaders:', error);
    }
  }
  /**
   * シェーダリソースを取得する
   * @param {string} key - シェーダのキー
   */
  getShader(key) {
    return this.shaders[key];
  }
  /**
   * ロードのためのヘルパー関数
   */
  loadShader(path) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.FileLoader();
      loader.load(path, resolve, undefined, reject);
    });
  }
}

export default new ShaderFiles();
