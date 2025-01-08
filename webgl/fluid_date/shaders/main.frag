precision highp float;

uniform float uTime;
uniform sampler2D uVelocity;
uniform sampler2D uText;
uniform vec2 uResolution;
varying vec2 vUv;

// ランダム関数
float rnd(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// フラクタルノイズ
float fractalNoise(vec2 p) {
    float value = 0.0;
    float scale = 1.0;
    float weight = 0.5;
    for (int i = 0; i < 4; i++) {
      value += weight * rnd(p * scale);
      scale *= 2.0;
      weight *= 0.5;
    }
    return value;
}

// メイン関数
void main() {
    // - 共通 --------------------------------
    vec2 texelSize = 1.0 / vec2(textureSize(uVelocity, 0));
    vec2 vel = texture2D(uVelocity, vUv).xy;
    float theta = atan(vel.y, vel.x);
    float speed = length(vel);
    vec4 text = texture2D(uText, vUv) ;
    float distFromCenter = length(vUv - vec2(0.5));
    float rnd1 = rnd(vec2(speed));
    float rnd2 = rnd(vec2(speed * 0.5));
    float noise1 = fractalNoise(vec2(uTime * 0.1, vUv.x * uTime));
    float noise2 = fractalNoise(vec2(uTime * 0.1, vUv.y * uTime));

    // ベースカラー
    vec4 baseColor = vec4(0.24, 0.37, 0.48, 1.0);
    
    // - テキスト --------------------------------
    float textAlpha = text.a;
    text = texture2D(uText, vUv + vel * 0.1);
    text += texture2D(uText, vUv + vel * 0.1 + vec2(0.005));
    text -= texture2D(uText, vUv + vel * 0.1 + vec2(-0.005));
    text -= texture2D(uText, vUv + vel * 0.2 + vec2(rnd1 * 0.01, rnd2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.2 + vec2(-rnd2 * 0.01, -rnd2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.25 + vec2(rnd1 * 0.02, rnd2 * 0.02));
    text -= texture2D(uText, vUv + vel * 0.25 + vec2(-rnd2 * 0.02, -rnd2 * 0.02));
    text -= texture2D(uText, vUv + vel * 0.3 + vec2(rnd1 * 0.03, rnd2 * 0.03));
    text += texture2D(uText, vUv + vel * 0.3 + vec2(-rnd2 * 0.03, -rnd2 * 0.03));
    text += texture2D(uText, vUv + vel * 1.1 + vec2(rnd1 * 0.04, rnd2 * 0.04));
    text -= texture2D(uText, vUv + vel * 1.1 + vec2(-rnd2 * 0.04, -rnd2 * 0.04));
    text -= texture2D(uText, vUv + vel * 2.0 + vec2(rnd1 * 0.05, rnd2 * 0.05));
    text += texture2D(uText, vUv + vel * 2.0 + vec2(-rnd2 * 0.05, -rnd2 * 0.05));
    text += texture2D(uText, vUv + vel * 4.5 + vec2(rnd1 * 0.1, rnd2 * 0.1));
    text -= texture2D(uText, vUv + vel * 4.5 + vec2(-rnd2 * 0.1, -rnd2 * 0.1));
    text -= texture2D(uText, vUv + vel * 7.0 + vec2(rnd1 * 0.2, rnd2 * 0.2));
    text += texture2D(uText, vUv + vel * 7.0 + vec2(-rnd2 * 0.2, -rnd2 * 0.2));
    text -= texture2D(uText, vUv + vel * 10.0 + vec2(rnd1 * 0.3, rnd2 * 0.3));
    text += texture2D(uText, vUv + vel * 10.0 + vec2(-rnd2 * 0.3, -rnd2 * 0.3));
    text *= rnd(vec2(fract(uTime * 0.01))) * 5.25;
    text.a *= textAlpha; 
    if(text.r < 0.5 || text.g < 0.5 || text.b < 0.5) {
        text.rgb += vec3(0.3, 0.75, 1.0);
    }


    // - 流体 --------------------------------
    vel += noise1 * 5.0;
    vel += noise2 * 5.0;
    vel *= rnd1 * 0.1 + rnd2 * 0.1;
    vec4 velocity = vec4(0.9, vel.y * 0.5, vel.x * 0.1, 1.0);
    if(velocity.r > 0.75 || velocity.g > 0.75 || velocity.b > 0.75) {
        velocity.rgb = vec3(1.75, -1.25, -2.75);
    }

    // - 蛇のうねり --------------------------------
    const int segmentCount = 32;
    float snakeBody = 1.0;
    float offset = 0.5;

    // セグメントを順に描画
    for (int i = 0; i < segmentCount; i++) {
        float t = float(i) / float(segmentCount); // セグメントの進行度
        float phase = uTime * 2.0 - t * 5.0; // 時間ベースの位相
        float x = sin(phase) * 0.5 + offset; // セグメントのX座標
        float y = -t + 0.5 + offset;         // セグメントのY座標
        float dist = length(vUv - vec2(x, y));
        vec3 snakeColor = vec3(0.42, 0.63, 0.78);
        snakeBody += smoothstep(0.15, 0.001, dist);
    }

    // - MIX --------------------------------
    vec4 outputColor = mix(baseColor, text, clamp(speed * 1.75, 0.0, 1.0));
    outputColor = mix(outputColor, velocity, clamp(speed * 0.75, 0.0, 1.0));
    outputColor.rgb += vec3(snakeBody) * clamp(speed, 0.0, 0.05);

    // - 明るさ調整 --------------------------------
    outputColor = mix(outputColor, text, text.a);
    
    gl_FragColor = outputColor;
}
