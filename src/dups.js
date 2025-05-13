import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { SUBTRACTION, Evaluator, Brush } from 'three-bvh-csg'
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// console.log(terrainVertexShader ? 'working': 'not imported')
//console.log( Brush)
/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 })
gui.hide()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const rgbeLoader = new RGBELoader()

/**
 * Environment map
 */
rgbeLoader.load('/spruit_sunrise.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.backgroundBlurriness = 0.5
    scene.environment = environmentMap
})


/**
 * fonts
 */
//'/fonts/font.json',
const text1 = new THREE.Group()
const fontLoader = new FontLoader()

const textMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, // Choose the color you prefer
    metalness: 0,
    roughness: 0.5 // Adjust for desired material properties
});
//0xf7ece1
fontLoader.load(
    '/fonts/Abhinav_Regular.json', 
   //font.json
    (font) => {
        console.log('font loaded')
       const textGeometry = new TextGeometry(
        ';kgfx¿ p8fgsf] k|tLIff ub{}5g\\',
        {
            font: font,
            size: 0.35,
            height: 0.1,
            curveSegments: 5,
            bevelEnabled: false,

        }
       )

        const textMesh = new THREE.Mesh(textGeometry, textMaterial)

        textMesh.rotation.y = Math.PI * -0.8
        textMesh.position.set(10.5, 0.5, 7);
        text1.add(textMesh)
    }
)

scene.add(text1)

// scene.add(textMesh)
//add text
//';kgfx¿ p8fgsf] k|tLIff ub{}5g\\\''
//'../static/assets/fonts/font.json'
/**
 * terrain
 */

const geometry = new THREE.PlaneGeometry(10,10,500,500)
//let's rotate the geometry instead of the camera or mesh.
geometry.deleteAttribute('uv')
geometry.deleteAttribute('normal')
geometry.rotateX(-Math.PI*0.5)
geometry.rotateY(-Math.PI*0.5)
debugObject.colorWaterDeep = '#002b3d'
debugObject.colorWaterSurface = '#66a8ff'
debugObject.colorSand = '#ffe894'
debugObject.colorGrass = '#85d534'
debugObject.colorSnow = '#ffffff'
debugObject.colorRock = '#bfbd8d'


//material section
const uniforms = { 
    uTime: new THREE.Uniform(0),
    uPositionFrequency : new THREE.Uniform(0.2),
    uStrength: new THREE.Uniform(2.0),
    uWarpFrequency: new THREE.Uniform(5),
    uWarpStrength: new THREE.Uniform(0.5),

    uColorWaterDeep: new THREE.Uniform(new THREE.Color(debugObject.colorWaterDeep)),
    uColorWaterSurface: new THREE.Uniform(new THREE.Color(debugObject.colorWaterSurface)),
    uColorSand: new THREE.Uniform(new THREE.Color(debugObject.colorSand)),
    uColorGrass: new THREE.Uniform(new THREE.Color(debugObject.colorGrass)),
    uColorSnow: new THREE.Uniform(new THREE.Color(debugObject.colorSnow)),
    uColorRock: new THREE.Uniform(new THREE.Color(debugObject.colorRock)),
}

gui.add (uniforms.uPositionFrequency,"value",0,1,0.001).name("uPositionFrequency")
gui.add (uniforms.uStrength,"value", 0,10,0.001).name("uStrength")
gui.add (uniforms.uWarpFrequency,"value",0,10,0.001).name("uWarpFrequency")
gui.add (uniforms.uWarpStrength,"value",0,1,0.001).name("uWarpStrength")
gui.addColor(debugObject, 'colorWaterDeep').onChange(() => uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep))
gui.addColor(debugObject, 'colorWaterSurface').onChange(() => uniforms.uColorWaterSurface.value.set(debugObject.colorWaterSurface))
gui.addColor(debugObject, 'colorSand').onChange(() => uniforms.uColorSand.value.set(debugObject.colorSand))
gui.addColor(debugObject, 'colorGrass').onChange(() => uniforms.uColorGrass.value.set(debugObject.colorGrass))
gui.addColor(debugObject, 'colorSnow').onChange(() => uniforms.uColorSnow.value.set(debugObject.colorSnow))
gui.addColor(debugObject, 'colorRock').onChange(() => uniforms.uColorRock.value.set(debugObject.colorRock))
    
