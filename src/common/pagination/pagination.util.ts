import { PageInfo } from './page-info.model';

export interface BuildPaginationArgs {
  skip: number;
  take: number;
  totalCount: number;
  currentItemsLength: number;
}

export function buildPageInfo({ skip, take, totalCount, currentItemsLength }: BuildPaginationArgs): PageInfo {
  return {
    hasNextPage: skip + take < totalCount,
    hasPreviousPage: skip > 0,
    startCursor: String(skip),
    endCursor: String(skip + currentItemsLength),
  } as PageInfo;
}

export function buildPaginatedResult<T>(params: {
  items: T[];
  skip: number;
  take: number;
  totalCount: number;
  meta?: Record<string, any> | null;
}) {
  const { items, skip, take, totalCount, meta = null } = params;
  return {
    items,
    pageInfo: buildPageInfo({ skip, take, totalCount, currentItemsLength: items.length }),
    totalCount,
    meta,
  };
}
