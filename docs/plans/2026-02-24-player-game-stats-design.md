# Player Game Stats Design

## Overview

Post-match summary stats collected per player per match, matching the stats EAFC26 produces at the end of each game. Includes entry, review/dispute, delegation, and aggregation.

## Requirements

- **Per-match summary stats** (not event-based) for every player in a match
- **Outfield stats**: position, rating (1.0-10.0), substitute toggle, goals, assists, shots, shot accuracy, passes, pass accuracy, dribbles, dribble success rate, tackles, tackle success rate, offsides, fouls committed, possessions won, possessions lost, minutes played, yellow cards, red cards
- **GK-additional stats** (when lineup position is GK): shots against, shots on target, saves, goals conceded, save success rate %, clean sheet toggle
- **Entry timing**: Match result must be CONFIRMED/RESOLVED before stats can be entered
- **Permissions**: Owner enters for own team; persistent delegates can also enter; admins can enter for any team
- **Dispute flow**: Per-stat-field granularity — individual fields can be flagged by opposing owner
- **Aggregation**: Season totals/averages per competition, career totals, leaderboards

## Data Model

### MatchPlayerGameStats

One row per player per match. Wide table with a column per stat.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| matchId | String | FK to Match |
| playerId | String | FK to Player |
| teamId | String | FK to Team |
| submittedById | String | FK to User |
| position | String | Position played (from lineup) |
| isSubstitute | Boolean | Came on as sub |
| rating | Float | 1.0-10.0 |
| goals | Int | |
| assists | Int | |
| shots | Int | |
| shotAccuracy | Float | Percentage 0-100 |
| passes | Int | |
| passAccuracy | Float | Percentage 0-100 |
| dribbles | Int | |
| dribbleSuccessRate | Float | Percentage 0-100 |
| tackles | Int | |
| tackleSuccessRate | Float | Percentage 0-100 |
| offsides | Int | |
| foulsCommitted | Int | |
| possessionsWon | Int | |
| possessionsLost | Int | |
| minutesPlayed | Int | 0-120 |
| yellowCards | Int | |
| redCards | Int | |
| shotsAgainst | Int? | GK only |
| shotsOnTarget | Int? | GK only |
| saves | Int? | GK only |
| goalsConceded | Int? | GK only |
| saveSuccessRate | Float? | GK only, percentage |
| cleanSheet | Boolean? | GK only |
| status | Enum | PENDING / CONFIRMED / DISPUTED / RESOLVED |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique constraint: `(matchId, playerId)`

### StatDispute

Per-field dispute tracking.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| gameStatsId | String | FK to MatchPlayerGameStats |
| fieldName | String | Which stat field (e.g., "goals") |
| disputedById | String | FK to User |
| reason | String? | Optional explanation |
| status | Enum | OPEN / RESOLVED |
| resolvedById | String? | FK to User (admin) |
| resolutionNote | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### StatDelegate

Persistent delegation — allows another user to enter stats on behalf of a team.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| teamId | String | FK to Team |
| delegateUserId | String | FK to User |
| createdAt | DateTime | |

Unique constraint: `(teamId, delegateUserId)`

## API Endpoints

### Stat Entry

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| POST | `/matches/:matchId/game-stats` | Owner, Delegate, Admin | Batch submit stats for a team's players |
| GET | `/matches/:matchId/game-stats` | Any authenticated | Get all player stats for a match |
| PATCH | `/matches/:matchId/game-stats/:id` | Original submitter, Admin | Update a player's stat line |

- Match result must be CONFIRMED or RESOLVED
- Admin submissions auto-confirm; owner/delegate submissions start as PENDING
- POST body: array of player stat objects for one team

### Disputes

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| POST | `/game-stats/:id/disputes` | Opposing owner, Admin | Dispute specific fields |
| GET | `/admin/stat-disputes` | Admin | List all open disputes |
| PATCH | `/stat-disputes/:id/resolve` | Admin | Resolve a dispute |

- Only opposing team's owner can dispute (not the submitter)
- Specifies field name(s) and optional reason
- Admin resolves by confirming or correcting the value

### Confirmation

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| PATCH | `/matches/:matchId/game-stats/confirm` | Opposing owner, Admin | Confirm all PENDING stats for a team |

### Delegation

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| POST | `/teams/:teamId/delegates` | Team owner | Add a delegate |
| DELETE | `/teams/:teamId/delegates/:userId` | Team owner | Remove a delegate |
| GET | `/teams/:teamId/delegates` | Team owner, Admin | List delegates |

### Aggregation

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| GET | `/players/:id/stats/season?competitionId=X` | Any authenticated | Season totals/averages |
| GET | `/players/:id/stats/career` | Any authenticated | Career totals/averages |
| GET | `/competitions/:id/stats/leaders` | Any authenticated | Leaderboards |

Aggregations computed at query time from CONFIRMED/RESOLVED rows. No materialized tables needed at current scale.

## Frontend

### Stats Entry Form

- Appears on match page after result is confirmed
- Player list from match lineup, one expandable row per player
- Common stat fields for all; GK fields shown when lineup position is GK
- Substitute toggle pre-filled from lineup data
- "Submit All" batch button

### Stats Review / Dispute

- Read-only view for opposing owner
- Per-field dispute icon next to each stat
- "Confirm All" button to approve the submission

### Delegation Management

- Team Settings page: "Stat Delegates" section
- Search/add users, list/remove current delegates

### Aggregated Stats Views

- Player Profile: season stats table per competition + career summary
- Competition page: leaderboards (top scorers, top rated, most assists, clean sheets)

## Submission Flow

1. Match result is CONFIRMED or RESOLVED
2. Owner A submits their team's stats -> rows created with status PENDING
3. Owner B reviews:
   - Confirms all -> PENDING -> CONFIRMED
   - Disputes specific fields -> those rows go to DISPUTED
4. Admin resolves disputes -> DISPUTED -> RESOLVED (optionally corrects values)

## Design Decisions

- **Wide table over EAV**: Stats are well-defined by the game; strong typing and simple aggregation outweigh flexibility
- **Query-time aggregation**: ~2000 stat rows per season makes real-time SQL aggregation fast enough
- **Persistent delegation**: Simpler than per-match delegation; owner retains ability to enter stats themselves
- **GK detection via lineup position**: Avoids hardcoding player types; respects positional flexibility
