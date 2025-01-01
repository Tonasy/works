
precision highp float;

uniform vec2 uPx;
varying vec2 vUv;

void main() {
    vec3 pos = position;
    // 頂点座標を 0.0 から 1.0 の範囲に変換して UV 座標にする
    vUv = 0.5 + pos.xy * 0.5;

    vec2 n = sign(pos.xy); // 符号を取得
    pos.xy = abs(pos.xy) - uPx * 2.0; // 座標の絶対値をピクセルサイズ分オフセット
    pos.xy *= n; // 符号を戻す

    gl_Position = vec4(pos, 1.0);
}