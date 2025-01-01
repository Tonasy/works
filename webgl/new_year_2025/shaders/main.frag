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
      weight *= 0.5; // 重みを減少させながら細部を追加
    }
    return value;
}

// // HSV to RGB変換
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 法線計算
vec3 computeNormal(sampler2D heightMap, vec2 uv, vec2 texelSize) {
    float hL = texture(heightMap, uv - vec2(texelSize.x, 0.0)).r;
    float hR = texture(heightMap, uv + vec2(texelSize.x, 0.0)).r;
    float hT = texture(heightMap, uv - vec2(0.0, texelSize.y)).r;
    float hB = texture(heightMap, uv + vec2(0.0, texelSize.y)).r;

    return normalize(vec3(hL - hR, hT - hB, 1.0));
}

// 照明計算
vec3 applyLighting(vec3 normal, vec3 lightDir, vec3 viewDir) {
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);

    return vec3(0.2) + diff * vec3(0.8) + spec * vec3(1.0);
}



// メイン関数
void main() {
    // - 共通 --------------------------------
    vec2 texelSize = 1.0 / vec2(textureSize(uVelocity, 0));
    vec2 vel = texture2D(uVelocity, vUv).xy;
    float theta = atan(vel.y, vel.x);
    float speed = length(vel);
    vec4 text = texture2D(uText, vUv);
    float distFromCenter = length(vUv - vec2(0.5));
    float rnd1 = rnd(vec2(speed));
    float rnd2 = rnd(vec2(speed * 0.5));
    float noise1 = fractalNoise(vec2(uTime * 0.1, vUv.x * uTime));
    float noise2 = fractalNoise(vec2(uTime * 0.1, vUv.y * uTime));

    
    // - テキスト --------------------------------
    text = texture2D(uText, vUv + vel * 0.1);
    text += texture2D(uText, vUv + vel * 0.1 + vec2(0.005));
    text += texture2D(uText, vUv + vel * 0.1 + vec2(-0.005));
    text += texture2D(uText, vUv + vel * 0.2 + vec2(rnd1 * 0.01, rnd2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.2 + vec2(-rnd2 * 0.01, -rnd2 * 0.01));
    text += texture2D(uText, vUv + vel * 0.25 + vec2(rnd1 * 0.02, rnd2 * 0.02));
    text += texture2D(uText, vUv + vel * 0.25 + vec2(-rnd2 * 0.02, -rnd2 * 0.02));
    text += texture2D(uText, vUv + vel * 0.3 + vec2(rnd1 * 0.03, rnd2 * 0.03));
    text += texture2D(uText, vUv + vel * 0.3 + vec2(-rnd2 * 0.03, -rnd2 * 0.03));
    text += texture2D(uText, vUv + vel * 1.1 + vec2(rnd1 * 0.04, rnd2 * 0.04));
    text += texture2D(uText, vUv + vel * 1.1 + vec2(-rnd2 * 0.04, -rnd2 * 0.04));
    text += texture2D(uText, vUv + vel * 2.0 + vec2(rnd1 * 0.05, rnd2 * 0.05));
    text += texture2D(uText, vUv + vel * 2.0 + vec2(-rnd2 * 0.05, -rnd2 * 0.05));
    text += texture2D(uText, vUv + vel * 4.5 + vec2(rnd1 * 0.1, rnd2 * 0.1));
    text += texture2D(uText, vUv + vel * 4.5 + vec2(-rnd2 * 0.1, -rnd2 * 0.1));
    text += texture2D(uText, vUv + vel * 7.0 + vec2(rnd1 * 0.2, rnd2 * 0.2));
    text += texture2D(uText, vUv + vel * 7.0 + vec2(-rnd2 * 0.2, -rnd2 * 0.2));
    text += texture2D(uText, vUv + vel * 10.0 + vec2(rnd1 * 0.3, rnd2 * 0.3));
    text += texture2D(uText, vUv + vel * 10.0 + vec2(-rnd2 * 0.3, -rnd2 * 0.3));
    text *= rnd(vec2(fract(uTime * 0.01))) * 1.25;

    // - 流体 --------------------------------
    vel *= noise1 * 2.0;
    vel *= noise2 * 2.0;
    vel *= rnd2 * rnd1 * 0.5;
    vec4 velocity = vec4(vel.x * rnd1, vel.y * rnd2, speed * 2.0, 1.0);
    velocity = mix(velocity, text, rnd1 * 0.05); 

        // - 蛇 --------------------------------
    const int segmentCount = 16;
    float snakeBody = 0.0;
    float offset = 0.5;

    // セグメントを順に描画
    for (int i = 0; i < segmentCount; i++) {
        float t = float(i) / float(segmentCount); // セグメントの進行度
        float phase = uTime * 2.0 - t * 5.0; // 時間ベースの位相
        float x = sin(phase) * 0.5 + offset; // セグメントのX座標
        float y = -t + 0.5 + offset;         // セグメントのY座標
        float dist = length(vUv - vec2(x, y));
        snakeBody += smoothstep(0.15, 0.001, dist) * 1.5; // セグメントの太さ
    }

    // - 出力 --------------------------------
    vec4 outputColor = mix(velocity, text, speed * 1.25);
    outputColor.rgb += vec3(snakeBody) * speed * 1.5;
    outputColor.b += 0.15;
    outputColor.g += 0.15 * (1.0 - sin(uTime * 0.5));
    outputColor.r += 0.025 * sin(uTime * 0.75);

    
    // ビネット
    float vignette = 1.0 - pow(distFromCenter * 1.5, 2.0); // 暗く
    outputColor.rgb *= vignette;

    vec2 st = gl_FragCoord.xy / uResolution;
    st = st * 2.0 - 1.0; // -1.0 ～ 1.0 の範囲に正規化
    st.x *= uResolution.x / uResolution.y; // アスペクト比の調整

    
    gl_FragColor = outputColor;
}
