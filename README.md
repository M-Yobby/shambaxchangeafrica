# shambaXchange 🌾

> **AI-Powered Digital Ecosystem for African Farmers**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://lovable.dev/projects/187a46b2-1766-48d3-8321-826890a33d3d) • [Documentation](#documentation) • [Report Bug](https://github.com/yourusername/shambaxchange/issues) • [Request Feature](https://github.com/yourusername/shambaxchange/issues)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [Feature Implementation](#feature-implementation)
- [Edge Functions](#edge-functions)
- [Deployment](#deployment)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🌍 Overview

**shambaXchange** is a comprehensive digital platform designed to empower African farmers through AI-powered insights, real-time market intelligence, secure trading, and community engagement. The platform combines four core experiences into a unified ecosystem that helps farmers maximize productivity, profitability, and knowledge sharing.

### Mission

To bridge the digital divide in African agriculture by providing farmers with cutting-edge tools for farm management, market access, financial tracking, and peer learning—all in one accessible platform.

### Target Audience

- Small to medium-scale farmers across Africa
- Agricultural cooperatives and farmer groups
- Agribusiness entrepreneurs
- Agricultural extension workers

### Problem Statement

African farmers face multiple challenges:
- Limited access to real-time market prices leading to exploitation
- Lack of weather information causing crop losses
- Insufficient farm management tools for financial tracking
- Isolation from peer knowledge and support networks
- Complex marketplace intermediaries reducing profits

### Solution

shambaXchange provides:
- **Real-time weather integration** based on farmer location
- **AI-powered insights** for planting, harvesting, and selling decisions
- **Direct marketplace** connecting buyers and sellers without intermediaries
- **Social platform** for knowledge sharing and community building
- **Gamification** to drive engagement and daily platform usage
- **Financial tracking** for income and expense management

---

## ✨ Key Features

### 🏡 Dashboard - Farm Management Hub
- **Crop Tracking**: Monitor multiple crops with acreage, planting dates, and expected yields
- **Financial Ledger**: Record income and expenses with detailed transaction history
- **Weather Integration**: Real-time weather data (temperature, humidity, rainfall) via OpenWeather API
- **AI Insights**: Personalized recommendations for planting, harvesting, and market timing
- **Quick Actions**: Fast access to all platform features from central hub
- **Ask Shamba Chatbot**: AI-powered farming assistant for instant agricultural advice

### 📊 Market Intelligence
- **Real-time Price Data**: Current market prices by crop and region
- **AI Price Predictions**: Forecast future prices to optimize selling decisions
- **Sell Now vs Wait Calculator**: Expected value analysis for timing decisions
- **Supply & Demand Analysis**: Regional market insights and trends
- **Smart Matching**: Automatic alerts when buyer requests match your available crops
- **Portfolio Tracker**: Monitor total value of your crop inventory

### 🛒 Marketplace - Trading Platform
- **Produce Listings**: List crops for sale with photos, quantity, and pricing
- **Buyer Discovery**: Search and filter available produce by region and crop type
- **Direct Messaging**: Real-time chat between buyers and sellers
- **Order Management**: Complete transaction flow (requested → confirmed → in-transit → delivered → completed)
- **Review System**: Rate and review trading partners after completed transactions
- **Verified Sellers**: Badge system for trusted sellers with 5+ successful transactions
- **M-Pesa Integration**: Secure payment processing (planned feature)

### 👥 Social Hub - Community Platform
- **Post Creation**: Share farming experiences, tips, and success stories with media uploads
- **Engagement**: Like, comment, and share posts from the farming community
- **Trending Algorithm**: Top 5 posts automatically selected based on engagement metrics
- **User Profiles**: Build reputation through social activity and helpful contributions
- **Community Feed**: Discover content from farmers across your region and beyond
- **Success Showcases**: Highlight farming transformations and best practices

### 📚 Learning Hub
- **Educational Content**: Curated lessons on Crop Care, Climate Smart Farming, Agribusiness, Digital Skills
- **Gamified Challenges**: Weekly and monthly quests with rewards
- **Video Integration**: Short-form educational clips (15-60 seconds)
- **Progress Tracking**: Unlock advanced content as you complete lessons
- **Community Contributions**: Farmers can submit tips and best practices
- **Sponsored Content**: Relevant agricultural product information and offers

### 🎮 Gamification System
- **Points System**: Earn points for platform activities
  - Weather check: 5 points
  - Crop update: 10 points
  - Social post: 15 points
  - Marketplace sale: 50 points
- **Streak Tracking**: Daily login rewards with multipliers
- **Badges**: Bronze/Silver/Gold Farmer, Deal Maker, Community Helper, Verified Seller
- **Leaderboards**: Rankings by sales, points, social engagement, and growth rate
- **Levels**: Progress through farming expertise tiers
- **Referral Rewards**: Invite 3 friends = 1 month premium AI access

### 🤖 AI Assistant - "Ask Shamba"
- **Expert Advice**: Answer agricultural and agribusiness questions
- **Local Context**: Uses weather data, market prices, and regional information
- **Personalized Insights**: Daily digest based on your crops, location, and financial data
- **Voice & Text**: Ask questions via typing or voice input
- **Action Recommendations**: Specific daily tasks to maximize profit
- **Risk Alerts**: Warnings about weather threats, pests, or disease outbreaks

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.x with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) for server state

### Backend
- **Platform**: Lovable Cloud (powered by Supabase)
- **Database**: PostgreSQL 15 with Row Level Security (RLS)
- **Realtime**: Supabase Realtime for messaging and notifications
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage for media uploads
- **Edge Functions**: Deno-based serverless functions
- **Cron Jobs**: pg_cron for scheduled tasks

### AI & External APIs
- **AI Provider**: Lovable AI Gateway
  - `google/gemini-2.5-flash` (default, balanced performance)
  - `google/gemini-2.5-pro` (advanced reasoning)
  - `openai/gpt-5-mini` (optional)
- **Weather API**: OpenWeather API for real-time weather data
- **Payment**: M-Pesa integration (planned)

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm/bun
- **Deployment**: Lovable Cloud (automated)
- **Database Migrations**: Supabase migrations
- **Environment Variables**: Auto-configured via Lovable Cloud

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React SPA (Dashboard, Marketplace, Social, Learning)       │
│  TailwindCSS + shadcn/ui + Lucide Icons                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS/WSS
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Lovable Cloud (Supabase)                   │
├──────────────────────────────────────────────────────────────┤
│  Authentication │ Row Level Security │ Realtime Subscriptions│
├──────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                        │
│  18 Tables: profiles, crops, ledger, marketplace_listings,  │
│  orders, messages, reviews, posts, comments, likes,          │
│  user_stats, challenges, leaderboards, referrals, etc.       │
├──────────────────────────────────────────────────────────────┤
│                     Edge Functions (Deno)                     │
│  • ai-chat          • fetch-weather                          │
│  • ai-insights      • price-change-monitor (cron)            │
│  • daily-notifications (cron)                                │
│  • refresh-leaderboard (cron)                                │
├──────────────────────────────────────────────────────────────┤
│                    External Services                          │
│  Lovable AI Gateway │ OpenWeather API │ M-Pesa (planned)    │
└──────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
src/
├── pages/              # Route components (Dashboard, Marketplace, Social, etc.)
├── components/
│   ├── ui/            # shadcn/ui base components (Button, Card, Dialog, etc.)
│   └── [features]     # Feature-specific components (AIChatbot, OrderCard, etc.)
├── hooks/             # Custom React hooks (useNotifications, useCompleteReferral)
├── integrations/
│   └── supabase/      # Auto-generated Supabase client and types
├── lib/               # Utility functions (utils.ts)
├── utils/             # Helper functions (notificationHelpers.ts)
└── index.css          # Global styles and design system tokens
```

### Backend Architecture

**Database Layer:**
- PostgreSQL with 18 tables for different domains
- Row Level Security (RLS) policies enforce user data isolation
- Materialized view (`leaderboards`) for performance optimization
- Foreign key relationships maintain referential integrity

**Edge Functions Layer:**
- Serverless Deno functions for background jobs
- CORS-enabled for frontend access
- JWT verification for authenticated endpoints
- Scheduled functions via pg_cron for daily tasks

**Realtime Layer:**
- Supabase Realtime enabled on `messages` and `notifications` tables
- WebSocket connections for instant updates
- Presence tracking for online users (future feature)

### Data Flow

1. **User Authentication**: Supabase Auth manages signup, login, session handling
2. **Data Mutations**: Client → Supabase Client SDK → PostgreSQL (RLS checks) → Response
3. **Real-time Updates**: Database change → Realtime broadcast → Subscribed clients
4. **Background Jobs**: pg_cron → Edge function → Database/External API → Notifications
5. **AI Queries**: Client → Edge function → Lovable AI Gateway → Response stream

---

## 🗄 Database Schema

The platform uses **18 PostgreSQL tables** with comprehensive Row Level Security (RLS) policies:

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `profiles` | User profile data and location | `id`, `full_name`, `location`, `farm_size`, `phone`, `referral_code` |
| `crops` | Crop tracking and management | `id`, `user_id`, `crop_name`, `acreage`, `planting_date`, `expected_yield`, `status` |
| `ledger` | Financial transactions (income/expenses) | `id`, `user_id`, `type`, `item`, `amount`, `quantity`, `date`, `notes` |
| `user_stats` | Gamification data | `user_id`, `total_points`, `level`, `streak_days`, `badges`, `last_login` |

### Marketplace Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `marketplace_listings` | Products for sale | `id`, `seller_id`, `crop_name`, `quantity`, `price_per_kg`, `location`, `status`, `image_url` |
| `orders` | Transaction management | `id`, `buyer_id`, `seller_id`, `listing_id`, `quantity`, `amount`, `status`, `delivery_details` |
| `messages` | Direct messaging | `id`, `conversation_id`, `sender_id`, `recipient_id`, `content`, `read` |
| `reviews` | Order ratings and feedback | `id`, `order_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment` |
| `buyer_requests` | Marketplace demand signals | `id`, `buyer_id`, `crop_name`, `quantity_needed`, `max_price`, `region`, `status` |

### Social Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `posts` | Social media posts | `id`, `user_id`, `content`, `media_url`, `likes_count`, `shares_count` |
| `comments` | Post comments | `id`, `post_id`, `user_id`, `content` |
| `likes` | Post engagement | `id`, `post_id`, `user_id` |

### Gamification Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `challenges` | Gamified learning quests | `id`, `title`, `description`, `challenge_type`, `requirements`, `rewards`, `start_date`, `end_date`, `active` |
| `challenge_participants` | User challenge progress | `id`, `user_id`, `challenge_id`, `progress`, `completed`, `completion_date` |
| `referrals` | Invite tracking and rewards | `id`, `referrer_id`, `referred_id`, `status`, `reward_claimed` |
| `leaderboards` | Performance rankings (materialized view) | `user_id`, `full_name`, `location`, `points`, `level`, `total_sales`, `completed_orders`, `streak_days`, `total_posts` |

### System Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `notifications` | Push notification queue | `id`, `user_id`, `type`, `title`, `message`, `data`, `read` |
| `market_prices` | Real-time market price data | `id`, `crop_name`, `region`, `price_per_kg`, `recorded_at`, `source` |
| `leaderboard_refresh_log` | Tracks leaderboard update history | `id`, `refreshed_at` |

### Key Database Functions

- `award_points(p_user_id, p_action, p_points)`: Awards gamification points for activities
- `update_streak(p_user_id)`: Updates daily login streaks
- `process_referral(p_new_user_id, p_referral_code)`: Handles referral system logic
- `complete_referral(p_referred_id)`: Finalizes referral rewards
- `refresh_leaderboards()`: Updates the materialized view for leaderboards
- `generate_referral_code()`: Creates unique referral codes
- `assign_referral_code(p_user_id)`: Assigns code to new user

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **bun** package manager
- **Git** for version control

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/shambaxchange.git
cd shambaxchange
```

2. **Install dependencies**

```bash
npm install
# or
bun install
```

3. **Start the development server**

```bash
npm run dev
# or
bun dev
```

4. **Open your browser**

Navigate to `http://localhost:8080` to see the application running.

### Environment Variables

**Good news!** If this is a Lovable Cloud project, environment variables are **automatically configured** for you. No manual setup required!

The following variables are auto-provisioned:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

For custom Supabase projects or additional API keys (like OpenWeather), add them to your `.env` file:

```env
# OpenWeather API Key (for weather integration)
OPENWEATHER_API_KEY=your_api_key_here

# Lovable AI API Key (auto-configured in Lovable Cloud)
LOVABLE_API_KEY=your_api_key_here
```

### First Run Setup

1. **Create an account**: Navigate to `/auth` and sign up
2. **Complete your profile**: Add your full name and farm location
3. **Explore the dashboard**: Start by adding your first crop
4. **Check the weather**: View real-time weather for your location
5. **Ask Shamba**: Try the AI chatbot for farming advice

---

## 💻 Development Guide

### Project Structure

```
shambaxchange/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── AIChatbot.tsx       # AI assistant component
│   │   ├── AddCropDialog.tsx   # Crop management
│   │   ├── AddListingDialog.tsx # Marketplace listing
│   │   ├── CommentSection.tsx  # Social comments
│   │   ├── MessagingDialog.tsx # Direct messaging
│   │   ├── OrderCard.tsx       # Order display
│   │   ├── NotificationCenter.tsx
│   │   └── ...
│   ├── pages/                  # Route pages
│   │   ├── Auth.tsx           # Authentication
│   │   ├── Dashboard.tsx      # Farm management hub
│   │   ├── Marketplace.tsx    # Trading platform
│   │   ├── Social.tsx         # Community feed
│   │   ├── Learning.tsx       # Educational content
│   │   ├── Leaderboards.tsx   # Rankings
│   │   ├── Referrals.tsx      # Invite system
│   │   ├── Orders.tsx         # Order management
│   │   ├── MarketIntel.tsx    # Price intelligence
│   │   └── NotFound.tsx       # 404 page
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNotifications.ts
│   │   ├── useCompleteReferral.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/          # Supabase integration
│   │       ├── client.ts      # Auto-generated client
│   │       └── types.ts       # Auto-generated types
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── utils/
│   │   └── notificationHelpers.ts
│   ├── index.css              # Global styles + design tokens
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component with routing
│   └── vite-env.d.ts          # TypeScript declarations
├── supabase/
│   ├── functions/             # Edge functions
│   │   ├── ai-chat/
│   │   ├── ai-insights/
│   │   ├── fetch-weather/
│   │   ├── price-change-monitor/
│   │   ├── refresh-leaderboard/
│   │   └── daily-notifications/
│   ├── migrations/            # Database migrations
│   └── config.toml            # Supabase configuration
├── public/                    # Static assets
│   ├── robots.txt
│   └── sw.js                  # Service worker for notifications
├── index.html                 # HTML entry point
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

### Development Workflow

#### Running Locally

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

#### Making Database Changes

All database changes go through migrations:

1. **Let Lovable handle it**: When you request database changes through the Lovable editor, migrations are created automatically
2. **Manual migrations**: Create a new migration file in `supabase/migrations/`
3. **Apply migrations**: Migrations are automatically applied on deployment

Example migration:

```sql
-- Add a new column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update RLS policy
CREATE POLICY "Users can update their own bio"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

#### Adding New Features

1. **Create components** in `src/components/`
2. **Add pages** in `src/pages/` for new routes
3. **Update routing** in `src/App.tsx`
4. **Add database tables** via migrations if needed
5. **Create edge functions** in `supabase/functions/` for backend logic
6. **Test thoroughly** before deploying

#### Working with Edge Functions

```bash
# Test locally (requires Supabase CLI)
supabase functions serve function-name

# View logs
supabase functions logs function-name

# Deploy (automatic in Lovable Cloud)
# Functions deploy automatically when code is pushed
```

#### Debugging

- **Browser DevTools**: Use React DevTools for component inspection
- **Console Logs**: Check browser console for errors
- **Network Tab**: Inspect API requests and responses
- **Supabase Logs**: View edge function logs in Lovable Cloud backend
- **Database Queries**: Use Lovable Cloud backend to run SQL queries

### Design System

The application uses a custom design system with semantic color tokens defined in `src/index.css`:

```css
:root {
  --background: 120 20% 98%;
  --foreground: 120 10% 10%;
  --primary: 120 45% 45%;
  --primary-foreground: 0 0% 100%;
  /* ... more tokens ... */
}

.dark {
  --background: 120 15% 8%;
  --foreground: 120 5% 95%;
  /* ... dark mode tokens ... */
}
```

**Always use semantic tokens** instead of hardcoded colors:
- ✅ `bg-background text-foreground`
- ❌ `bg-white text-black`

---

## 🎯 Feature Implementation

### Gamification System

The gamification system drives user engagement through points, streaks, badges, and leaderboards.

#### Points System

Points are awarded automatically for platform activities:

```typescript
// Award points via database function
await supabase.rpc('award_points', {
  p_user_id: userId,
  p_action: 'post_created',
  p_points: 15
});
```

**Point Values:**
- Weather check: 5 points
- Crop update: 10 points
- Social post: 15 points
- Comment: 5 points
- Marketplace listing: 20 points
- Completed sale: 50 points
- Referral signup: 100 points

#### Streak Tracking

Daily login streaks with multipliers:

```typescript
// Update streak on login
await supabase.rpc('update_streak', {
  p_user_id: userId
});
```

- 7-day streak: 1.5x points multiplier
- 14-day streak: 2x points multiplier
- 30-day streak: 3x points multiplier

#### Badge System

Badges are stored in `user_stats.badges` as JSONB:

```typescript
// Example badge structure
{
  "Bronze Farmer": {
    "earned": true,
    "date": "2024-01-15T10:00:00Z",
    "criteria": "Completed 10 crop updates"
  }
}
```

**Available Badges:**
- **Bronze/Silver/Gold Farmer**: Based on total crops managed
- **Deal Maker**: Complete 5/10/25 marketplace transactions
- **Community Helper**: Receive 50/100/200 likes on helpful posts
- **Verified Seller**: 5+ successful transactions with 4+ star rating
- **Streak Master**: Maintain 7/14/30 day login streaks

#### Leaderboards

The `leaderboards` materialized view aggregates user performance:

```sql
-- Refresh leaderboards (runs hourly via cron)
SELECT refresh_leaderboards();
```

**Ranking Categories:**
- Total Sales Volume
- Points Earned
- Social Engagement (posts + likes + comments)
- Growth Rate (week-over-week improvement)
- Streak Days

Regional rankings filter by user location.

### Notification System

Push notifications are implemented using Service Workers and the Notifications API.

#### Notification Types

1. **Weather Alerts**: Sent at 6am daily based on user location
2. **Price Surge**: When prices change >10% for user's crops
3. **Harvest Countdown**: Reminders as crop harvest dates approach
4. **Social Engagement**: Likes, comments, shares on user posts
5. **Marketplace Activity**: New messages, orders, buyer requests matching crops

#### Implementation

Service worker registration in `public/sw.js`:

```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon.png',
    badge: '/badge.png',
    data: data.data
  });
});
```

Client-side notification handling:

```typescript
// Request permission
const permission = await Notification.requestPermission();

// Subscribe to notifications
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: publicVapidKey
});
```

Edge function for sending notifications:

```typescript
// supabase/functions/price-change-monitor/index.ts
// Runs hourly via pg_cron
const { data: farmers } = await supabase
  .from('crops')
  .select('user_id, crop_name')
  .eq('status', 'active');

// Check price changes and send notifications
```

### Marketplace Transaction Flow

Complete end-to-end transaction system:

#### 1. Listing Creation

Sellers create listings:

```typescript
await supabase
  .from('marketplace_listings')
  .insert({
    seller_id: userId,
    crop_name: 'Maize',
    quantity: 1000,
    price_per_kg: 50,
    location: 'Nairobi',
    status: 'active'
  });
```

#### 2. Buyer Discovery

Buyers browse and filter listings:

```typescript
const { data: listings } = await supabase
  .from('marketplace_listings')
  .select('*, profiles(*)')
  .eq('status', 'active')
  .eq('location', region)
  .order('created_at', { ascending: false });
```

#### 3. Direct Messaging

Real-time chat between parties:

```typescript
// Send message
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_id: userId,
    recipient_id: sellerId,
    content: messageText
  });

// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Update UI with new message
  })
  .subscribe();
```

#### 4. Order Creation

Buyer creates formal order:

```typescript
await supabase
  .from('orders')
  .insert({
    buyer_id: userId,
    seller_id: listing.seller_id,
    listing_id: listing.id,
    quantity: orderQuantity,
    amount: orderQuantity * listing.price_per_kg,
    status: 'requested',
    delivery_details: {
      address: deliveryAddress,
      phone: phoneNumber,
      notes: specialInstructions
    }
  });
```

#### 5. Status Tracking

Order progresses through statuses:

```typescript
// Status flow
'requested' → 'confirmed' → 'in-transit' → 'delivered' → 'completed'

// Update status
await supabase
  .from('orders')
  .update({ status: newStatus })
  .eq('id', orderId);
```

#### 6. Review & Rating

After completion, buyer leaves review:

```typescript
await supabase
  .from('reviews')
  .insert({
    order_id: orderId,
    reviewer_id: userId,
    reviewee_id: sellerId,
    rating: 5,
    comment: 'Excellent quality maize, fast delivery!'
  });
```

#### 7. Reputation System

Seller reputation calculated from reviews:

```typescript
const { data: reviews } = await supabase
  .from('reviews')
  .select('rating')
  .eq('reviewee_id', sellerId);

const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
const totalSales = reviews.length;

// Verified Seller badge awarded at 5+ sales with 4+ avg rating
```

### AI Personalization

AI generates daily insights using Lovable AI:

```typescript
// supabase/functions/ai-insights/index.ts
const { data: profile } = await supabase
  .from('profiles')
  .select('*, crops(*), ledger(*)')
  .eq('id', userId)
  .single();

const { data: weather } = await supabase.functions.invoke('fetch-weather', {
  body: { location: profile.location }
});

const prompt = `
You are an agricultural expert. Based on this farmer's data:
- Location: ${profile.location}
- Crops: ${profile.crops.map(c => c.crop_name).join(', ')}
- Weather: ${weather.temp}°C, ${weather.condition}
- Recent expenses: ${recentExpenses}

Provide personalized advice on:
1. Planting or harvesting timing
2. Market selling opportunities
3. Risk alerts (weather, pests)
4. One specific action to take today
`;

const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'You are an expert farming advisor' },
      { role: 'user', content: prompt }
    ]
  })
});
```

---

## ⚙️ Edge Functions

The platform uses 6 edge functions for backend operations:

### 1. `ai-chat`
**Purpose**: Powers the "Ask Shamba" AI chatbot assistant

**Endpoint**: `POST /functions/v1/ai-chat`

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "When should I plant maize in Nairobi?" }
  ]
}
```

**Response**: Streaming AI response with farming advice

**Authentication**: Required (JWT token)

---

### 2. `ai-insights`
**Purpose**: Generates personalized daily farming insights

**Endpoint**: `POST /functions/v1/ai-insights`

**Request Body**:
```json
{
  "userId": "user-uuid"
}
```

**Response**:
```json
{
  "insights": [
    {
      "type": "harvest_timing",
      "message": "Your maize crop planted on 2024-01-15 is approaching harvest. Optimal harvest window: next 7-10 days.",
      "priority": "high"
    },
    {
      "type": "market_opportunity",
      "message": "Maize prices in Nairobi up 12% this week. Consider listing your harvest soon.",
      "priority": "medium"
    }
  ],
  "daily_action": "Check soil moisture for your maize crop and prepare for harvest next week."
}
```

**Authentication**: Required (JWT token)

---

### 3. `fetch-weather`
**Purpose**: Retrieves real-time weather data for user location

**Endpoint**: `POST /functions/v1/fetch-weather`

**Request Body**:
```json
{
  "location": "Nairobi, Kenya"
}
```

**Response**:
```json
{
  "temp": 24,
  "humidity": 65,
  "condition": "Partly Cloudy",
  "description": "partly cloudy",
  "windSpeed": 3.5
}
```

**External API**: OpenWeather API

**Authentication**: Required (JWT token)

---

### 4. `price-change-monitor`
**Purpose**: Monitors market prices and sends alerts to farmers

**Trigger**: Hourly cron job via pg_cron

**Workflow**:
1. Fetch current market prices from external APIs
2. Compare with historical prices in `market_prices` table
3. Identify price changes >10%
4. Query farmers with matching crops
5. Create notifications in `notifications` table
6. Trigger push notifications to affected users

**Authentication**: Service role (cron triggered)

**Schedule**: Every hour at :00

---

### 5. `refresh-leaderboard`
**Purpose**: Updates leaderboard materialized view

**Trigger**: Hourly cron job via pg_cron

**Workflow**:
1. Execute `REFRESH MATERIALIZED VIEW leaderboards`
2. Log refresh timestamp in `leaderboard_refresh_log`
3. Invalidate client-side cache

**Authentication**: Service role (cron triggered)

**Schedule**: Every hour at :30

---

### 6. `daily-notifications`
**Purpose**: Sends scheduled daily notifications to farmers

**Trigger**: Daily cron job via pg_cron

**Workflow**:
1. 6:00 AM: Weather alerts for all farmers
2. 7:00 AM: Harvest reminders for crops nearing maturity
3. 8:00 AM: Market opportunity alerts
4. 9:00 AM: Streak reminder for users without login today

**Authentication**: Service role (cron triggered)

**Schedule**: Multiple times daily

---

## 🚢 Deployment

### Frontend Deployment

**Via Lovable (Recommended):**

1. Click the **"Publish"** button in the Lovable editor (top right on desktop, bottom right on mobile)
2. Your app is instantly deployed to `yourproject.lovable.app`
3. **Custom domain setup**: Navigate to Project > Settings > Domains

**Manual Deployment:**

```bash
# Build for production
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, Cloudflare Pages, etc.)
```

### Backend Deployment

**Lovable Cloud (Automatic):**

- ✅ Edge functions deploy automatically when code is pushed
- ✅ Database migrations run automatically on deployment
- ✅ Environment variables managed by Lovable Cloud
- ✅ Zero manual configuration required

**Custom Supabase Deployment:**

If using a separate Supabase project:

1. Connect your Supabase project in Lovable settings
2. Push database migrations: `supabase db push`
3. Deploy edge functions: `supabase functions deploy`
4. Configure environment variables in Supabase dashboard

### Production Considerations

#### Database Optimization
- **Indexes**: Created on frequently queried columns (user_id, status, created_at)
- **Materialized views**: `leaderboards` view refreshed hourly for performance
- **RLS policies**: Optimized to minimize policy checks
- **Connection pooling**: Enabled by default in Lovable Cloud

#### Security Hardening
- Enable 2FA for admin accounts
- Rotate API keys regularly
- Monitor failed authentication attempts
- Set up database backups (automatic in Lovable Cloud)
- Review and update RLS policies as features expand

#### Performance Monitoring
- Enable Supabase Analytics for query performance
- Monitor edge function execution times
- Track API rate limits and quotas
- Set up error logging and alerting

#### Caching Strategy
- Use TanStack Query for client-side caching
- Set appropriate stale times for different data types
- Implement optimistic updates for better UX

#### Scaling Considerations
- Lovable Cloud auto-scales edge functions
- Database connection limits: Monitor concurrent connections
- File storage: Set up CDN for media assets
- Consider read replicas for high-traffic regions

---

## 🔒 Security

Security is a top priority for shambaXchange. The platform implements multiple layers of protection:

### Implemented Security Measures

#### Row Level Security (RLS)
All tables have RLS policies enforcing data isolation:

```sql
-- Example: Users can only view their own crops
CREATE POLICY "Users can view their own crops"
ON public.crops
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### Authentication
- Supabase Auth with email/password
- Session management with automatic token refresh
- Secure password storage with bcrypt hashing
- Email verification (configurable)

