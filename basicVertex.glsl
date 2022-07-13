attribute vec4 tangent;

uniform sampler2D u_heightmap;
uniform float u_heightScale;
uniform vec2 u_tiling;

varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

vec3 CalculateNormalsValue(vec3 normalHeight)
{
    vec3 normalTex = normalHeight * 2.0 - 1.0;
    normalTex.y *= -1.0;
    normalTex = normalize( normalTex );
    mat3 tsb = mat3( normalize( vTangent ), normalize( vBitangent ), normalize( vNormal ) );
    vec3 normal = tsb * normalTex;
	return normal;
}

void main()
{
    vUv = vec2(uv.x * u_tiling.x, uv.y * u_tiling.y);
    vec3 height = texture2D (u_heightmap, vUv).r * normal * u_heightScale;

    vPos = (modelViewMatrix * vec4(position + height, 1.0 )).xyz;
    vNormal = normalMatrix * normal;
    vTangent = normalize( normalMatrix * tangent.xyz );
    vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

    float texel = 0.001;
	float texelSize = 0.1;

	vec3 center = texture2D(u_heightmap, vUv).rgb;
	vec3 right = vTangent * texelSize + texture2D(u_heightmap, vUv + vec2(texel, 0.0)).rgb - center;
	vec3 left = -vTangent * texelSize + texture2D(u_heightmap, vUv + vec2(-texel, 0.0)).rgb - center;
	vec3 top = vBitangent * texelSize + texture2D(u_heightmap, vUv + vec2(0.0, texel)).rgb - center;
	vec3 bottom = -vBitangent * texelSize + texture2D(u_heightmap, vUv + vec2(0.0, -texel)).rgb - center;

	vec3 topRight = cross(right, top);
	vec3 topLeft = cross(top, left);
	vec3 bottomLeft = cross(left, bottom);
	vec3 bottomRight = cross(bottom, right);

    vec3 heightNormal = normalize(topRight + topLeft + bottomLeft + bottomRight);
    vNormal = heightNormal * u_heightScale * 10.0 + vNormal * (1.0 - u_heightScale * 10.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + height,1.0);
}