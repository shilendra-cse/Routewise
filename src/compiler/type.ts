export type ScannedRoute = {
  filePath: string;
  method: string;
  pattern: string;
  segments: string[];
};

export type ScannedMiddleware = {
  filePath: string;
  segments: string[];
  name: string;
  kind: "named" | "composer";
};

export type ScanResult = {
  routes: ScannedRoute[];
  middlewares: ScannedMiddleware[];
};