const material = new CustomShaderMaterial({
//CSM
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: uniforms,
    silent: true, 

    //native properties
    metalness: 0,
    roughness: 1,
    color:'#00d415', 
})
//we applied the transformations to the vertices.. Hence the shadows are not working as 3 js uses the depth material to cast shadows. 
//so let's duplicate the material.

const depthMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: uniforms,
    silent: true, 

    //native properties
    depthPacking: THREE.RGBADepthPacking
})
const terrain = new THREE.Mesh(geometry, material)
terrain.customDepthMaterial = depthMaterial
terrain.castShadow = true
terrain.receiveShadow = true
scene.add(terrain)

/**
 * water
 */
const water = new THREE.Mesh(
    new THREE.PlaneGeometry(10,10,1,1),
    new THREE.MeshPhysicalMaterial({
        transmission: 1,
        roughness: 0.3

    })

)

water.rotation.x = - Math.PI * 0.5
water.position.y = - 0.1
scene.add(water)

/**
 * board
 */
//brushes
//big one that we will poke a hole into
const boardFill = new Brush(new THREE.BoxGeometry(11,2,11)) //11 length, 2 on height, 11 on the width
const boardHole = new Brush(new THREE.BoxGeometry(10,2.1,10))
//let's move the  hole brush higher so we have a base
// boardHole.position.y = 0.3;
// // we need to update the internal matrix that stores the meshes
// boardHole.updateMatrixWorld()
//you have access to individual materials
// boardFill.material.color.set('red')

//evaluate
const evaluator = new Evaluator() //you can have one evaluator for multiple operations
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION)
board.geometry.clearGroups()
board.material = new THREE.MeshStandardMaterial({color: '#ffffff', metalness: 0, roughness:0})
board.castShadow = true;
board.receiveShadow = true;
// scene.add(board)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
directionalLight.position.set(6.25, 3, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 30
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.camera.left = -8
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)

const desiredPosition = new THREE.Vector3(-5.715, -1.7, -5.654); 
const alpha = 0.005;
// camera.position.set(desiredPosition.x, desiredPosition.y, desiredPosition.z);


const cameraStartY = 30;  // Starting position
const cameraEndY = 1.7;  // Ending position
const cameraStartPosition = new THREE.Vector3(-5.715, cameraStartY, -5.654);
const cameraEndPosition = new THREE.Vector3(-5.715, cameraEndY, -5.654);

let startAnimation = true;
let animationDuration = 5; // Duration in seconds
let animationStartTime = 0;

scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
//controls.enableDamping = true
// controls.enabled = false
// controls.reset();		

let desiredRotation = new THREE.Quaternion().copy(camera.quaternion);  
const minY = 1.5; 
const maxY = 4.0
document.addEventListener('keydown', (event) => {
    const moveSpeed = 0.1; 
    const rotationSpeed = Math.PI / 72; 

    switch (event.code) {
        case 'KeyW': 
        if (desiredPosition.y + moveSpeed <= maxY) {
            desiredPosition.y += moveSpeed;
        }
        break;
        case 'KeyS': 

            if (desiredPosition.y + moveSpeed > minY) {
                desiredPosition.y -= moveSpeed;  // Move downward
                console.log(`Y changed: ${desiredPosition.y}`);
            }


            break;
        case 'KeyA': 
            console.log('a')
            desiredRotation.multiplyQuaternions(desiredRotation, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), +rotationSpeed));
            break;
        case 'KeyD':
            desiredRotation.multiplyQuaternions(desiredRotation, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rotationSpeed));
            break;
        default:
            break;
    }
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    uniforms.uTime.value = elapsedTime

    if (startAnimation) {
        if (animationStartTime === 0) animationStartTime = elapsedTime;
        const deltaTime = elapsedTime - animationStartTime;
        const t = deltaTime / animationDuration;

        // Interpolate position
        camera.position.lerpVectors(cameraStartPosition, cameraEndPosition, t);

        if (t >= 1) {
            startAnimation = false; // Stop the animation after the duration
        }
    } else { // Only update camera position and rotation if not animating
        // Update controls
        // controls.update()

        // Move and rotate the camera based on user input
        camera.position.lerp(desiredPosition, alpha);
        camera.position.y = Math.max(Math.min(camera.position.y, maxY), minY);

        camera.quaternion.slerp(desiredRotation, alpha);
    }

    // Always make the camera look at the center of the scene
    camera.lookAt(0, 0, 0);

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}


tick()