#### Data Isolation
- User ID validation on all authenticated requests
- Marketplace orders visible only to buyer and seller
- Messages restricted to conversation participants
- Profile data accessible only to owner

#### HTTPS Everywhere
- All API requests over HTTPS/TLS 1.3
- Secure WebSocket connections (WSS) for realtime
- No sensitive data in URLs or query parameters

#### Input Validation
- Form validation with React Hook Form + Zod
- Server-side validation in edge functions
- SQL injection prevention via parameterized queries
- XSS prevention via React's automatic escaping

### Known Security Considerations

Based on recent security review, the following areas need attention:

#### 🔴 Critical
- **Edge functions without authentication**: `price-change-monitor`, `refresh-leaderboard`, and `fetch-weather` lack proper auth checks
  - **Impact**: Service abuse, API quota exhaustion
  - **Status**: Requires implementation of webhook signature validation

#### ✅ Implemented Security Measures

1. **Authentication & Input Validation**
   - ✅ Zod validation on auth forms (email format, password strength)
   - ✅ Social content restricted to authenticated users only
   - ✅ XSS prevention with DOMPurify and content length limits

2. **Rate Limiting**
   - ✅ In-memory rate limiter on all edge functions
   - ✅ Different tiers: AUTH (5/15min), AI (20/min), API (60/min)
   - ✅ IP-based tracking for anonymous, user-based for authenticated
   - ✅ Automatic cleanup to prevent memory leaks
   - See `docs/RATE_LIMITING.md` for details

