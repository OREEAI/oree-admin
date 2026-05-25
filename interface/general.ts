export type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export type PaginatedResponse<T> = {
  count: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data: T[];
};

export type Paging = {
  page?: number;
  pageSize?: number;
};

export type ApiListResponse<T> = PaginatedResponse<T> | T[];
