# Player Game Stats Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-match player summary stats with entry, dispute, delegation, and aggregation — matching what EAFC26 produces after each game.

**Architecture:** New `MatchPlayerGameStats` wide table (one row per player per match), `StatDispute` for per-field disputes, `StatDelegate` for persistent delegation. New `PlayerGameStatsModule` in NestJS with controller/service/DTOs. New shared types/enums in `@vcm/shared`. Frontend hooks and UI for entry, review, and aggregation.

**Tech Stack:** Prisma (PostgreSQL), NestJS, React 19, TanStack Query, TailwindCSS, class-validator

---

### Task 1: Add Prisma schema — enums and models

**Files:**
- Modify: `apps/api/src/prisma/schema.prisma`

**Step 1: Add new enums to schema.prisma**

After the existing `ResultStatus` enum block (line ~173), add:

```prisma
enum GameStatsStatus {
  PENDING
  CONFIRMED
  DISPUTED
  RESOLVED
}

enum StatDisputeStatus {
  OPEN
  RESOLVED
}
```

**Step 2: Add MatchPlayerGameStats model**

After the `MatchPlayerStat` model block (line ~258), add:

```prisma
// ─── Player Game Stats (per-match summary) ────────────────
model MatchPlayerGameStats {
  id              String          @id @default(uuid())
  matchId         String
  playerId        String
  teamId          String
  submittedById   String
  position        Position
  isSubstitute    Boolean         @default(false)
  rating          Float
  goals           Int             @default(0)
  assists         Int             @default(0)
  shots           Int             @default(0)
  shotAccuracy    Float           @default(0)
  passes          Int             @default(0)
  passAccuracy    Float           @default(0)
  dribbles        Int             @default(0)
  dribbleSuccessRate Float        @default(0)
  tackles         Int             @default(0)
  tackleSuccessRate Float         @default(0)
  offsides        Int             @default(0)
  foulsCommitted  Int             @default(0)
  possessionsWon  Int             @default(0)
  possessionsLost Int             @default(0)
  minutesPlayed   Int             @default(0)
  yellowCards     Int             @default(0)
  redCards        Int             @default(0)
  // GK-only fields (nullable)
  shotsAgainst    Int?
  shotsOnTarget   Int?
  saves           Int?
  goalsConceded   Int?
  saveSuccessRate Float?
  cleanSheet      Boolean?
  status          GameStatsStatus @default(PENDING)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  match       Match   @relation(fields: [matchId], references: [id], onDelete: Cascade)
  player      Player  @relation(fields: [playerId], references: [id])
  team        Team    @relation(fields: [teamId], references: [id])
  submittedBy User    @relation("GameStatsSubmittedBy", fields: [submittedById], references: [id])
  disputes    StatDispute[]

  @@unique([matchId, playerId])
  @@index([matchId])
  @@index([playerId])
  @@index([teamId])
}
```

**Step 3: Add StatDispute model**

```prisma
model StatDispute {
  id             String             @id @default(uuid())
  gameStatsId    String
  fieldName      String
  disputedById   String
  reason         String?
  status         StatDisputeStatus  @default(OPEN)
  resolvedById   String?
  resolutionNote String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  gameStats   MatchPlayerGameStats @relation(fields: [gameStatsId], references: [id], onDelete: Cascade)
  disputedBy  User                 @relation("StatDisputedBy", fields: [disputedById], references: [id])
  resolvedBy  User?                @relation("StatResolvedBy", fields: [resolvedById], references: [id])
}
```

**Step 4: Add StatDelegate model**

```prisma
model StatDelegate {
  id             String   @id @default(uuid())
  teamId         String
  delegateUserId String
  createdAt      DateTime @default(now())

  team     Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  delegate User @relation("StatDelegateUser", fields: [delegateUserId], references: [id])

  @@unique([teamId, delegateUserId])
}
```

**Step 5: Add reverse relations to existing models**

Add to the `User` model (after `respondedProposals` line):
```prisma
  submittedGameStats MatchPlayerGameStats[] @relation("GameStatsSubmittedBy")
  disputedStats      StatDispute[]          @relation("StatDisputedBy")
  resolvedStats      StatDispute[]          @relation("StatResolvedBy")
  statDelegations    StatDelegate[]         @relation("StatDelegateUser")
```

Add to the `Team` model (after `matchSubstitutions` line):
```prisma
  playerGameStats MatchPlayerGameStats[]
  statDelegates   StatDelegate[]
```

Add to the `Match` model (after `timeProposals` line):
```prisma
  playerGameStats MatchPlayerGameStats[]
```

Add to the `Player` model (after `matchStats` line):
```prisma
  gameStats MatchPlayerGameStats[]
```

**Step 6: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name add-player-game-stats
```

Expected: Migration created and applied successfully.

**Step 7: Commit**

```bash
git add apps/api/src/prisma/schema.prisma apps/api/src/prisma/migrations/
git commit -m "feat: add Prisma models for player game stats, disputes, and delegates"
```

---

### Task 2: Add shared enums and types

**Files:**
- Create: `packages/shared/src/enums/game-stats-status.enum.ts`
- Create: `packages/shared/src/enums/stat-dispute-status.enum.ts`
- Modify: `packages/shared/src/enums/index.ts`
- Modify: `packages/shared/src/types/game-stats.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Create GameStatsStatus enum**

```typescript
// packages/shared/src/enums/game-stats-status.enum.ts
export enum GameStatsStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
}
```

**Step 2: Create StatDisputeStatus enum**

```typescript
// packages/shared/src/enums/stat-dispute-status.enum.ts
export enum StatDisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}
```

**Step 3: Export new enums from index**

Add to `packages/shared/src/enums/index.ts`:
```typescript
export { GameStatsStatus } from './game-stats-status.enum';
export { StatDisputeStatus } from './stat-dispute-status.enum';
```

