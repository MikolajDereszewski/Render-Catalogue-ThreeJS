//Variables
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;

//Texturing
uniform sampler2D u_basemap;
uniform sampler2D u_normalmap;
uniform float u_normalScale;

//Lighting
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
float saturate(float x)
{
    return max(0.0, min(1.0, x));
}

vec3 CalculateNormalsValue()
{
    vec3 normalTex = texture2D (u_normalmap, vUv).xyz * 2.0 - 1.0;
    normalTex.xy *= u_normalScale;
    normalTex.y *= -1.0;
    normalTex = normalize( normalTex );
    mat3 tsb = mat3( normalize( vTangent ), normalize( vBitangent ), normalize( vNormal ) );
    vec3 normal = tsb * normalTex;

    //DXT5nm encoding
    //normal.xy = texture2D(u_normalmap, vUv).wy * 2.0 - 1.0;
	//normal.xy *= u_normalScale;
	//normal.z = sqrt(1.0 - saturate(dot(normal.xy, normal.xy)));
    //normal = normal.xzy;

    //RGB encoding
    //vec3 normal = texture2D(u_normalmap, vUv).rgb;
	//normal = normalize(normal);
    //normal = normal * 2.0 - 1.0;
    //normal = normal.xzy;
	return normal;
}

void main()
{
    vec4 color = texture2D(u_basemap, vUv);
    vec3 textureNormal = CalculateNormalsValue();

    vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++)
    {
        vec3 adjustedLight = pointLights[l].position + cameraPosition;
        vec3 lightDirection = normalize(vPos - adjustedLight);
        addedLights.rgb += clamp(dot(-lightDirection, textureNormal) * pointLights[l].color, 0.0, 1.0);
    }

    color *= addedLights;
    color.a = 1.0;
    gl_FragColor = color;
}