precision highp float;
uniform float uTime;
uniform sampler2D uVelocity;
uniform sampler2D uText;
varying vec2 vUv;

// ランダム関数
float rnd(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // 乱数
    float random = rnd(vUv + uTime);

    // 速度場から値を取得
    vec2 vel = texture2D(uVelocity, vUv).xy;

    // 速度の大きさを取得
    float speed = length(vel);

    // テキストのスケール
    float scale = 1.0 + 0.5 * abs(speed * 0.75);
    vec2 scaledUv = (vUv - 0.5) / scale + 0.5;

    // テキストテクスチャを取得
    vec4 textColor = texture2D(uText, vUv);

    // UV座標を速度に基づいて変形
    vec2 distortedUv = scaledUv + vel * abs(sin(uTime * 0.5)) * 0.25;

    // 変形後のテクスチャ色を取得
    vec4 distortedTextColor = texture2D(uText, distortedUv);
    distortedTextColor.rgb *= abs(sin(uTime * random * 5.0));
    if(speed < 0.1) {
        distortedTextColor = textColor * sin(random) * 10.0;
    }

    // 速度の大きさを色に反映
    vec4 velocityColor = vec4(0.5 + 0.5 * vel.x, 0.25 + 0.25 * vel.y, speed * sin(uTime), 1.0);

    // テキストのアルファ値を速度でマスク
    vec4 finalColor = mix(velocityColor, distortedTextColor, speed * 2.0);

    // 色味の調整
    finalColor = vec4(hsv2rgb(vec3(finalColor.r + 0.1, 0.5 + random, 1.0 * random * 0.75)), finalColor.a);

    gl_FragColor = finalColor;
}