**Step 4: Add new types to game-stats.ts**

Append to `packages/shared/src/types/game-stats.ts`:

```typescript
import { GameStatsStatus, StatDisputeStatus } from '../enums';
import { User } from './user';
import { Team } from './team';

// ─── Player Game Stats (per-match summary) ────────────────

export interface MatchPlayerGameStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  submittedById: string;
  position: Position;
  isSubstitute: boolean;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotAccuracy: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  dribbleSuccessRate: number;
  tackles: number;
  tackleSuccessRate: number;
  offsides: number;
  foulsCommitted: number;
  possessionsWon: number;
  possessionsLost: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  // GK-only
  shotsAgainst: number | null;
  shotsOnTarget: number | null;
  saves: number | null;
  goalsConceded: number | null;
  saveSuccessRate: number | null;
  cleanSheet: boolean | null;
  status: GameStatsStatus;
  createdAt: string;
  updatedAt: string;
  player?: Player;
  team?: Team;
  submittedBy?: User;
  disputes?: StatDispute[];
}

export interface StatDispute {
  id: string;
  gameStatsId: string;
  fieldName: string;
  disputedById: string;
  reason: string | null;
  status: StatDisputeStatus;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  disputedBy?: User;
  resolvedBy?: User | null;
}

export interface StatDelegate {
  id: string;
  teamId: string;
  delegateUserId: string;
  createdAt: string;
  delegate?: User;
}

// ─── DTOs ────────────────

export interface PlayerGameStatEntry {
  playerId: string;
  position: Position;
  isSubstitute: boolean;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotAccuracy: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  dribbleSuccessRate: number;
  tackles: number;
  tackleSuccessRate: number;
  offsides: number;
  foulsCommitted: number;
  possessionsWon: number;
  possessionsLost: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  // GK-only (optional)
  shotsAgainst?: number;
  shotsOnTarget?: number;
  saves?: number;
  goalsConceded?: number;
  saveSuccessRate?: number;
  cleanSheet?: boolean;
}

export interface SubmitGameStatsDto {
  teamId: string;
  stats: PlayerGameStatEntry[];
}

export interface DisputeStatFieldDto {
  fields: {
    fieldName: string;
    reason?: string;
  }[];
}

export interface ResolveStatDisputeDto {
  correctedValue?: number | boolean;
  note?: string;
}

export interface ConfirmGameStatsDto {
  teamId: string;
}

export interface AddStatDelegateDto {
  delegateUserId: string;
}

// ─── Aggregation types ────────────────

export interface PlayerSeasonStats {
  playerId: string;
  competitionId: string;
  matchesPlayed: number;
  avgRating: number;
  totalGoals: number;
  totalAssists: number;
  totalShots: number;
  avgShotAccuracy: number;
  totalPasses: number;
  avgPassAccuracy: number;
  totalDribbles: number;
  avgDribbleSuccessRate: number;
  totalTackles: number;
  avgTackleSuccessRate: number;
  totalOffsides: number;
  totalFoulsCommitted: number;
  totalPossessionsWon: number;
  totalPossessionsLost: number;
  totalMinutesPlayed: number;
  totalYellowCards: number;
  totalRedCards: number;
  // GK
  totalSaves: number | null;
  totalGoalsConceded: number | null;
  avgSaveSuccessRate: number | null;
  totalCleanSheets: number | null;
}

export interface LeaderboardEntry {
  playerId: string;
  player?: Player;
  team?: Team;
  value: number;
}
```

**Step 5: Export new types from index**

Add to `packages/shared/src/types/index.ts`:
```typescript
export type {
  MatchPlayerGameStats,
  StatDispute,
  StatDelegate,
  PlayerGameStatEntry,
  SubmitGameStatsDto,
  DisputeStatFieldDto,
  ResolveStatDisputeDto,
  ConfirmGameStatsDto,
  AddStatDelegateDto,
  PlayerSeasonStats,
  LeaderboardEntry,
} from './game-stats';
```

**Step 6: Verify build**

```bash
cd packages/shared && pnpm build
```

Expected: Build succeeds with no errors.

**Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared types and enums for player game stats"
```

---

### Task 3: Backend — StatDelegate module (delegation)

**Files:**
- Create: `apps/api/src/stat-delegates/stat-delegates.module.ts`
- Create: `apps/api/src/stat-delegates/stat-delegates.controller.ts`
- Create: `apps/api/src/stat-delegates/stat-delegates.service.ts`
- Create: `apps/api/src/stat-delegates/dto/add-stat-delegate.dto.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Create the DTO**

```typescript
// apps/api/src/stat-delegates/dto/add-stat-delegate.dto.ts
import { IsString } from 'class-validator';

export class AddStatDelegateDto {
  @IsString()
  delegateUserId: string;
}
```

**Step 2: Create the service**

```typescript
// apps/api/src/stat-delegates/stat-delegates.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddStatDelegateDto } from './dto/add-stat-delegate.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class StatDelegatesService {
  constructor(private prisma: PrismaService) {}

  async addDelegate(teamId: string, dto: AddStatDelegateDto, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can manage delegates');
    }

    // Verify delegate user exists
    await this.prisma.user.findUniqueOrThrow({
      where: { id: dto.delegateUserId },
    });

    try {
      return await this.prisma.statDelegate.create({
        data: {
          teamId,
          delegateUserId: dto.delegateUserId,
        },
        include: { delegate: true },
      });
    } catch {
      throw new ConflictException('User is already a delegate for this team');
    }
  }

  async removeDelegate(teamId: string, userId: string, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can manage delegates');
    }

    const delegate = await this.prisma.statDelegate.findUnique({
      where: { teamId_delegateUserId: { teamId, delegateUserId: userId } },
    });

    if (!delegate) {
      throw new NotFoundException('Delegate not found');
    }

    await this.prisma.statDelegate.delete({
      where: { id: delegate.id },
    });

    return { success: true };
  }

  async listDelegates(teamId: string, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can view delegates');
    }

    return this.prisma.statDelegate.findMany({
      where: { teamId },
      include: { delegate: true },
    });
  }

  /** Check if a user is a delegate for a given team */
  async isDelegate(teamId: string, userId: string): Promise<boolean> {
    const delegate = await this.prisma.statDelegate.findUnique({
      where: { teamId_delegateUserId: { teamId, delegateUserId: userId } },
    });
    return !!delegate;
  }
}
```

