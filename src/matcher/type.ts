import { Handler } from "../shared/types.js";

export type Route = {
  method: string;
  pattern: string;
  segments: string[];
  handler: Handler;
};

export type MatchResult = {
  handler: Handler;
  params: Record<string, string>;
};

export type Router = {
  get(pattern: string, handler: Handler): void;
  post(pattern: string, handler: Handler): void;
  put(pattern: string, handler: Handler): void;
  patch(pattern: string, handler: Handler): void;
  delete(pattern: string, handler: Handler): void;
  register(method: string, pattern: string, handler: Handler): void;
  match(method: string, path: string): MatchResult | null;
  allowedMethods(path: string): string[];
};
