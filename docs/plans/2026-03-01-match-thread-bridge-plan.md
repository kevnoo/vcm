# Match Thread Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bridge the existing web `MatchMessage` system with Discord match threads so messages flow both directions — web posts appear in Discord threads (via webhook with user identity), and Discord thread messages appear on the web match hub.

**Architecture:** Extend the existing `MatchMessage` model with source tracking and Discord metadata. The API posts to Discord via channel webhooks (one per schedule channel, targeting threads via `thread_id`). The bot captures all thread messages into `MatchMessage` with deduplication via `discordMessageId`.

**Tech Stack:** Prisma (schema migration), NestJS (API endpoints), discord.js `WebhookClient` (API-side posting), discord.js events (bot-side capture), React + TanStack Query (frontend)

---

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `apps/api/src/prisma/schema.prisma:198-210` (MatchMessage model)
- Modify: `apps/api/src/prisma/schema.prisma:26` (User matchMessages relation)
- Modify: `apps/api/src/prisma/schema.prisma:770-782` (DiscordChannelMapping model)

**Step 1: Add `MessageSource` enum and update `MatchMessage` model**

In `apps/api/src/prisma/schema.prisma`, replace the MatchMessage model (lines 198-210) with:

```prisma
// ─── Match Messages ────────────────────────────────────
model MatchMessage {
  id               String        @id @default(uuid())
  matchId          String
  authorId         String?
  content          String
  source           MessageSource @default(WEB)
  discordMessageId String?
  authorDiscordId  String?
  authorName       String?
  authorAvatarUrl  String?
  attachmentUrls   Json?
  createdAt        DateTime      @default(now())

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

Update the User relation (line 26) from `matchMessages MatchMessage[]` — no change needed since it's already a simple relation (making `authorId` optional doesn't break it).

**Step 2: Add `webhookUrl` field to `DiscordChannelMapping`**

In `apps/api/src/prisma/schema.prisma`, add `webhookUrl` to the DiscordChannelMapping model (after line 775):

```prisma
model DiscordChannelMapping {
  id               String             @id @default(uuid())
  competitionId    String
  discordGuildId   String
  discordChannelId String
  channelType      DiscordChannelType
  webhookUrl       String?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  competition Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)

  @@unique([competitionId, channelType])
}
```

**Step 3: Run the migration**

```bash
cd apps/api && npx prisma migrate dev --name match_thread_bridge
```

**Step 4: Generate client**

```bash
pnpm db:generate
```

**Step 5: Commit**

```bash
git add apps/api/src/prisma/schema.prisma apps/api/src/prisma/migrations/
git commit -m "feat: add message source tracking and webhook URL to schema"
```

---

### Task 2: Shared Types — MessageSource enum and MatchMessage update

**Files:**
- Create: `packages/shared/src/enums/message-source.enum.ts`
- Modify: `packages/shared/src/enums/index.ts:18` (add export)
- Modify: `packages/shared/src/types/match-scheduling.ts:5-12` (update MatchMessage)
- Modify: `packages/shared/src/types/match-scheduling.ts:36-38` (update CreateMatchMessageDto)

**Step 1: Create `MessageSource` enum**

Create `packages/shared/src/enums/message-source.enum.ts`:

```typescript
export enum MessageSource {
  WEB = 'WEB',
  DISCORD = 'DISCORD',
}
```

**Step 2: Export from enums index**

Add to `packages/shared/src/enums/index.ts`:

```typescript
export { MessageSource } from './message-source.enum';
```

**Step 3: Update `MatchMessage` interface**

In `packages/shared/src/types/match-scheduling.ts`, update the MatchMessage interface:

```typescript
import { TimeProposalStatus, MessageSource } from '../enums';
import { User } from './user';
import { Match } from './match';

export interface MatchMessage {
  id: string;
  matchId: string;
  authorId: string | null;
  content: string;
  source: MessageSource;
  discordMessageId?: string | null;
  authorDiscordId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  attachmentUrls?: string[] | null;
  author?: User | null;
  createdAt: string;
}
```

**Step 4: Update `CreateMatchMessageDto`**

In the same file, update:

```typescript
export interface CreateMatchMessageDto {
  content: string;
  attachmentUrls?: string[];
}
```

**Step 5: Export MessageSource from types index**

In `packages/shared/src/types/index.ts`, the `MessageSource` is already exported via the enums barrel. No change needed here — verify the enums re-export at the package level.

**Step 6: Build shared package**

```bash
pnpm build:shared
```

**Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat: add MessageSource enum and update MatchMessage types"
```

