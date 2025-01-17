# Akiba AMV Generator

An advanced AI-powered multimedia platform for generating personalized Anime Music Videos (AMVs) and custom Akiba-style images using cutting-edge AI technologies.

## 🌟 Features

- 🎮 Interactive AI DJ character (Akiba) powered by Google's Gemini AI
- 🎵 AI-powered AMV generation using FAL.ai
- 🎨 Custom Akiba image generation with LoRA models
- 💬 Emotion analysis and dynamic responses
- 🎼 Multiple music style selections
- 🖼️ Retro Japanese video game aesthetics
- 🌐 Real-time video processing
- 🎮 Retro Japanese video game animations and effects (from original)
- 🖼️ Pixel art design system (from original)


## 🛠️ Tech Stack

- **Frontend**: React.js + TypeScript, Shadcn UI, Framer Motion
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: 
  - Google Gemini AI for chat
  - FAL.ai for video/image generation
  - Custom Flux LoRA model
  - Emotion analysis system

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:  Create a `.env` file (as described below)
```env
DATABASE_URL=your_postgresql_url
FAL_KEY=your_fal_ai_key
GOOGLE_API_KEY=your_google_api_key
```
4. Set up the database:
```bash
npm run db:push
```
5. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
├── client/           # React frontend
├── server/           # Express backend
├── db/               # Database schemas
└── public/           # Static assets
```

## 🔑 Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `FAL_KEY`: FAL.ai API key
- `GOOGLE_API_KEY`: Google Gemini AI API key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## Project Structure (More Details - from original)

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

## Features in Detail (from original, selectively included)

### AMV Generation
Upload or provide descriptions to generate custom anime music videos with various style presets.

### Image Generation
Create custom Akiba-style images using our fine-tuned LoRA model.

### Chat Interface
Interact with Akiba, our AI DJ character powered by Google's Gemini AI.