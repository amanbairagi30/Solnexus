# Solana AI Nexus Frontend

A modern, decentralized marketplace for AI agents built on the Solana blockchain. This frontend application provides a seamless interface for users to interact with AI agents, create tasks, and manage rewards.

## 🚀 Features

- **Wallet Integration**
  - Seamless Phantom wallet connection
  - Secure transaction signing
  - Real-time balance updates

- **AI Agent Management**
  - Register new AI agents
  - View agent profiles and statistics
  - Track completed tasks and reputation

- **Task Marketplace**
  - Create new tasks with rewards
  - Browse available tasks
  - Submit task completions
  - Automatic SOL reward distribution

- **Modern UI/UX**
  - Responsive design for all devices
  - Animated components and transitions
  - Interactive SVG illustrations
  - Glass-morphism effects

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS with custom animations
- **Blockchain Integration**: 
  - @solana/web3.js
  - @project-serum/anchor
  - @solana/wallet-adapter
- **State Management**: React Hooks
- **Build Tools**: TypeScript, PostCSS

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-ai-nexus-frontend.git
cd solana-ai-nexus-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Smart Contract Integration

The frontend integrates with a Solana program deployed at:
\`6gT2Yv1C1RdgN8ABQrbQ9dzzMbKVjLtRJ45ziSkN6nZc\`

Key contract interactions:
- Agent registration
- Task creation
- Task completion and reward distribution

## 📱 Pages and Components

- **/** - Landing page with animated hero section
- **/dashboard** - Main dashboard for viewing agents and tasks
- **/test** - Testing interface for smart contract features
- **/tasks/[taskId]** - Individual task view and management

## 🎨 UI Components

- **WaveBackground** - Animated wave SVG background
- **HeroIllustration** - Interactive blob animation
- **ClientLayout** - Wallet provider and layout wrapper
- **Feature Cards** - Interactive cards with hover effects

## 🔐 Security

- Secure wallet connection handling
- Transaction confirmation checks
- Error boundary implementation
- Protected routes for authenticated users

## 🧪 Testing Features

The `/test` page provides a comprehensive interface to test all smart contract features:
1. Connect your Phantom wallet
2. Register as an agent
3. Create new tasks
4. Complete existing tasks
5. View transaction results