**Step 3: Create the controller**

```typescript
// apps/api/src/stat-delegates/stat-delegates.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StatDelegatesService } from './stat-delegates.service';
import { AddStatDelegateDto } from './dto/add-stat-delegate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('teams/:teamId/delegates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatDelegatesController {
  constructor(private statDelegatesService: StatDelegatesService) {}

  @Post()
  add(
    @Param('teamId') teamId: string,
    @Body() dto: AddStatDelegateDto,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.addDelegate(teamId, dto, user);
  }

  @Delete(':userId')
  remove(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.removeDelegate(teamId, userId, user);
  }

  @Get()
  list(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.listDelegates(teamId, user);
  }
}
```

**Step 4: Create the module**

```typescript
// apps/api/src/stat-delegates/stat-delegates.module.ts
import { Module } from '@nestjs/common';
import { StatDelegatesController } from './stat-delegates.controller';
import { StatDelegatesService } from './stat-delegates.service';

@Module({
  controllers: [StatDelegatesController],
  providers: [StatDelegatesService],
  exports: [StatDelegatesService],
})
export class StatDelegatesModule {}
```

**Step 5: Register in AppModule**

Add import and module to `apps/api/src/app.module.ts`:
```typescript
import { StatDelegatesModule } from './stat-delegates/stat-delegates.module';
// Add StatDelegatesModule to imports array
```

**Step 6: Verify compilation**

```bash
cd apps/api && pnpm build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add apps/api/src/stat-delegates/ apps/api/src/app.module.ts
git commit -m "feat: add stat delegation module (add/remove/list delegates per team)"
```

---

### Task 4: Backend — Player game stats submission and retrieval

**Files:**
- Create: `apps/api/src/player-game-stats/player-game-stats.module.ts`
- Create: `apps/api/src/player-game-stats/player-game-stats.controller.ts`
- Create: `apps/api/src/player-game-stats/player-game-stats.service.ts`
- Create: `apps/api/src/player-game-stats/dto/submit-game-stats.dto.ts`
- Create: `apps/api/src/player-game-stats/dto/confirm-game-stats.dto.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Create SubmitGameStatsDto**

```typescript
// apps/api/src/player-game-stats/dto/submit-game-stats.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

enum Position {
  GK = 'GK', RB = 'RB', CB = 'CB', LB = 'LB',
  CDM = 'CDM', CM = 'CM', CAM = 'CAM',
  RM = 'RM', LM = 'LM', RW = 'RW', LW = 'LW',
  CF = 'CF', ST = 'ST',
}

class PlayerGameStatEntryDto {
  @IsString()
  playerId: string;

  @IsEnum(Position)
  position: Position;

  @IsBoolean()
  isSubstitute: boolean;

  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @IsInt() @Min(0)
  goals: number;

  @IsInt() @Min(0)
  assists: number;

  @IsInt() @Min(0)
  shots: number;

  @IsNumber() @Min(0) @Max(100)
  shotAccuracy: number;

  @IsInt() @Min(0)
  passes: number;

  @IsNumber() @Min(0) @Max(100)
  passAccuracy: number;

  @IsInt() @Min(0)
  dribbles: number;

  @IsNumber() @Min(0) @Max(100)
  dribbleSuccessRate: number;

  @IsInt() @Min(0)
  tackles: number;

  @IsNumber() @Min(0) @Max(100)
  tackleSuccessRate: number;

  @IsInt() @Min(0)
  offsides: number;

  @IsInt() @Min(0)
  foulsCommitted: number;

  @IsInt() @Min(0)
  possessionsWon: number;

  @IsInt() @Min(0)
  possessionsLost: number;

  @IsInt() @Min(0) @Max(120)
  minutesPlayed: number;

  @IsInt() @Min(0)
  yellowCards: number;

  @IsInt() @Min(0)
  redCards: number;

  // GK-only (optional)
  @IsOptional() @IsInt() @Min(0)
  shotsAgainst?: number;

  @IsOptional() @IsInt() @Min(0)
  shotsOnTarget?: number;

  @IsOptional() @IsInt() @Min(0)
  saves?: number;

  @IsOptional() @IsInt() @Min(0)
  goalsConceded?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  saveSuccessRate?: number;

  @IsOptional() @IsBoolean()
  cleanSheet?: boolean;
}

export class SubmitGameStatsDto {
  @IsString()
  teamId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerGameStatEntryDto)
  stats: PlayerGameStatEntryDto[];
}
```

**Step 2: Create ConfirmGameStatsDto**

```typescript
// apps/api/src/player-game-stats/dto/confirm-game-stats.dto.ts
import { IsString } from 'class-validator';

