# Mekong Sight AI

IoT & AI Decision Support System for Shrimp-Rice Rotation Farming in Mekong Delta.

## Architecture

- **Frontend**: Flutter Mobile App, React Admin Dashboard
- **Backend**: Microservices (Node.js, Python)
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Docker, Traefik, Redis

## Structure

- `packages/`: Shared libraries
- `Backend/service/`: Microservices
  - `auth-service`: Authentication & User Management
  - `farm-service`: Farm Management & Season Logic
  - `iot-service`: Device Connectivity & Data Processing
  - `ai-service`: Computer Vision & Prediction Models
  - `notification-service`: Multi-channel Notifications

## Getting Started

1. Copy `.env.example` to `.env`
2. Run `npm install`
3. Run `docker-compose up`

## Development

Use `npm run dev` to start individual services in watch mode.
