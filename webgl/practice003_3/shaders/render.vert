varying vec3 vNormal;
varying float vWhiteness;
varying float vReflectionFactor;

// 乱数生成器
float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vNormal = normal;
    vNormal *= rand(instanceMatrix[3].xy); // インスタンスのxy座標をシードにしてノイズを生成

    // ワールド座標の計算
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position + vec3(0.0, 0.3, 0.0), 1.0);

    // 反射率の計算
    vec3 lightPosition = vec3(1.0, 2.0, 0.0); // 光源の位置
    float shininess = 5.0; // 輝度

    vReflectionFactor = 0.2 + 0.2 * pow(1.0 + dot(normalize(worldPosition.xyz - cameraPosition - lightPosition), normal), shininess);
    // vReflectionFactor = specular;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}