export class ConfirmGameStatsDto {
  @IsString()
  teamId: string;
}
```

**Step 3: Create the service**

```typescript
// apps/api/src/player-game-stats/player-game-stats.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatDelegatesService } from '../stat-delegates/stat-delegates.service';
import { SubmitGameStatsDto } from './dto/submit-game-stats.dto';
import { ConfirmGameStatsDto } from './dto/confirm-game-stats.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class PlayerGameStatsService {
  constructor(
    private prisma: PrismaService,
    private statDelegatesService: StatDelegatesService,
  ) {}

  async getMatchGameStats(matchId: string) {
    return this.prisma.matchPlayerGameStats.findMany({
      where: { matchId },
      include: {
        player: true,
        submittedBy: true,
        disputes: { include: { disputedBy: true, resolvedBy: true } },
      },
      orderBy: [{ teamId: 'asc' }, { position: 'asc' }],
    });
  }

  async submit(matchId: string, dto: SubmitGameStatsDto, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    // Result must be confirmed or resolved
    if (!match.result || !['CONFIRMED', 'RESOLVED'].includes(match.result.status)) {
      throw new BadRequestException(
        'Match result must be confirmed or resolved before submitting game stats',
      );
    }

    // Validate team is part of this match
    if (match.homeTeamId !== dto.teamId && match.awayTeamId !== dto.teamId) {
      throw new BadRequestException('Team is not part of this match');
    }

    // Check permissions: admin, team owner, or delegate
    const isAdmin = user.role === 'ADMIN';
    const team = dto.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
    const isTeamOwner = team.ownerId === user.id;
    const isDelegate = await this.statDelegatesService.isDelegate(dto.teamId, user.id);

    if (!isAdmin && !isTeamOwner && !isDelegate) {
      throw new ForbiddenException(
        'Only admins, the team owner, or a delegate can submit game stats',
      );
    }

    // Check if stats already submitted for this team in this match
    const existing = await this.prisma.matchPlayerGameStats.findFirst({
      where: { matchId, teamId: dto.teamId },
    });

    if (existing) {
      throw new ConflictException('Game stats already submitted for this team in this match');
    }

    const status = isAdmin ? 'CONFIRMED' : 'PENDING';

    const created = await this.prisma.$transaction(
      dto.stats.map((stat) =>
        this.prisma.matchPlayerGameStats.create({
          data: {
            matchId,
            playerId: stat.playerId,
            teamId: dto.teamId,
            submittedById: user.id,
            position: stat.position,
            isSubstitute: stat.isSubstitute,
            rating: stat.rating,
            goals: stat.goals,
            assists: stat.assists,
            shots: stat.shots,
            shotAccuracy: stat.shotAccuracy,
            passes: stat.passes,
            passAccuracy: stat.passAccuracy,
            dribbles: stat.dribbles,
            dribbleSuccessRate: stat.dribbleSuccessRate,
            tackles: stat.tackles,
            tackleSuccessRate: stat.tackleSuccessRate,
            offsides: stat.offsides,
            foulsCommitted: stat.foulsCommitted,
            possessionsWon: stat.possessionsWon,
            possessionsLost: stat.possessionsLost,
            minutesPlayed: stat.minutesPlayed,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards,
            shotsAgainst: stat.shotsAgainst ?? null,
            shotsOnTarget: stat.shotsOnTarget ?? null,
            saves: stat.saves ?? null,
            goalsConceded: stat.goalsConceded ?? null,
            saveSuccessRate: stat.saveSuccessRate ?? null,
            cleanSheet: stat.cleanSheet ?? null,
            status,
          },
          include: { player: true },
        }),
      ),
    );

    return created;
  }

  async confirm(matchId: string, dto: ConfirmGameStatsDto, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    // Must be admin or the opposing team's owner
    const isAdmin = user.role === 'ADMIN';
    const submittedTeam = dto.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
    const opposingTeam = dto.teamId === match.homeTeamId ? match.awayTeam : match.homeTeam;
    const isOpposingOwner = opposingTeam.ownerId === user.id;

    if (!isAdmin && !isOpposingOwner) {
      throw new ForbiddenException(
        'Only admins or the opposing team owner can confirm game stats',
      );
    }

    return this.prisma.matchPlayerGameStats.updateMany({
      where: {
        matchId,
        teamId: dto.teamId,
        status: 'PENDING',
      },
      data: { status: 'CONFIRMED' },
    });
  }
}
```

**Step 4: Create the controller**

```typescript
// apps/api/src/player-game-stats/player-game-stats.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlayerGameStatsService } from './player-game-stats.service';
import { SubmitGameStatsDto } from './dto/submit-game-stats.dto';
import { ConfirmGameStatsDto } from './dto/confirm-game-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayerGameStatsController {
  constructor(private service: PlayerGameStatsService) {}

  @Get('matches/:matchId/game-stats')
  getMatchGameStats(@Param('matchId') matchId: string) {
    return this.service.getMatchGameStats(matchId);
  }

  @Post('matches/:matchId/game-stats')
  submit(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitGameStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submit(matchId, dto, user);
  }

  @Patch('matches/:matchId/game-stats/confirm')
  confirm(
    @Param('matchId') matchId: string,
    @Body() dto: ConfirmGameStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.confirm(matchId, dto, user);
  }
}
```

**Step 5: Create the module**

```typescript
// apps/api/src/player-game-stats/player-game-stats.module.ts
import { Module } from '@nestjs/common';
import { PlayerGameStatsController } from './player-game-stats.controller';
import { PlayerGameStatsService } from './player-game-stats.service';
import { StatDelegatesModule } from '../stat-delegates/stat-delegates.module';

@Module({
  imports: [StatDelegatesModule],
  controllers: [PlayerGameStatsController],
  providers: [PlayerGameStatsService],
  exports: [PlayerGameStatsService],
})
export class PlayerGameStatsModule {}
```

**Step 6: Register in AppModule**

Add import and module to `apps/api/src/app.module.ts`:
```typescript
import { PlayerGameStatsModule } from './player-game-stats/player-game-stats.module';
// Add PlayerGameStatsModule to imports array
```

**Step 7: Verify compilation**

```bash
cd apps/api && pnpm build
```

**Step 8: Commit**

```bash
git add apps/api/src/player-game-stats/ apps/api/src/app.module.ts
git commit -m "feat: add player game stats submission and confirmation endpoints"
```

---

### Task 5: Backend — Stat disputes

**Files:**
- Create: `apps/api/src/player-game-stats/dto/dispute-stat-field.dto.ts`
- Create: `apps/api/src/player-game-stats/dto/resolve-stat-dispute.dto.ts`
- Modify: `apps/api/src/player-game-stats/player-game-stats.service.ts`
- Modify: `apps/api/src/player-game-stats/player-game-stats.controller.ts`

**Step 1: Create DisputeStatFieldDto**

```typescript
// apps/api/src/player-game-stats/dto/dispute-stat-field.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

