# 🎮 Board Game Platform - Admin Panel Documentation

## 📋 Overview

Board Game Platform เป็นเว็บแอปพลิเคชันสำหรับเล่นเกมกระดานออนไลน์แบบ real-time โดยปัจจุบันรองรับเกม **ITO** (เกมเรียงลำดับตัวเลขโดยการสื่อสาร)

**ความสามารถหลัก:**
- สร้างและจัดการห้องเกมแบบ real-time
- รองรับผู้เล่นหลายคนพร้อมกัน
- ระบบโหวตและเปิดเผยคำตอบ
- ติดตามสถานะเกมและคะแนน
- Admin Panel สำหรับจัดการคำถามและเกม

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.5 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x (Strict Mode)
- **Styling**: Tailwind CSS 3.4
- **Animation**: Motion (Framer Motion)
- **Icons**: React Icons

### Backend & Database
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Real-time**: Firebase Real-time Listeners
- **Hosting**: Vercel (or similar)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Dev Server**: Next.js with Turbopack

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Firebase project (for database)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd board-game
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# Get credentials from: https://console.firebase.google.com/
```

4. **Configure .env.local**
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Application URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

5. **Run development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack (Fast Refresh) |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code quality checks |

---

## 📁 Project Structure

```
board-game/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── admin/                  # 🔐 Admin Panel pages
│   │   │   ├── page.tsx            # Admin dashboard
│   │   │   ├── login/              # Admin login
│   │   │   ├── games/              # Game management
│   │   │   └── ito/
│   │   │       └── questions/      # ITO question management
│   │   ├── api/                    # API routes
│   │   │   ├── rooms/              # Room management APIs
│   │   │   └── games/              # Game logic APIs
│   │   ├── create-room/            # Room creation page
│   │   ├── join-room/              # Room joining page
│   │   ├── lobby/[roomId]/         # Game lobby
│   │   └── game/[roomId]/          # Game play page
│   │
│   ├── components/                 # React components
│   │   ├── games/                  # Game components
│   │   │   ├── ItoGame.tsx         # Main ITO game component
│   │   │   └── ito/                # ITO sub-components
│   │   │       ├── ItoGameHeader.tsx
│   │   │       ├── ItoWritingPhase.tsx
│   │   │       ├── ItoRevealedNumbers.tsx
│   │   │       └── ...
│   │   └── reactbits/              # Reusable UI components
│   │
│   ├── lib/                        # Core libraries & utilities
│   │   ├── firebase/               # Firebase integration
│   │   │   ├── config.ts           # Firebase initialization
│   │   │   ├── firestore.ts        # Firestore helpers
│   │   │   └── ito.ts              # ITO game Firebase functions
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useItoGame.ts       # ITO game state hook
│   │   │   ├── useVotes.ts         # Real-time votes hook
│   │   │   ├── useVoteManagement.ts # Vote logic hook
│   │   │   └── useReadyStatus.ts   # Player ready status
│   │   └── utils/                  # Utility functions
│   │       ├── voteUtils.ts        # Vote-related utilities
│   │       ├── heartsUtils.ts      # Hearts display utilities
│   │       ├── logger.ts           # Centralized logger
│   │       └── ...
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── ito.ts                  # ITO game types
│   │   ├── room.ts                 # Room types
│   │   ├── game.ts                 # Game types
│   │   └── player.ts               # Player types
│   │
│   └── constants/                  # Constants & configuration
│       └── ito.ts                  # ITO game constants
│
├── public/                         # Static assets
├── .env.example                    # Environment variables template
├── .env.local                      # Local environment (gitignored)
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── CHANGES.md                      # Refactoring changelog
└── README.md                       # This file
```

---

## 🔐 Admin Panel

### Accessing Admin Panel

**URL**: `http://localhost:3000/admin`

**Authentication**:
- Currently requires Firebase Authentication
- Login page: `/admin/login`

### Admin Features

#### 1. **Dashboard** (`/admin`)
- Overview of all games
- System statistics
- Quick actions

#### 2. **Game Management** (`/admin/games`)
- View all game sessions
- Monitor active games
- Game statistics

