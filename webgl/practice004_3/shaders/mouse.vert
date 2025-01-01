precision highp float;

attribute vec3 position;
attribute vec2 uv;
uniform vec2 uCenter;
uniform vec2 uScale;
uniform vec2 uPx;
varying vec2 vUv;

void main(){
    vec2 pos = position.xy * uScale * 2.0 * uPx + uCenter;
    vUv = uv;
    gl_Position = vec4(pos, 0.0, 1.0);
}