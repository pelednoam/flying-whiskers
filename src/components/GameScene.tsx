import React, { FC, useEffect, useRef, ReactElement } from 'react';
import { Engine, Scene, Vector3, FreeCamera, SpriteManager, Sprite, Vector2, Color3, Color4, Sound, ParticleSystem, Texture, Observer } from '@babylonjs/core';

interface GameSceneProps {
    antialias: boolean;
    onScoreUpdate?: () => void;
    isPaused?: boolean;
    isGameStarted?: boolean;
    score?: number;
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

const GameScene: FC<GameSceneProps> = ({ 
    antialias, 
    onScoreUpdate = () => {}, 
    isPaused = false,
    isGameStarted = false,
    score = 0
}): ReactElement => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const catSpriteRef = useRef<Sprite | null>(null);
    const sardineSpriteRef = useRef<Sprite | null>(null);
    const dogSpriteRef = useRef<Sprite | null>(null);
    const catSpriteManagerRef = useRef<SpriteManager | null>(null);
    const sardineSpriteManagerRef = useRef<SpriteManager | null>(null);
    const dogSpriteManagerRef = useRef<SpriteManager | null>(null);
    const catVelocityRef = useRef<Vector2>(new Vector2(0, 0));
    const sardineVelocityRef = useRef<Vector2>(new Vector2(0, 0));
    const dogVelocityRef = useRef<Vector2>(new Vector2(0, 0));
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
    const keyDownMapRef = useRef<KeyboardState>({});

    // Game constants
    const ACCELERATION: number = 0.01;
    const MAX_SPEED: number = 0.2;
    const DRAG: number = 0.98;
    const BOUNDS: number = 8;
    const COLLISION_DISTANCE: number = 1.5;
    const SARDINE_ESCAPE_SPEED: number = 0.06;
    const SARDINE_AWARENESS_DISTANCE: number = 4;
    const TOUCH_SENSITIVITY: number = 0.01;
    const MOUSE_SENSITIVITY: number = 0.02;
    const DOG_CHASE_SPEED: number = 0.018;
    const DOG_DRAG: number = 0.98;

