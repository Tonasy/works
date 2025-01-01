precision highp float;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uPx;
varying vec2 vUv;

void main() {
   
    float left = texture2D(uPressure, vUv - vec2(uPx.x * 2.0, 0.0)).r;
    float right = texture2D(uPressure, vUv + vec2(uPx.x * 2.0, 0.0)).r;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uPx.y * 2.0)).r;
    float top = texture2D(uPressure, vUv + vec2(0.0, uPx.y * 2.0)).r;
    float div = texture2D(uDivergence, vUv).r;

    float new_pressure = (left + right + bottom + top) / 4.0 - div;

    gl_FragColor = vec4(new_pressure);
}