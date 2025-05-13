uniform float uPositionFrequency;
uniform float uTime;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;

varying vec3 vPosition;
varying float vUpDot;

#include ../includes/simplexNoise2d.glsl

float getElevation(vec2 position){

    vec2 warpedPosition = position;
    warpedPosition += uTime *0.3;
    warpedPosition += simplexNoise2d(warpedPosition * uPositionFrequency* uWarpFrequency )* uWarpStrength;
    float elevation = 0.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency ) / 2.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 2.0) / 4.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 4.0)/ 8.0;
    
    //let's ad plateaus. if we are close to 0, set it to 0 
    float elevationSign = sign(elevation); 
    elevation = pow(abs(elevation), 2.0) * elevationSign;
    elevation*=uStrength;
    //perect now we have values that foes lower than 0

    return elevation;

}

void main(){
    //elevation calculations

    float shift = 0.01;
    //defining neighbor positions;
    
    //start from base position and shift by shift in the x axis
    vec3 positionA = position + vec3(shift,0,0); 
    vec3 positionB = position + vec3(0,0,-shift); 

    
    //we'll only use x and z as the parameters for calculating elevation so vec2 is enough
    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;

    positionA.y = getElevation(positionA.xz);
    positionB.y = getElevation(positionB.xz);

    //compute the normals between A and B 
    vec3 toA = normalize(positionA- csm_Position);
    vec3 toB = normalize(positionB- csm_Position);
    csm_Normal = cross(toA, toB);
    
    //Varyings
    vPosition = csm_Position;
    vPosition.xz += uTime*0.2;
    vUpDot = dot( csm_Normal, vec3(0.0,1.0,0.0));

    //once the normals have been set, we can remove it
}
//normals are not correct
//calculate position of 2 neighbors
    // A in positive X axis
    // B in negative Z axis
    // if i put a positive z, the normal is going -y direction and we want the normal to be upright