    useEffect(() => {
        const logMessage = (msg: string) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] 🎮 ${msg}`);
        };

        let isCleaningUp = false;

        if (!canvasRef.current) {
            logMessage('Canvas not ready');
            return;
        }

        logMessage('Initializing game scene');

        // Create engine if it doesn't exist
        if (!engineRef.current) {
            engineRef.current = new Engine(canvasRef.current, antialias);
            logMessage('Engine created');
        }

        // Create scene
        const scene = new Scene(engineRef.current);
        sceneRef.current = scene;
        logMessage('Scene created');
        
        // Set transparent background
        scene.clearColor = new Color4(0, 0, 0, 0);
        scene.ambientColor = new Color3(1, 1, 1);

        // Create camera
        const camera = new FreeCamera('camera', new Vector3(0, 0, -15), scene);
        camera.setTarget(Vector3.Zero());
        logMessage('Camera set up');
        
        // Create sprite managers
        catSpriteManagerRef.current = new SpriteManager('catManager', `${process.env.PUBLIC_URL}/assets/flying-cat-transparent.png`, 1, {
            width: 1024,
            height: 1024,
            premultipliedAlpha: true
        }, scene);
        logMessage('Cat sprite manager created');
        
        sardineSpriteManagerRef.current = new SpriteManager('sardineManager', `${process.env.PUBLIC_URL}/assets/sardine.png`, 10, 1024, scene);
        logMessage('Sardine sprite manager created');
        
        dogSpriteManagerRef.current = new SpriteManager('dogManager', `${process.env.PUBLIC_URL}/assets/german_shepherd_transparent.png`, 1, {
            width: 1024,
            height: 1024,
            premultipliedAlpha: true
        }, scene);
        logMessage('Dog sprite manager created');

        // Create initial sprites
        try {
            const catSpriteManager = catSpriteManagerRef.current;
            catSpriteRef.current = new Sprite('cat', catSpriteManager);
            catSpriteRef.current.width = 3;
            catSpriteRef.current.height = 3;
            catSpriteRef.current.position = new Vector3(-4, 0, 0);
            catVelocityRef.current = new Vector2(0, 0);
            logMessage('Cat sprite created successfully');

            const sardineSpriteManager = sardineSpriteManagerRef.current;
            const sardine = new Sprite('sardine', sardineSpriteManager);
            sardine.width = 2.5;
            sardine.height = 1.5;
            sardine.invertU = true;
            sardine.position = new Vector3(4, 0, 0);
            sardineVelocityRef.current = new Vector2(0, 0);
            sardineSpriteRef.current = sardine;
            logMessage('Sardine sprite created successfully');

            // Create dog sprite immediately
            const dogSpriteManager = dogSpriteManagerRef.current;
            dogSpriteRef.current = new Sprite('dog', dogSpriteManager);
            dogSpriteRef.current.width = 2.8;  // 70% of original 4
            dogSpriteRef.current.height = 2.8;  // 70% of original 4
            dogSpriteRef.current.position = new Vector3(8, 0, 0);
            dogVelocityRef.current = new Vector2(0, 0);
            logMessage('Dog sprite created successfully');
        } catch (error) {
            logMessage(`Error creating sprites: ${error}`);
        }

        // Start render loop
        engineRef.current.runRenderLoop((): void => {
            scene.render();
        });
        logMessage('Render loop started');

        // Add render observer
        const renderObserver = scene.onBeforeRenderObservable.add((): void => {
            const logMessage = (msg: string) => {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] 🎮 ${msg}`);
            };

            if (!catSpriteRef.current || !sardineSpriteRef.current) {
                logMessage('Sprites not ready in render observer');
                return;
            }

            // If game hasn't started, just keep sprites in their initial positions
            if (!isGameStarted) {
                catSpriteRef.current.position = new Vector3(-4, 0, 0);
                sardineSpriteRef.current.position = new Vector3(4, 0, 0);
                if (dogSpriteRef.current) {
                    dogSpriteRef.current.position = new Vector3(8, 0, 0);
                }
                return;
            }

            // If paused, don't update positions
            if (isPaused) {
                return;
            }

            // Handle dog movement
            if (isGameStarted && dogSpriteRef.current && catSpriteRef.current) {
                // Calculate distance between dog and cat
                const dogToCatDx = catSpriteRef.current.position.x - dogSpriteRef.current.position.x;
                const dogToCatDy = catSpriteRef.current.position.y - dogSpriteRef.current.position.y;
                const dogToCatDistance = Math.sqrt(dogToCatDx * dogToCatDx + dogToCatDy * dogToCatDy);

                // Log positions every few frames
                if (Math.random() < 0.1) {  // Increased logging frequency
                    console.log(`[${new Date().toISOString()}] 🐕 Dog chase update:
                        Game started: ${isGameStarted}
                        Dog pos: (${dogSpriteRef.current.position.x.toFixed(2)}, ${dogSpriteRef.current.position.y.toFixed(2)})
                        Cat pos: (${catSpriteRef.current.position.x.toFixed(2)}, ${catSpriteRef.current.position.y.toFixed(2)})
                        Distance: ${dogToCatDistance.toFixed(2)}
                        Dog velocity: (${dogVelocityRef.current.x.toFixed(2)}, ${dogVelocityRef.current.y.toFixed(2)})`);
                }

                // Calculate direction to cat and normalize it
                const angle = Math.atan2(dogToCatDy, dogToCatDx);
                
                // Set velocity towards cat with the global speed constant
                dogVelocityRef.current.x = Math.cos(angle) * DOG_CHASE_SPEED;
                dogVelocityRef.current.y = Math.sin(angle) * DOG_CHASE_SPEED;
                
                // Update dog position with the new velocity
                dogSpriteRef.current.position.x += dogVelocityRef.current.x;
                dogSpriteRef.current.position.y += dogVelocityRef.current.y;

                // Keep dog within bounds
                dogSpriteRef.current.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, dogSpriteRef.current.position.x));
                dogSpriteRef.current.position.y = Math.max(-BOUNDS/2, Math.min(BOUNDS/2, dogSpriteRef.current.position.y));

                // Flip dog sprite based on movement direction
                if (dogVelocityRef.current.x < -0.01) {
                    dogSpriteRef.current.invertU = true;
                } else if (dogVelocityRef.current.x > 0.01) {
                    dogSpriteRef.current.invertU = false;
                }
            }

            // Handle keyboard input
            if (keyDownMapRef.current['ArrowLeft'] || keyDownMapRef.current['a']) {
                catVelocityRef.current.x -= ACCELERATION;
            }
            if (keyDownMapRef.current['ArrowRight'] || keyDownMapRef.current['d']) {
                catVelocityRef.current.x += ACCELERATION;
            }
            if (keyDownMapRef.current['ArrowUp'] || keyDownMapRef.current['w']) {
                catVelocityRef.current.y += ACCELERATION;
            }
            if (keyDownMapRef.current['ArrowDown'] || keyDownMapRef.current['s']) {
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
            if (distance < COLLISION_DISTANCE && catSpriteRef.current && sardineSpriteRef.current) {
                console.log(`[${new Date().toISOString()}] 🎯 Collision detected! Current score before update: ${score}`);
                
                // Create catch effect at sardine position before disposing it
                const sardinePosition = sardineSpriteRef.current.position.clone();
                createCatchEffect(sardinePosition);
                
                // Create new sardine at random position
                const newSardinePosition = new Vector3(
                    Math.random() * 14 - 7,  // Random x between -7 and 7
                    Math.random() * 6 - 3,   // Random y between -3 and 3
                    0
                );
                
                // Dispose only the sardine
                if (sardineSpriteRef.current) {
                    sardineSpriteRef.current.dispose();
                    sardineSpriteRef.current = null;
                }
                
                // Create new sardine
                createSardine(newSardinePosition);
                
                // Update score and play effects
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

        // Handle window resize
        window.addEventListener('resize', onResize);

        return () => {
            if (isCleaningUp) return;
            isCleaningUp = true;
            
            logMessage('Cleaning up game scene');
            
            // Remove render observer first
            if (scene && renderObserver) {
                scene.onBeforeRenderObservable.remove(renderObserver);
                logMessage('Render observer removed');
            }

            // Then dispose sprites
            if (catSpriteRef.current) {
                catSpriteRef.current.dispose();
                catSpriteRef.current = null;
                logMessage('Cat sprite disposed');
            }
            if (sardineSpriteRef.current) {
                sardineSpriteRef.current.dispose();
                sardineSpriteRef.current = null;
                logMessage('Sardine sprite disposed');
            }
            if (dogSpriteRef.current) {
                dogSpriteRef.current.dispose();
                dogSpriteRef.current = null;
                logMessage('Dog sprite disposed');
            }
            if (catSpriteManagerRef.current) {
                catSpriteManagerRef.current.dispose();
                catSpriteManagerRef.current = null;
                logMessage('Cat sprite manager disposed');
            }
            if (sardineSpriteManagerRef.current) {
                sardineSpriteManagerRef.current.dispose();
                sardineSpriteManagerRef.current = null;
                logMessage('Sardine sprite manager disposed');
            }
            if (dogSpriteManagerRef.current) {
                dogSpriteManagerRef.current.dispose();
                dogSpriteManagerRef.current = null;
                logMessage('Dog sprite manager disposed');
            }
            if (scene) {
                scene.dispose();
                logMessage('Scene disposed');
            }
            if (engineRef.current) {
                engineRef.current.dispose();
                engineRef.current = null;
                logMessage('Engine disposed');
            }
        };
    }, [canvasRef.current, isGameStarted, antialias, isPaused, onScoreUpdate]);

    // Effect for handling game state
    useEffect(() => {
        if (!backgroundMusicRef.current?.isReady()) return;

        if (!isGameStarted) {
            if (backgroundMusicRef.current?.isPlaying) {
                backgroundMusicRef.current?.stop();
            }
        } else {
            if (isPaused) {
                if (backgroundMusicRef.current?.isPlaying) {
                    backgroundMusicRef.current?.pause();
                }
            } else {
                backgroundMusicRef.current?.play();
            }
        }
    }, [isGameStarted, isPaused]);

    useEffect((): (() => void) => {
        if (!canvasRef.current) return () => {};

        // Store canvas reference for cleanup
        const canvas = canvasRef.current;
        let renderObserver: Observer<Scene> | null = null;

        // Initialize keyboard state
        const keyDownMap: KeyboardState = {};

        // Initialize event handlers
        const handleKeyDown = (e: KeyboardEvent): void => {
            keyDownMapRef.current[e.key] = true;
        };
        
        const handleKeyUp = (e: KeyboardEvent): void => {
            keyDownMapRef.current[e.key] = false;
        };

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

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Add dragstart prevention
        const preventDrag = (e: DragEvent) => {
            e.preventDefault();
        };
        canvas.addEventListener('dragstart', preventDrag);

        // Get the current scene
        const scene = sceneRef.current;
        if (!scene) return () => {};

        // Load catch sound
        catchSoundRef.current = new Sound("catchSound", `${process.env.PUBLIC_URL}/assets/meow.mp3`, scene, null, {
            loop: false,
            autoplay: false,
            volume: 0.15
        });

        // Load background music with onReady callback
        backgroundMusicRef.current = new Sound(
            "backgroundMusic",
            `${process.env.PUBLIC_URL}/assets/nam-nam-nam.mp3`,
            scene,
            () => {
                if (isGameStarted && !isPaused && backgroundMusicRef.current) {
                    backgroundMusicRef.current.play();
                }
            },
            {
                loop: true,
                autoplay: false,
                volume: 0.3
            }
        );

        return () => {
            // Remove event listeners first
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', onResize);
            
            if (canvas) {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
                canvas.removeEventListener('mousedown', handleMouseDown);
            }
            
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            // Remove sprites
            if (catSpriteRef.current) {
                catSpriteRef.current.dispose();
                catSpriteRef.current = null;
            }
            if (sardineSpriteRef.current) {
                sardineSpriteRef.current.dispose();
                sardineSpriteRef.current = null;
            }
            if (dogSpriteRef.current) {
                dogSpriteRef.current.dispose();
                dogSpriteRef.current = null;
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
        };
    }, [canvasRef.current]);

    const onResize = (): void => {
        if (engineRef.current) {
            engineRef.current.resize();
        }
    };

    const createSardine = (position?: Vector3): void => {
        if (!sardineSpriteManagerRef.current || !sceneRef.current) return;
        
        // Store the sprite manager in a local variable to satisfy TypeScript
        const sardineSpriteManager = sardineSpriteManagerRef.current;
        
        // Clean up existing sardine if it exists
        if (sardineSpriteRef.current) {
            sardineSpriteRef.current.dispose();
            sardineSpriteRef.current = null;
        }
        
        // Create new sardine
        const sardine = new Sprite('sardine', sardineSpriteManager);
        sardine.width = 2.5;
        sardine.height = 1.5;
        sardine.invertU = true;
        
        if (position) {
            // Use provided position
            sardine.position.copyFrom(position);
        } else {
            // Random position for subsequent sardines
            sardine.position.x = Math.random() * 14 - 7;
            sardine.position.y = Math.random() * 6 - 3;
            sardine.position.z = 0;
        }
        
        // Reset sardine velocity
        sardineVelocityRef.current.x = 0;
        sardineVelocityRef.current.y = 0;
        
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