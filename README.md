# Entrepreneur Pitching and Matching System

This repository uses Turborepo to organize the project as a monorepo.

## Workspace Structure

- apps/web: Frontend app (currently minimal HTTP server)
- apps/api: Backend API app (currently minimal HTTP server)
- packages/shared: Shared types and utilities
- packages/db: Database schema and client utilities
- packages/config: Shared lint and TypeScript config

## Run Locally

1. Install dependencies:
   pnpm install
2. Start all apps in dev mode:
   pnpm dev

Web runs on port 3000.
API runs on port 4000.

## Monday Component Goal

This commit is the Foundation Component (Turborepo setup) for your Clean Streak.