3. **Row-Level Security (RLS)**
   - ✅ All tables protected with RLS policies
   - ✅ User data isolation (crops, ledger, stats, orders)
   - ✅ Proper authentication checks on all queries

4. **Edge Function Security**
   - ✅ CORS headers properly configured
   - ✅ JWT verification on user-facing endpoints
   - ✅ Webhook validation on cron endpoints (needs secret setup)
   - ✅ No raw SQL execution allowed

#### ⚠️ Known Considerations

- **Edge function secrets**: Cron functions require WEBHOOK_SECRET configuration
  - **Impact**: Unauthorized access to cron endpoints
  - **Status**: Secret needs to be configured and webhook validation enabled

- **Database functions**: Some SECURITY DEFINER functions need search_path hardening
  - **Impact**: Potential SQL injection in complex scenarios
  - **Status**: Low priority - requires migration

- **Leaked password protection**: Disabled in auth settings
  - **Impact**: Users can use compromised passwords
  - **Status**: Can be enabled in Lovable Cloud auth settings

### Security Best Practices

For production deployment:

1. ✅ **Rate limiting implemented** on all API endpoints
2. ✅ **Input validation** with zod schemas on auth and user content
3. ✅ **XSS prevention** with DOMPurify sanitization
4. ⚠️ **Enable email verification** in Supabase Auth settings
5. ⚠️ **Configure WEBHOOK_SECRET** for cron job security
6. ⚠️ **Set up monitoring** for suspicious activity and rate limit hits
7. ✅ **RLS policies active** on all user data tables
8. ⚠️ **Keep dependencies updated** with `npm audit`
9. ⚠️ **Use environment variables** for all secrets
10. ✅ **Database backups** (automatic in Lovable Cloud)

### Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security@yourcompany.com with details
3. Allow 48 hours for initial response
4. Coordinate disclosure timeline with maintainers

---

## 📖 API Documentation

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

Get the token from Supabase Auth:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Rate Limiting

All edge functions are protected by rate limiting to prevent abuse and ensure fair usage. Different endpoint types have different limits:

- **AUTH**: 5 requests per 15 minutes (login/signup)
- **AI**: 20 requests per minute (ai-chat, ai-insights)
- **API**: 60 requests per minute (fetch-weather, general operations)
- **EXPENSIVE**: 10 requests per minute (large operations)

#### Rate Limit Headers

Every API response includes these headers:

```
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 2025-11-19T12:01:00Z
```

#### Rate Limit Exceeded (429)

When you exceed the rate limit, you'll receive:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Response Headers:**
- `Retry-After`: Seconds until you can retry
- `X-RateLimit-Reset`: ISO timestamp when limit resets

For detailed information, see `docs/RATE_LIMITING.md`.

### Edge Function Endpoints

Base URL: `https://rqhiemvbadaokpbvxhwv.supabase.co/functions/v1`

#### POST `/ai-chat`

Chat with the AI farming assistant.

**Rate Limit**: 20 requests per minute

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How do I prepare soil for planting maize?" }
  ]
}
```

**Response:** Streaming text response

**Auth:** Required

---

#### POST `/ai-insights`

Get personalized farming insights.

**Rate Limit**: 20 requests per minute

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "insights": [
    {
      "type": "harvest_timing",
      "message": "Your maize is ready for harvest in 7-10 days",
      "priority": "high"
    }
  ],
  "daily_action": "Check soil moisture levels"
}
```

