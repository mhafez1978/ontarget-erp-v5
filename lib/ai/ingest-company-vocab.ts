import { db } from "@/lib/db";
import { vectorStore } from "./vector-store";
import type { Prisma } from "@/generated/prisma/client";

export interface IngestOptions {
  dryRun?: boolean;
  onlyEnabled?: boolean; // respect company.aiStorefrontEnabled
  companyId?: string | null;
  batchSize?: number;
}

export interface IngestDeps {
  db?: typeof db;
  vectorStore?: typeof vectorStore;
}

export async function ingestCompanyVocab(
  opts: IngestOptions = {},
  deps: IngestDeps = {}
) {
  const {
    dryRun = true,
    onlyEnabled = true,
    companyId = null,
    batchSize = 50,
  } = opts;

  const dbClient = deps.db || db;
  const vstore = deps.vectorStore || vectorStore;

  console.log("Starting company vocab ingestion", {
    dryRun,
    onlyEnabled,
    companyId,
    batchSize,
  });

  let where: Prisma.CompanyWhereInput = {};
  if (companyId) where = { ...where, id: companyId };
  if (onlyEnabled) where = { ...where, aiStorefrontEnabled: true };

  let offset = 0;
  let processedCompanies = 0;

  while (true) {
    const companies = await dbClient.company.findMany({
      where,
      select: { id: true },
      skip: offset,
      take: batchSize,
    });
    if (!companies || companies.length === 0) break;

    for (const c of companies) {
      processedCompanies++;
      const entries = await dbClient.companyVocabulary.findMany({
        where: { companyId: c.id },
      });
      if (!entries || entries.length === 0) {
        console.log(`No vocab for company ${c.id}`);
        continue;
      }

      const docs = entries.map((e) => ({
        id: e.id,
        text: `${e.key}: ${e.pluralLabel || e.singularLabel}`,
      }));

      if (dryRun) {
        console.log(
          `[dry-run] Would index ${docs.length} docs for company ${c.id}`
        );
      } else {
        try {
          await vstore.upsert(c.id, docs);
          console.log(`Indexed ${docs.length} docs for company ${c.id}`);
        } catch (err) {
          console.error(`Failed to index company ${c.id}:`, err);
        }
      }
    }

    offset += companies.length;
    if (companies.length < batchSize) break;
  }

  console.log("Ingestion complete", { processedCompanies });
  return { processedCompanies };
}
