import ShaderFiles from './ShaderFiles.js';
import ShaderPass from './ShaderPass.js';

export default class Pressure extends ShaderPass {
  constructor(simProps) {
    super({
      material: {
        vertexShader: ShaderFiles.getShader('mainVS'),
        fragmentShader: ShaderFiles.getShader('pressureFS'),
        uniforms: {
          uBoundary: {
            value: simProps.boundary
          },
          uPressure: {
            value: simProps.src_p.texture
          },
          uVelocity: {
            value: simProps.src_v.texture
          },
          uPx: {
            value: simProps.cellScale
          },
          uDt: {
            value: simProps.dt
          }
        }
      },
      output: simProps.dest
    });

    this.init();
  }

  update({ vel, pressure }) {
    this.uniforms.uVelocity.value = vel.texture;
    this.uniforms.uPressure.value = pressure.texture;
    super.update();
  }
}