class DisputeFieldEntry {
  @IsString()
  fieldName: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DisputeStatFieldDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisputeFieldEntry)
  fields: DisputeFieldEntry[];
}
```

**Step 2: Create ResolveStatDisputeDto**

```typescript
// apps/api/src/player-game-stats/dto/resolve-stat-dispute.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ResolveStatDisputeDto {
  @IsOptional()
  correctedValue?: number | boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
```

**Step 3: Add dispute methods to the service**

Add these methods to `PlayerGameStatsService`:

```typescript
  // Valid stat field names for disputes
  private static readonly DISPUTABLE_FIELDS = [
    'rating', 'goals', 'assists', 'shots', 'shotAccuracy',
    'passes', 'passAccuracy', 'dribbles', 'dribbleSuccessRate',
    'tackles', 'tackleSuccessRate', 'offsides', 'foulsCommitted',
    'possessionsWon', 'possessionsLost', 'minutesPlayed',
    'yellowCards', 'redCards',
    'shotsAgainst', 'shotsOnTarget', 'saves', 'goalsConceded',
    'saveSuccessRate', 'cleanSheet',
  ];

  async disputeFields(
    gameStatsId: string,
    dto: DisputeStatFieldDto,
    user: AuthUser,
  ) {
    const gameStats = await this.prisma.matchPlayerGameStats.findUniqueOrThrow({
      where: { id: gameStatsId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });

    if (!['PENDING', 'CONFIRMED'].includes(gameStats.status)) {
      throw new BadRequestException('Can only dispute PENDING or CONFIRMED stats');
    }

    // Verify user is opposing owner or admin
    const isAdmin = user.role === 'ADMIN';
    const opposingTeam =
      gameStats.teamId === gameStats.match.homeTeamId
        ? gameStats.match.awayTeam
        : gameStats.match.homeTeam;
    const isOpposingOwner = opposingTeam.ownerId === user.id;

    if (!isAdmin && !isOpposingOwner) {
      throw new ForbiddenException('Only the opposing team owner or an admin can dispute stats');
    }

    // Validate field names
    for (const field of dto.fields) {
      if (!PlayerGameStatsService.DISPUTABLE_FIELDS.includes(field.fieldName)) {
        throw new BadRequestException(`Invalid field name: ${field.fieldName}`);
      }
    }

    // Create dispute records and update game stats status
    return this.prisma.$transaction(async (tx) => {
      const disputes = await Promise.all(
        dto.fields.map((field) =>
          tx.statDispute.create({
            data: {
              gameStatsId,
              fieldName: field.fieldName,
              disputedById: user.id,
              reason: field.reason ?? null,
            },
            include: { disputedBy: true },
          }),
        ),
      );

      await tx.matchPlayerGameStats.update({
        where: { id: gameStatsId },
        data: { status: 'DISPUTED' },
      });

      return disputes;
    });
  }

  async resolveDispute(
    disputeId: string,
    dto: ResolveStatDisputeDto,
    adminId: string,
  ) {
    const dispute = await this.prisma.statDispute.findUniqueOrThrow({
      where: { id: disputeId },
      include: { gameStats: true },
    });

    if (dispute.status !== 'OPEN') {
      throw new BadRequestException('Dispute is already resolved');
    }

    return this.prisma.$transaction(async (tx) => {
      // Resolve the dispute
      const resolved = await tx.statDispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolvedById: adminId,
          resolutionNote: dto.note ?? null,
        },
        include: { disputedBy: true, resolvedBy: true },
      });

      // If a corrected value was provided, update the game stats field
      if (dto.correctedValue !== undefined) {
        await tx.matchPlayerGameStats.update({
          where: { id: dispute.gameStatsId },
          data: { [dispute.fieldName]: dto.correctedValue },
        });
      }

      // Check if all disputes for this game stats entry are resolved
      const openDisputes = await tx.statDispute.count({
        where: { gameStatsId: dispute.gameStatsId, status: 'OPEN' },
      });

      if (openDisputes === 0) {
        await tx.matchPlayerGameStats.update({
          where: { id: dispute.gameStatsId },
          data: { status: 'RESOLVED' },
        });
      }

      return resolved;
    });
  }

  async findOpenDisputes() {
    return this.prisma.statDispute.findMany({
      where: { status: 'OPEN' },
      include: {
        gameStats: {
          include: {
            player: true,
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                round: { include: { competition: true } },
              },
            },
          },
        },
        disputedBy: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
```

**Step 4: Add dispute endpoints to the controller**

Add these methods to `PlayerGameStatsController`:

```typescript
  @Post('game-stats/:id/disputes')
  disputeFields(
    @Param('id') id: string,
    @Body() dto: DisputeStatFieldDto,
    @CurrentUser() user: any,
  ) {
    return this.service.disputeFields(id, dto, user);
  }

  @Patch('stat-disputes/:id/resolve')
  @Roles('ADMIN')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveStatDisputeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDispute(id, dto, user.id);
  }

  @Get('admin/stat-disputes')
  @Roles('ADMIN')
  findOpenDisputes() {
    return this.service.findOpenDisputes();
  }
```

Don't forget to add the missing imports: `DisputeStatFieldDto`, `ResolveStatDisputeDto`, `Roles` decorator.

**Step 5: Verify compilation**

```bash
cd apps/api && pnpm build
```

**Step 6: Commit**

```bash
git add apps/api/src/player-game-stats/
git commit -m "feat: add per-field stat dispute and admin resolution endpoints"
```

---

### Task 6: Backend — Aggregation endpoints

**Files:**
- Modify: `apps/api/src/player-game-stats/player-game-stats.service.ts`
- Modify: `apps/api/src/player-game-stats/player-game-stats.controller.ts`

**Step 1: Add aggregation methods to the service**

Add these methods to `PlayerGameStatsService`:

```typescript
  async getPlayerSeasonStats(playerId: string, competitionId: string) {
    const stats = await this.prisma.matchPlayerGameStats.findMany({
      where: {
        playerId,
        status: { in: ['CONFIRMED', 'RESOLVED'] },
        match: {
          round: { competitionId },
        },
      },
    });

    if (stats.length === 0) return null;

    const count = stats.length;
    const gkStats = stats.filter((s) => s.saves !== null);

    return {
      playerId,
      competitionId,
      matchesPlayed: count,
      avgRating: +(stats.reduce((sum, s) => sum + s.rating, 0) / count).toFixed(2),
      totalGoals: stats.reduce((sum, s) => sum + s.goals, 0),
      totalAssists: stats.reduce((sum, s) => sum + s.assists, 0),
      totalShots: stats.reduce((sum, s) => sum + s.shots, 0),
      avgShotAccuracy: +(stats.reduce((sum, s) => sum + s.shotAccuracy, 0) / count).toFixed(2),
      totalPasses: stats.reduce((sum, s) => sum + s.passes, 0),
      avgPassAccuracy: +(stats.reduce((sum, s) => sum + s.passAccuracy, 0) / count).toFixed(2),
      totalDribbles: stats.reduce((sum, s) => sum + s.dribbles, 0),
      avgDribbleSuccessRate: +(stats.reduce((sum, s) => sum + s.dribbleSuccessRate, 0) / count).toFixed(2),
      totalTackles: stats.reduce((sum, s) => sum + s.tackles, 0),
      avgTackleSuccessRate: +(stats.reduce((sum, s) => sum + s.tackleSuccessRate, 0) / count).toFixed(2),
      totalOffsides: stats.reduce((sum, s) => sum + s.offsides, 0),
      totalFoulsCommitted: stats.reduce((sum, s) => sum + s.foulsCommitted, 0),
      totalPossessionsWon: stats.reduce((sum, s) => sum + s.possessionsWon, 0),
      totalPossessionsLost: stats.reduce((sum, s) => sum + s.possessionsLost, 0),
      totalMinutesPlayed: stats.reduce((sum, s) => sum + s.minutesPlayed, 0),
      totalYellowCards: stats.reduce((sum, s) => sum + s.yellowCards, 0),
      totalRedCards: stats.reduce((sum, s) => sum + s.redCards, 0),
      // GK
      totalSaves: gkStats.length > 0
        ? gkStats.reduce((sum, s) => sum + (s.saves ?? 0), 0)
        : null,
      totalGoalsConceded: gkStats.length > 0
        ? gkStats.reduce((sum, s) => sum + (s.goalsConceded ?? 0), 0)
        : null,
      avgSaveSuccessRate: gkStats.length > 0
        ? +(gkStats.reduce((sum, s) => sum + (s.saveSuccessRate ?? 0), 0) / gkStats.length).toFixed(2)
        : null,
      totalCleanSheets: gkStats.length > 0
        ? gkStats.filter((s) => s.cleanSheet === true).length
        : null,
    };
  }

  async getPlayerCareerStats(playerId: string) {
    const stats = await this.prisma.matchPlayerGameStats.findMany({
      where: {
        playerId,
        status: { in: ['CONFIRMED', 'RESOLVED'] },
      },
    });

    if (stats.length === 0) return null;

    const count = stats.length;
    const gkStats = stats.filter((s) => s.saves !== null);

    return {
      playerId,
      matchesPlayed: count,
      avgRating: +(stats.reduce((sum, s) => sum + s.rating, 0) / count).toFixed(2),
      totalGoals: stats.reduce((sum, s) => sum + s.goals, 0),
      totalAssists: stats.reduce((sum, s) => sum + s.assists, 0),
      totalShots: stats.reduce((sum, s) => sum + s.shots, 0),
      avgShotAccuracy: +(stats.reduce((sum, s) => sum + s.shotAccuracy, 0) / count).toFixed(2),
      totalPasses: stats.reduce((sum, s) => sum + s.passes, 0),
      avgPassAccuracy: +(stats.reduce((sum, s) => sum + s.passAccuracy, 0) / count).toFixed(2),
      totalDribbles: stats.reduce((sum, s) => sum + s.dribbles, 0),
      avgDribbleSuccessRate: +(stats.reduce((sum, s) => sum + s.dribbleSuccessRate, 0) / count).toFixed(2),
      totalTackles: stats.reduce((sum, s) => sum + s.tackles, 0),
      avgTackleSuccessRate: +(stats.reduce((sum, s) => sum + s.tackleSuccessRate, 0) / count).toFixed(2),
      totalOffsides: stats.reduce((sum, s) => sum + s.offsides, 0),
      totalFoulsCommitted: stats.reduce((sum, s) => sum + s.foulsCommitted, 0),
      totalPossessionsWon: stats.reduce((sum, s) => sum + s.possessionsWon, 0),
      totalPossessionsLost: stats.reduce((sum, s) => sum + s.possessionsLost, 0),
      totalMinutesPlayed: stats.reduce((sum, s) => sum + s.minutesPlayed, 0),
      totalYellowCards: stats.reduce((sum, s) => sum + s.yellowCards, 0),
      totalRedCards: stats.reduce((sum, s) => sum + s.redCards, 0),
      totalSaves: gkStats.length > 0
        ? gkStats.reduce((sum, s) => sum + (s.saves ?? 0), 0)
        : null,
      totalGoalsConceded: gkStats.length > 0
        ? gkStats.reduce((sum, s) => sum + (s.goalsConceded ?? 0), 0)
        : null,
      avgSaveSuccessRate: gkStats.length > 0
        ? +(gkStats.reduce((sum, s) => sum + (s.saveSuccessRate ?? 0), 0) / gkStats.length).toFixed(2)
        : null,
      totalCleanSheets: gkStats.length > 0
        ? gkStats.filter((s) => s.cleanSheet === true).length
        : null,
    };
  }

  async getCompetitionLeaders(competitionId: string) {
    const allStats = await this.prisma.matchPlayerGameStats.findMany({
      where: {
        status: { in: ['CONFIRMED', 'RESOLVED'] },
        match: { round: { competitionId } },
      },
      include: { player: true, team: true },
    });

    // Group by player
    const byPlayer = new Map<string, typeof allStats>();
    for (const stat of allStats) {
      const existing = byPlayer.get(stat.playerId) ?? [];
      existing.push(stat);
      byPlayer.set(stat.playerId, existing);
    }

    const playerAggregates = Array.from(byPlayer.entries()).map(([playerId, stats]) => {
      const count = stats.length;
      return {
        playerId,
        player: stats[0].player,
        team: stats[0].team,
        matchesPlayed: count,
        totalGoals: stats.reduce((s, st) => s + st.goals, 0),
        totalAssists: stats.reduce((s, st) => s + st.assists, 0),
        avgRating: +(stats.reduce((s, st) => s + st.rating, 0) / count).toFixed(2),
        totalCleanSheets: stats.filter((s) => s.cleanSheet === true).length,
      };
    });

    return {
      topScorers: [...playerAggregates].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 10),
      topAssists: [...playerAggregates].sort((a, b) => b.totalAssists - a.totalAssists).slice(0, 10),
      topRated: [...playerAggregates].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10),
      topCleanSheets: [...playerAggregates]
        .filter((p) => p.totalCleanSheets > 0)
        .sort((a, b) => b.totalCleanSheets - a.totalCleanSheets)
        .slice(0, 10),
    };
  }
