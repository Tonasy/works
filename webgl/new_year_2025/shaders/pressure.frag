precision highp float;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uPx;
uniform float uDt;
varying vec2 vUv;

void main() {
    float left = texture2D(uPressure, vUv - vec2(uPx.x, 0.0)).r;
    float right = texture2D(uPressure, vUv + vec2(uPx.x, 0.0)).r;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uPx.y)).r;
    float top = texture2D(uPressure, vUv + vec2(0.0, uPx.y)).r;

    vec2 vel = texture2D(uVelocity, vUv).xy;

    // 勾配
    vec2 gradP = vec2(right - left, top - bottom) * 0.5;
    vel = vel - gradP * uDt;

    gl_FragColor = vec4(vel, 0.0, 1.0);
}