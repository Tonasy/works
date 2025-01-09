import * as THREE from '../../../lib/three.module.js';
import Common from './Common.js';

export default class Text {
  constructor() {
    // テクスチャを初期化
    this.texture = null;
  }

  init() {
    this.createTextTexture();
  }

  createTextTexture() {
    // canvas の定義
    const canvas = document.createElement('canvas');
    canvas.width = Common.width;
    canvas.height = Common.height;
    // 2D コンテキストの取得
    const ctx = canvas.getContext('2d');

    // テキストの取得（日付）
    const today = this.getDateInfo();

    // フォント設定
    const fontSize = Common.width / 8;
    ctx.font = `${fontSize}px Lobster, serif`;
    // ctx.fillStyle = '#ffffff';
    ctx.fillStyle = '#eecc55';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // テキストの描画
    ctx.fillText(today, Common.width / 2, Common.height / 2);

    // テクスチャの生成
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.needsUpdate = true;
  }

  resize() {
    if (this.texture) {
      this.texture.dispose();
    }
    this.createTextTexture();
  }

  getDateInfo() {
    // 0 パディング
    const zeroPadding = num => {
      return num < 10 ? `0${num}` : num;
    };
    // 年.月.日
    const date = new Date();
    const year = date.getFullYear();
    const month = zeroPadding(date.getMonth() + 1);
    const day = zeroPadding(date.getDate());

    return `${year}.${month}.${day}`;
  }
}
