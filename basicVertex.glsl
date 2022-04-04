//Variables
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;

varying vec3 vViewPosition;
varying vec3 vViewNormal;

//Vertex displacement
uniform sampler2D u_heightmap;
uniform float u_heightScale;

//Lighting
attribute vec4 tangent;

struct PointLight 
{
    vec3 position;
    vec3 color;
};

uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vLL [ NUM_POINT_LIGHTS ];

//
void main()
{
    vUv = uv;
    vNormal = normalize( normalMatrix * normal );

    vec3 height = texture2D (u_heightmap, vUv).r * normal * u_heightScale;
    vPos = (modelMatrix * vec4(position, 1.0 )).xyz;

    vTangent = normalize( normalMatrix * tangent.xyz );
    vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
    for(int l = 0; l < NUM_POINT_LIGHTS; l++)
    {
        vLL[l] = normalize (normalMatrix * (pointLights[l].position - vPos));
    }

    vViewPosition = (modelViewMatrix * vec4(position,1.0)).xyz;
	vViewNormal = normalMatrix * normal.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + height,1.0);
}