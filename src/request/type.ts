export type ParsedRequest = {
  method: string;
  path: string;
  query: Record<string, string>;
  host: string;
};
