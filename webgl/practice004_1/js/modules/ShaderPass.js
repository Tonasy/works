import * as THREE from '../../../lib/three.module.js';
import Common from './Common.js';

export default class ShaderPass {
    
    constructor(props) {
        this.props = props;
        this.uniforms = this.props.material?.uniforms;
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        if(this.uniforms) {
            this.material = new THREE.ShaderMaterial(this.props.material);
            this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
            this.plane = new THREE.Mesh(this.geometry, this.material);
            this.scene.add(this.plane);
        }
    }

    update() {
        Common.renderer.setRenderTarget(this.props.output);
        Common.renderer.render(this.scene, this.camera);
        Common.renderer.setRenderTarget(null);
    }

}