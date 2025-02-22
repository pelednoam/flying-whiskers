# Flying Whiskers

<table style="border: none;">
<tr style="border: none;">
<td width="70%" style="border: none;">

A charming browser game where you control a magical flying cat chasing sardines in the sky! Built with React and Babylon.js.

Play now: [Flying Whiskers Game](https://pelednoam.github.io/flying-whiskers)

</td>
<td width="30%" align="right" style="border: none;">
    <img src="./public/assets/flying-cat-transparent.png" width="200" alt="Flying Cat">
</td>
</tr>
</table>

## Game Features

- Control a flying cat with magical purple wings
- Chase and catch sardines that try to escape from you
- Beautiful sky background with drifting clouds
- Score tracking system
- Multiple control options (keyboard, mouse, touch)
- Playful background music and meow sound effects
- Responsive design that works on all devices
- Smart sardine AI that tries to escape when the cat gets close

## How to Play

### Multiple Control Options:

1. **Keyboard Controls**
   - Use **Arrow Keys** or **WASD** to control the cat's movement
   - Precise digital control for desktop users

2. **Mouse/Trackpad Controls**
   - Click and drag anywhere on the screen
   - The cat follows your mouse/trackpad movement
   - Release to stop moving
   - Optimized for laptop trackpads

3. **Touch Controls**
   - Touch and drag on mobile devices
   - Virtual joystick appears for easy control
   - Optimized for mobile gaming

### Gameplay:
- Guide the cat to catch sardines
- Sardines will actively try to swim away when you get close
- Each catch increases your score and plays a meow sound
- Relaxing background music accompanies your sardine chase
- Click the Restart button in the top right to start a new game

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/pelednoam/flying-whiskers.git
cd flying-whiskers
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to play the game in your browser

## Technologies Used

- React with TypeScript for type safety
- Babylon.js for game rendering and physics
- CSS for cloud animations and UI
- Web Audio API for sound management
- Responsive design for all devices
- GitHub Pages for deployment

## Development

The game is built using React and TypeScript, with Babylon.js handling the game rendering. Key components include:

- `Game.tsx`: Main game container and UI
- `GameScene.tsx`: Babylon.js scene setup and game logic
- Custom cloud animations using CSS
- Sprite management for the cat and sardines
- Touch, mouse, and keyboard input handling
- Sound management system
- Responsive UI elements

## Building for Production

To create a production build:

```bash
npm run build
```

To deploy to GitHub Pages:

```bash
npm run deploy
```

## Credits

- Game concept and development: Noam Peled
- Cat and sardine artwork
- Sound effects and background music

## License

MIT License
