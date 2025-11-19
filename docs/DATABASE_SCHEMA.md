# Database Schema Documentation

This document provides comprehensive documentation for the shambaXchange database schema, including table structures, RLS policies, functions, and business logic.

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [Row-Level Security Policies](#row-level-security-policies)
3. [Database Functions](#database-functions)
4. [Triggers](#triggers)
5. [Materialized Views](#materialized-views)

---

## Core Tables

### profiles
Stores user profile information for authenticated farmers.

**Columns:**
- `id` (uuid, PK): References auth.users(id) - the authenticated user's ID
- `full_name` (text, NOT NULL): User's display name
- `phone` (text, NULLABLE): Contact phone number
- `location` (text, NOT NULL): Geographic location for weather/market data
- `farm_size` (numeric, NULLABLE): Size of farm in acres
- `referral_code` (text, NULLABLE, UNIQUE): Unique code for inviting others
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Central user data table. Location is critical for weather API and regional market intelligence. Referral code enables viral growth tracking.

---

### user_stats
Tracks gamification metrics for each user including points, streaks, levels, and badges.

**Columns:**
- `user_id` (uuid, PK): References profiles(id)
- `total_points` (integer, DEFAULT 0): Cumulative points earned from activities
- `level` (integer, DEFAULT 1): Calculated as floor(total_points / 100) + 1
- `streak_days` (integer, DEFAULT 0): Consecutive days of platform engagement
- `last_login` (date, NULLABLE): Last date user logged in (for streak calculation)
- `badges` (jsonb, DEFAULT '[]'): Array of earned badge names
- `streak_milestones` (jsonb, DEFAULT '[]'): Array tracking which streak milestones achieved
- `featured_until` (timestamptz, NULLABLE): End date for featured profile status (30-day streak reward)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Powers the gamification system that drives daily engagement. Points and levels provide progression, streaks encourage daily logins, badges reward achievements.

**Business Logic:**
- Points determine level: Level = floor(total_points / 100) + 1
- Streak breaks if user doesn't log in for 2+ consecutive days
- Featured status (30-day streak reward) lasts 7 days from achievement

---

### crops
Farmer's crop inventory tracking what they're currently growing.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `user_id` (uuid, NOT NULL): Owner of the crop
- `crop_name` (text, NOT NULL): Name of the crop (e.g., "Maize", "Tomatoes")
- `acreage` (numeric, NOT NULL): Land area allocated to this crop
- `planting_date` (date, NOT NULL): When crop was planted
- `expected_yield` (numeric, NULLABLE): Estimated harvest amount
- `status` (text, DEFAULT 'active'): Current status ('active', 'harvested', etc.)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Core dashboard data. Used by AI to generate personalized insights about harvest timing, yield predictions, and selling opportunities.

---

### ledger
Financial transaction tracking for farm income and expenses.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `user_id` (uuid, NOT NULL): Transaction owner
- `type` (text, NOT NULL): 'income' or 'expense'
- `date` (date, NOT NULL, DEFAULT CURRENT_DATE): Transaction date
- `item` (text, NOT NULL): Description (e.g., "Maize Seeds", "Harvest Sale")
- `quantity` (numeric, NULLABLE): Amount of items
- `amount` (numeric, NOT NULL): Money value
- `notes` (text, NULLABLE): Additional details
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Enables financial tracking and analysis. Powers expense breakdowns, profit/loss calculations, and temporal comparisons.

---

### marketplace_listings
Products available for sale in the marketplace.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `seller_id` (uuid, NOT NULL): User listing the product
- `crop_name` (text, NOT NULL): Product being sold
- `quantity` (numeric, NOT NULL): Amount available
- `price_per_kg` (numeric, NOT NULL): Price per kilogram
- `location` (text, NOT NULL): Seller's location
- `image_url` (text, NULLABLE): Product photo URL
- `status` (text, DEFAULT 'active'): 'active', 'sold', 'expired'
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Core marketplace inventory. Enables farmer-to-buyer transactions.

---

### buyer_requests
Buyers post requests for crops they want to purchase.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `buyer_id` (uuid, NOT NULL): User making the request
- `crop_name` (text, NOT NULL): Crop they want to buy
- `quantity_needed` (numeric, NOT NULL): Amount needed
- `max_price` (numeric, NULLABLE): Maximum price willing to pay
- `region` (text, NOT NULL): Geographic area for purchase
- `status` (text, DEFAULT 'active'): 'active', 'fulfilled', 'expired'
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Demand-side marketplace. Enables smart matching between buyer requests and seller listings.

---

### orders
Tracks marketplace transactions from request to completion.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `listing_id` (uuid, NULLABLE): Original marketplace listing
- `buyer_id` (uuid, NULLABLE): Purchasing user
- `seller_id` (uuid, NULLABLE): Selling user
- `quantity` (numeric, NOT NULL): Amount being purchased
- `amount` (numeric, NOT NULL): Total transaction value
- `status` (text, DEFAULT 'requested'): Transaction status flow
- `delivery_details` (jsonb, NULLABLE): Shipping/delivery information
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Status Flow:** requested → confirmed → in-transit → delivered → completed

**Purpose:** Manages complete transaction lifecycle. Enables order tracking, status updates, and transaction history.

---

### messages
Direct messaging between buyers and sellers.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `conversation_id` (uuid, NOT NULL): Groups messages between two users
- `sender_id` (uuid, NULLABLE): User sending message
- `recipient_id` (uuid, NULLABLE): User receiving message
- `content` (text, NOT NULL): Message text
- `read` (boolean, DEFAULT false): Read status
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Enables real-time communication for transaction coordination. Uses Supabase Realtime for instant delivery.

---

### reviews
Rating and feedback system after completed transactions.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `order_id` (uuid, NULLABLE): Completed order being reviewed
- `reviewer_id` (uuid, NULLABLE): User leaving review
- `reviewee_id` (uuid, NULLABLE): User being reviewed
- `rating` (integer, NOT NULL): 1-5 star rating
- `comment` (text, NULLABLE): Optional review text
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Builds trust and reputation. Enables "Verified Seller" badges and seller ratings.

---

### posts
Social media posts from farmers.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `user_id` (uuid, NOT NULL): Post author
- `content` (text, NOT NULL, MAX 2000 chars): Post text content
- `media_url` (text, NULLABLE): Photo/video URL from storage bucket
- `likes_count` (integer, DEFAULT 0): Cached like count
- `shares_count` (integer, DEFAULT 0): Cached share count
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Purpose:** Social engagement layer. Drives community building and platform stickiness.

---

### comments
Comments on social posts.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `post_id` (uuid, NOT NULL): Post being commented on
- `user_id` (uuid, NOT NULL): Comment author
- `content` (text, NOT NULL, MAX 500 chars): Comment text
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Enables post discussions and social interaction.

---

### likes
Like tracking for social posts.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `post_id` (uuid, NOT NULL): Post being liked
- `user_id` (uuid, NOT NULL): User liking post
- `created_at` (timestamptz, DEFAULT now())

**Unique Constraint:** (post_id, user_id) - prevents duplicate likes

**Purpose:** Social engagement metric. Powers trending algorithm.

---

### notifications
Push notification queue and history.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `user_id` (uuid, NULLABLE): Notification recipient
- `type` (text, NOT NULL): Category ('system', 'social', 'marketplace', 'weather')
- `title` (text, NOT NULL): Notification headline
- `message` (text, NOT NULL): Notification body
- `data` (jsonb, NULLABLE): Additional context data
- `read` (boolean, DEFAULT false): Read status
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Drives daily re-engagement. Delivers weather alerts, price changes, social interactions, and marketplace activity.

---

### referrals
Tracks invite chain for viral growth.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `referrer_id` (uuid, NULLABLE): User who invited
- `referred_id` (uuid, NULLABLE): User who was invited
- `status` (text, DEFAULT 'pending'): 'pending' or 'completed'
- `reward_claimed` (boolean, DEFAULT false): Whether rewards distributed
- `created_at` (timestamptz, DEFAULT now())

**Status Logic:**
- 'pending': Referred user signed up but hasn't completed activation
- 'completed': Referred user is active, rewards distributed

**Purpose:** Tracks referral network and rewards. Powers viral growth incentives.

---

### market_prices
Historical and current market price data.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `crop_name` (text, NOT NULL): Crop being priced
- `region` (text, NOT NULL): Geographic market
- `price_per_kg` (numeric, NOT NULL): Current price
- `source` (text, NULLABLE): Data source (API, manual entry)
- `recorded_at` (timestamptz, DEFAULT now())

**Purpose:** Powers market intelligence AI predictions, price change alerts, and "sell now vs wait" recommendations.

---

### challenges
Gamified quests and competitions.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `title` (text, NOT NULL): Challenge name
- `description` (text, NULLABLE): Challenge details
- `challenge_type` (text, NULLABLE): Category
- `start_date` (date, NULLABLE): When challenge begins
- `end_date` (date, NULLABLE): When challenge ends
- `requirements` (jsonb, NULLABLE): Completion criteria
- `rewards` (jsonb, NULLABLE): What participants earn
- `active` (boolean, DEFAULT true): Whether challenge is running
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Drives engagement through time-limited quests. Example: "Document Your Harvest Week", "Yield Improvement Challenge"

---

### challenge_participants
Tracks user participation in challenges.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `challenge_id` (uuid, NULLABLE): Challenge being attempted
- `user_id` (uuid, NULLABLE): Participant
- `progress` (jsonb, DEFAULT '{}'): Current progress state
- `completed` (boolean, DEFAULT false): Completion status
- `completion_date` (timestamptz, NULLABLE): When completed
- `created_at` (timestamptz, DEFAULT now())

**Purpose:** Links users to challenges they're participating in. Tracks progress toward completion.

---

## Row-Level Security Policies

### Principle
All tables use RLS to ensure users can only access their own data or publicly viewable data. This prevents unauthorized access and data leaks.

### Common Patterns

#### 1. **User-Owned Data** (profiles, crops, ledger, user_stats)
```sql
-- Users can only view/edit their own records
CREATE POLICY "Users can view their own X"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own X"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own X"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Rationale:** Prevents users from viewing or modifying other farmers' personal data, crops, finances, or stats.

---

#### 2. **Public Marketplace Data** (marketplace_listings, buyer_requests)
```sql
-- Anyone can view active listings/requests
CREATE POLICY "Anyone can view active listings"
ON marketplace_listings FOR SELECT
USING (status = 'active');

-- Users can only create/edit their own
CREATE POLICY "Users can insert their own listings"
ON marketplace_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);
```

**Rationale:** Marketplace data must be visible to all users for discovery, but only owners can modify their listings.

---

#### 3. **Bilateral Access** (orders, messages)
```sql
-- Both parties in a transaction can view
CREATE POLICY "Users can view their orders"
ON orders FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages visible to sender and recipient
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
```

**Rationale:** Transaction participants need mutual access to orders and messages, but third parties should not see private communications.

---

#### 4. **Public Social Content** (posts, comments, likes)
```sql
-- All authenticated users can view social content
CREATE POLICY "Authenticated users can view posts"
ON posts FOR SELECT
USING (true);

-- Users can only create their own content
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Rationale:** Social platform requires public visibility for community engagement, but content authorship is protected.

---

#### 5. **Read-Only Data** (market_prices, challenges)
```sql
-- Anyone can view, no one can modify via API
CREATE POLICY "Anyone can view market prices"
ON market_prices FOR SELECT
USING (true);

-- No INSERT/UPDATE/DELETE policies = only backend can modify
```

**Rationale:** Market data and challenges are managed by edge functions, not users directly.

---

#### 6. **System-Only Writes** (notifications, referrals)
```sql
-- Users can read their own notifications
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- No INSERT policy = only backend functions can create notifications
```

**Rationale:** Notifications are generated by the system, not users. Prevents notification spam or manipulation.

---

## Database Functions

### 1. award_points(p_user_id uuid, p_points integer, p_action text)

**Purpose:** Central function for awarding points and managing level progression.

**Logic:**
1. **Upsert user_stats**: Creates record if doesn't exist, otherwise adds points
2. **Calculate new level**: `level = floor(total_points / 100) + 1`
3. **Calculate points to next level**: `(current_level * 100) - total_points`
4. **Check for level up**: Compare new level to previous level
5. **Send appropriate notification**:
   - If level increased: "🎉 Level Up!" with new level and progress to next
   - If no level up: "Points Earned!" with progress to next level

**Called By:**
- Social actions (creating posts, comments)
- Marketplace actions (creating listings, completing sales)
- Daily login streak bonus
- Challenge completions
- Referral completions

**Example Flow:**
```
User creates a post (15 points)
→ award_points(user_id, 15, 'creating post')
→ Check previous level: 3 (250 points)
→ Add 15 points: 265 total
→ Calculate new level: floor(265/100) + 1 = 3 (no change)
→ Points to next level: (3 * 100) - 265 = 35 points
→ Notification: "You earned 15 points for creating post. 35 more points until Level 4"
```

**Security:** `SECURITY DEFINER` - runs with function owner's privileges to bypass RLS when inserting notifications.

---

### 2. update_streak(p_user_id uuid)

**Purpose:** Manages daily login streaks, milestone achievements, and streak-based rewards.

**Logic:**

1. **Fetch current streak data** from user_stats (last_login, streak_days, streak_milestones)

2. **If no stats record exists** (new user):
   - Create user_stats with streak_days = 1
   - Send welcome notification: "🔥 Streak Started! Day 1..."
   - Return early

3. **If already logged in today** (last_login = CURRENT_DATE):
   - Do nothing (prevent double-counting same day)
   - Return early

4. **If logged in yesterday** (last_login = CURRENT_DATE - 1 day):
   - **Continue streak**: Increment streak_days by 1
   - **Award bonus points**: 5 points for daily login
   - **Calculate next milestone**:
     - If streak < 7 days → next milestone is 7
     - If streak < 30 days → next milestone is 30
     - If streak < 90 days → next milestone is 90
     - If streak >= 90 → next milestone is 365
   - **Check for milestone achievements**:
     
     **7-Day Milestone:**
     - Add "Week Warrior" badge
     - Award 50 bonus points
     - Mark streak_milestones with "7_day"
     - Notification: "🔥 7-Day Streak! You earned Week Warrior badge! X more days until Month Master..."
     
     **30-Day Milestone:**
     - Add "Month Master" badge
     - Award 200 bonus points
     - Set featured_until = CURRENT_DATE + 7 days (featured profile for a week)
     - Mark streak_milestones with "30_day"
     - Notification: "🌟 30-Day Streak! You earned Month Master badge and featured profile for a week!..."
     
     **90-Day Milestone:**
     - Add "Dedicated Farmer" badge
     - Award 500 bonus points
     - Mark streak_milestones with "90_day"
     - Notification: "💎 90-Day Streak! You earned Dedicated Farmer status!..."
   
   - **If no milestone reached**: Send progress notification showing days until next milestone

5. **If didn't log in yesterday** (streak broken):
   - **Reset streak to 1**
   - Update last_login to CURRENT_DATE
   - Notification: "⚠️ Streak Reset. Your X-day streak was reset. Starting fresh at Day 1!..."

**Called By:**
- Auth system on user login (automatically via trigger or app initialization)
- useCompleteReferral hook on mount (ensures streak updates on page load)

**Example Flow:**
```
User with 6-day streak logs in:
→ update_streak(user_id)
→ Check last_login: yesterday ✓
→ Increment: 6 → 7 days
→ Award 5 points for daily login
→ Check milestones: 7 = 7-day milestone!
→ Add "Week Warrior" badge
→ Award 50 bonus points
→ Notification: "🔥 7-Day Streak! Earned Week Warrior badge! 23 more days until Month Master..."
```

**Security:** `SECURITY DEFINER` - can insert notifications and award points despite RLS.

---

### 3. generate_referral_code()

**Purpose:** Creates unique 8-character alphanumeric referral codes.

**Logic:**
1. Generate random 8-character code using MD5 hash of random() + timestamp
2. Convert to uppercase for readability
3. Check if code already exists in profiles table
4. If exists, loop and generate new code until unique
5. Return unique code

**Example Output:** `A7F3B9E2`, `K4M8Q1Z6`

**Called By:**
- handle_new_profile_referral() trigger when user signs up
- assign_referral_code() function for manual code assignment

**Why Randomized:** Prevents code guessing and ensures fair distribution across character space.

---

### 4. assign_referral_code(p_user_id uuid)

**Purpose:** Manually assigns a referral code to an existing user who doesn't have one.

**Logic:**
1. Call generate_referral_code() to get unique code
2. Update user's profile with the new code
3. Return the generated code

**Called By:** 
- Admin functions
- Migration scripts for existing users
- Recovery functions if code generation fails during signup

---

### 5. process_referral(p_new_user_id uuid, p_referral_code text)

**Purpose:** Creates referral relationship when new user signs up with referral code.

**Logic:**
1. **Find referrer** by looking up referral_code in profiles table
2. **If referrer found**:
   - Create referral record with status='pending'
   - Link referrer_id → referred_id
   - Send notification to referrer: "New Referral! Someone signed up using your code!"
3. **If referrer not found**: Do nothing (invalid code)

**Status = 'pending':** Referral exists but not yet rewarded. Rewards distributed when referred user becomes active.

**Called By:**
- Signup flow when user provides referral code
- Auth hooks after user creation

**Example Flow:**
```
User A (referral_code: "FARM1234") invites User B
→ User B signs up with code "FARM1234"
→ process_referral(user_b_id, "FARM1234")
→ Find User A by code "FARM1234"
→ Create referral: {referrer: User A, referred: User B, status: 'pending'}
→ Notify User A: "New Referral! Someone signed up..."
```

---

### 6. complete_referral(p_referred_id uuid)

**Purpose:** Activates referral rewards when referred user becomes active (completes profile, adds crops, etc.).

**Logic:**

1. **Find and update referral**:
   - Look for referral where referred_id = p_referred_id AND status = 'pending'
   - Update status to 'completed'
   - Get referrer_id

2. **If referral found** (status was pending):
   
   **Distribute rewards:**
   - Referrer gets 100 points
   - Referred user gets 50 points (welcome bonus)
   
   **Count total completed referrals** for referrer
   
   **Check badge milestones:**
   - If 3 completed referrals:
     - Add "Recruiter" badge
     - Notify: "🎉 Badge Earned! You earned the Recruiter badge for 3 successful referrals!"
   
   - If 10 completed referrals:
     - Add "Community Builder" badge
     - Notify: "🎉 Badge Earned! You earned the Community Builder badge for 10 successful referrals!"
   
   **Send completion notification** to referrer:
   - "Referral Completed! Your referral is now active. You earned 100 points! Total referrals: X"

3. **If no pending referral found**: Do nothing (already completed or doesn't exist)

**Called By:**
- useCompleteReferral hook (checks on Dashboard mount)
- Edge functions monitoring user activation criteria

**Activation Criteria** (when to call complete_referral):
- User adds their first crop
- User creates first marketplace listing
- User makes first social post
- Any action indicating real platform engagement

**Example Flow:**
```
User B (referred by User A) adds their first crop:
→ complete_referral(user_b_id)
→ Find referral: {referrer: User A, referred: User B, status: 'pending'}
→ Update status: 'completed'
→ Award 100 points to User A
→ Award 50 points to User B
→ Count User A's referrals: 3 total
→ Award "Recruiter" badge to User A
→ Notify User A: "Referral Completed! You earned 100 points! Total: 3"
→ Notify User A: "🎉 Badge Earned! Recruiter badge for 3 referrals!"
```

---

### 7. get_popular_crops()

**Purpose:** Returns list of crops that are frequently used across the platform (5+ occurrences).

**Logic:**
1. **Collect all active crops** from two sources:
   - Dashboard crops table (status = 'active')
   - Marketplace listings (status = 'active')
2. **Normalize crop names**: Convert to lowercase and trim whitespace
3. **Count occurrences** of each crop name
4. **Filter**: Keep only crops with 5+ uses (HAVING COUNT(*) > 5)
5. **Sort**: By usage count (descending), then alphabetically
6. **Return**: crop_name and usage_count

**Example Output:**
```
crop_name    | usage_count
-------------|------------
maize        | 234
tomatoes     | 156
potatoes     | 89
beans        | 67
```

**Used By:**
- Crop dropdown population (dynamic crop lists)
- Market intelligence (popular crop tracking)
- AI insights (community trends)

**Why 5+ threshold:** Prevents one-off crops from cluttering dropdowns, ensures only commonly-grown crops appear.

---

### 8. refresh_leaderboards()

**Purpose:** Updates the materialized view that powers leaderboard rankings.

**Logic:**
1. Execute `REFRESH MATERIALIZED VIEW public.leaderboards`
2. Recalculates all ranking data from source tables

**Called By:**
- Edge function: refresh-leaderboard (cron job, runs periodically)
- Manual refresh when immediate update needed

**Why Materialized View:** Leaderboard queries are expensive (aggregate calculations across users). Materialized view pre-computes results for fast reads.

---

## Triggers

### 1. handle_new_user (ON auth.users, AFTER INSERT)

**Purpose:** Automatically creates profile record when user signs up.

**Logic:**
1. User signs up via Supabase Auth
2. Trigger fires AFTER user inserted into auth.users
3. Extract metadata from signup form:
   - full_name from raw_user_meta_data (default: 'Farmer')
   - location from raw_user_meta_data (default: 'Kenya')
4. Create profile record in public.profiles with user's ID

**Why Needed:** Separates auth data (managed by Supabase) from profile data (managed by app). Profiles table is accessible via RLS while auth.users is not directly queryable.

---

### 2. handle_new_profile_referral (ON profiles, BEFORE INSERT)

**Purpose:** Automatically generates referral code for new profiles.

**Logic:**
1. Profile about to be inserted
2. Check if referral_code is NULL
3. If NULL, call generate_referral_code() and assign to NEW.referral_code
4. Return NEW (modified profile record)

**Why BEFORE INSERT:** Ensures every profile has referral code before record is saved.

---

### 3. update_updated_at_column (ON multiple tables, BEFORE UPDATE)

**Purpose:** Automatically updates updated_at timestamp on row modifications.

**Logic:**
1. Before any UPDATE on table
2. Set NEW.updated_at = now()
3. Return NEW (modified record)

**Applied To:** profiles, crops, ledger, marketplace_listings, posts, user_stats, orders

**Why Needed:** Ensures updated_at always reflects last modification without manual timestamp management.

---

## Materialized Views

### leaderboards

**Purpose:** Pre-computed rankings of top farmers across multiple metrics.

**Columns:**
- `user_id` (uuid): Farmer being ranked
- `full_name` (text): Display name
- `location` (text): Geographic region
- `total_points` (integer): Gamification points
- `level` (integer): Current level
- `total_sales` (numeric): Lifetime sales volume
- `avg_rating` (numeric): Average review rating
- `rank_by_points` (integer): Ranking by points
- `rank_by_sales` (integer): Ranking by sales
- `rank_by_rating` (integer): Ranking by reviews

**Refresh Strategy:** 
- Periodic refresh via edge function (e.g., hourly or daily)
- Manual refresh when immediate update critical

**Why Materialized:** Ranking calculations involve complex joins and aggregations across profiles, user_stats, orders, and reviews. Materializing results enables instant leaderboard page loads.

---

## Edge Function Integration

### Functions That Interact with Database

1. **daily-notifications**: Queries users, generates personalized messages, inserts notifications
2. **price-change-monitor**: Queries market_prices, detects changes >10%, creates alerts
3. **ai-insights**: Reads user crops/ledger/weather, generates recommendations via AI
4. **refresh-leaderboard**: Calls refresh_leaderboards() function
5. **fetch-weather**: Updates user profile or cache with weather data

---

## Security Considerations

### 1. RLS Enforcement
- **ALL tables have RLS enabled**
- No table allows unfiltered access
- User data strictly scoped to auth.uid()

### 2. Function Security
- Functions use `SECURITY DEFINER` when they need to bypass RLS (e.g., awarding points, sending notifications)
- Functions validate user_id matches auth.uid() when relevant
- No SQL injection risk (parameterized queries)

### 3. Input Validation
- Content length limits (posts: 2000 chars, comments: 500 chars)
- HTML sanitization on user-generated content
- URL validation on image uploads

### 4. Rate Limiting
- Edge functions protected by webhook signature validation
- Client-side rate limiting on API calls

---

## Performance Optimizations

### 1. Indexed Columns
- Foreign keys (user_id, post_id, order_id, etc.)
- Frequently queried fields (status, created_at)
- Unique constraints (referral_code, post_id+user_id for likes)

### 2. Materialized Views
- Leaderboards pre-computed
- Reduces real-time calculation overhead

### 3. Cached Counts
- posts.likes_count cached (updated via trigger)
- posts.shares_count cached (updated via trigger)

### 4. Realtime Selective
- Only critical tables use Realtime (messages, notifications)
- Reduces connection overhead

---

## Common Query Patterns

### Fetch User Dashboard Data
```sql
-- Get user profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Get active crops
SELECT * FROM crops WHERE user_id = auth.uid() AND status = 'active';

-- Get recent ledger entries
SELECT * FROM ledger WHERE user_id = auth.uid() ORDER BY date DESC LIMIT 10;

-- Get user stats
SELECT * FROM user_stats WHERE user_id = auth.uid();
```

### Fetch Marketplace Data
```sql
-- Get active listings
SELECT 
  ml.*,
  p.full_name as seller_name,
  p.location
FROM marketplace_listings ml
JOIN profiles p ON ml.seller_id = p.id
WHERE ml.status = 'active'
ORDER BY ml.created_at DESC;
```

### Fetch Social Feed
```sql
-- Get recent posts with author info
SELECT 
  posts.*,
  profiles.full_name,
  profiles.location,
  EXISTS(
    SELECT 1 FROM likes 
    WHERE likes.post_id = posts.id 
    AND likes.user_id = auth.uid()
  ) as user_has_liked
FROM posts
JOIN profiles ON posts.user_id = profiles.id
ORDER BY posts.created_at DESC
LIMIT 20;
```

### Award Points and Check Level
```sql
-- Award points (via function)
SELECT award_points('user-uuid', 15, 'creating post');

-- Check if user leveled up
SELECT level, total_points, 
  (level * 100) - total_points as points_to_next_level
FROM user_stats 
WHERE user_id = 'user-uuid';
```

---

## Migration Strategy

### Adding New Tables
1. Create table with appropriate columns
2. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
3. Create policies for SELECT/INSERT/UPDATE/DELETE
4. Add indexes on foreign keys and frequently queried columns
5. Test policies with different user contexts

### Modifying Existing Tables
1. Use ALTER TABLE to add/modify columns
2. Set appropriate defaults for existing rows
3. Update RLS policies if access patterns change
4. Update application queries to use new columns
5. Test with existing data

---

## Troubleshooting

### User Can't See Their Data
- **Check RLS policies**: Verify policy USING clause matches user's context
- **Check auth**: Ensure user is authenticated (auth.uid() not null)
- **Check foreign keys**: Verify user_id column correctly set

### Function Not Working
- **Check SECURITY DEFINER**: Required for functions that insert/update across tables
- **Check search_path**: Set to 'public' explicitly
- **Check permissions**: Function owner needs permissions on referenced tables

### Realtime Not Updating
- **Check Realtime enabled**: `ALTER PUBLICATION supabase_realtime ADD TABLE table_name;`
- **Check RLS**: Realtime respects RLS policies
- **Check subscription**: Verify client subscribed to correct channel/event

---

This documentation serves as the single source of truth for shambaXchange database architecture and should be updated whenever schema changes are made.
