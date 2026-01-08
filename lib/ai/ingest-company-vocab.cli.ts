#!/usr/bin/env -S ts-node
import { parse } from "ts-command-line-args";
import { ingestCompanyVocab } from "./ingest-company-vocab.ts";

interface CLIArgs {
  dryRun?: boolean;
  onlyEnabled?: boolean;
  companyId?: string;
  batchSize?: number;
}

const args = parse<CLIArgs>({
  dryRun: { type: Boolean, optional: true },
  onlyEnabled: { type: Boolean, optional: true },
  companyId: { type: String, optional: true },
  batchSize: { type: Number, optional: true },
});

(async () => {
  try {
    const res = await ingestCompanyVocab({
      dryRun: args.dryRun !== undefined ? args.dryRun : true,
      onlyEnabled: args.onlyEnabled !== undefined ? args.onlyEnabled : true,
      companyId: args.companyId || null,
      batchSize: args.batchSize || 50,
    });
    console.log("Done.", res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
