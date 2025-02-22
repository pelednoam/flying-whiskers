# Flying Whiskers

A charming browser game where you control a magical flying cat chasing sardines in the sky! Built with React and Babylon.js.

![Flying Cat](./public/assets/flying-cat-transparent.png)

## Game Features

- Control a flying cat with magical purple wings
- Chase and catch sardines that try to escape from you
- Beautiful sky background with drifting clouds
- Score tracking system
- Responsive controls using arrow keys or WASD
- Meow sound effects when catching sardines

## How to Play

- Use **Arrow Keys** or **WASD** to control the cat's movement
- Chase the sardines across the screen
- The sardines will try to escape when you get close
- Catch as many sardines as you can to increase your score
- Click the Restart button to start a new game

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flying-whiskers.git
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

- React
- TypeScript
- Babylon.js for game rendering
- CSS for cloud animations and UI

## Development

The game is built using React and TypeScript, with Babylon.js handling the game rendering. Key components include:

- `Game.tsx`: Main game container and UI
- `GameScene.tsx`: Babylon.js scene setup and game logic
- Custom cloud animations using CSS
- Sprite management for the cat and sardines

## Building for Production

To create a production build:

```bash
npm run build
```

This will create an optimized build in the `build` folder, ready for deployment.

## Credits

- Game concept and development: [Your Name]
- Cat and sardine artwork
- Sound effects

## License

[Your chosen license]
