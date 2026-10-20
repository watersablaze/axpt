import "server-only";
import { PrismaClient as SourceAuthorityJoinClient } from "@axpt/source-authority-join";

declare global {
  var arpSourceAuthorityJoinClient: SourceAuthorityJoinClient | undefined;
}

function graphDelegate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const client = global.arpSourceAuthorityJoinClient ??= new SourceAuthorityJoinClient({
    datasources: { db: { url } },
    log: ["error"],
  });
  return client.sourceAuthorityRecord;
}

/**
 * Request-scoped adapter for the CUP reader only. All ownership, version,
 * particulars and other queries retain the supplied client's delegates.
 * Both generated clients come from the same schema; only this graph delegate
 * uses the separately generated relation-join engine. No result is cached.
 * Do not use with a transaction client: the graph has its own connection.
 */
export function withSourceAuthorityJoinGraph<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, property) {
      if (property === "sourceAuthorityRecord") return graphDelegate();
      return Reflect.get(target, property, target);
    },
  });
}
