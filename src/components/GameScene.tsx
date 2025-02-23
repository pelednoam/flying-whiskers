import React, { FC, useEffect, useRef, ReactElement } from 'react';
import { Engine, Scene, Vector3, FreeCamera, SpriteManager, Sprite, Vector2, Color3, Color4, Sound, ParticleSystem, Texture } from '@babylonjs/core';

interface GameSceneProps {
    antialias: boolean;
    onScoreUpdate?: () => void;
    isPaused?: boolean;
}

interface KeyboardState {
    [key: string]: boolean;
}

interface TouchState {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

const GameScene: FC<GameSceneProps> = ({ antialias, onScoreUpdate = () => {}, isPaused = false }): ReactElement => {
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
    const backgroundMusicRef = useRef<Sound | null>(null);
    const touchStateRef = useRef<TouchState>({
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    });
    const mouseStateRef = useRef<TouchState>({
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    });
    const particleSystemRef = useRef<ParticleSystem | null>(null);

    // Effect for handling pause state
    useEffect(() => {
        if (isPaused) {
            backgroundMusicRef.current?.pause();
        } else {
            backgroundMusicRef.current?.play();
        }
    }, [isPaused]);

    useEffect((): (() => void) => {
        if (!canvasRef.current) return () => {};

        // Store canvas reference for cleanup
        const canvas = canvasRef.current;

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
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.dispose();
                backgroundMusicRef.current = null;
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
            volume: 0.15
        });

        // Load and play background music
        backgroundMusicRef.current = new Sound("backgroundMusic", `${process.env.PUBLIC_URL}/assets/nam-nam-nam.mp3`, scene, () => {
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.loop = true;
                backgroundMusicRef.current.play();
            }
        }, {
            loop: true,
            autoplay: true,
            volume: 0.3
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

        // Handle touch input
        const handleTouchStart = (e: TouchEvent): void => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStateRef.current = {
                active: true,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY
            };
        };

        const handleTouchMove = (e: TouchEvent): void => {
            e.preventDefault();
            if (!touchStateRef.current.active) return;
            const touch = e.touches[0];
            touchStateRef.current.currentX = touch.clientX;
            touchStateRef.current.currentY = touch.clientY;
        };

        const handleTouchEnd = (e: TouchEvent): void => {
            e.preventDefault();
            touchStateRef.current.active = false;
            catVelocityRef.current.x = 0;
            catVelocityRef.current.y = 0;
        };

        // Add touch event listeners
        canvasRef.current.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvasRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasRef.current.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Handle mouse input
        const handleMouseDown = (e: MouseEvent): void => {
            e.preventDefault();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            mouseStateRef.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY
            };
        };

        const handleMouseMove = (e: MouseEvent): void => {
            if (!mouseStateRef.current.active) return;

            // Update current position
            mouseStateRef.current.currentX = e.clientX;
            mouseStateRef.current.currentY = e.clientY;

            // Calculate distance from start
            const dx = mouseStateRef.current.currentX - mouseStateRef.current.startX;
            const dy = mouseStateRef.current.currentY - mouseStateRef.current.startY;

            // Update start position to current for continuous movement
            mouseStateRef.current.startX = mouseStateRef.current.currentX;
            mouseStateRef.current.startY = mouseStateRef.current.currentY;

            // Apply movement directly
            catVelocityRef.current.x += dx * MOUSE_SENSITIVITY;
            catVelocityRef.current.y -= dy * MOUSE_SENSITIVITY;
        };

        const handleMouseUp = (e: MouseEvent): void => {
            mouseStateRef.current.active = false;
        };

        // Add mouse event listeners
        canvasRef.current.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Add dragstart prevention
        const preventDrag = (e: DragEvent) => {
            e.preventDefault();
        };
        canvasRef.current.addEventListener('dragstart', preventDrag);

        // Game constants
        const ACCELERATION: number = 0.01;
        const MAX_SPEED: number = 0.2;
        const DRAG: number = 0.98;
        const BOUNDS: number = 8;
        const COLLISION_DISTANCE: number = 1.5;
        const SARDINE_ESCAPE_SPEED: number = 0.06;
        const SARDINE_AWARENESS_DISTANCE: number = 4;
        const TOUCH_SENSITIVITY: number = 0.01;
        const MOUSE_SENSITIVITY: number = 0.02; // Increased for better trackpad response

        // Game loop
        const renderObserver = scene.onBeforeRenderObservable.add((): void => {
            if (!catSpriteRef.current || !sardineSpriteRef.current || isPaused) return;

            // Handle keyboard input
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

            // Handle touch input
            if (touchStateRef.current.active) {
                const dx = touchStateRef.current.currentX - touchStateRef.current.startX;
                const dy = touchStateRef.current.currentY - touchStateRef.current.startY;
                catVelocityRef.current.x = dx * TOUCH_SENSITIVITY;
                catVelocityRef.current.y = -dy * TOUCH_SENSITIVITY;
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
                // Get the sardine position before disposing it
                const sardinePosition = sardineSpriteRef.current.position.clone();
                
                // Create catch effect at sardine position
                createCatchEffect(sardinePosition);
                
                // Handle collision (existing code)
                sardineSpriteRef.current.dispose();
                createSardine();
                onScoreUpdate?.();
                catchSoundRef.current?.play();
                try {
                    if ('vibrate' in navigator) {
                        navigator.vibrate([100, 50, 100]);
                    }
                } catch (error) {
                    console.log('Vibration not supported or permission denied');
                }
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
            
            // Remove touch event listeners
            if (canvas) {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
                canvas.removeEventListener('mousedown', handleMouseDown);
            }
            
            // Remove mouse event listeners
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            
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

    const createCatchEffect = (position: Vector3): void => {
        if (!sceneRef.current) return;

        // Clean up previous particle system if it exists
        if (particleSystemRef.current) {
            particleSystemRef.current.dispose();
        }

        // Create particle system
        const particleSystem = new ParticleSystem("catchEffect", 50, sceneRef.current);
        particleSystemRef.current = particleSystem;

        // Particle texture
        particleSystem.particleTexture = new Texture(`${process.env.PUBLIC_URL}/assets/star.png`, sceneRef.current);

        // Set particle system properties
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new Vector3(-0.2, -0.2, 0);
        particleSystem.maxEmitBox = new Vector3(0.2, 0.2, 0);
        particleSystem.color1 = new Color4(1, 1, 0, 1);
        particleSystem.color2 = new Color4(1, 0.5, 0, 1);
        particleSystem.colorDead = new Color4(0, 0, 0, 0);
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.4;
        particleSystem.emitRate = 100;
        particleSystem.gravity = new Vector3(0, 0, 0);
        particleSystem.direction1 = new Vector3(-1, -1, 0);
        particleSystem.direction2 = new Vector3(1, 1, 0);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.01;

        // Start the particle system
        particleSystem.start();

        // Stop and dispose after animation
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
                particleSystemRef.current = null;
            }, 500);
        }, 200);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: '100%',
                outline: 'none',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'grab'
            }}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default GameScene; 