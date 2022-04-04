#define M_PI 3.1415926535897932384626433832795

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

//PBR
uniform vec3 u_lightColor;
uniform vec3 u_lightDir;
uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec3 u_diffuseColor;
uniform float u_roughness;
uniform float u_fresnel;
uniform float u_alpha;
uniform vec3 u_ambientColor;
uniform samplerCube u_tCube;
uniform float u_time;

varying vec3 vViewPosition;
varying vec3 vViewNormal;

//
float saturate(float x)
{
    return max(0.0, min(1.0, x));
}

float dotClamped(vec3 a, vec3 b)
{
	return max(dot(a,b), 0.0);
}

float CalculateFresnel(float f0, vec3 l, vec3 h)
{
	float LoH = dot(l,h);
	float powTerm = (-5.55473 * LoH - 6.98316) * LoH;
	return f0 + (1.0 - f0) * pow(2.0, powTerm);
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

float NDFBeckmann(float a, vec3 n, vec3 h, float NoH)
{
	float a2 = a*a;
	float NoH2 = pow(NoH, 2.0);
	return (1.0 / (4.0 * a2 * pow(NoH, 4.0))) * exp((NoH2 - 1.0) / (a2 * NoH2));
}

float GBeckmannHelper(float a, float NoT)
{
	return NoT / (a * sqrt(1.0 - pow(NoT, 2.0)));
}

float GBeckmann(float a, vec3 l, vec3 v, vec3 h, vec3 n, float NoL, float NoV)
{
	float c1 = GBeckmannHelper(a, NoV);
	float c2 = GBeckmannHelper(a, NoL);

	float c12 = c1*c1;
	float c22 = c2*c2;
	float GV, GL;

	if(c1 < 1.6)
    {
		GV = (3.535 * c1 + 2.181 * c12) / (1.0 + 2.276*c1 + 2.577*c12);
	}
	else
    {
		GV = 1.0;
	}

	if(c2 < 1.6)
    {
	    GL = (3.535 * c2 + 2.181 * c22) / (1.0 + 2.276*c2 + 2.577*c22);
	}
	else
    {
		GL = 1.0;
	}

	return GL*GV;
}

float random(vec3 scale, float seed) 
{
	return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

vec2 RandomSamples(float seed)
{
	float u = random(vec3(12.9898, 78.233, 151.7182), seed);
	float v = random(vec3(63.7264, 10.873, 623.6736), seed);
	return vec2(u, v);
}

vec3 ImportanceSampleGGX( vec2 Xi, float Roughness, vec3 N )
{
	float a = Roughness * Roughness;
	float Phi = 2.0 * M_PI * Xi.x;
	float CosTheta = sqrt( (1.0 - Xi.y) / ( 1.0 + (a*a - 1.0) * Xi.y ) );
	float SinTheta = sqrt( 1.0 - CosTheta * CosTheta );
	vec3 H;
	H.x = SinTheta * cos( Phi );
	H.y = SinTheta * sin( Phi );
	H.z = CosTheta;
	return H;
}


vec3 SpecularIBL( float Roughness, vec3 NL, vec3 V, float fresnel )
{
	//L: viewLightDir
	//H: halfVector
	//V: viewNormal
	//V: viewDir

	vec3 SpecularLighting = vec3(0.0);
	const int NumSamples = 32;
	for( int i = 0; i < NumSamples; i++ )
	{
		vec2 Xi = RandomSamples( u_time + float(i) );
		vec3 H = ImportanceSampleGGX( Xi, Roughness, NL );
		vec3 L = 2.0 * dot( V, H ) * H - V;
		float NoV = max( dot( NL, V ), 0.0 );
		float NoL = max( dot( NL, L ), 0.0 );
		float NoH = max( dot( NL, H ), 0.0 );
		float VoH = max( dot( V, H ), 0.0 );


		if( NoL > 0.0 )
		{
			vec3 SampleColor = textureCube (u_tCube, L).xyz;

			float fresnel_fn = CalculateFresnel(fresnel, L, H);
			float ndf_fn = NDFBeckmann(Roughness, NL, H, NoH);
			float g_fn = GBeckmann(Roughness, L, V, H, NL, NoL, NoV);

			SpecularLighting += fresnel_fn * ndf_fn * g_fn * SampleColor;
		}
	}
	return SpecularLighting / float(NumSamples);
}

vec3 dirDiffuse = vec3(0.0);
vec3 dirSpecular = vec3(0.0);

void calDirLight(vec3 lDir, vec3 normal, vec3 diffuse, vec3 specular)
{
	vec3 dirLightColor = vec3(1.0);

	vec4 lDirection = viewMatrix * vec4( lDir, 0.0 );
	vec3 dirVector = normalize( lDirection.xyz );

	float dirDiffuseWeight = max(dot( normal, dirVector ), 0.0);

	dirDiffuse += diffuse * dirLightColor * dirDiffuseWeight * 0.5;

	vec3 dirHalfVector = normalize( dirVector + vViewPosition );
	float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );
	float dirSpecularWeight = 0.5 * max( pow( dirDotNormalHalf, 0.0 ), 0.0 );

	float specularNormalization = ( 0.0 + 2.0 ) / 8.0;

	vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );
	dirSpecular += schlick * dirLightColor * dirSpecularWeight * dirDiffuseWeight * specularNormalization;
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