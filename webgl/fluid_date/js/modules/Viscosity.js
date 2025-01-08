import ShaderFiles from './ShaderFiles.js';
import ShaderPass from './ShaderPass.js';

export default class Viscosity extends ShaderPass {
  constructor(simProps) {
    super({
      material: {
        vertexShader: ShaderFiles.getShader('mainVS'),
        fragmentShader: ShaderFiles.getShader('viscosityFS'),
        uniforms: {
          uBoundary: {
            value: simProps.boundary
          },
          uVelocity: {
            value: simProps.src.texture
          },
          uNewVelocity: {
            value: simProps.dest_.texture
          },
          uViscosity: {
            value: simProps.viscosity
          },
          uPx: {
            value: simProps.cellScale
          },
          uDt: {
            value: simProps.dt
          }
        }
      },
      output: simProps.dest,

      output0: simProps.dest_,
      output1: simProps.dest
    });

    this.init();
  }

  init() {
    super.init();
  }

  update({ dt, viscosity }) {
    const ITR = 36; // 反復回数
    let vis_in, vis_out;

    for (let i = 0; i < ITR; i++) {
      // FBO を切り替えて反復計算
      if (i % 2 == 0) {
        vis_in = this.props.output0;
        vis_out = this.props.output1;
      } else {
        vis_in = this.props.output1;
        vis_out = this.props.output0;
      }

      this.uniforms.uViscosity.value = viscosity;
      this.uniforms.uNewVelocity.value = vis_in.texture;
      this.props.output = vis_out;
      this.uniforms.uDt.value = dt;

      super.update();
    }
    return vis_out;
  }
}
