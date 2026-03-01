# Bidirectional Match Thread Bridge

**Date:** 2026-03-01
**Status:** Approved

## Problem

The web app has a match messaging system (`MatchMessage`) and Discord has match threads, but they are isolated. Users chatting on the web app don't see Discord thread messages, and vice versa.

## Solution

Bridge the existing `MatchMessage` system with Discord match threads so messages flow both directions:

- **Web → Discord**: Messages sent from the match hub page are posted to the Discord thread via webhook, appearing with the user's Discord name and avatar.
- **Discord → Web**: Messages posted in Discord match threads are saved as `MatchMessage` records and displayed on the match hub page.

## Design

### Schema Changes (`MatchMessage`)

Extend the existing model:

```prisma
model MatchMessage {
  id               String            @id @default(uuid())
  matchId          String
  authorId         String?           // nullable — Discord users without VCM accounts
  content          String
  source           MessageSource     @default(WEB)
  discordMessageId String?           // for deduplication
  authorDiscordId  String?           // Discord user ID (for non-VCM users)
  authorName       String?           // display name at time of posting
  authorAvatarUrl  String?           // avatar URL at time of posting
  attachmentUrls   Json?             // JSON array of attachment URLs
  createdAt        DateTime          @default(now())

  match  Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  author User? @relation(fields: [authorId], references: [id])

  @@index([matchId, createdAt])
  @@index([discordMessageId])
}

enum MessageSource {
  WEB
  DISCORD
}
```

Key changes from current schema:
- `authorId` becomes optional (nullable)
- New fields: `source`, `discordMessageId`, `authorDiscordId`, `authorName`, `authorAvatarUrl`, `attachmentUrls`
- New `MessageSource` enum

### Web → Discord Flow

1. User sends message on match hub page (existing `POST /matches/:matchId/scheduling/messages`)
2. API saves `MatchMessage` with `source: WEB`
3. API looks up the match's `discordThreadId`
4. API fetches the channel webhook URL from `DiscordChannelMapping` or `LeagueSetting`
5. API posts to Discord via webhook with:
   - `content`: the message text
   - `username`: user's `discordUsername`
   - `avatarURL`: user's `discordAvatar` (Discord CDN URL)
   - `threadId`: the match's `discordThreadId`
6. API saves the returned Discord message ID on the `MatchMessage` for deduplication

**Webhook strategy**: One webhook per schedule channel (not per thread). Discord webhooks can target specific threads via the `thread_id` parameter. Store the webhook URL on `DiscordChannelMapping` or as a new field on the channel mapping.

**Image uploads from web**: The `createMessage` endpoint accepts optional file uploads. Files are posted to Discord via the webhook (Discord hosts them), and the resulting CDN URLs are stored in `attachmentUrls`.

### Discord → Web Flow

1. User posts message in a Discord match thread
2. Bot's `onMessageCreate` fires (already listens to threads)
3. Bot checks if the thread is a tracked match thread (existing logic)
4. Bot creates a `MatchMessage` record:
   - `source: DISCORD`
   - `discordMessageId`: the Discord message ID
   - `authorId`: VCM user ID if found by `discordId`, otherwise null
   - `authorDiscordId`: always populated
   - `authorName`: `message.author.displayName`
   - `authorAvatarUrl`: `message.author.displayAvatarURL()`
   - `content`: message text
   - `attachmentUrls`: array of attachment URLs (if any)
5. Existing media capture (`captureMedia`) continues to run for the `MatchMedia` gallery

**Deduplication**: When the bot sees a message in a thread, it checks `discordMessageId` to avoid duplicating messages that were originally sent from the web (which already have a `MatchMessage` record). Messages posted via webhook have a `discordMessageId` stored — the bot skips those.

### Frontend Changes

- Messages display author avatar (from `authorAvatarUrl` or `author.discordAvatar`)
- Source indicator: small Discord/Web icon on each message
- Image upload button in the message input area
- Attachment thumbnails rendered inline within messages
- Non-VCM users shown by `authorName` with no link to a profile

### API Changes

- `createMessage` in `MatchSchedulingService`: after DB insert, post to Discord webhook
- `CreateMatchMessageDto`: add optional `attachments` (file upload)
- New utility: `postToThreadWebhook(threadId, content, username, avatarUrl, attachments?)`
- `getMessages` response includes new fields (`source`, `authorName`, `authorAvatarUrl`, `attachmentUrls`)

### Webhook Management

- Store webhook URL on `DiscordChannelMapping` (new `webhookUrl` field) or create automatically
- The bot's `/setup` command (which maps channels) could create the webhook automatically when mapping a schedule channel
- Alternatively, a one-time setup via `/setup` that creates and stores the webhook

### Append-Only

Messages are immutable once sent. No edit/delete sync between platforms.

## Out of Scope

- Real-time push (WebSocket/SSE) — messages load on page refresh
- Edit/delete synchronization
- Rich embeds from Discord rendered on web (just show text + attachments)
- Typing indicators
