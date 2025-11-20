# Express TypeScript User API — Advanced Caching, Rate Limiting, Async Processing

## Overview
This repository contains an Express.js API written in TypeScript that serves user data using:
- An in-memory LRU cache with TTL and background cleanup
- Per-IP rate limiting (1-minute and 10-second token buckets for burst handling)
- An asynchronous queue for simulated database calls with concurrency control
- Concurrent request deduplication (requests waiting for a single fetch)
- Endpoints: `GET /users/:id`, `POST /users`, `DELETE /cache`, `GET /cache-status`, `GET /health`

## Requirements implemented
- TypeScript + Express
- LRU cache (TTL = 60s), cache stats and background stale cleanup
- Concurrent dedupe for same user id
- Queue-based asynchronous DB simulation (200ms)
- Rate limit: max 10 requests per minute and burst 5 requests per 10s -> 429 on exceed
- Manual cache clear and cache-status endpoints
- User creation endpoint which caches new user

## Project structure