---

### Task 3: API — Update `CreateMatchMessageDto` validation

**Files:**
- Modify: `apps/api/src/matches/dto/create-match-message.dto.ts`

**Step 1: Add `attachmentUrls` to DTO**

```typescript
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateMatchMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
```

**Step 2: Commit**

```bash
git add apps/api/src/matches/dto/create-match-message.dto.ts
git commit -m "feat: add attachmentUrls to CreateMatchMessageDto"
```

---

### Task 4: API — Discord webhook posting utility

**Files:**
- Create: `apps/api/src/matches/discord-thread.service.ts`
- Modify: `apps/api/src/matches/matches.module.ts` (register new service)

**Step 1: Find the matches module**

Check `apps/api/src/matches/matches.module.ts` for how services are registered.

**Step 2: Create `DiscordThreadService`**

Create `apps/api/src/matches/discord-thread.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { WebhookClient } from 'discord.js';
import { PrismaService } from '../prisma/prisma.service';

interface ThreadPostOptions {
  threadId: string;
  content: string;
  username: string;
  avatarURL?: string;
  attachmentUrls?: string[];
}

interface ThreadPostResult {
  discordMessageId: string;
}

@Injectable()
export class DiscordThreadService {
  private readonly logger = new Logger(DiscordThreadService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Posts a message to a Discord match thread via webhook.
   * Finds the webhook URL from the competition's SCHEDULE channel mapping.
   */
  async postToThread(
    matchId: string,
    options: ThreadPostOptions,
  ): Promise<ThreadPostResult | null> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { round: true },
      });

      if (!match?.discordThreadId) return null;

      const mapping = await this.prisma.discordChannelMapping.findUnique({
        where: {
          competitionId_channelType: {
            competitionId: match.round.competitionId,
            channelType: 'SCHEDULE',
          },
        },
      });

      if (!mapping?.webhookUrl) return null;

      const webhook = new WebhookClient({ url: mapping.webhookUrl });

      const message = await webhook.send({
        content: options.content,
        username: options.username,
        avatarURL: options.avatarURL,
        threadId: match.discordThreadId,
      });

      webhook.destroy();

      return { discordMessageId: message.id };
    } catch (err) {
      this.logger.error(`Failed to post to thread for match ${matchId}:`, err);
      return null;
    }
  }
}
```

**Step 3: Register in matches module**

Add `DiscordThreadService` to the providers array in the matches module.

**Step 4: Commit**

```bash
git add apps/api/src/matches/discord-thread.service.ts apps/api/src/matches/matches.module.ts
git commit -m "feat: add DiscordThreadService for posting to match threads"
```

---

### Task 5: API — Update `MatchSchedulingService.createMessage` to post to Discord

**Files:**
- Modify: `apps/api/src/matches/match-scheduling.service.ts:66-82` (createMessage method)
- Modify: `apps/api/src/matches/match-scheduling.service.ts:1-9` (imports + constructor)

**Step 1: Inject `DiscordThreadService` and update `createMessage`**

Add `DiscordThreadService` to the constructor. Update `createMessage` to:
1. Save the message with `source: 'WEB'`
2. Post to Discord thread via `DiscordThreadService`
3. Update the message with the returned `discordMessageId`

