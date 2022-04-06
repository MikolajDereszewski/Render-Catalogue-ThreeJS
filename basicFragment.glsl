#define M_PI 3.1415926535897932384626433832795

//Variables
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNormal;

//Texturing
uniform sampler2D u_basemap;
uniform sampler2D u_normalmap;
uniform sampler2D u_roughness;
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


vec3 SpecularIBL( float Roughness, vec3 NL, vec3 V, float fresnel)
{
	//L: viewLightDir
	//H: halfVector
	//NL: viewNormal
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
			vec3 SampleColor = vec3(1.0,1.0,1.0);//textureCube (u_tCube, L).xyz;

			float fresnel_fn = CalculateFresnel(fresnel, L, H);
			float ndf_fn = NDFBeckmann(Roughness, NL, H, NoH);
			float g_fn = GBeckmann(Roughness, L, V, H, NL, NoL, NoV);

			SpecularLighting += fresnel_fn * ndf_fn * g_fn * SampleColor;
		}
	}
	return SpecularLighting / float(NumSamples);
}

void main()
{
	vec3 viewPosition = normalize(vViewPosition);
	vec3 normal = normalize(vNormal.xyz);
	vec3 viewNormal = normalize(vViewNormal.xyz);
	vec3 viewDir = normalize(-vViewPosition);

	float roughness = 0.1;//clamp(texture2D(u_roughness, vUv).r, 0.001, 1.0);
    vec4 color = texture2D(u_basemap, vUv);
    vec3 textureNormal = CalculateNormalsValue();

    vec3 diffuseLight = vec3(0.0, 0.0, 0.0);
	vec3 specularLight = vec3(0.0, 0.0, 0.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++)
    {
		vec3 adjustedLight = pointLights[l].position + cameraPosition;
        vec3 lightDirection = normalize(vPos - adjustedLight);
		float diffuse = max(dot(normalize(-lightDirection), textureNormal), 0.0);

		vec4 viewLightPos = viewMatrix * vec4( pointLights[l].position, 1.0 );
		vec3 viewLightDir = viewLightPos.xyz - viewPosition.xyz;
		viewLightDir = normalize(viewLightDir);

		vec3 halfVec = normalize(viewDir + viewLightDir);
		float NoL = max(dot(textureNormal, viewDir), 0.0);

		float fresnel_value = 1.2;
		float fresnel = pow((1.0 - fresnel_value) / (1.0 + fresnel_value), 2.0);
		float fresnel_fn = CalculateFresnel(fresnel, viewLightDir, halfVec);

		vec3 specularColor = SpecularIBL(roughness, textureNormal, viewDir, fresnel);
		
		diffuseLight += clamp(diffuse * (1.0 - fresnel_fn) * pointLights[l].color, 0.0, 1.0);
		specularLight += specularColor * pointLights[l].color * NoL;
        //diffuseLight += clamp(dot(-lightDirection, textureNormal) * pointLights[l].color, 0.0, 1.0);
    }
    color.rgb = color.rgb * diffuseLight + specularLight;
    color.a = 1.0;
    gl_FragColor = color;
}

/*void main()	{
		//		viewMatrix
		//		cameraPosition
				vec3 viewPosition = normalize(vViewPosition);
				vec4 viewLightPos = viewMatrix * vec4( u_lightPos, 1.0 );
				vec3 viewLightDir = viewLightPos.xyz - viewPosition.xyz;
				viewLightDir = normalize(viewLightDir);

				vec3 normal = normalize(vNormal.xyz);
				vec3 viewNormal = normalize(vViewNormal.xyz);
				vec3 viewDir = normalize(-vViewPosition);
				vec3 halfVec = normalize(viewDir + viewLightDir);
				float diffuse = max(dot(normalize(-u_lightDir), normal), 0.0);

				float NoL= max(dot(viewNormal, viewLightDir), 0.0);

				float fresnel = pow((1.0 - u_fresnel) / (1.0 + u_fresnel), 2.0);

				float fresnel_fn = F(fresnel, viewLightDir, halfVec);

				vec3 specularColor = SpecularIBL(u_alpha, viewNormal, viewDir, fresnel);

				vec3 specColor = specularColor * NoL + dirSpecular;
				vec3 diffuseColor = u_diffuseColor * diffuse * (1.0 - fresnel_fn) * u_lightColor + dirDiffuse;

				gl_FragColor = vec4( diffuseColor + specColor + u_ambientColor * u_diffuseColor, 1.0);
			}*/