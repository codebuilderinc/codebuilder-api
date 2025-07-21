export interface PaginatedResponse<T = any> {
  results: T[];
  hasNextPage: boolean;
  cursor?: string;
}
