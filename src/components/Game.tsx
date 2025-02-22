import React, { FC, useState, useCallback, ReactElement } from 'react';
import GameScene from './GameScene';
import './Game.css';

const Game: FC = (): ReactElement => {
    const [score, setScore] = useState<number>(0);
    const [key, setKey] = useState<number>(0); // Key to force GameScene remount
    
    const handleScoreUpdate = useCallback((): void => {
        setScore((prev: number): number => prev + 1);
    }, []);

    const handleRestart = useCallback((): void => {
        setScore(0);
        setKey(prev => prev + 1); // Force GameScene to remount
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
                <GameScene key={key} antialias={true} onScoreUpdate={handleScoreUpdate} />
            </div>

            {/* UI Overlay */}
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

                {/* Restart Button */}
                <button 
                    onClick={handleRestart}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        padding: '8px 16px',
                        fontSize: '18px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        pointerEvents: 'auto'
                    }}
                >
                    Restart
                </button>
            </div>
        </div>
    );
};

export default Game; 