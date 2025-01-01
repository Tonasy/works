
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

uniform mat4 modelMatrix;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
uniform vec3 lightPosition;
uniform vec3 eyePosition;

varying vec3 vNormal;
varying vec3 vLightVec;
varying float vLightLength;
varying vec4 vColor;
varying vec3 vEyeVec;
varying vec2 vTexCoord;


void main() {
  
  // ワールド座標系に変換
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  // ライト
  vLightVec = lightPosition - worldPosition;
  vLightLength = length(vLightVec);

  // 視線
  vEyeVec = eyePosition - worldPosition;

  // 法線をまず行列で変換する
  vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;
  vColor = color;

  // テクスチャ座標をフラグメントシェーダに送る
  vTexCoord = texCoord;


  // MVP 行列と頂点座標を乗算してから出力する
  gl_Position = mvpMatrix * vec4(position, 1.0);
}

