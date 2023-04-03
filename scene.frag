#version 450

layout (binding = 1) uniform samplerCube shadowCubeMap;

layout (location = 0) in vec3 inNormal;
layout (location = 1) in vec3 inColor;
layout (location = 2) in vec3 inEyePos;
layout (location = 3) in vec3 inLightVec;
layout (location = 4) in vec3 inWorldPos;
layout (location = 5) in vec3 inLightPos;

layout (location = 0) out vec4 outFragColor;

#define EPSILON 0.15
#define SHADOW_OPACITY 0.5

vec3 LightIntensity = vec3(1.0, 0.0, 0.0);
vec3 MaterialKd = vec3(1.0, 1.0, 1.0);
vec3 MaterialKs = vec3(1.0, 0.5, 0.0);
vec3 MaterialKa = vec3(0.0, 0.025, 0.075);
float MaterialShininess = 10.0;



vec3 phongModelDiffAndSpec(bool do_specular)
{
  vec3 normal_vector = normalize( inNormal );



    vec3 n = inNormal;
    vec3 s = normalize(-vec3(5, 5, 5) - inWorldPos);
    vec3 v = normalize(-inWorldPos);
    vec3 r = reflect( -s, n );
    float sDotN = max( dot(s,n), 0.0 );
    vec3 diffuse = LightIntensity * MaterialKd * sDotN;
    vec3 spec = vec3(0.0);

    if( sDotN > 0.0 )
    {
        spec.x = MaterialKs.x * pow( max( dot(r,v), 0.0 ), MaterialShininess );
        spec.y = MaterialKs.y * pow( max( dot(r,v), 0.0 ), MaterialShininess );
        spec.z = MaterialKs.z * pow( max( dot(r,v), 0.0 ), MaterialShininess );
    }

    vec3 n2 = inNormal;
    vec3 s2 = normalize(-vec3(5, 5, 5) - inWorldPos);
    vec3 v2 = normalize(-inWorldPos);
    vec3 r2 = reflect( -s2, n2 );
    float sDotN2 = max( dot(s2,n2)*0.5f, 0.0 );
    vec3 diffuse2 = LightIntensity*0.25 * MaterialKa * sDotN2;

    float k = (1.0 - sDotN)/2.0;
    vec3 ret = diffuse + diffuse2 + MaterialKa*k;

    if(do_specular)
        ret = ret + spec;
    
    return ret;
}








void main() 
{
	// Lighting
	vec3 N = normalize(inNormal);
	vec3 L = normalize(vec3(1.0));	
	
	vec3 Eye = normalize(-inEyePos);
	vec3 Reflected = normalize(reflect(-inLightVec, inNormal)); 

	vec4 IAmbient = vec4(vec3(0.05), 1.0);
	vec4 IDiffuse = vec4(1.0, 0, 0 ,0) * max(dot(inNormal, inLightVec), 0.0);

	outFragColor = vec4(IAmbient + IDiffuse * vec4(inColor, 1.0));		
		
	// Shadow
	vec3 lightVec = inWorldPos - inLightPos;
    float sampledDist = texture(shadowCubeMap, lightVec).r;
    float dist = length(lightVec);

	// Check if fragment is in shadow
    float shadow = (dist <= sampledDist + EPSILON) ? 1.0 : SHADOW_OPACITY;



        vec3 diffAndSpec;
    
    
    if(shadow == 1.0)
    {
        diffAndSpec = phongModelDiffAndSpec(true);
        outFragColor = vec4(diffAndSpec, 1.0);// + vec4(diffAndSpec * shadow + MaterialKa*(1.0 - shadow), 1.0);
    }
    else
    {
        diffAndSpec = phongModelDiffAndSpec(false);
        outFragColor = vec4(diffAndSpec * shadow + MaterialKa*(1.0 - shadow), 1.0) + vec4(diffAndSpec, 1.0) + vec4(diffAndSpec * shadow + MaterialKa*(1.0 - shadow), 1.0);
        outFragColor /= 3;
    }

    outFragColor = pow( outFragColor, vec4(1.0 / 2.2) );
}