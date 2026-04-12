# Contrato: Content Orchestrator Project Root

## Overview
Full-stack social media orchestration system with AI-driven ideation, blueprinting, and automated publishing.

## Key Modules
- **Ideation**: Uses 7-day Blitz Prompts to generate strategic content anchors.
- **Blueprint**: Converts ideation output into production-ready tactical instructions.
- **Generation**: AI-integrated media generation (Image/Video/Shorts).
- **Publishing**: Automated distribution via Composio to Instagram, TikTok, etc.
- **Triggers**: Scheduled marketing tasks via Trigger.dev.

## Tech Stack
- **Frontend**: Next.js (App Router, Tailwind, TypeScript).
- **Backend**: Express/Node.js (TypeScript).
- **Infrastructure**: Trigger.dev for cron/background jobs.
- **Persistence**: PostgreSQL + Prisma ORM.
- **AI Context**: Centralized logic in `/ai-context` for brand DNA and prompt templates.

## Rules & Constraints
1. **TypeScript Always**: No `any`.
2. **No Comments**: Files should be self-documenting. Use descriptive names.
3. **Spec First**: Features must be defined here before implementation.
4. **Temporary Tasks**: All scratch/experimental code goes to `/tmp`.
