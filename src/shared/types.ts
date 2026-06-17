export interface Context {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  auth?: unknown;
  status(code: number): Context;
  json(data: unknown): void;
  notFound(message?: string): void;
  unauthorized(message?: string): void;
}

export type Handler = (ctx: Context) => void | Promise<void>;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>,
) => void | Promise<void>;
