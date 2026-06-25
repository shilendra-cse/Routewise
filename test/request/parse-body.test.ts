import assert from "node:assert/strict";
import { test } from "node:test";
import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import {
  populateBody,
  readRequestBody,
  shouldReadBody,
  BodyTooLargeError,
} from "../../src/request/parse-body.js";
import type { Context } from "../../src/shared/types.js";

function mockReq(body: string, headers: Record<string, string>): IncomingMessage {
  const stream = Readable.from([Buffer.from(body)]) as unknown as IncomingMessage;
  stream.headers = headers as IncomingMessage["headers"];
  return stream;
}

function mockCtx(headers: Record<string, string>): Context {
  return { headers } as unknown as Context;
}

test("shouldReadBody is false when content-length is 0", () => {
  assert.equal(
    shouldReadBody({ headers: { "content-length": "0" } } as IncomingMessage),
    false,
  );
});

test("shouldReadBody is true with positive content-length", () => {
  assert.equal(
    shouldReadBody({ headers: { "content-length": "10" } } as IncomingMessage),
    true,
  );
});

test("shouldReadBody is true for chunked transfer-encoding", () => {
  assert.equal(
    shouldReadBody({
      headers: { "transfer-encoding": "chunked" },
    } as IncomingMessage),
    true,
  );
});

test("readRequestBody throws when over the limit", async () => {
  const req = mockReq("hello world", {});
  await assert.rejects(() => readRequestBody(req, 4), BodyTooLargeError);
});

test("populateBody parses JSON into ctx.body", async () => {
  const raw = JSON.stringify({ name: "Alice" });
  const req = mockReq(raw, {
    "content-length": String(raw.length),
    "content-type": "application/json",
  });
  const ctx = mockCtx({ "content-type": "application/json" });

  const result = await populateBody(req, ctx, 1024);

  assert.equal(result, "ok");
  assert.deepEqual(ctx.body, { name: "Alice" });
  assert.equal(ctx.rawBody, raw);
});

test("populateBody returns invalid-json for malformed JSON", async () => {
  const raw = "{ not json";
  const req = mockReq(raw, {
    "content-length": String(raw.length),
    "content-type": "application/json",
  });
  const ctx = mockCtx({ "content-type": "application/json" });

  const result = await populateBody(req, ctx, 1024);

  assert.equal(result, "invalid-json");
  assert.equal(ctx.body, undefined);
  assert.equal(ctx.rawBody, raw);
});

test("populateBody sets rawBody but not body for non-JSON content types", async () => {
  const raw = "name=Alice";
  const req = mockReq(raw, {
    "content-length": String(raw.length),
    "content-type": "application/x-www-form-urlencoded",
  });
  const ctx = mockCtx({ "content-type": "application/x-www-form-urlencoded" });

  const result = await populateBody(req, ctx, 1024);

  assert.equal(result, "ok");
  assert.equal(ctx.rawBody, raw);
  assert.equal(ctx.body, undefined);
});

test("populateBody returns too-large when body exceeds limit", async () => {
  const raw = JSON.stringify({ data: "x".repeat(100) });
  const req = mockReq(raw, {
    "content-length": String(raw.length),
    "content-type": "application/json",
  });
  const ctx = mockCtx({ "content-type": "application/json" });

  const result = await populateBody(req, ctx, 8);

  assert.equal(result, "too-large");
});

test("populateBody skips reading when there is no body", async () => {
  const req = mockReq("", { "content-length": "0" });
  const ctx = mockCtx({});

  const result = await populateBody(req, ctx, 1024);

  assert.equal(result, "ok");
  assert.equal(ctx.body, undefined);
  assert.equal(ctx.rawBody, undefined);
});
