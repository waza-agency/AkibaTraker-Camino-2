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

## 🛠️ Tech Stack

- **Frontend**: React.js + TypeScript, Shadcn UI, Framer Motion
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: 
  - Google Gemini AI for chat
  - FAL.ai for video/image generation
  - Custom Flux LoRA model
  - Emotion analysis system

## 🚀 Local Development Setup

1. Prerequisites:
   - Node.js (v20 or later)
   - PostgreSQL (v15 or later)
   - npm or yarn

2. Clone the repository:
```bash
git clone <your-repository-url>
cd akiba-amv-generator
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
GOOGLE_API_KEY=your_google_api_key
FAL_KEY=your_fal_ai_key
PINATA_JWT=your_pinata_jwt_token  # Required for IPFS storage
```

5. Set up the database:
```bash
npm run db:push
```

6. Start the development server:
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── lib/         # Utility functions and API clients
│   │   ├── pages/       # Page components
│   │   └── styles/      # CSS and styling
├── server/           # Express backend
│   ├── routes/      # API routes
│   └── index.ts     # Server entry point
├── db/              # Database schemas and migrations
└── public/          # Static assets
```

## 🔨 Build for Production

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.