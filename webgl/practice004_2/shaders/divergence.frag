precision highp float;
uniform sampler2D uVelocity;
uniform float uDt;
uniform vec2 uPx;
uniform float uTime;
varying vec2 vUv;


void main() {
    float left = texture2D(uVelocity, vUv - vec2(uPx.x, 0.0)).x;
    float right = texture2D(uVelocity, vUv + vec2(uPx.x, 0.0)).x;
    float bottom = texture2D(uVelocity, vUv - vec2(0.0, uPx.y)).y;
    float top = texture2D(uVelocity, vUv + vec2(0.0, uPx.y)).y;
    float divergence = ((right - left) + (top - bottom)) / 2.0;

    // 時間で発散を変化させる
    divergence = ((right - left) + (top - bottom)) / (2.0 + sin(uTime) * 2.0);

    // 発散を抑える
    // divergence *= 0.1;


    gl_FragColor = vec4(divergence / uDt);
}