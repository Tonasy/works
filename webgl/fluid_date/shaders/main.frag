precision highp float;
uniform float uTime;
uniform sampler2D uVelocity;
uniform sampler2D uText;
uniform vec2 uResolution;
uniform bool uPsy;
varying vec2 vUv;

float rnd(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float rnd2(vec2 n) {
  float a = 0.129898;
  float b = 0.78233;
  float c = 437.585453;
  float dt= dot(n ,vec2(a, b));
  float sn= mod(dt, 3.14);
  return fract(sin(sn) * c);
}
void main() {
    // - 共通 --------------------------------
    vec2 vel = texture2D(uVelocity, vUv).xy;
    float speed = length(vel);
    vec4 text = texture2D(uText, vUv) ;
    float r1 = rnd(vec2(speed));
    float r2 = rnd(vec2(speed * 0.5));
    float r3 = rnd2(vec2(speed * 0.25));
    float rTime = rnd(vec2(fract(uTime * 0.01)));

    // - テキスト --------------------------------
    float textAlpha = text.a;
    text = texture2D(uText, vUv + vel * 0.1);
    text += texture2D(uText, vUv + vel * 0.1 + vec2(0.005));
    text -= texture2D(uText, vUv + vel * 0.1 + vec2(-0.005));
    text -= texture2D(uText, vUv + vel * 0.2 + vec2(r1 * 0.01, r2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.2 + vec2(-r2 * 0.01, -r2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.25 + vec2(r1 * 0.02, r2 * 0.02));
    text -= texture2D(uText, vUv + vel * 0.25 + vec2(-r2 * 0.02, -r2 * 0.02));
    text -= texture2D(uText, vUv + vel * 0.3 + vec2(r1 * 0.03, r2 * 0.03));
    text += texture2D(uText, vUv + vel * 0.3 + vec2(-r2 * 0.03, -r2 * 0.03));
    text += texture2D(uText, vUv + vel * 1.1 + vec2(r1 * 0.04, r2 * 0.04));
    text -= texture2D(uText, vUv + vel * 1.1 + vec2(-r2 * 0.04, -r2 * 0.04));
    text -= texture2D(uText, vUv + vel * 2.0 + vec2(r1 * 0.05, r2 * 0.05));
    text += texture2D(uText, vUv + vel * 2.0 + vec2(-r2 * 0.05, -r2 * 0.05));
    text += texture2D(uText, vUv + vel * 4.5 + vec2(r1 * 0.1, r2 * 0.1));
    text -= texture2D(uText, vUv + vel * 4.5 + vec2(-r2 * 0.1, -r2 * 0.1));
    text -= texture2D(uText, vUv + vel * 7.0 + vec2(r1 * 0.2, r2 * 0.2));
    text += texture2D(uText, vUv + vel * 7.0 + vec2(-r2 * 0.2, -r2 * 0.2));
    text -= texture2D(uText, vUv + vel * 10.0 + vec2(r1 * 0.3, r2 * 0.3));
    text += texture2D(uText, vUv + vel * 10.0 + vec2(-r2 * 0.3, -r2 * 0.3));
    text *= rTime * 2.25;
    if(text.r < 0.5 || text.g < 0.5 || text.b < 0.5) {
        text.rgb += vec3(0.3, 0.8, 1.0);
    } else {
        text.rgb -= vec3(0.3, 0.5, 0.0);
    }

    // - 流体 --------------------------------
    vel *= r1 * 0.1 + r2 * 0.1;
    vec4 velocity = vec4(0.8, vel.y * 0.5, vel.x * 0.5, 1.0);
    if(velocity.r > 0.75 || velocity.g > 0.75 || velocity.b > 0.75) {
        velocity.rgb = vec3(0.8, -1.25, -2.75);
    }

    // - 蛇のうねり --------------------------------
    const int segmentCount = 16;
    float snakeBody = 1.0;
    float offset = 0.5;

    // セグメントを順に描画
    for (int i = 0; i < segmentCount; i++) {
        float t = float(i) / float(segmentCount); // セグメントの進行度
        float phase = uTime * 2.0 - t * 5.0; // 時間ベースの位相
        float x = sin(phase) * 0.5 + offset; // セグメントのX座標
        float y = -t + 0.5 + offset;         // セグメントのY座標
        float dist = length(vUv - vec2(x, y));
        snakeBody += smoothstep(0.15, 0.001, dist);
    }

    // - MIX --------------------------------
    vec4 outputColor = mix(vec4(0.24, 0.37, 0.48, 1.0), text, clamp(speed * 1.75, 0.0, 1.0));
    outputColor = mix(outputColor, velocity, clamp(speed * 0.75, 0.0, 1.0));
    outputColor.rgb += vec3(snakeBody) * clamp(speed, 0.0, 0.05);

    // ノイズ追加
    if(uPsy) {
        text.rgb -= vec3(0.2 * r3, 0.4, 0.8);
        outputColor.rgb -= vec3(r3 * 1.2, r3 * 0.5, r3 * 0.2);
    }
    
    // - 明るさ調整 --------------------------------
    outputColor = mix(outputColor, text, text.a);
    
    gl_FragColor = outputColor;
}
