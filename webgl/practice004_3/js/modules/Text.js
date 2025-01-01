import * as THREE from '../../../lib/three.module.js';
import Common from './Common.js';

export default class Text {
  constructor() {
    // テクスチャを初期化
    this.texture = null;

    this.init();
  }

  async init() {
    this.createTextTexture();
  }

  createTextTexture() {
    // canvas の定義
    const canvas = document.createElement('canvas');
    canvas.width = Common.width;
    canvas.height = Common.height;
    // 2D コンテキストの取得
    const ctx = canvas.getContext('2d');

    // フォント設定
    const fontSize = Math.min(Common.width, Common.height) * 0.3;
    ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // テキストの描画
    ctx.fillText("あ け お め", Common.width / 2, Common.height / 2);

    // テクスチャの生成
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.needsUpdate = true;
  }
}
