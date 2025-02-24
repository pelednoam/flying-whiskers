import React, { FC, useState, useCallback, useRef, useEffect, ReactElement } from 'react';
import GameScene from './GameScene';
import './Game.css';

const Game: FC = (): ReactElement => {
    const [score, setScore] = useState<number>(0);
    const [key, setKey] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const joystickBaseRef = useRef<HTMLDivElement>(null);
    
    const handleScoreUpdate = useCallback((): void => {
        setScore((prev: number): number => prev + 1);
    }, []);

    const handleRestart = useCallback((): void => {
        setScore(0);
        setKey(prev => prev + 1);
        setIsPaused(false);
    }, []);

    const handlePause = useCallback((): void => {
        setIsPaused(prev => !prev);
    }, []);

    const handleStartGame = useCallback((): void => {
        setIsGameStarted(true);
    }, []);

    // Update joystick position based on touch input
    useEffect(() => {
        const updateJoystickPosition = (touchX: number, touchY: number) => {
            if (!joystickBaseRef.current) return;
            const rect = joystickBaseRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance from center
            const dx = touchX - centerX;
            const dy = touchY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = rect.width / 2 - 25;
            
            // Normalize to max distance
            const normalizedDistance = Math.min(distance, maxDistance);
            const angle = Math.atan2(dy, dx);
            
            // Calculate final position
            const x = Math.cos(angle) * normalizedDistance;
            const y = Math.sin(angle) * normalizedDistance;
            
            setJoystickPosition({ x, y });
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleTouchEnd = () => {
            setJoystickPosition({ x: 0, y: 0 });
        };

        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Cloud Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, #87CEEB, #4682B4)',
                zIndex: 0
            }}>
                <div className="cloud cloud1"></div>
                <div className="cloud cloud2"></div>
                <div className="cloud cloud3"></div>
                <div className="cloud cloud4"></div>
            </div>

            {/* Game Canvas */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                <GameScene 
                    antialias={true} 
                    onScoreUpdate={handleScoreUpdate} 
                    isPaused={isPaused} 
                    isGameStarted={isGameStarted}
                    score={score}
                />
            </div>

            {/* Start Button Overlay */}
            {!isGameStarted && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, 120px)', // Move button below center
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 3
                }}>
                    <div style={{
                        fontSize: '28px',
                        color: '#333',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
                        marginBottom: '20px'
                    }}>
                        Flying Whiskers
                    </div>
                    <button
                        onClick={handleStartGame}
                        style={{
                            padding: '15px 40px',
                            fontSize: '24px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.backgroundColor = '#45a049';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = '#4CAF50';
                        }}
                    >
                        Start Game
                    </button>
                    <div style={{
                        fontSize: '16px',
                        color: '#333',
                        marginTop: '15px',
                        textAlign: 'center',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                    }}>
                        Use arrow keys or click and drag to move
                    </div>
                </div>
            )}

            {/* UI Overlay */}
            {isGameStarted && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    pointerEvents: 'none'
                }}>
                    {/* Score Display */}
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        color: 'black',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        Score: {score}
                    </div>

                    {/* Game Controls */}
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        pointerEvents: 'auto'
                    }}>
                        <button 
                            onClick={handleRestart}
                            style={{
                                padding: '8px 16px',
                                fontSize: '18px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            Restart
                        </button>
                        <button 
                            onClick={handlePause}
                            style={{
                                padding: '8px 16px',
                                fontSize: '18px',
                                backgroundColor: isPaused ? '#f44336' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                    </div>

                    {/* Virtual Joystick */}
                    <div className="joystick-base" ref={joystickBaseRef}>
                        <div 
                            className="joystick-stick"
                            style={{
                                transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game; 