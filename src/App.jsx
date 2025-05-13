import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { SUBTRACTION, Evaluator, Brush } from "three-bvh-csg";
import GUI from "lil-gui";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import LoadingScreen from "./LoadingScreen";
import terrainVertexShader from "./shaders/terrain/vertex.glsl";
import terrainFragmentShader from "./shaders/terrain/fragment.glsl";

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);

    const handleLoadComplete = () => {
        setIsLoading(false);
    };

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingProgress((prev) => (prev < 100 ? prev + 1 : prev));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) {
            initThreeScene();
        }
    }, [isLoading]);

    const initThreeScene = () => {
        const canvas = canvasRef.current;
        sceneRef.current = new THREE.Scene();
        const scene = sceneRef.current;

        // Debug
        const gui = new GUI({ width: 325 });
        gui.hide();
        const debugObject = {};

        // Loaders
        const rgbeLoader = new RGBELoader();

        // Environment map
        rgbeLoader.load("/spruit_sunrise.hdr", (environmentMap) => {
            environmentMap.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = environmentMap;
            scene.backgroundBlurriness = 0.5;
            scene.environment = environmentMap;
        });

        // Fonts
        const text1 = new THREE.Group();
        const fontLoader = new FontLoader();
        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.5,
        });

        fontLoader.load("/fonts/Abhinav_Regular.json", (font) => {
            console.log("font loaded");
            const textGeometry = new TextGeometry(
                ";kgfx¿ p8fgsf] k|tLIff ub{}5g\\",
                {
                    font: font,
                    size: 0.35,
                    height: 0.1,
                    curveSegments: 5,
                    bevelEnabled: false,
                },
            );

            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.rotation.y = Math.PI * -0.8;
            textMesh.position.set(10.5, 0.5, 7);
            text1.add(textMesh);
        });

        scene.add(text1);

        // Terrain
        const geometry = new THREE.PlaneGeometry(10, 10, 500, 500);
        geometry.deleteAttribute("uv");
        geometry.deleteAttribute("normal");
        geometry.rotateX(-Math.PI * 0.5);
        geometry.rotateY(-Math.PI * 0.5);

        debugObject.colorWaterDeep = "#002b3d";
        debugObject.colorWaterSurface = "#66a8ff";
        debugObject.colorSand = "#ffe894";
        debugObject.colorGrass = "#85d534";
        debugObject.colorSnow = "#ffffff";
        debugObject.colorRock = "#bfbd8d";

        const uniforms = {
            uTime: new THREE.Uniform(0),
            uPositionFrequency: new THREE.Uniform(0.2),
            uStrength: new THREE.Uniform(2.0),
            uWarpFrequency: new THREE.Uniform(5),
            uWarpStrength: new THREE.Uniform(0.5),
            uColorWaterDeep: new THREE.Uniform(
                new THREE.Color(debugObject.colorWaterDeep),
            ),
            uColorWaterSurface: new THREE.Uniform(
                new THREE.Color(debugObject.colorWaterSurface),
            ),
            uColorSand: new THREE.Uniform(
                new THREE.Color(debugObject.colorSand),
            ),
            uColorGrass: new THREE.Uniform(
                new THREE.Color(debugObject.colorGrass),
            ),
            uColorSnow: new THREE.Uniform(
                new THREE.Color(debugObject.colorSnow),
            ),
            uColorRock: new THREE.Uniform(
                new THREE.Color(debugObject.colorRock),
            ),
        };

        gui.add(uniforms.uPositionFrequency, "value", 0, 1, 0.001).name(
            "uPositionFrequency",
        );
        gui.add(uniforms.uStrength, "value", 0, 10, 0.001).name("uStrength");
        gui.add(uniforms.uWarpFrequency, "value", 0, 10, 0.001).name(
            "uWarpFrequency",
        );
        gui.add(uniforms.uWarpStrength, "value", 0, 1, 0.001).name(
            "uWarpStrength",
        );
        gui.addColor(debugObject, "colorWaterDeep").onChange(() =>
            uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep),
        );
        gui.addColor(debugObject, "colorWaterSurface").onChange(() =>
            uniforms.uColorWaterSurface.value.set(
                debugObject.colorWaterSurface,
            ),
        );
        gui.addColor(debugObject, "colorSand").onChange(() =>
            uniforms.uColorSand.value.set(debugObject.colorSand),
        );
        gui.addColor(debugObject, "colorGrass").onChange(() =>
            uniforms.uColorGrass.value.set(debugObject.colorGrass),
        );
        gui.addColor(debugObject, "colorSnow").onChange(() =>
            uniforms.uColorSnow.value.set(debugObject.colorSnow),
        );
        gui.addColor(debugObject, "colorRock").onChange(() =>
            uniforms.uColorRock.value.set(debugObject.colorRock),
        );

        const material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: uniforms,
            silent: true,
            metalness: 0,
            roughness: 1,
            color: "#00d415",
        });

        const depthMaterial = new CustomShaderMaterial({
            baseMaterial: THREE.MeshDepthMaterial,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: uniforms,
            silent: true,
            depthPacking: THREE.RGBADepthPacking,
        });

        const terrain = new THREE.Mesh(geometry, material);
        terrain.customDepthMaterial = depthMaterial;
        terrain.castShadow = true;
        terrain.receiveShadow = true;
        scene.add(terrain);

        // Water
        const water = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10, 1, 1),
            new THREE.MeshPhysicalMaterial({
                transmission: 1,
                roughness: 0.3,
            }),
        );

        water.rotation.x = -Math.PI * 0.5;
        water.position.y = -0.1;
        scene.add(water);

        // Board
        const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11));
        const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10));
        const evaluator = new Evaluator();
        const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION);
        board.geometry.clearGroups();
        board.material = new THREE.MeshStandardMaterial({
            color: "#ffffff",
            metalness: 0,
            roughness: 0,
        });
        board.castShadow = true;
        board.receiveShadow = true;

        // Lights
        const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
        directionalLight.position.set(6.25, 3, 4);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(1024, 1024);
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 30;
        directionalLight.shadow.camera.top = 8;
        directionalLight.shadow.camera.right = 8;
        directionalLight.shadow.camera.bottom = -8;
        directionalLight.shadow.camera.left = -8;
        scene.add(directionalLight);

        // Camera
        cameraRef.current = new THREE.PerspectiveCamera(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            100,
        );
        const camera = cameraRef.current;
        const desiredPosition = new THREE.Vector3(-5.715, 1.7, -5.654);
        const alpha = 0.005;
        camera.position.set(
            desiredPosition.x,
            desiredPosition.y,
            desiredPosition.z,
        );
        camera.lookAt(0, 0, 0);
        scene.add(camera);

        // Renderer
        rendererRef.current = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        });
        const renderer = rendererRef.current;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Animation
        const clock = new THREE.Clock();
        let startAnimation = true;
        let animationDuration = 4;
        let animationStartTime = 0;
        const cameraStartY = 15;
        const cameraEndY = 1.7;
        const cameraStartPosition = new THREE.Vector3(
            -5.715,
            cameraStartY,
            -0.654,
        );
        const cameraEndPosition = new THREE.Vector3(-5.715, cameraEndY, -5.654);
        let desiredRotation = new THREE.Quaternion().copy(camera.quaternion);
        const minY = 1.5;
        const maxY = 4.0;

        const tick = () => {
            const elapsedTime = clock.getElapsedTime();
            uniforms.uTime.value = elapsedTime;

            camera.position.lerp(desiredPosition, alpha);
            camera.position.y = Math.max(
                Math.min(camera.position.y, maxY),
                minY,
            );
            camera.quaternion.slerp(desiredRotation, alpha);

            if (startAnimation) {
                if (animationStartTime === 0) animationStartTime = elapsedTime;
                const deltaTime = elapsedTime - animationStartTime;
                const t = deltaTime / animationDuration;
                camera.position.lerpVectors(
                    cameraStartPosition,
                    cameraEndPosition,
                    t,
                );
                if (t >= 1) {
                    startAnimation = false;
                }
            }

            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        };

        tick();

        // Event listeners
        const handleResize = () => {
            const sizes = {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: Math.min(window.devicePixelRatio, 2),
            };
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(sizes.pixelRatio);
        };

        const handleKeyDown = (event) => {
            const moveSpeed = 0.1;
            const rotationSpeed = Math.PI / 72;

            switch (event.code) {
                case "KeyW":
                    if (desiredPosition.y + moveSpeed <= maxY) {
                        desiredPosition.y += moveSpeed;
                    }
                    break;
                case "KeyS":
                    if (desiredPosition.y - moveSpeed > minY) {
                        desiredPosition.y -= moveSpeed;
                    }
                    break;
                case "KeyA":
                    desiredRotation.multiplyQuaternions(
                        desiredRotation,
                        new THREE.Quaternion().setFromAxisAngle(
                            new THREE.Vector3(0, 0, 1),
                            +rotationSpeed,
                        ),
                    );
                    break;
                case "KeyD":
                    desiredRotation.multiplyQuaternions(
                        desiredRotation,
                        new THREE.Quaternion().setFromAxisAngle(
                            new THREE.Vector3(0, 0, 1),
                            -rotationSpeed,
                        ),
                    );
                    break;
            }
        };

        window.addEventListener("resize", handleResize);
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup function
        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("keydown", handleKeyDown);
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            if (gui) gui.destroy();
            // Dispose of any other Three.js objects, geometries, materials, etc.
        };
    };

    return (
        <>
            {isLoading ? (
                <LoadingScreen onLoadComplete={handleLoadComplete} />
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100vh" }}
                />
            )}
        </>
    );
};

export default App;
