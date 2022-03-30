uniform sampler2D u_basemap;
uniform sampler2D u_normalmap;
uniform float u_normalScale;

varying vec2 vUv;
varying mediump vec3 vNormal;

float saturate(float x)
{
    return max(0.0, min(1.0, x));
}

vec3 CalculateNormalsValue()
{
	vec4 normalColor = texture2D(u_normalmap, vUv);
	vec3 normal;
	normal.xy = (normalColor.wy * 2.0 - 1.0);
	normal.xy *= u_normalScale * 2.0;
	normal.z = sqrt(1.0 - saturate(dot(normal.xy, normal.xy)));
	return normal;
}

void main()
{
    mediump vec3 light = vec3(0.5, 0.2, 1.0);

    // ensure it's normalized
    light = normalize(light);

    // calculate the dot product of
    // the light to the vertex normal
    mediump float dProd = max(0.0, dot(CalculateNormalsValue(), light));

    vec4 basemapColor = texture2D(u_basemap, vUv);
    // feed into our frag colour
    gl_FragColor = vec4(dProd * basemapColor.r, // R
                        dProd * basemapColor.g, // G
                        dProd * basemapColor.b, // B
                        1.0);  // A
    //gl_FragColor = basemapColor;
}
