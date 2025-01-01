import ShaderFiles from './ShaderFiles.js';
import ShaderPass from './ShaderPass.js';

export default class Divergence extends ShaderPass {
  constructor(simProps) {
    super({
      material: {
        vertexShader: ShaderFiles.getShader('mainVS'),
        fragmentShader: ShaderFiles.getShader('divergenceFS'),
        uniforms: {
          uBoundry: {
            value: simProps.boundary
          },
          uVelocity: {
            value: simProps.src.texture
          },
          uPx: {
            value: simProps.cellScale
          },
          uDt: {
            value: simProps.dt
          },
          uTime: {
            value: simProps.time
          }
        }
      },
      output: simProps.dest
    });

    this.init();
  }

  update({ vel }) {
    this.uniforms.uVelocity.value = vel.texture;
    super.update();
  }
}