```typescript
async createMessage(
  matchId: string,
  dto: CreateMatchMessageDto,
  user: AuthUser,
) {
  const match = await this.getMatchWithOwners(matchId);
  this.assertInvolvedOrAdmin(match, user);

  // Look up the user's Discord info for the webhook post
  const fullUser = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  const message = await this.prisma.matchMessage.create({
    data: {
      matchId,
      authorId: user.id,
      content: dto.content,
      source: 'WEB',
      authorDiscordId: fullUser?.discordId,
      authorName: fullUser?.discordUsername,
      authorAvatarUrl: fullUser?.discordAvatar
        ? `https://cdn.discordapp.com/avatars/${fullUser.discordId}/${fullUser.discordAvatar}.png`
        : undefined,
      attachmentUrls: dto.attachmentUrls ?? undefined,
    },
    include: { author: true },
  });

  // Post to Discord thread (fire-and-forget, don't block the response)
  if (match.discordThreadId) {
    this.discordThread
      .postToThread(matchId, {
        threadId: match.discordThreadId,
        content: dto.content,
        username: fullUser?.discordUsername ?? 'VCM User',
        avatarURL: fullUser?.discordAvatar
          ? `https://cdn.discordapp.com/avatars/${fullUser.discordId}/${fullUser.discordAvatar}.png`
          : undefined,
        attachmentUrls: dto.attachmentUrls,
      })
      .then((result) => {
        if (result) {
          this.prisma.matchMessage.update({
            where: { id: message.id },
            data: { discordMessageId: result.discordMessageId },
          });
        }
      })
      .catch((err) => {
        console.error('Failed to post to Discord thread:', err);
      });
  }

  return message;
}
```

**Step 2: Update `getMessages` response to include new fields**

No change needed — Prisma returns all fields by default.

**Step 3: Commit**

```bash
git add apps/api/src/matches/match-scheduling.service.ts
git commit -m "feat: post web messages to Discord thread via webhook"
```

---

### Task 6: Bot — Capture all thread messages into MatchMessage

**Files:**
- Modify: `apps/bot/src/events/message-create.ts` (expand to save all messages)

**Step 1: Update `onMessageCreate` to save text messages**

Replace the contents of `apps/bot/src/events/message-create.ts`:

```typescript
import type { Message } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { captureMedia } from '../services/media.service.js';

export async function onMessageCreate(message: Message, prisma: PrismaClient) {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only process messages in threads
  if (!message.channel.isThread()) return;

  // Check if this thread is a tracked match thread
  const match = await prisma.match.findFirst({
    where: { discordThreadId: message.channelId },
  });
  if (!match) return;

  // Deduplication: skip if this discordMessageId already exists
  // (e.g. a message posted from the web via webhook)
  const existing = await prisma.matchMessage.findFirst({
    where: { discordMessageId: message.id },
  });
  if (existing) return;

  // Find VCM user by Discord ID (nullable)
  const user = await prisma.user.findUnique({
    where: { discordId: message.author.id },
  });

  // Collect attachment URLs
  const attachmentUrls = message.attachments.size > 0
    ? [...message.attachments.values()].map((a) => a.url)
    : undefined;

  // Save as MatchMessage
  await prisma.matchMessage.create({
    data: {
      matchId: match.id,
      authorId: user?.id ?? null,
      content: message.content || '',
      source: 'DISCORD',
      discordMessageId: message.id,
      authorDiscordId: message.author.id,
      authorName: message.author.displayName,
      authorAvatarUrl: message.author.displayAvatarURL(),
      attachmentUrls: attachmentUrls ?? undefined,
    },
  });

  // Still capture media to MatchMedia table for the gallery
  const captured = await captureMedia(message, prisma);
  if (captured > 0) {
    await message.react('📸');
  }
}
```

**Step 2: Commit**

```bash
git add apps/bot/src/events/message-create.ts
git commit -m "feat: capture all Discord thread messages into MatchMessage"
```

---

### Task 7: Bot — Webhook deduplication for web-originated messages

The deduplication logic is already in Task 6 (checking `discordMessageId` before saving). However, messages posted via the API webhook will come from the webhook bot, not a real user — so `message.author.bot` will be `true` and they'll be skipped by the first guard.

No additional work needed. The `if (message.author.bot) return;` line in `onMessageCreate` naturally prevents the bot from re-capturing webhook-posted messages.

---

### Task 8: Bot — Setup command for channel webhook creation

**Files:**
- Modify: `apps/bot/src/commands/setup.ts` (add `create-webhook` subcommand or auto-create on channel mapping)

**Step 1: Add webhook auto-creation to the `channel` subcommand**

When a user maps a SCHEDULE channel via `/setup channel`, also create a webhook for that channel and store the URL in `DiscordChannelMapping.webhookUrl`.

In `apps/bot/src/commands/setup.ts`, after the `discordChannelMapping.upsert` call (around line 100-114), add:

```typescript
// Auto-create webhook for SCHEDULE channels (used for thread message bridge)
if (channelType === 'SCHEDULE') {
  try {
    const textChannel = channel as import('discord.js').TextChannel;
    const webhooks = await textChannel.fetchWebhooks();
    let webhook = webhooks.find((w) => w.name === 'VCM Thread Bridge');

    if (!webhook) {
      webhook = await textChannel.createWebhook({ name: 'VCM Thread Bridge' });
    }

    await prisma.discordChannelMapping.update({
      where: {
        competitionId_channelType: { competitionId, channelType },
      },
      data: { webhookUrl: webhook.url },
    });
  } catch (err) {
    console.error('Failed to create webhook for SCHEDULE channel:', err);
    // Non-fatal: channel mapping still works, just no thread bridge
  }
}
```

Also update the response message to indicate webhook status.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/setup.ts
git commit -m "feat: auto-create webhook when mapping SCHEDULE channels"
```