**Auth:** Required

---

#### POST `/fetch-weather`

Get real-time weather data.

**Rate Limit**: 60 requests per minute

**Request:**
```json
{
  "location": "Nairobi, Kenya"
}
```

**Response:**
```json
{
  "temp": 24,
  "humidity": 65,
  "condition": "Partly Cloudy",
  "description": "partly cloudy",
  "windSpeed": 3.5
}
```

**Auth:** Required

---

### Database Operations

All database operations use the Supabase client SDK:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Example: Fetch user's crops
const { data: crops, error } = await supabase
  .from('crops')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active');

// Example: Create a marketplace listing
const { data, error } = await supabase
  .from('marketplace_listings')
  .insert({
    seller_id: userId,
    crop_name: 'Maize',
    quantity: 1000,
    price_per_kg: 50
  });
```

RLS policies automatically enforce access control.

---

## 🗺 Roadmap

### ✅ Completed Features (Phase 1 & 2)

- ✅ User authentication and profiles
- ✅ Dashboard with crop tracking and financial ledger
- ✅ Real-time weather integration
- ✅ AI chatbot assistant ("Ask Shamba")
- ✅ Social platform (posts, comments, likes, trending)
- ✅ Marketplace with listings and discovery
- ✅ Direct messaging between buyers and sellers
- ✅ Order management system
- ✅ Review and rating system
- ✅ Gamification (points, streaks, badges, leaderboards)
- ✅ Referral system
- ✅ Push notification infrastructure
- ✅ Learning Hub with educational content
- ✅ Market intelligence page structure
- ✅ Regional leaderboards

### 🔄 In Progress (Phase 3)

- 🔄 **M-Pesa payment integration** - Secure payment processing for marketplace transactions
- 🔄 **Real market price API integration** - Live market data from government/agricultural boards
- 🔄 **AI price predictions** - Machine learning models for price forecasting
- 🔄 **Enhanced security** - Input validation, edge function authentication, XSS protection
- 🔄 **Content moderation** - AI-powered moderation for social posts and comments

### 📅 Upcoming Features (Q1 2025)

#### Marketplace Enhancements
- 📱 Mobile-optimized image uploads
- 🏷️ Bulk listing management for sellers
- 🔍 Advanced search with filters (price range, distance, organic/conventional)
- 📊 Seller analytics dashboard (views, inquiries, conversion rate)
- ⭐ Buyer request matching algorithm with AI recommendations

#### Social Features
- 🎥 Video posts (15-60 second clips)
- 📸 Story-style disappearing content
- 👥 Follow/follower system
- 🏆 Community-voted "Best Post of the Week"
- 🔔 Advanced notification preferences

#### Learning Hub
- 📚 Interactive quizzes after lessons
- 🎬 Video courses (Crop Care, Climate Adaptation, Marketing Skills)
- 🏅 Certificate of completion for courses
- 👨‍🏫 Expert farmer interviews
- 📖 Offline content downloads for low-connectivity areas

#### AI & Intelligence
- 🌾 Crop disease detection from photos
- 🌦️ 7-day weather forecasts with farming advice
- 📈 Yield prediction models based on historical data
- 💹 Optimal selling time recommendations
- 🛡️ Risk alerts (pest outbreaks, drought warnings, market crashes)

#### Platform Expansion
- 🌍 Multi-language support (Swahili, Kikuyu, Luo, etc.)
- 🏦 Group buying/selling (farmer cooperatives)
- 🚜 Agricultural input marketplace (seeds, fertilizers, tools)
- 📍 GPS-based farm mapping
- 🤝 Partnerships with agricultural extension services

### 🎯 Long-term Vision (2025+)

- 🌐 Pan-African expansion (Uganda, Tanzania, Nigeria, Ghana, etc.)
- 🏭 Integration with agricultural supply chains
- 💳 Credit scoring system for farmer loans
- 🛰️ Satellite imagery for farm monitoring
- 🔬 IoT sensor integration (soil moisture, pH, temperature)
- 📱 Offline-first mobile apps for rural areas
- 🚁 Drone-based crop monitoring partnerships

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or translations, your help makes shambaXchange better for farmers across Africa.

### How to Contribute

1. **Fork the repository**

Click the "Fork" button at the top right of this page.

2. **Clone your fork**

```bash
git clone https://github.com/yourusername/shambaxchange.git
cd shambaxchange
```

3. **Create a feature branch**

```bash
git checkout -b feature/amazing-new-feature
```

4. **Make your changes**

- Write clean, readable code
- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation as needed

5. **Test your changes**

```bash
npm run dev
# Test thoroughly in the browser
```

6. **Commit your changes**

```bash
git add .
git commit -m "feat: add amazing new feature"
```

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

7. **Push to your fork**

```bash
git push origin feature/amazing-new-feature
```

8. **Submit a Pull Request**

Go to the original repository and click "New Pull Request". Describe your changes and reference any related issues.

### Development Guidelines

#### Code Style

- Use **TypeScript** for all new code
- Follow **React best practices** (hooks, functional components)
- Use **Tailwind CSS** semantic tokens (no hardcoded colors)
- Leverage **shadcn/ui** components when possible
- Keep components small and focused (single responsibility)
- Use meaningful variable and function names

#### Database Changes

- Always create migrations for schema changes
- Include both `up` and `down` migrations
- Add RLS policies for new tables
- Document foreign key relationships
- Use SECURITY DEFINER functions sparingly

#### Edge Functions

- Use Deno runtime features
- Implement CORS headers for all functions
- Add error handling and logging
- Validate input parameters
- Use service role key only when necessary
- Document function purpose and parameters

#### Testing

Currently, the project doesn't have automated tests. Contributions to add testing infrastructure are welcome!

Manual testing checklist:
- ✅ Authentication flow (signup, login, logout)
- ✅ CRUD operations on all resources
- ✅ RLS policy enforcement
- ✅ Edge function responses
- ✅ Real-time subscriptions
- ✅ Mobile responsiveness
- ✅ Error handling and edge cases

#### Documentation

- Update README.md for significant changes
- Add JSDoc comments to functions
- Document API changes
- Include code examples
- Update database schema documentation

### Areas We Need Help

- 🐛 **Bug fixes**: Check open issues for known bugs
- ✨ **Features**: See roadmap for planned features
- 📚 **Documentation**: Improve clarity and add examples
- 🌍 **Translations**: Add multi-language support
- 🎨 **Design**: Improve UI/UX and accessibility
- 🧪 **Testing**: Add unit and integration tests
- ♿ **Accessibility**: Ensure WCAG compliance
- 📱 **Mobile**: Optimize for mobile devices

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different perspectives and experiences
- Report unacceptable behavior to maintainers

### Getting Help

- 💬 Join our Discord community: [link]
- 📧 Email maintainers: dev@yourcompany.com
- 📝 Open a GitHub discussion for questions
- 🐛 File issues for bugs or feature requests

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 shambaXchange

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

This project wouldn't be possible without these amazing technologies and communities:

### Core Technologies
- **[Lovable](https://lovable.dev)** - AI-powered development platform
- **[Supabase](https://supabase.com)** - Open-source Firebase alternative
- **[React](https://reactjs.org)** - JavaScript library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org)** - Typed superset of JavaScript
- **[Vite](https://vitejs.dev)** - Next-generation frontend tooling
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework

### UI Components & Design
- **[shadcn/ui](https://ui.shadcn.com)** - Re-usable component collection
- **[Radix UI](https://www.radix-ui.com)** - Unstyled, accessible UI primitives
- **[Lucide](https://lucide.dev)** - Beautiful & consistent icon pack
- **[Recharts](https://recharts.org)** - Composable charting library

### AI & APIs
- **[Lovable AI](https://docs.lovable.dev/features/ai)** - AI gateway for Gemini and GPT models
- **[OpenWeather API](https://openweathermap.org/api)** - Weather data API

### Inspiration
- **African farmers** - The real heroes feeding the continent
- **Agricultural extension workers** - Sharing knowledge on the ground
- **Open-source community** - For making world-class tools freely available

---

## 📞 Support & Community

### Get Help

- 📖 **Documentation**: You're reading it!
- 💬 **Discord Community**: [Join our Discord](#) (coming soon)
- 📧 **Email Support**: support@shambaxchange.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/shambaxchange/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/shambaxchange/discussions)

### Stay Updated

- ⭐ **Star this repository** to follow updates
- 👁️ **Watch releases** for new versions
- 🐦 **Follow us on Twitter**: [@shambaXchange](#) (coming soon)
- 📰 **Subscribe to newsletter**: [link](#) (coming soon)

### Commercial Support

For enterprise deployments, custom features, or priority support:
- 📧 Email: enterprise@shambaxchange.com
- 🌐 Visit: [www.shambaxchange.com](#) (coming soon)

---

## 👨‍💻 Credits

### Maintainers

- **Project Lead**: [Your Name](https://github.com/yourusername)
- **Lead Developer**: [Developer Name](https://github.com/devusername)

### Contributors

Thanks to all contributors who have helped make shambaXchange better! 🙌

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- This section is auto-generated. Add contributors with: npm run contributors:add -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Want to see your name here? [Start contributing today!](#contributing)

---

## 🌟 Star History

If shambaXchange has helped you or your farming community, consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/shambaxchange&type=Date)](https://star-history.com/#yourusername/shambaxchange&Date)

---

<div align="center">

**Built with ❤️ for African farmers**

shambaXchange | [Website](#) | [Documentation](#) | [Community](#)

</div>
