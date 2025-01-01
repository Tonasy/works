import ShaderFiles from './ShaderFiles.js';
import ShaderPass from './ShaderPass.js';
import * as THREE from '../../../lib/three.module.js';

export default class Advection extends ShaderPass {
  constructor(simProps) {
    super({
      material: {
        vertexShader: ShaderFiles.getShader('mainVS'),
        fragmentShader: ShaderFiles.getShader('advectionFS'),
        uniforms: {
          uBoundary: {
            value: simProps.cellScale
          },
          uPx: {
            value: simProps.cellScale
          },
          uFboSize: {
            value: simProps.fboSize
          },
          uVelocity: {
            value: simProps.src.texture
          },
          uDt: {
            value: simProps.dt
          }
        }
      },
      output: simProps.dest
    });

    this.cellScale = simProps.cellScale;
    this.init();
  }

  init() {
    super.init();
    this.createBoundary();
  }

  createBoundary() {
    const boundaryGeometry = new THREE.BufferGeometry();
    const offsettedX = 1.0 - this.cellScale.x;
    const offsettedY = 1.0 - this.cellScale.y;

    const vertices = new Float32Array([
      // left
      -offsettedX,
      -offsettedY,
      0.0,
      -offsettedX,
      offsettedY,
      0.0,

      // top
      -offsettedX,
      offsettedY,
      0.0,
      offsettedX,
      offsettedY,
      0.0,

      // right
      offsettedX,
      offsettedY,
      0.0,
      offsettedX,
      -offsettedY,
      0.0,

      // bottom
      offsettedX,
      -offsettedY,
      0.0,
      -offsettedX,
      -offsettedY,
      0.0,
    ]);
    boundaryGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const boundaryMaterial = new THREE.ShaderMaterial({
      vertexShader: ShaderFiles.getShader('boundaryVS'),
      fragmentShader: ShaderFiles.getShader('advectionFS'),
      uniforms: this.uniforms
    });

    const boundaryMesh = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
    this.scene.add(boundaryMesh);
  }

  update(dt) {
    this.uniforms.uDt.value = dt;
    super.update();
  }
}
