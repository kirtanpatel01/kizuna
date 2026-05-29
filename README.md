# Greem

Greem is a lightweight social platform built to explore real-world Redis leaderboard implementations.

Users can create short text posts, interact through likes, comments, and saves, and compete on weekly and all-time leaderboards. The project combines PostgreSQL as the source of truth with Redis as a high-performance ranking engine.

## Features

* Email and Google authentication
* Create and manage text-based posts
* Like, comment, and save posts
* User profiles and follow system
* Weekly and all-time leaderboards
* Real-time leaderboard updates using Redis Pub/Sub
* Built with TanStack Start, Drizzle ORM, PostgreSQL, and Redis

---

## Tech Stack

* TanStack Start
* TanStack Router
* TypeScript
* PostgreSQL
* Drizzle ORM
* Redis
* Better Auth
* ImageKit
* Tailwind CSS
* shadcn/ui

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd greem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Windows:

```bash
copy env.example .env
```

macOS / Linux:

```bash
cp env.example .env
```

### 4. Configure environment variables

Fill the values inside `.env`.

Required services:

* PostgreSQL
* Redis
* Google OAuth credentials
* ImageKit credentials

### 5. Start Required Services

Greem ships with a Docker Compose configuration for running Redis locally.

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: greem-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: ["redis-server", "--appendonly", "yes"]

volumes:
  redis-data:
```

Start Redis:

```bash
docker compose up -d redis
```

Verify it is running:

```bash
docker ps
```

You should see:

```txt
greem-redis
```

### Why Docker?

The leaderboard system depends on Redis for:

* User rankings
* Post rankings
* Redis Sorted Sets
* Redis Pub/Sub
* Real-time leaderboard updates

Using Docker allows contributors to run Redis locally without installing Redis manually.

### Persistence

Redis data is stored inside a Docker volume:

```yaml
volumes:
  - redis-data:/data
```

This means leaderboard data survives container restarts.

Redis is also started with:

```yaml
--appendonly yes
```

which enables Redis Append Only File (AOF) persistence.

### Local Redis URL

When using the provided Docker setup:

```env
REDIS_URL=redis://localhost:6379
```

### 6. Push database schema

```bash
npx drizzle-kit push
```

### 7. Start development server

```bash
npm run dev
```

## Environment Variables

| Variable             | Description                  |
| -------------------- | ---------------------------- |
| DATABASE_URL         | PostgreSQL connection string |
| REDIS_URL            | Redis connection string      |
| GOOGLE_CLIENT_ID     | Google OAuth client ID       |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret   |
| IMAGEKIT_PUBLIC_KEY  | ImageKit public key          |
| IMAGEKIT_PRIVATE_KEY | ImageKit private key         |

---

# Leaderboard Algorithm

Greem uses a weighted engagement system.

### Post Score

Each interaction contributes points to a post.

```txt
Like    = 1 point
Comment = 3 points
Save    = 5 points
```

Formula:

```txt
post_score =
  likes * 1 +
  comments * 3 +
  saves * 5
```

Example:

```txt
10 likes
3 comments
2 saves

Score =
10 + (3 × 3) + (2 × 5)

Score = 29
```

---

### User Score

A user's leaderboard score is derived from all of their posts.

```txt
user_score =
  total_post_score /
  sqrt(total_posts + 1)
```

This normalization prevents users from dominating rankings simply by publishing a large number of low-quality posts.

Example:

```txt
total_post_score = 100
total_posts = 4

100 / sqrt(5)
≈ 44.72
```

---

## How Redis Is Used

PostgreSQL stores all application data and acts as the source of truth.

Redis is responsible only for rankings and real-time updates.

### Redis Sorted Sets

User rankings:

```txt
leaderboard:users:alltime
leaderboard:users:weekly
```

Post rankings:

```txt
leaderboard:posts:alltime
leaderboard:posts:weekly
```

Example:

```txt
leaderboard:users:alltime

user:alice  92.3
user:bob    74.1
user:john   63.5
```

Redis automatically keeps members sorted by score.

This allows extremely fast ranking queries.

Examples:

```redis
ZREVRANGE leaderboard:users:alltime 0 9 WITHSCORES
```

Get Top 10 users.

```redis
ZREVRANK leaderboard:users:alltime user:alice
```

Get a user's rank.

---

### Update Flow

When a user interacts with a post:

```txt
Like / Comment / Save
        ↓
Calculate score delta
        ↓
Update post score
        ↓
Update author's score
        ↓
Update Redis sorted sets
        ↓
Publish realtime event
        ↓
Clients receive leaderboard updates
```

The leaderboard updates incrementally rather than recalculating all rankings from scratch.

---

### Real-Time Updates

Greem uses Redis Pub/Sub to broadcast leaderboard changes.

```txt
leaderboard:updates
```

Clients subscribe through a Server-Sent Events (SSE) endpoint and receive updates whenever:

* A post score changes
* A user score changes
* A post is created
* A post is deleted

This provides near real-time leaderboard updates without polling.

---

## Available Commands

```bash
npm run dev
```

Start development server.

```bash
npm run build
```

Create production build.

```bash
npm run preview
```

Preview production build.

```bash
npm run lint
```

Run ESLint.

```bash
npm run typecheck
```

Run TypeScript checks.

---

## Contributing

Contributions are welcome.

Before opening a pull request:

```bash
npm run lint
npm run typecheck
```

Please keep pull requests focused on a single logical change.

For detailed contribution guidelines, branch naming conventions, and pull request requirements, see:

```txt
CONTRIBUTING.md
```