---

### Task 9: Frontend — Update ConversationSection for bidirectional messages

**Files:**
- Modify: `apps/web/src/routes/matches/hub.tsx:435-539` (ConversationSection component)

**Step 1: Update ConversationSection to show source, avatars, and attachments**

Key changes:
- Show author avatar (from `authorAvatarUrl` or derive from `author.discordAvatar`)
- Show a source badge (small Discord icon for DISCORD messages)
- Handle nullable `authorId` — use `authorName` for display when no VCM user
- Render `attachmentUrls` as inline thumbnails
- Show `authorName` instead of only `author?.discordUsername`

```tsx
function ConversationSection({
  matchId,
  messages,
  userId,
}: {
  matchId: string;
  messages: MatchMessage[];
  userId?: string;
}) {
  const [messageText, setMessageText] = useState('');
  const sendMessage = useSendMessage(matchId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;
    sendMessage.mutate(
      { content: text },
      { onSuccess: () => setMessageText('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAuthorName = (msg: MatchMessage) =>
    msg.author?.discordUsername ?? msg.authorName ?? 'Unknown';

  const getAvatarUrl = (msg: MatchMessage) => {
    if (msg.authorAvatarUrl) return msg.authorAvatarUrl;
    if (msg.author?.discordAvatar && msg.author?.discordId) {
      return `https://cdn.discordapp.com/avatars/${msg.author.discordId}/${msg.author.discordAvatar}.png?size=64`;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900">Conversation</h3>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center mt-8">
            No messages yet. Start the conversation to coordinate your match.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.authorId === userId;
          const avatarUrl = getAvatarUrl(msg);
          const authorName = getAuthorName(msg);
          const attachments = (msg.attachmentUrls ?? []) as string[];

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={authorName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[70%]`}>
                {!isOwn && (
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs font-medium text-gray-500">
                      {authorName}
                    </p>
                    {msg.source === 'DISCORD' && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-600 font-medium">
                        Discord
                      </span>
                    )}
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={url}
                            alt="attachment"
                            className="max-h-32 rounded"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-right text-gray-400' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !messageText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/matches/hub.tsx
git commit -m "feat: update conversation UI with avatars, source badges, and attachments"
```

---

### Task 10: Install discord.js in the API

**Files:**
- Modify: `apps/api/package.json`

**Step 1: Add discord.js dependency**

The API needs `discord.js` for `WebhookClient`. Install it:

```bash
pnpm --filter @vcm/api add discord.js
```

**Step 2: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore: add discord.js to API for webhook posting"
```

Note: This should be done before Task 4 (DiscordThreadService) since it imports from discord.js.

---

### Task Order Summary

Execute in this order (dependency-aware):

1. **Task 10** — Install discord.js in API (prerequisite for Task 4)
2. **Task 1** — Prisma schema migration
3. **Task 2** — Shared types update
4. **Task 3** — API DTO update
5. **Task 4** — DiscordThreadService (new service)
6. **Task 5** — Update createMessage to post to Discord
7. **Task 6** — Bot: capture all thread messages
8. **Task 8** — Bot: webhook auto-creation on /setup
9. **Task 9** — Frontend: update ConversationSection

Task 7 is a no-op (deduplication is handled naturally).