```

**Step 2: Add aggregation endpoints to the controller**

Add to `PlayerGameStatsController`:

```typescript
  @Get('players/:playerId/stats/season')
  getPlayerSeasonStats(
    @Param('playerId') playerId: string,
    @Query('competitionId') competitionId: string,
  ) {
    return this.service.getPlayerSeasonStats(playerId, competitionId);
  }

  @Get('players/:playerId/stats/career')
  getPlayerCareerStats(@Param('playerId') playerId: string) {
    return this.service.getPlayerCareerStats(playerId);
  }

  @Get('competitions/:competitionId/stats/leaders')
  getCompetitionLeaders(@Param('competitionId') competitionId: string) {
    return this.service.getCompetitionLeaders(competitionId);
  }
```

Add `Query` to the `@nestjs/common` import.

**Step 3: Verify compilation**

```bash
cd apps/api && pnpm build
```

**Step 4: Commit**

```bash
git add apps/api/src/player-game-stats/
git commit -m "feat: add season stats, career stats, and competition leaderboard endpoints"
```

---

### Task 7: Frontend — React hooks for game stats

**Files:**
- Create: `apps/web/src/hooks/usePlayerGameStats.ts`
- Create: `apps/web/src/hooks/useStatDelegates.ts`

**Step 1: Create usePlayerGameStats hook**

```typescript
// apps/web/src/hooks/usePlayerGameStats.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  MatchPlayerGameStats,
  SubmitGameStatsDto,
  ConfirmGameStatsDto,
  DisputeStatFieldDto,
  ResolveStatDisputeDto,
  PlayerSeasonStats,
  LeaderboardEntry,
} from '@vcm/shared';

