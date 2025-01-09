import ShaderFiles from "./ShaderFiles.js";
import ShaderPass from "./ShaderPass.js";

export default class Poisson extends ShaderPass {
    constructor(simProps) {
        super({
            material: {
                vertexShader: ShaderFiles.getShader('mainVS'),
                fragmentShader: ShaderFiles.getShader('poissonFS'),
                uniforms: {
                    uBoundary: {
                        value: simProps.boundary
                    },
                    uPressure: {
                        value: simProps.dest_.texture
                    },
                    uDivergence: {
                        value: simProps.src.texture
                    },
                    uPx: {
                        value: simProps.cellScale
                    },
                }
            },
            output: simProps.dest,
            output0 : simProps.dest_,
            output1 : simProps.dest
        });

        this.init();
    }

    update() {
        const ITR = 10; // 反復回数
        let p_in, p_out;

        for(let i = 0; i < ITR; i++) {
            // FBO を切り替えて反復計算
            if(i % 2 == 0) {
                p_in = this.props.output0;
                p_out = this.props.output1;
            } else {
                p_in = this.props.output1;
                p_out = this.props.output0;
            }

            this.uniforms.uPressure.value = p_in.texture;
            this.props.output = p_out;
            super.update();
        }

        return p_out;
    }
}