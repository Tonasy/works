precision highp float;
uniform float uTime;
uniform sampler2D uVelocity;
varying vec2 vUv;


// ランダム関数
float rnd (vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


void main() {
    // 速度場
    vec2 vel = texture2D(uVelocity, vUv).xy;
    
    // ノイズ
    float rnd1 = rnd(vUv * uTime);
    float rnd2 = rnd(vel.xy);
    float rnd3 = rnd(vel.yx);
    
    float speed = length(vel); // 速度の大きさ
    vel = vel * 0.5 + 0.5;
    vec3 color = vec3(vel.x, vel.y, 1.0);

    // 減衰
    speed *= 0.5;

    // 速度場の角度
    float angle = atan(vel.y, vel.x);

    // ノイズ　+ 色変化
    // color = vec3(rnd1 + speed, sign(sin(uTime)), sign(cos(uTime)));

    // 青 + オレンジ
    color = vec3(0.5 + 0.5 * tan(angle), 0.5 + 0.5 * sin(angle), 0.5 + 0.5 * cos(angle));

    // 色相シフト
    float hue = mod(uTime * 0.1 + speed, 1.0);
    vec3 baseColor = vec3(1.0, 0.5, 0.9);
    // color = vec3(hue, baseColor.y, baseColor.z);

    // 時間で色変化
    // color = vec3(
    //     0.5 + 0.5 * sin(angle + uTime),
    //     0.5 + 0.5 * cos(angle * rnd1),
    //     0.5 + 0.5 * sin(angle * rnd2)
    // );
    // color += speed;  // 速度に応じた輝度
    

    // 流線
    // float line = abs(sin(angle * 10.0 + uTime * speed * 2.0));
    // float thickness = 0.05;
    // float lineMask = smoothstep(thickness, thickness + 0.05, line);
    // color = vec3(lineMask, lineMask + 0.5, 1.0); // 水色

    // エッジ強調
    // color *= smoothstep(0.2, 0.5, speed);

    // 0.2以上の速度を持つ粒子のみ表示
    // color = mix(vec3(0.0), color, step(0.2, speed));

    // ベースカラー：黒
    color = mix(vec3(0.0), color, speed);

    // ベースカラー：白
    // color = mix(vec3(1.0), color, speed);


    gl_FragColor = vec4(color, 1.0);
}