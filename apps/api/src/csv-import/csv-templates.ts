/**
 * CSV Template definitions for each importable dataset.
 * Each template defines headers, sample data, and a human-readable description
 * so admins know exactly what format to provide.
 */

export interface TemplateDef {
  type: string;
  label: string;
  description: string;
  headers: string[];
  sampleRows: string[][];
}

export const CSV_TEMPLATES: TemplateDef[] = [
  {
    type: 'players',
    label: 'Players',
    description:
      'Import players with basic attributes. Team name must match an existing team (leave blank for free agents). Positions use short codes: GK, RB, CB, LB, CDM, CM, CAM, RM, LM, RW, LW, CF, ST. Alternative positions are pipe-separated (e.g. CM|CAM|CDM).',
    headers: [
      'firstName',
      'lastName',
      'age',
      'primaryPosition',
      'overall',
      'weakFoot',
      'potential',
      'alternativePositions',
      'teamName',
      'imageUrl',
    ],
    sampleRows: [
      ['Lionel', 'Messi', '37', 'RW', '88', '4', '88', 'CF|ST|CAM', 'Inter Miami', ''],
      ['Erling', 'Haaland', '26', 'ST', '91', '3', '95', 'CF', 'Manchester City', ''],
      ['Jude', 'Bellingham', '22', 'CAM', '89', '4', '94', 'CM|CDM', '', ''],
    ],
  },
  {
    type: 'player-skills',
    label: 'Player Skills',
    description:
      'Import skill ratings for existing players. Player is matched by firstName + lastName. Skill names must match skill definitions already set up in Reference Data. Value is 1-99.',
    headers: ['firstName', 'lastName', 'skillName', 'value'],
    sampleRows: [
      ['Lionel', 'Messi', 'Acceleration', '85'],
      ['Lionel', 'Messi', 'Sprint Speed', '75'],
      ['Erling', 'Haaland', 'Acceleration', '88'],
      ['Erling', 'Haaland', 'Finishing', '95'],
    ],
  },
  {
    type: 'teams',
    label: 'Teams',
    description:
      'Import teams. Owner Discord Username must match an existing user in the system. Budget is in currency units (integer).',
    headers: ['name', 'ownerDiscordUsername', 'budget', 'logoUrl'],
    sampleRows: [
      ['Manchester City', 'john_doe', '100000', ''],
      ['Real Madrid', 'jane_smith', '95000', ''],
      ['Inter Miami', 'mike_ross', '60000', ''],
    ],
  },
  {
    type: 'competitions',
    label: 'Competitions',
    description:
      'Import competitions with their team assignments. Type must be one of: DOUBLE_ROUND_ROBIN, SINGLE_ROUND_ROBIN, KNOCKOUT_CUP, PLAYOFF. Team names are pipe-separated and must match existing teams.',
    headers: ['name', 'type', 'teamNames'],
    sampleRows: [
      ['Premier League S1', 'DOUBLE_ROUND_ROBIN', 'Manchester City|Real Madrid|Inter Miami'],
      ['FA Cup S1', 'KNOCKOUT_CUP', 'Manchester City|Real Madrid|Inter Miami'],
    ],
  },
  {
    type: 'match-results',
    label: 'Match Results (Historical)',
    description:
      'Import historical match results for completed competitions. Competition, home team, and away team names must match existing records. Round number must match a round in the competition. Scores are integers.',
    headers: [
      'competitionName',
      'roundNumber',
      'homeTeamName',
      'awayTeamName',
      'homeScore',
      'awayScore',
    ],
    sampleRows: [
      ['Premier League S1', '1', 'Manchester City', 'Real Madrid', '3', '1'],
      ['Premier League S1', '1', 'Inter Miami', 'Manchester City', '0', '2'],
    ],
  },
];

export function getTemplate(type: string): TemplateDef | undefined {
  return CSV_TEMPLATES.find((t) => t.type === type);
}
