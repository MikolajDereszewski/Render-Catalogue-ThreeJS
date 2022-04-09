attribute vec4 tangent;

uniform sampler2D u_heightmap;
uniform float u_heightScale;
uniform vec2 u_tiling;

varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

void main()
{
    vUv = vec2(uv.x * u_tiling.x, uv.y * u_tiling.y);
    vNormal = normalMatrix * normal;
    vec3 height = texture2D (u_heightmap, vUv).r * normal * u_heightScale;
    vPos = (modelViewMatrix * vec4(position, 1.0 )).xyz;

    vTangent = normalize( normalMatrix * tangent.xyz );
    vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + height,1.0);
}