#### 3. **ITO Question Management** (`/admin/ito/questions`)
- 📝 **Add New Questions**: Create questions for ITO game
- ✏️ **Edit Existing Questions**: Modify question text
- 🗑️ **Delete Questions**: Remove unused questions
- 🔍 **Search & Filter**: Find questions quickly

**Question Structure**:
```typescript
interface ItoQuestion {
  id: string;
  questionsTH: string;  // Thai question text
  // Future: questionsEN, category, difficulty
}
```

---

## 🎮 How to Play ITO Game

### Game Flow

1. **Create Room** → Host creates a game room
2. **Join Room** → Players join using room code
3. **Game Start** → Host starts the game
4. **Writing Phase** → Each player receives secret numbers and writes hints
5. **Voting Phase** → Players vote for the smallest number
6. **Reveal Phase** → Show results and deduct hearts if wrong
7. **Next Level** → Repeat with more numbers per player
8. **Game End** → Win if all numbers revealed with hearts remaining

### Game Rules

- **Objective**: Reveal all numbers in order (smallest to largest)
- **Hearts**: Start with 3 ❤️, lose 1 for each wrong vote
- **Levels**:
  - Level 1: Each player gets 1 number
  - Level 2: Each player gets 2 numbers
  - Level 3: Each player gets 3 numbers
- **Win Condition**: Complete all levels with hearts > 0
- **Lose Condition**: Hearts reach 0

---

## ⚙️ Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `myapp.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `myapp-12345` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `myapp.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |
| `APP_URL` | Server-side base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Client-side base URL | `http://localhost:3000` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Firestore Database
4. Enable Authentication (if using admin features)
5. Get configuration from Project Settings
6. Add to `.env.local`

### Firestore Collections Structure

```
firestore/
├── rooms/                          # Game rooms
│   └── [roomId]/
│       ├── id, code, hostId, status, ...
│       └── players/                # Sub-collection
│           └── [playerId]
│
├── game_sessions/                  # Active game sessions
│   └── [sessionId]/
│       ├── id, gameId, roomId, phase, hearts, ...
│       ├── player_answers/         # Sub-collection
│       │   └── [docId]            # One doc per number
│       ├── votes/                  # Sub-collection
│       │   └── [playerId]
│       └── ready_status/           # Sub-collection
│           └── [playerId]
│
└── ito_questions/                  # Question bank
    └── [questionId]
        └── id, questionsTH, ...
```

---

## 👨‍💻 Developer Notes

### Recent Refactoring (Phase 1 Complete ✅)

This codebase has been refactored to follow professional best practices. See [CHANGES.md](./CHANGES.md) for detailed changes.

**Key Improvements:**
- ✅ Centralized constants
- ✅ Utility functions for business logic
- ✅ Custom hooks for state management
- ✅ Better TypeScript typing
- ✅ Centralized logging
- ✅ Vote persistence bug fixed

### Code Quality Standards

#### 1. **TypeScript**
- **Strict mode enabled**
- Always define types/interfaces
- Avoid `any` type
- Use type inference where appropriate

#### 2. **Component Structure**
```typescript
// Recommended pattern
export default function MyComponent({ prop1, prop2 }: Props) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Derived values
  const computed = useMemo(() => {}, []);

  // 3. Event handlers
  const handleClick = useCallback(() => {}, []);

  // 4. Effects
  useEffect(() => {}, []);

  // 5. Render
  return <div>...</div>;
}
```

#### 3. **File Organization**
- One component per file
- Colocate related files (component + styles + tests)
- Use index files for clean imports
- Separate business logic into hooks/utils

