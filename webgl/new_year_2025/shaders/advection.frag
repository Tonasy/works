precision highp float;
uniform sampler2D uVelocity;
uniform float uDt;
uniform vec2 uFboSize;
uniform vec2 uPx;
varying vec2 vUv;

// ランダム関数
float rnd (vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // BFECC法で計算
    vec2 ratio = max(uFboSize.x, uFboSize.y) / uFboSize;
    
    vec2 spot_new = vUv;
    vec2 vel_old = texture2D(uVelocity, vUv).xy;

    // backtrace
    vec2 spot_old = spot_new - vel_old * uDt * ratio;
    vec2 vel_new1 = texture2D(uVelocity, spot_old).xy;

    // forward trace
    vec2 spot_new2 = spot_old + vel_new1 * uDt * ratio;

    vec2 error = spot_new2 - spot_new;

    vec2 spot_new3 = spot_new - error / 2.0;
    vec2 vel_2 = texture2D(uVelocity, spot_new3).xy;

    // backtrace2
    vec2 spot_old2 = spot_new3 - vel_2 * uDt * ratio;
    vec2 vel_new2 = texture2D(uVelocity, spot_old2).xy;

    gl_FragColor = vec4(vel_new2, 0.0, 0.0);
}
