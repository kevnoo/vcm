export type CsvTemplateType =
  | 'players'
  | 'player-skills'
  | 'teams'
  | 'competitions'
  | 'match-results';

export interface CsvTemplate {
  type: CsvTemplateType;
  label: string;
  description: string;
  headers: string[];
  sampleRows: string[][];
}

export interface CsvImportResult {
  template: CsvTemplateType;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: CsvImportError[];
}

export interface CsvImportError {
  row: number;
  field?: string;
  message: string;
}
