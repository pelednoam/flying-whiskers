import React, { FC, useEffect, useRef, ReactElement } from 'react';
import { Engine, Scene, Vector3, FreeCamera, Texture, SpriteManager, Sprite, Vector2, Color3, Color4, ParticleSystem, Texture as BabylonTexture, Sound } from '@babylonjs/core';

interface GameSceneProps {
    antialias: boolean;
    onScoreUpdate?: () => void;
}

interface KeyboardState {
    [key: string]: boolean;
}

const GameScene: FC<GameSceneProps> = ({ antialias, onScoreUpdate = () => {} }): ReactElement => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const catSpriteRef = useRef<Sprite | null>(null);
    const sardineSpriteRef = useRef<Sprite | null>(null);
    const catSpriteManagerRef = useRef<SpriteManager | null>(null);
    const sardineSpriteManagerRef = useRef<SpriteManager | null>(null);
    const catVelocityRef = useRef<Vector2>(new Vector2(0, 0));
    const sardineVelocityRef = useRef<Vector2>(new Vector2(0, 0));
    const catchSoundRef = useRef<Sound | null>(null);

    useEffect((): (() => void) => {
        if (!canvasRef.current) return () => {};

        // Cleanup any existing resources
        const cleanup = () => {
            // Remove sprites first
            if (catSpriteRef.current) {
                catSpriteRef.current.dispose();
                catSpriteRef.current = null;
            }
            if (sardineSpriteRef.current) {
                sardineSpriteRef.current.dispose();
                sardineSpriteRef.current = null;
            }

            // Then sprite managers
            if (catSpriteManagerRef.current) {
                catSpriteManagerRef.current.dispose();
                catSpriteManagerRef.current = null;
            }
            if (sardineSpriteManagerRef.current) {
                sardineSpriteManagerRef.current.dispose();
                sardineSpriteManagerRef.current = null;
            }

            // Then sound
            if (catchSoundRef.current) {
                catchSoundRef.current.dispose();
                catchSoundRef.current = null;
            }

            // Finally scene and engine
            if (sceneRef.current) {
                sceneRef.current.dispose();
                sceneRef.current = null;
            }
            if (engineRef.current) {
                engineRef.current.dispose();
                engineRef.current = null;
            }
        };

        // Clean up existing resources
        cleanup();

        // Create new engine and scene
        engineRef.current = new Engine(canvasRef.current, antialias);
        const scene = new Scene(engineRef.current);
        sceneRef.current = scene;
        
        // Set transparent background
        scene.clearColor = new Color4(0, 0, 0, 0);
        scene.ambientColor = new Color3(1, 1, 1);

        // Create camera
        const camera = new FreeCamera('camera', new Vector3(0, 0, -15), scene);
        camera.setTarget(Vector3.Zero());

        // Load catch sound
        catchSoundRef.current = new Sound("catchSound", `${process.env.PUBLIC_URL}/assets/meow.mp3`, scene, null, {
            loop: false,
            autoplay: false,
            volume: 0.5
        });

        // Create sprite managers
        catSpriteManagerRef.current = new SpriteManager('catManager', `${process.env.PUBLIC_URL}/assets/flying-cat-transparent.png`, 1, {
            width: 1024,
            height: 1024,
            premultipliedAlpha: true
        }, scene);
        sardineSpriteManagerRef.current = new SpriteManager('sardineManager', `${process.env.PUBLIC_URL}/assets/sardine.png`, 10, 1024, scene);

        // Create cat sprite
        catSpriteRef.current = new Sprite('cat', catSpriteManagerRef.current);
        catSpriteRef.current.width = 3;
        catSpriteRef.current.height = 3;
        catSpriteRef.current.position = Vector3.Zero();
        catVelocityRef.current = new Vector2(0, 0);

        // Create initial sardine
        createSardine();
        sardineVelocityRef.current = new Vector2(0, 0);

        // Handle keyboard input
        const keyDownMap: KeyboardState = {};
        
        const handleKeyDown = (e: KeyboardEvent): void => {
            keyDownMap[e.key] = true;
        };
        
        const handleKeyUp = (e: KeyboardEvent): void => {
            keyDownMap[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Game constants
        const ACCELERATION: number = 0.01;
        const MAX_SPEED: number = 0.2;
        const DRAG: number = 0.98;
        const BOUNDS: number = 8;
        const COLLISION_DISTANCE: number = 1.5;
        const SARDINE_ESCAPE_SPEED: number = 0.06;
        const SARDINE_AWARENESS_DISTANCE: number = 4;

        // Game loop
        const renderObserver = scene.onBeforeRenderObservable.add((): void => {
            if (!catSpriteRef.current || !sardineSpriteRef.current) return;

            // Update cat velocity based on input
            if (keyDownMap['ArrowLeft'] || keyDownMap['a']) {
                catVelocityRef.current.x -= ACCELERATION;
            }
            if (keyDownMap['ArrowRight'] || keyDownMap['d']) {
                catVelocityRef.current.x += ACCELERATION;
            }
            if (keyDownMap['ArrowUp'] || keyDownMap['w']) {
                catVelocityRef.current.y += ACCELERATION;
            }
            if (keyDownMap['ArrowDown'] || keyDownMap['s']) {
                catVelocityRef.current.y -= ACCELERATION;
            }

            // Apply drag and limit speed
            catVelocityRef.current.x *= DRAG;
            catVelocityRef.current.y *= DRAG;
            
            const currentSpeed: number = Math.sqrt(
                catVelocityRef.current.x * catVelocityRef.current.x + 
                catVelocityRef.current.y * catVelocityRef.current.y
            );
            
            if (currentSpeed > MAX_SPEED) {
                const scale: number = MAX_SPEED / currentSpeed;
                catVelocityRef.current.x *= scale;
                catVelocityRef.current.y *= scale;
            }

            // Update cat position
            catSpriteRef.current.position.x += catVelocityRef.current.x;
            catSpriteRef.current.position.y += catVelocityRef.current.y;

            // Flip cat sprite based on movement direction
            if (catVelocityRef.current.x < -0.01) {
                catSpriteRef.current.invertU = true;
            } else if (catVelocityRef.current.x > 0.01) {
                catSpriteRef.current.invertU = false;
            }

            // Keep cat within bounds
            catSpriteRef.current.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, catSpriteRef.current.position.x));
            catSpriteRef.current.position.y = Math.max(-BOUNDS/2, Math.min(BOUNDS/2, catSpriteRef.current.position.y));

            // Calculate distance between cat and sardine
            const dx: number = catSpriteRef.current.position.x - sardineSpriteRef.current.position.x;
            const dy: number = catSpriteRef.current.position.y - sardineSpriteRef.current.position.y;
            const distance: number = Math.sqrt(dx * dx + dy * dy);

            // Update sardine movement
            if (distance < SARDINE_AWARENESS_DISTANCE) {
                // Move away from cat
                const angle = Math.atan2(dy, dx);
                sardineVelocityRef.current.x = -Math.cos(angle) * SARDINE_ESCAPE_SPEED;
                sardineVelocityRef.current.y = -Math.sin(angle) * SARDINE_ESCAPE_SPEED;
            } else {
                // Slow down when far from cat
                sardineVelocityRef.current.x *= 0.95;
                sardineVelocityRef.current.y *= 0.95;
            }

            // Update sardine position
            sardineSpriteRef.current.position.x += sardineVelocityRef.current.x;
            sardineSpriteRef.current.position.y += sardineVelocityRef.current.y;

            // Keep sardine within bounds
            sardineSpriteRef.current.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, sardineSpriteRef.current.position.x));
            sardineSpriteRef.current.position.y = Math.max(-BOUNDS/2, Math.min(BOUNDS/2, sardineSpriteRef.current.position.y));

            // Flip sardine sprite based on movement direction
            if (sardineVelocityRef.current.x > 0.01) {
                sardineSpriteRef.current.invertU = true;
            } else if (sardineVelocityRef.current.x < -0.01) {
                sardineSpriteRef.current.invertU = false;
            }

            // Check for collision
            if (distance < COLLISION_DISTANCE) {
                // Caught the sardine!
                sardineSpriteRef.current.dispose();
                createSardine();
                sardineVelocityRef.current.x = 0;
                sardineVelocityRef.current.y = 0;
                onScoreUpdate?.();
                // Play catch sound
                catchSoundRef.current?.play();
            }
        });

        // Start the render loop
        engineRef.current.runRenderLoop((): void => {
            scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', onResize);

        return (): void => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', onResize);
            
            // Remove the render observer
            scene.onBeforeRenderObservable.remove(renderObserver);
            
            // Clean up all resources
            cleanup();
        };
    }, [antialias, onScoreUpdate]);

    const onResize = (): void => {
        if (engineRef.current) {
            engineRef.current.resize();
        }
    };

    const createSardine = (): void => {
        if (!sardineSpriteManagerRef.current) return;
        
        const sardine = new Sprite('sardine', sardineSpriteManagerRef.current);
        sardine.width = 2.5;
        sardine.height = 1.5;
        sardine.invertU = true;
        
        // Random position
        sardine.position.x = Math.random() * 14 - 7;
        sardine.position.y = Math.random() * 6 - 3;
        
        sardineSpriteRef.current = sardine;
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', outline: 'none' }}
        />
    );
};

export default GameScene; 