# Flying Whiskers Development Guide

This guide provides a detailed walkthrough of how the Flying Whiskers game was created, from initial setup to deployment. It's intended for developers who want to understand the development process or create similar games.

## Table of Contents
- [Project Setup](#project-setup)
- [Game Architecture](#game-architecture)
- [Implementation Details](#implementation-details)
- [Asset Management](#asset-management)
- [Game Logic](#game-logic)
- [UI/UX Design](#uiux-design)
- [Controls Implementation](#controls-implementation)
- [PWA Setup](#pwa-setup)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

## Project Setup

### 1. Initial Project Creation
```bash
# Create a new React project with TypeScript
npx create-react-app flying-whiskers --template typescript

# Navigate to project directory
cd flying-whiskers

# Install necessary dependencies
npm install @babylonjs/core @babylonjs/gui
npm install --save-dev gh-pages
```

### 2. Project Structure
```
flying-whiskers/
├── public/
│   ├── assets/
│   │   ├── flying-cat-transparent.png
│   │   ├── sardine.png
│   │   ├── meow.mp3
│   │   └── nam-nam-nam.mp3
│   ├── manifest.json
│   ├── service-worker.js
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Game.tsx
│   │   ├── GameScene.tsx
│   │   └── Game.css
│   ├── App.tsx
│   ├── index.tsx
│   └── App.css
└── package.json
```

## Game Architecture

### 1. Component Structure
- `App.tsx`: Root component
- `Game.tsx`: Main game container and UI
- `GameScene.tsx`: Babylon.js scene and game logic

### 2. State Management
```typescript
// Game.tsx state
const [score, setScore] = useState<number>(0);
const [isPaused, setIsPaused] = useState<boolean>(false);
const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });

// GameScene.tsx refs
const catSpriteRef = useRef<Sprite | null>(null);
const sardineSpriteRef = useRef<Sprite | null>(null);
const catVelocityRef = useRef<Vector2>(new Vector2(0, 0));
```

## Implementation Details

### 1. Babylon.js Scene Setup
```typescript
// GameScene.tsx
const scene = new Scene(engineRef.current);
scene.clearColor = new Color4(0, 0, 0, 0);

const camera = new FreeCamera('camera', new Vector3(0, 0, -15), scene);
camera.setTarget(Vector3.Zero());
```

### 2. Sprite Management
```typescript
// Create sprite managers
catSpriteManagerRef.current = new SpriteManager(
    'catManager',
    `${process.env.PUBLIC_URL}/assets/flying-cat-transparent.png`,
    1,
    {
        width: 1024,
        height: 1024,
        premultipliedAlpha: true
    },
    scene
);

// Create cat sprite
catSpriteRef.current = new Sprite('cat', catSpriteManagerRef.current);
catSpriteRef.current.width = 3;
catSpriteRef.current.height = 3;
```

## Asset Management

### 1. Image Assets
- Cat sprite: 1024x1024 PNG with transparency
- Sardine sprite: 1024x1024 PNG with transparency
- Assets are stored in the public folder for easy access

### 2. Sound Assets
```typescript
// Load sound effects
catchSoundRef.current = new Sound(
    "catchSound",
    `${process.env.PUBLIC_URL}/assets/meow.mp3`,
    scene,
    null,
    {
        loop: false,
        autoplay: false,
        volume: 0.15
    }
);

// Background music
backgroundMusicRef.current = new Sound(
    "backgroundMusic",
    `${process.env.PUBLIC_URL}/assets/nam-nam-nam.mp3`,
    scene,
    null,
    {
        loop: true,
        autoplay: true,
        volume: 0.3
    }
);
```

## Game Logic

### 1. Movement System
```typescript
// Constants
const ACCELERATION: number = 0.01;
const MAX_SPEED: number = 0.2;
const DRAG: number = 0.98;
const BOUNDS: number = 8;

// Update velocity
catVelocityRef.current.x *= DRAG;
catVelocityRef.current.y *= DRAG;

// Limit speed
const currentSpeed: number = Math.sqrt(
    catVelocityRef.current.x * catVelocityRef.current.x + 
    catVelocityRef.current.y * catVelocityRef.current.y
);

if (currentSpeed > MAX_SPEED) {
    const scale: number = MAX_SPEED / currentSpeed;
    catVelocityRef.current.x *= scale;
    catVelocityRef.current.y *= scale;
}
```

### 2. Collision Detection
```typescript
const COLLISION_DISTANCE: number = 1.5;
const distance: number = Math.sqrt(dx * dx + dy * dy);

if (distance < COLLISION_DISTANCE) {
    // Handle collision
    sardineSpriteRef.current.dispose();
    createSardine();
    onScoreUpdate?.();
    catchSoundRef.current?.play();
}
```

### 3. Sardine AI
```typescript
const SARDINE_ESCAPE_SPEED: number = 0.06;
const SARDINE_AWARENESS_DISTANCE: number = 4;

if (distance < SARDINE_AWARENESS_DISTANCE) {
    // Move away from cat
    const angle = Math.atan2(dy, dx);
    sardineVelocityRef.current.x = -Math.cos(angle) * SARDINE_ESCAPE_SPEED;
    sardineVelocityRef.current.y = -Math.sin(angle) * SARDINE_ESCAPE_SPEED;
}
```

## UI/UX Design

### 1. Cloud Background
```css
.cloud {
    position: absolute;
    background: white;
    border-radius: 50%;
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.1);
}

.cloud::before,
.cloud::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 50%;
}
```

### 2. Game Controls
```typescript
// Game.tsx
<button 
    onClick={handleRestart}
    style={{
        padding: '8px 16px',
        fontSize: '18px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }}
>
    Restart
</button>
```

## Controls Implementation

### 1. Keyboard Controls
```typescript
const handleKeyDown = (e: KeyboardEvent): void => {
    keyDownMap[e.key] = true;
};

const handleKeyUp = (e: KeyboardEvent): void => {
    keyDownMap[e.key] = false;
};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
```

### 2. Touch Controls
```typescript
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
```

### 3. Mouse Controls
```typescript
const handleMouseMove = (e: MouseEvent): void => {
    if (!mouseStateRef.current.active) return;
    
    mouseStateRef.current.currentX = e.clientX;
    mouseStateRef.current.currentY = e.clientY;
    
    const dx = mouseStateRef.current.currentX - mouseStateRef.current.startX;
    const dy = mouseStateRef.current.currentY - mouseStateRef.current.startY;
    
    mouseStateRef.current.startX = mouseStateRef.current.currentX;
    mouseStateRef.current.startY = mouseStateRef.current.currentY;
    
    catVelocityRef.current.x += dx * MOUSE_SENSITIVITY;
    catVelocityRef.current.y -= dy * MOUSE_SENSITIVITY;
};
```

## PWA Setup

### 1. Service Worker
```javascript
// public/service-worker.js
const CACHE_NAME = 'flying-whiskers-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/flying-cat-transparent.png',
    '/assets/sardine.png',
    '/assets/meow.mp3',
    '/assets/nam-nam-nam.mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});
```

### 2. Manifest Configuration
```json
{
    "short_name": "Flying Whiskers",
    "name": "Flying Whiskers - A cat and sardine chase game",
    "icons": [
        {
            "src": "assets/flying-cat-transparent.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "start_url": ".",
    "display": "standalone",
    "theme_color": "#87CEEB",
    "background_color": "#87CEEB",
    "orientation": "landscape"
}
```

## Deployment Process

### 1. GitHub Pages Setup
```json
// package.json
{
    "homepage": "https://pelednoam.github.io/flying-whiskers",
    "scripts": {
        "predeploy": "npm run build",
        "deploy": "gh-pages -d build"
    }
}
```

### 2. Deployment Steps
```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Build and deploy
npm run build
npm run deploy
```

### 3. Environment Configuration
- Set up GitHub repository
- Enable GitHub Pages in repository settings
- Configure custom domain (optional)

## Troubleshooting

### Common Issues and Solutions

1. **Asset Loading Issues**
   - Ensure assets are in the correct public folder location
   - Use `process.env.PUBLIC_URL` for asset paths
   - Check browser console for 404 errors

2. **Mobile Controls**
   - Add `touch-action: none` to prevent default touch behaviors
   - Use `preventDefault()` on touch events
   - Test on various devices and browsers

3. **PWA Installation**
   - Verify HTTPS is enabled
   - Check service worker registration
   - Validate manifest.json format

4. **Performance Optimization**
   - Compress image assets
   - Adjust game loop for different devices
   - Monitor memory usage with sprite disposal

### Development Tips

1. **Testing**
   - Test on multiple browsers
   - Test on different device types
   - Verify offline functionality
   - Check PWA installation process

2. **Debugging**
   - Use browser dev tools
   - Monitor frame rate
   - Check memory usage
   - Validate asset loading

3. **Code Organization**
   - Keep components focused
   - Use TypeScript for type safety
   - Implement proper cleanup
   - Follow React best practices 