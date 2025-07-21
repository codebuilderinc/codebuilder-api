import { LogMeta } from './log-meta.model';

export interface LogErrorMeta extends LogMeta {
  errorMessage: string;
  errorStack?: string;
  trace?: string;
}
