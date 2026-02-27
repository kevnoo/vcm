import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseCsv } from './csv-parse.util';
import { getTemplate, CSV_TEMPLATES } from './csv-templates';
import type { CompetitionType, Position } from '../generated/prisma/client';

interface ImportError {
  row: number;
  field?: string;
  message: string;
}

interface ImportResult {
  template: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

const VALID_POSITIONS = [
  'GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST',
];

const VALID_COMPETITION_TYPES = [
  'DOUBLE_ROUND_ROBIN', 'SINGLE_ROUND_ROBIN', 'KNOCKOUT_CUP', 'PLAYOFF',
];

@Injectable()
export class CsvImportService {
  constructor(private prisma: PrismaService) {}

  getTemplates() {
    return CSV_TEMPLATES.map((t) => ({
      type: t.type,
      label: t.label,
      description: t.description,
      headers: t.headers,
      sampleRows: t.sampleRows,
    }));
  }

  getTemplateCsv(type: string): string {
    const template = getTemplate(type);
    if (!template) {
      throw new BadRequestException(`Unknown template type: ${type}`);
    }

    const rows = [template.headers, ...template.sampleRows];
    return rows
      .map((row) =>
        row
          .map((cell) => {
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(','),
      )
      .join('\n');
  }

  async importCsv(type: string, fileContent: string): Promise<ImportResult> {
    const template = getTemplate(type);
    if (!template) {
      throw new BadRequestException(`Unknown template type: ${type}`);
    }

    const rows = parseCsv(fileContent);
    if (rows.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }

    // Validate headers match template
    const headers = rows[0].map((h) => h.trim());
    const expectedHeaders = template.headers;
    for (const expected of expectedHeaders) {
      if (!headers.includes(expected)) {
        throw new BadRequestException(
          `Missing required header column: "${expected}". Expected columns: ${expectedHeaders.join(', ')}`,
        );
      }
    }

    const dataRows = rows.slice(1);

    switch (type) {
      case 'players':
        return this.importPlayers(headers, dataRows);
      case 'player-skills':
        return this.importPlayerSkills(headers, dataRows);
      case 'teams':
        return this.importTeams(headers, dataRows);
      case 'competitions':
        return this.importCompetitions(headers, dataRows);
      case 'match-results':
        return this.importMatchResults(headers, dataRows);
      default:
        throw new BadRequestException(`Import not supported for type: ${type}`);
    }
  }

  // ─── Players ───────────────────────────────────────────
  private async importPlayers(headers: string[], rows: string[][]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Pre-fetch teams for name lookup
    const teams = await this.prisma.team.findMany();
    const teamMap = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));

    // Pre-fetch skill definitions for auto-populating
    const skillDefinitions = await this.prisma.skillDefinition.findMany();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed, skip header
      try {
        const row = this.rowToObject(headers, rows[i]);

        // Validate required fields
        if (!row.firstName?.trim()) {
          errors.push({ row: rowNum, field: 'firstName', message: 'firstName is required' });
          continue;
        }
        if (!row.lastName?.trim()) {
          errors.push({ row: rowNum, field: 'lastName', message: 'lastName is required' });
          continue;
        }
        const age = parseInt(row.age, 10);
        if (isNaN(age) || age < 1) {
          errors.push({ row: rowNum, field: 'age', message: 'age must be a positive integer' });
          continue;
        }
        if (!row.primaryPosition || !VALID_POSITIONS.includes(row.primaryPosition)) {
          errors.push({
            row: rowNum,
            field: 'primaryPosition',
            message: `Invalid position "${row.primaryPosition}". Valid: ${VALID_POSITIONS.join(', ')}`,
          });
          continue;
        }

        const overall = row.overall ? parseInt(row.overall, 10) : 50;
        const weakFoot = row.weakFoot ? parseInt(row.weakFoot, 10) : 3;
        const potential = row.potential ? parseInt(row.potential, 10) : 50;

        // Resolve team
        let teamId: string | null = null;
        if (row.teamName?.trim()) {
          teamId = teamMap.get(row.teamName.trim().toLowerCase()) ?? null;
          if (!teamId) {
            errors.push({
              row: rowNum,
              field: 'teamName',
              message: `Team "${row.teamName}" not found`,
            });
            continue;
          }
        }

        // Parse alternative positions
        const altPositions: Position[] = [];
        if (row.alternativePositions?.trim()) {
          const parts = row.alternativePositions.split('|').map((p) => p.trim());
          for (const p of parts) {
            if (!VALID_POSITIONS.includes(p)) {
              errors.push({
                row: rowNum,
                field: 'alternativePositions',
                message: `Invalid alternative position "${p}"`,
              });
              continue;
            }
            altPositions.push(p as Position);
          }
        }

        // Create player in transaction
        await this.prisma.$transaction(async (tx) => {
          const player = await tx.player.create({
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              age,
              primaryPosition: row.primaryPosition as Position,
              overall,
              weakFoot,
              potential,
              teamId,
              imageUrl: row.imageUrl?.trim() || null,
            },
          });

          // Create primary position entry
          await tx.playerPosition.create({
            data: {
              playerId: player.id,
              position: row.primaryPosition as Position,
              isPrimary: true,
            },
          });

          // Create alternative position entries
          const uniqueAltPositions = altPositions.filter(
            (p) => p !== row.primaryPosition,
          );
          if (uniqueAltPositions.length > 0) {
            await tx.playerPosition.createMany({
              data: uniqueAltPositions.map((pos) => ({
                playerId: player.id,
                position: pos,
                isPrimary: false,
              })),
            });
          }

          // Auto-populate skills with defaults
          if (skillDefinitions.length > 0) {
            await tx.playerSkill.createMany({
              data: skillDefinitions.map((skill) => ({
                playerId: player.id,
                skillDefinitionId: skill.id,
                value: skill.defaultValue,
              })),
            });
          }
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      template: 'players',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  // ─── Player Skills ─────────────────────────────────────
  private async importPlayerSkills(headers: string[], rows: string[][]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Pre-fetch players for name lookup
    const players = await this.prisma.player.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
    const playerMap = new Map(
      players.map((p) => [`${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`, p.id]),
    );

    // Pre-fetch skill definitions for name lookup
    const skills = await this.prisma.skillDefinition.findMany();
    const skillMap = new Map(skills.map((s) => [s.name.toLowerCase(), s.id]));

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const row = this.rowToObject(headers, rows[i]);

        const playerKey = `${(row.firstName || '').trim().toLowerCase()}|${(row.lastName || '').trim().toLowerCase()}`;
        const playerId = playerMap.get(playerKey);
        if (!playerId) {
          errors.push({
            row: rowNum,
            field: 'firstName/lastName',
            message: `Player "${row.firstName} ${row.lastName}" not found`,
          });
          continue;
        }

        const skillName = (row.skillName || '').trim();
        const skillDefId = skillMap.get(skillName.toLowerCase());
        if (!skillDefId) {
          errors.push({
            row: rowNum,
            field: 'skillName',
            message: `Skill "${skillName}" not found in reference data`,
          });
          continue;
        }

        const value = parseInt(row.value, 10);
        if (isNaN(value) || value < 1 || value > 99) {
          errors.push({
            row: rowNum,
            field: 'value',
            message: 'Skill value must be an integer between 1 and 99',
          });
          continue;
        }

        await this.prisma.playerSkill.upsert({
          where: {
            playerId_skillDefinitionId: { playerId, skillDefinitionId: skillDefId },
          },
          create: { playerId, skillDefinitionId: skillDefId, value },
          update: { value },
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      template: 'player-skills',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  // ─── Teams ─────────────────────────────────────────────
  private async importTeams(headers: string[], rows: string[][]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Pre-fetch users for owner lookup
    const users = await this.prisma.user.findMany({
      select: { id: true, discordUsername: true },
    });
    const userMap = new Map(
      users.map((u) => [u.discordUsername.toLowerCase(), u.id]),
    );

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const row = this.rowToObject(headers, rows[i]);

        if (!row.name?.trim()) {
          errors.push({ row: rowNum, field: 'name', message: 'Team name is required' });
          continue;
        }

        const ownerUsername = (row.ownerDiscordUsername || '').trim();
        if (!ownerUsername) {
          errors.push({
            row: rowNum,
            field: 'ownerDiscordUsername',
            message: 'Owner Discord username is required',
          });
          continue;
        }

        const ownerId = userMap.get(ownerUsername.toLowerCase());
        if (!ownerId) {
          errors.push({
            row: rowNum,
            field: 'ownerDiscordUsername',
            message: `User "${ownerUsername}" not found`,
          });
          continue;
        }

        const budget = row.budget ? parseInt(row.budget, 10) : 0;

        await this.prisma.team.create({
          data: {
            name: row.name.trim(),
            ownerId,
            budget: isNaN(budget) ? 0 : budget,
            logoUrl: row.logoUrl?.trim() || null,
          },
        });

        successCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('Unique constraint')) {
          errors.push({ row: rowNum, field: 'name', message: `Team "${rows[i][0]}" already exists` });
        } else {
          errors.push({ row: rowNum, message: msg });
        }
      }
    }

    return {
      template: 'teams',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  // ─── Competitions ──────────────────────────────────────
  private async importCompetitions(headers: string[], rows: string[][]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Pre-fetch teams
    const teams = await this.prisma.team.findMany();
    const teamMap = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const row = this.rowToObject(headers, rows[i]);

        if (!row.name?.trim()) {
          errors.push({ row: rowNum, field: 'name', message: 'Competition name is required' });
          continue;
        }

        if (!row.type || !VALID_COMPETITION_TYPES.includes(row.type)) {
          errors.push({
            row: rowNum,
            field: 'type',
            message: `Invalid type "${row.type}". Valid: ${VALID_COMPETITION_TYPES.join(', ')}`,
          });
          continue;
        }

        // Parse team names
        const teamNames = (row.teamNames || '')
          .split('|')
          .map((n) => n.trim())
          .filter(Boolean);

        const resolvedTeamIds: string[] = [];
        let teamError = false;
        for (const name of teamNames) {
          const tid = teamMap.get(name.toLowerCase());
          if (!tid) {
            errors.push({
              row: rowNum,
              field: 'teamNames',
              message: `Team "${name}" not found`,
            });
            teamError = true;
            break;
          }
          resolvedTeamIds.push(tid);
        }
        if (teamError) continue;

        await this.prisma.$transaction(async (tx) => {
          const competition = await tx.competition.create({
            data: {
              name: row.name.trim(),
              type: row.type as CompetitionType,
              status: 'DRAFT',
            },
          });

          if (resolvedTeamIds.length > 0) {
            await tx.competitionTeam.createMany({
              data: resolvedTeamIds.map((teamId) => ({
                competitionId: competition.id,
                teamId,
              })),
            });
          }
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      template: 'competitions',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  // ─── Match Results ─────────────────────────────────────
  private async importMatchResults(headers: string[], rows: string[][]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    // Pre-fetch competitions
    const competitions = await this.prisma.competition.findMany({
      include: { rounds: true, teams: { include: { team: true } } },
    });
    const compMap = new Map(
      competitions.map((c) => [c.name.toLowerCase(), c]),
    );

    // Pre-fetch teams
    const teams = await this.prisma.team.findMany();
    const teamMap = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));

    // Get a system admin user for submittedById
    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const row = this.rowToObject(headers, rows[i]);

        const competition = compMap.get((row.competitionName || '').trim().toLowerCase());
        if (!competition) {
          errors.push({
            row: rowNum,
            field: 'competitionName',
            message: `Competition "${row.competitionName}" not found`,
          });
          continue;
        }

        const roundNumber = parseInt(row.roundNumber, 10);
        if (isNaN(roundNumber)) {
          errors.push({
            row: rowNum,
            field: 'roundNumber',
            message: 'Round number must be an integer',
          });
          continue;
        }

        const round = competition.rounds.find((r) => r.roundNumber === roundNumber);
        if (!round) {
          errors.push({
            row: rowNum,
            field: 'roundNumber',
            message: `Round ${roundNumber} not found in competition "${row.competitionName}"`,
          });
          continue;
        }

        const homeTeamId = teamMap.get((row.homeTeamName || '').trim().toLowerCase());
        if (!homeTeamId) {
          errors.push({
            row: rowNum,
            field: 'homeTeamName',
            message: `Team "${row.homeTeamName}" not found`,
          });
          continue;
        }

        const awayTeamId = teamMap.get((row.awayTeamName || '').trim().toLowerCase());
        if (!awayTeamId) {
          errors.push({
            row: rowNum,
            field: 'awayTeamName',
            message: `Team "${row.awayTeamName}" not found`,
          });
          continue;
        }

        const homeScore = parseInt(row.homeScore, 10);
        const awayScore = parseInt(row.awayScore, 10);
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
          errors.push({
            row: rowNum,
            field: 'homeScore/awayScore',
            message: 'Scores must be non-negative integers',
          });
          continue;
        }

        await this.prisma.$transaction(async (tx) => {
          // Find existing match or create one
          let match = await tx.match.findFirst({
            where: {
              roundId: round.id,
              homeTeamId,
              awayTeamId,
            },
          });

          if (!match) {
            match = await tx.match.create({
              data: {
                roundId: round.id,
                homeTeamId,
                awayTeamId,
                status: 'COMPLETED',
              },
            });
          } else {
            await tx.match.update({
              where: { id: match.id },
              data: { status: 'COMPLETED' },
            });
          }

          // Upsert result
          await tx.result.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              homeScore,
              awayScore,
              status: 'CONFIRMED',
              submittedById: adminUser?.id ?? match.homeTeamId,
            },
            update: {
              homeScore,
              awayScore,
              status: 'CONFIRMED',
            },
          });
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      template: 'match-results',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  // ─── Helpers ───────────────────────────────────────────
  private rowToObject(headers: string[], row: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] ?? '';
    }
    return obj;
  }
}