#### 4. **Naming Conventions**
- **Components**: PascalCase (`ItoGame.tsx`)
- **Hooks**: camelCase with `use` prefix (`useVoteManagement.ts`)
- **Utils**: camelCase (`voteUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`ITO_GAME_CONFIG`)
- **Types/Interfaces**: PascalCase (`ItoGameState`)

#### 5. **Import Order**
```typescript
// 1. External libraries
import React from 'react';
import { someLib } from 'some-lib';

// 2. Internal absolute imports
import { Component } from '@/components';
import { useHook } from '@/lib/hooks';

// 3. Relative imports
import { helper } from './utils';

// 4. Types
import type { MyType } from '@/types';

// 5. Styles
import styles from './styles.module.css';
```

### Adding New Features

#### Example: Adding a New Game

1. **Create types** (`src/types/newgame.ts`)
```typescript
export interface NewGameState {
  // Define your game state
}
```

2. **Create constants** (`src/constants/newgame.ts`)
```typescript
export const NEW_GAME_CONFIG = {
  // Game configuration
} as const;
```

3. **Create Firebase functions** (`src/lib/firebase/newgame.ts`)
```typescript
export async function initializeNewGame() {
  // Firebase logic
}
```

4. **Create custom hooks** (`src/lib/hooks/useNewGame.ts`)
```typescript
export function useNewGame() {
  // Real-time listeners
}
```

5. **Create components** (`src/components/games/NewGame.tsx`)
```typescript
export default function NewGame() {
  // Component logic
}
```

6. **Add API routes** (`src/app/api/games/newgame/route.ts`)
```typescript
export async function POST(request: Request) {
  // API logic
}
```

### Useful Utilities

#### Logger
```typescript
import { gameLogger } from '@/lib/utils/logger';

gameLogger.info('Game started', { gameId });
gameLogger.error('Failed to start', error);
gameLogger.success('Game completed', { score });
```

#### Vote Utils
```typescript
import { parseAnswerId, getVoterNames } from '@/lib/utils/voteUtils';

const { playerId, answerIndex } = parseAnswerId('player1_0');
const voters = getVoterNames(votes, answers, 'player1', 0);
```

#### Hearts Utils
```typescript
import { calculateCurrentHearts } from '@/lib/utils/heartsUtils';

const hearts = calculateCurrentHearts(gameState, lastRevealResult);
```

---

## 🚢 Deployment

### Development
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- Hot reload enabled
- Turbopack for fast refresh

### Production Build
```bash
npm run build
npm run start
```

### Deployment Checklist

#### Pre-Deployment
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run build` successfully
- [ ] Test all features in production mode
- [ ] Update environment variables for production
- [ ] Review Firebase security rules
- [ ] Check Firebase usage limits

#### Environment Variables (Production)
- [ ] Set all `NEXT_PUBLIC_FIREBASE_*` variables
- [ ] Set `APP_URL` to production domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `NODE_ENV=production`

#### Firebase Configuration
- [ ] Update Firestore security rules
- [ ] Set up Firebase indexes
- [ ] Configure backup schedule
- [ ] Set up monitoring/alerts

#### Vercel Deployment (Recommended)
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Deploy

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Firebase not initialized"
**Solution**: Check `.env.local` has all required Firebase variables

#### Issue: "Vote lost after refresh"
**Solution**: This has been fixed in latest version. Update to latest code.

#### Issue: "Hearts display incorrect"
**Solution**: Fixed in latest version. Clear browser cache and refresh.

#### Issue: "Port 3000 already in use"
**Solution**:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

#### Issue: "Firestore permission denied"
**Solution**: Update Firestore security rules to allow read/write for authenticated users

#### Issue: "Build fails with TypeScript errors"
**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors then rebuild
npm run build
```

---

## 📖 FAQ

### Q: Can I add more games besides ITO?
**A**: Yes! Follow the pattern in the "Adding New Features" section. The platform is designed to support multiple games.

### Q: How do I change game configuration (hearts, timer, etc.)?
**A**: Edit constants in `src/constants/ito.ts`

### Q: Can players rejoin if they disconnect?
**A**: Yes, using the same playerId and roomCode

### Q: How do I backup Firestore data?
**A**: Use Firebase Console > Firestore > Import/Export feature

### Q: Is there a player limit per room?
**A**: Technically no hard limit, but recommended 3-10 players for best experience

### Q: Can I use this without Firebase?
**A**: No, the app is tightly coupled with Firebase. Refactoring for other databases would require significant changes.

---

## 📝 License

[Add your license here]

---

## 🤝 Contributing

Contributions are welcome! Please follow the coding standards outlined in this README.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [CHANGES.md](./CHANGES.md) for recent updates
- Open an issue on GitHub

---

**Last Updated**: 2025-10-21
**Version**: 0.1.0
**Status**: Active Development 🚀
