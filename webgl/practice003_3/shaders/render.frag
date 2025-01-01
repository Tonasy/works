varying vec3 vNormal;
varying float vWhiteness;
varying float vReflectionFactor;


void main() {
    vec3 colored = mix(vNormal, vec3(1.), .75);

    gl_FragColor = vec4(colored, vReflectionFactor);
}