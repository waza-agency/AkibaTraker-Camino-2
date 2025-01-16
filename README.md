# Akiba AMV Generator

An advanced AI-powered multimedia platform for generating personalized Anime Music Videos (AMVs) and custom Akiba-style images using cutting-edge AI technologies. The application combines retro gaming aesthetics with state-of-the-art image generation capabilities.

## Features

- 🎮 Retro Japanese video game animations and effects
- 🎵 AI-powered AMV generation using FAL.ai
- 🎨 Custom Akiba image generation with LoRA models
- 💬 Interactive chat with Akiba powered by Google's Gemini AI
- 🎼 Multiple music style selections
- 🖼️ Pixel art design system
- 🌐 Real-time video processing

## Tech Stack

- React.js + TypeScript frontend
- Express.js backend
- PostgreSQL database with Drizzle ORM
- Google Gemini AI for chat
- FAL.ai for video and image generation
- Custom Flux LoRA model for image generation
- Shadcn UI components
- Framer Motion for animations

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- FAL.ai API key
- Google API key (for Gemini AI)

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=your_postgresql_url
FAL_KEY=your_fal_ai_key
GOOGLE_API_KEY=your_google_api_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── lib/         # Utility functions and API clients
│   │   ├── pages/       # Page components
│   │   └── styles/      # CSS and styling
├── server/           # Backend Express application
│   ├── routes.ts    # API routes
│   └── index.ts     # Server entry point
├── db/              # Database schemas and migrations
└── public/          # Static assets
```

## Features in Detail

### AMV Generation
Upload or provide descriptions to generate custom anime music videos with various style presets.

### Image Generation
Create custom Akiba-style images using our fine-tuned LoRA model.

### Chat Interface
Interact with Akiba, our AI DJ character powered by Google's Gemini AI.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
