import type { Context } from "elysia";

export function notImplemented({ set }: Context) {
  set.status = 501;

  return {
    error: "Not implemented",
    message: "This endpoint is reserved for the MVP API scaffold."
  };
}
