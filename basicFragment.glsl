#define M_PI 3.1415
#define maxMipLevel 6

struct PointLight 
{
    vec3 position;
    vec3 color;
};

uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

uniform sampler2D u_basemap;
uniform sampler2D u_normalmap;
uniform sampler2D u_roughness;
uniform sampler2D u_AO;
uniform samplerCube u_envMap;
uniform float u_normalScale;
uniform float u_AOScale;
uniform vec2 u_roughnessRemap;

varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

float saturate(float x)
{
    return max(0.0, min(1.0, x));
}

vec3 reflect( vec3 i, vec3 n )
{
  return i - 2.0 * n * dot(n,i);
}

float dotClamped(vec3 a, vec3 b)
{
	return max(dot(a,b), 0.0);
}

float GGXRoughnessToBlinnExponent(float roughness)
{
    return (2.0 / pow(roughness, 2.0) - 2.0);
}

float getSpecularMIPLevel(float blinnShininessExponent)
{
	float maxMIPLevelScalar = float( maxMipLevel );
    float desiredMIPLevel = maxMIPLevelScalar + 0.79248 - 0.5 * log2( pow(blinnShininessExponent, 2.0) + 1.0 );
    return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );
}

vec3 getLightProbeIndirectRadiance(vec3 normal, float roughness)
{
    vec3 reflectVec = reflect( vPos, normal );
    reflectVec = normalize( ( vec4( reflectVec, 0.0 ) * viewMatrix ).xyz );
    
    float blinnShininessExponent = GGXRoughnessToBlinnExponent(roughness);
    float specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent );

    vec4 envMapColor = textureCube( u_envMap, reflectVec, specularMIPLevel );
                
    return envMapColor.rgb * .75;
}

vec3 CalculateNormalsValue()
{
    vec3 normalTex = texture2D (u_normalmap, vUv).xyz * 2.0 - 1.0;
    normalTex.xy *= u_normalScale;
    normalTex.y *= -1.0;
    normalTex = normalize( normalTex );
    mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normalize( vNormal ) );
    vec3 normal = tbn * normalTex;
	return normalize(normal);
}

void main()
{
	vec3 normal = CalculateNormalsValue();

    float roughness = texture2D(u_roughness, vUv).r;
    roughness = u_roughnessRemap.x + (u_roughnessRemap.y - u_roughnessRemap.x) * roughness;
    roughness = clamp(roughness, 0.001, 0.999);
	float smoothness = 1.0 - roughness;

    vec3 diffuseLight = vec3(0.0, 0.0, 0.0);
	vec3 specularLight = vec3(0.0, 0.0, 0.0);

    vec3 viewDir = -vPos;

    for(int l = 0; l < NUM_POINT_LIGHTS; l++)
    {
        vec3 lightDirection = pointLights[l].position + viewDir;
		vec3 halfVector = normalize(lightDirection);
		
		float attenuation = 1.0 / (1.0 + dot(lightDirection, lightDirection));

		diffuseLight += dotClamped(halfVector, normal) * pointLights[l].color * attenuation;
		specularLight += pow(dotClamped(halfVector, normal), smoothness * 100.0) * pointLights[l].color * attenuation;
    }

    vec3 diffuseColor = texture2D(u_basemap, vUv).rgb * diffuseLight;
	vec3 specularColor = specularLight * smoothness;

	float fresnel = pow(dot(normalize(viewDir), normal) * 0.5 + 0.5, smoothness);
    vec3 reflectionColor = getLightProbeIndirectRadiance(normal, roughness) * (1.0 - fresnel);

    float ambientOcclusion = 1.0 - u_AOScale + u_AOScale * texture2D(u_AO, vUv).r;

    vec3 finalColor = (diffuseColor + specularColor + reflectionColor) * ambientOcclusion;
    gl_FragColor = vec4(finalColor, 1.0);
}