export function useMatchGameStats(matchId: string) {
  return useQuery<MatchPlayerGameStats[]>({
    queryKey: ['match-game-stats', matchId],
    queryFn: () =>
      api.get(`/matches/${matchId}/game-stats`).then((r) => r.data),
    enabled: !!matchId,
  });
}

export function useSubmitGameStats(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitGameStatsDto) =>
      api.post(`/matches/${matchId}/game-stats`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats', matchId] });
    },
  });
}

export function useConfirmGameStats(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmGameStatsDto) =>
      api.patch(`/matches/${matchId}/game-stats/confirm`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats', matchId] });
    },
  });
}

export function useDisputeStatField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameStatsId, ...data }: DisputeStatFieldDto & { gameStatsId: string }) =>
      api.post(`/game-stats/${gameStatsId}/disputes`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stat-disputes'] });
    },
  });
}

export function useResolveStatDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, ...data }: ResolveStatDisputeDto & { disputeId: string }) =>
      api.patch(`/stat-disputes/${disputeId}/resolve`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stat-disputes'] });
    },
  });
}

export function useStatDisputes() {
  return useQuery({
    queryKey: ['stat-disputes'],
    queryFn: () => api.get('/admin/stat-disputes').then((r) => r.data),
  });
}

export function usePlayerSeasonStats(playerId: string, competitionId: string) {
  return useQuery<PlayerSeasonStats | null>({
    queryKey: ['player-season-stats', playerId, competitionId],
    queryFn: () =>
      api.get(`/players/${playerId}/stats/season?competitionId=${competitionId}`).then((r) => r.data),
    enabled: !!playerId && !!competitionId,
  });
}

export function usePlayerCareerStats(playerId: string) {
  return useQuery<PlayerSeasonStats | null>({
    queryKey: ['player-career-stats', playerId],
    queryFn: () =>
      api.get(`/players/${playerId}/stats/career`).then((r) => r.data),
    enabled: !!playerId,
  });
}

