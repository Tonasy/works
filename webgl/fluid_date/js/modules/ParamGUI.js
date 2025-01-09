import { Pane } from '../../../lib/webgl/tweakpane-4.0.3.min.js';

export default class ParamGUI {
  constructor(params) {
    this.pane = new Pane(); // Paneのインスタンスを作成
    this.params = params;  // パラメータを保持
    this.init();           // 初期化処理を実行
  }

  init() {
    // チェックボックスを追加
    this.pane.addBinding(this.params, 'psy', {
      label: 'Psychedelic', // ラベルの指定
    }).on('change', (e) => {
      this.params.psy = e.value;
    });
  }
}