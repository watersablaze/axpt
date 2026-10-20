import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { queueAdminIncomingAlert, deliverAdminIncomingAlert } = require("../../src/domains/admin-incoming/adminIncomingAlerts.ts");
let row, sends = 0;
const emailLog = {
  create: async ({data}) => { row = { id: 1, ...data }; return { id: 1 }; },
  findUnique: async () => ({ ...row }),
  updateMany: async ({ where, data }) => {
    if (!where.status.in.includes(row.status)) return { count: 0 };
    Object.assign(row, data); return { count: 1 };
  },
  update: async ({data}) => Object.assign(row, data),
};
const client = { emailLog };
const send = async input => {
  sends++;
  assert.equal(input.to, "connect@axpt.io");
  assert.match(input.text, /https:\/\/www\.axpt\.io\/admin\//);
  assert.ok(!input.html.includes("private message body"));
  return { data: { id: "provider-1" }, error: null };
};
const options = { mode: "send", from: "AXPT <no-reply@axpt.io>", send };
await queueAdminIncomingAlert(client, { kind: "PROFILE_REQUEST", sourceId: "request-1" });
await Promise.all([deliverAdminIncomingAlert(client, 1, options), deliverAdminIncomingAlert(client, 1, options)]);
assert.equal(sends, 1); assert.equal(row.status, "SENT");
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 1);
await queueAdminIncomingAlert(client, { kind: "ARP_FIELD_MESSAGE", sourceId: "message-1" });
await deliverAdminIncomingAlert(client, 1, { ...options, mode: "log" });
assert.equal(row.status, "LOGGED_ONLY"); assert.equal(sends, 1);
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 2);
await queueAdminIncomingAlert(client, { kind: "LOI_ACCESS_REQUEST", sourceId: "request-2" });
await deliverAdminIncomingAlert(client, 1, { ...options, send: async () => { throw new Error("network timeout"); } });
assert.equal(row.status, "DELIVERY_UNCERTAIN");
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 2);
row.status = "SENDING";
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 2);
row.status = "QUEUED";
await deliverAdminIncomingAlert(client, 1, { ...options, send: async () => ({ data: null, error: { message: "rejected" } }) });
assert.equal(row.status, "FAILED");
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 3);
row.status = "QUEUED"; row.to = "other@example.com";
await deliverAdminIncomingAlert(client, 1, options); assert.equal(sends, 3);
console.log("ADMIN_INCOMING_ALERTS_OK: concurrent claim, replay, log mode, rejection retry, ambiguous/interrupted holds and fixed recipient; no email or database connection.");
