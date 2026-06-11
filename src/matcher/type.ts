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
