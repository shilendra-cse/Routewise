import { createRoutewiseServer } from "./server/server.js";

// Public - Front Door
export function routewise() {
  const server = createRoutewiseServer();
  return {
    listen(port: number) {
      server.listen(port, () => {
        console.log(`Routewise listening on port ${port}`);
      });
    },
  };
}
