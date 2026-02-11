# Benito Bot - Twitch ChatGPT Bot

## Overview
A Twitch chat bot named "Benito" that responds to VIP/mod/broadcaster messages using OpenAI's ChatGPT. The bot has a distinct personality (Andalusian who thinks he knows Italian) and uses better-sqlite3 for message memory.

## Project Architecture
- **Runtime**: Node.js 20 (ESM modules)
- **Database**: SQLite via better-sqlite3 (`memoria.db`)
- **APIs**: OpenAI (ChatGPT), Twitch (tmi.js)
- **Entry point**: `index.js`

### Key Files
- `index.js` - Main bot entry, connects to Twitch and handles messages
- `chatgpt.js` - OpenAI integration for generating responses
- `memory.js` - Message history storage/retrieval
- `db.js` - SQLite database setup and connection
- `permissions.js` - Checks if a user has VIP/mod/broadcaster permissions

## Required Environment Variables (Secrets)
- `OPENAI_API_KEY` - OpenAI API key for ChatGPT
- `BOT_USERNAME` - Twitch bot username
- `BOT_OAUTH` - Twitch OAuth token (format: oauth:xxxxx)
- `CHANNEL` - Twitch channel name to join

## Workflow
- **Benito Bot** - Runs `node index.js` (console output)

## Deployment
- Deployed as a VM (always-on) since it's a long-running bot process
