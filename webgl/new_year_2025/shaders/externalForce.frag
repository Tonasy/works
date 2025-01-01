precision highp float;

uniform vec2 uForce;
uniform vec2 uCenter;
uniform vec2 uScale;
uniform vec2 uPx;
varying vec2 vUv;

void main() {
    vec2 circle = vUv * 2.0 - 1.0; // -1.0 ~ 1.0 に正規化
    float d = pow(1.0 - min(length(circle), 1.0), 2.0); // 0.0 ~ 1.0 に正規化 (中心に近いほど大きな値)

    gl_FragColor = vec4(uForce * d, 0.0, 1.0); 
}
