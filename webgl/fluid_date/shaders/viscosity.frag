precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uNewVelocity;
uniform float uViscosity;
uniform vec2 uPx;
uniform float uDt;
varying vec2 vUv;

void main() {
    vec2 newLeft = texture2D(uNewVelocity, vUv - vec2(uPx.x * 2.0, 0.0)).xy;
    vec2 newRight = texture2D(uNewVelocity, vUv + vec2(uPx.x * 2.0, 0.0)).xy;
    vec2 newBottom = texture2D(uNewVelocity, vUv - vec2(0.0, uPx.y * 2.0)).xy;
    vec2 newTop = texture2D(uNewVelocity, vUv + vec2(0.0, uPx.y * 2.0)).xy;

    vec2 old = texture2D(uVelocity, vUv).xy;

    vec2 new = 4.0 * old + uViscosity * uDt * (newLeft + newRight + newBottom + newTop);
    new /= 4.0 * (1.0 + uViscosity * uDt);

    gl_FragColor = vec4(new, 0.0, 0.0);
}