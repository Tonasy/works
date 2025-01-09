import { Pane } from '../../../lib/webgl/tweakpane-4.0.3.min.js';

export default class ParamGUI {
  constructor(params) {
    this.pane = new Pane();
    this.params = params;
    this.init();
  }

  init() {

    // フォルダー
    const f1 = this.pane.addFolder({
      title: 'Parameters',
      expanded: false,
    });
    

    // 解像度
    f1.addBlade({
      view: 'slider',
      label: 'resolution',
      min: 0.1,
      max: 1.0,
      value: this.params.resolution
    }).on('change', (e) => {
      this.params.resolution = e.value;
    });

    // マウスの影響力
    f1.addBlade({
      view: 'slider',
      label: 'mouse_force',
      min: 20,
      max: 200,
      value: this.params.mouse_force
    }).on('change', (e) => {
      this.params.mouse_force = e.value;
    });
    
    // カーソルのサイズ（Planeのサイズ）
    f1.addBlade({
      view: 'slider',
      label: 'cursor_size',
      min: 20,
      max: 200,
      value: this.params.cursor_size
    }).on('change', (e) => {
      this.params.cursor_size = e.value;
    });

    // delta time
    f1.addBlade({
      view: 'slider',
      label: 'dt',
      min: 1 / 200,
      max: 1 / 30,
      value: this.params.dt
    }).on('change', (e) => {
      this.params.dt = e.value;
    });
  }
}