interface CompetitionLeaders {
  topScorers: LeaderboardEntry[];
  topAssists: LeaderboardEntry[];
  topRated: LeaderboardEntry[];
  topCleanSheets: LeaderboardEntry[];
}

export function useCompetitionLeaders(competitionId: string) {
  return useQuery<CompetitionLeaders>({
    queryKey: ['competition-leaders', competitionId],
    queryFn: () =>
      api.get(`/competitions/${competitionId}/stats/leaders`).then((r) => r.data),
    enabled: !!competitionId,
  });
}
```

**Step 2: Create useStatDelegates hook**

```typescript
// apps/web/src/hooks/useStatDelegates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StatDelegate, AddStatDelegateDto } from '@vcm/shared';

export function useStatDelegates(teamId: string) {
  return useQuery<StatDelegate[]>({
    queryKey: ['stat-delegates', teamId],
    queryFn: () =>
      api.get(`/teams/${teamId}/delegates`).then((r) => r.data),
    enabled: !!teamId,
  });
}

export function useAddStatDelegate(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddStatDelegateDto) =>
      api.post(`/teams/${teamId}/delegates`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-delegates', teamId] });
    },
  });
}

export function useRemoveStatDelegate(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/teams/${teamId}/delegates/${userId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-delegates', teamId] });
    },
  });
}
```

**Step 3: Verify build**

```bash
cd apps/web && pnpm build
```

**Step 4: Commit**

```bash
git add apps/web/src/hooks/usePlayerGameStats.ts apps/web/src/hooks/useStatDelegates.ts
git commit -m "feat: add React hooks for player game stats and stat delegates"
```

---

### Task 8: Frontend — Game Stats Entry UI

This task builds the stat entry form component that team owners use to submit their team's post-match stats. This is a large UI task — the specific layout and styling decisions involve trade-offs around form UX.

**Files:**
- Create: `apps/web/src/components/game-stats/GameStatsEntryForm.tsx`
- Modify: `apps/web/src/routes/matches/hub.tsx` (add game stats tab/section after result is confirmed)

**User contribution opportunity:** The form layout (expandable rows vs. table grid vs. tabbed per-player) is a UX decision. The implementer should create the component structure and let the user decide the form layout approach once scaffolding is in place.

**Step 1:** Create `GameStatsEntryForm.tsx` with:
- Accept props: `matchId`, `teamId`, `players` (from lineup), `onSubmitted` callback
- Build a form with one section per player
- Common stat fields for all players
- GK fields shown conditionally when `player.position === 'GK'`
- Substitute toggle pre-filled from lineup `isStarter` field
- Validation matching the DTO constraints (rating 1-10, percentages 0-100, etc.)
- Submit button calls `useSubmitGameStats` with the full batch

**Step 2:** Integrate into `hub.tsx`:
- After the result display section, add a conditional block:
  - If result status is CONFIRMED or RESOLVED AND no game stats exist for the user's team → show `GameStatsEntryForm`
  - If game stats exist and are PENDING → show read-only review view for opposing owner with confirm/dispute options
  - If game stats are CONFIRMED/RESOLVED → show read-only stats display

**Step 3:** Verify in browser and commit.

```bash
git add apps/web/src/components/game-stats/ apps/web/src/routes/matches/hub.tsx
git commit -m "feat: add game stats entry form and integrate into match hub"
```

---

### Task 9: Frontend — Stats Review, Dispute, and Delegation UI

**Files:**
- Create: `apps/web/src/components/game-stats/GameStatsReview.tsx`
- Create: `apps/web/src/components/game-stats/StatDelegateManager.tsx`
- Modify: `apps/web/src/routes/matches/hub.tsx` (dispute/confirm UI)
- Modify: `apps/web/src/routes/teams/` (delegation management in team settings)

**Step 1:** Create `GameStatsReview.tsx`:
- Read-only display of submitted stats per player
- Per-field dispute icon (flag button) next to each stat value
- Clicking opens a small inline input for dispute reason
- "Confirm All" button at the bottom
- Uses `useConfirmGameStats` and `useDisputeStatField` hooks

**Step 2:** Create `StatDelegateManager.tsx`:
- List current delegates with remove button
- User search/select to add a new delegate
- Uses `useStatDelegates`, `useAddStatDelegate`, `useRemoveStatDelegate`

**Step 3:** Integrate review into hub.tsx match page.

**Step 4:** Integrate delegate manager into team settings page.

**Step 5:** Commit.

```bash
git add apps/web/src/components/game-stats/ apps/web/src/routes/
git commit -m "feat: add stats review/dispute UI and delegation management"
```

---

### Task 10: Frontend — Aggregated Stats Views (Player Profile + Leaderboards)

**Files:**
- Create: `apps/web/src/components/game-stats/PlayerStatsTab.tsx`
- Create: `apps/web/src/components/game-stats/CompetitionLeaderboard.tsx`
- Modify: player profile route (add stats tab)
- Modify: competition detail route (add leaderboard section)

**Step 1:** Create `PlayerStatsTab.tsx`:
- Season stats table: one row per competition with totals and averages
- Career summary section with key metrics highlighted
- Uses `usePlayerSeasonStats` and `usePlayerCareerStats`

**Step 2:** Create `CompetitionLeaderboard.tsx`:
- Tabs for: Top Scorers, Top Assists, Top Rated, Clean Sheets
- Sortable table showing player name, team, and stat value
- Uses `useCompetitionLeaders`

**Step 3:** Wire into existing routes.

**Step 4:** Commit.

```bash
git add apps/web/src/components/game-stats/ apps/web/src/routes/
git commit -m "feat: add player stats tab and competition leaderboard views"
```
