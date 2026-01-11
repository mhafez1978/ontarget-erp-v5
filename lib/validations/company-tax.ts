import { z } from "zod";

// Legal entity display names
export const LEGAL_ENTITY_LABELS: Record<
  string,
  { label: string; region: string }
> = {
  // Individual
  SOLE_PROPRIETOR: {
    label: "Sole Proprietor / Self-Employed",
    region: "Global",
  },

  // United States
  SINGLE_MEMBER_LLC: { label: "Single Member LLC", region: "United States" },
  LLC: { label: "Limited Liability Company (LLC)", region: "United States" },
  S_CORP: { label: "S-Corporation", region: "United States" },
  C_CORP: { label: "C-Corporation", region: "United States" },
  GENERAL_PARTNERSHIP: {
    label: "General Partnership",
    region: "United States",
  },
  LIMITED_PARTNERSHIP: {
    label: "Limited Partnership (LP)",
    region: "United States",
  },
  LLP: {
    label: "Limited Liability Partnership (LLP)",
    region: "United States",
  },
  NON_PROFIT: { label: "Non-Profit Organization", region: "United States" },

  // United Kingdom & Ireland
  LTD: {
    label: "Private Limited Company (Ltd)",
    region: "UK / Ireland / Commonwealth",
  },
  PLC: { label: "Public Limited Company (PLC)", region: "UK / Ireland" },

  // Germany & Austria
  GMBH: {
    label: "GmbH (Gesellschaft mit beschränkter Haftung)",
    region: "Germany / Austria / Switzerland",
  },
  AG: {
    label: "AG (Aktiengesellschaft)",
    region: "Germany / Austria / Switzerland",
  },
  UG: { label: "UG (Unternehmergesellschaft)", region: "Germany" },
  KG: { label: "KG (Kommanditgesellschaft)", region: "Germany / Austria" },
  OHG: {
    label: "OHG (Offene Handelsgesellschaft)",
    region: "Germany / Austria",
  },

  // France & Belgium
  SARL: {
    label: "SARL (Société à Responsabilité Limitée)",
    region: "France / Belgium / Luxembourg",
  },
  SA: {
    label: "SA (Société Anonyme)",
    region: "France / Belgium / Switzerland",
  },
  SAS: { label: "SAS (Société par Actions Simplifiée)", region: "France" },
  SASU: { label: "SASU (SAS Unipersonnelle)", region: "France" },
  EURL: { label: "EURL (Entreprise Unipersonnelle à RL)", region: "France" },
  SNC: { label: "SNC (Société en Nom Collectif)", region: "France" },

  // Spain & Portugal
  SL: { label: "SL (Sociedad Limitada)", region: "Spain" },
  SA_SPAIN: { label: "SA (Sociedad Anónima)", region: "Spain" },
  LDA: { label: "Lda (Sociedade por Quotas)", region: "Portugal" },
  SA_PORTUGAL: { label: "SA (Sociedade Anónima)", region: "Portugal" },

  // Italy
  SRL: {
    label: "SRL (Società a Responsabilità Limitata)",
    region: "Italy / Romania",
  },
  SPA: { label: "SpA (Società per Azioni)", region: "Italy" },
  SRLS: { label: "SRLS (SRL Semplificata)", region: "Italy" },

  // Netherlands
  BV: { label: "BV (Besloten Vennootschap)", region: "Netherlands / Belgium" },
  NV: { label: "NV (Naamloze Vennootschap)", region: "Netherlands / Belgium" },
  VOF: { label: "VOF (Vennootschap onder Firma)", region: "Netherlands" },

  // Nordic Countries
  AB: { label: "AB (Aktiebolag)", region: "Sweden" },
  AS: { label: "AS (Aksjeselskap)", region: "Norway" },
  APS: { label: "ApS (Anpartsselskab)", region: "Denmark" },
  AS_DENMARK: { label: "A/S (Aktieselskab)", region: "Denmark" },
  OY: { label: "Oy (Osakeyhtiö)", region: "Finland" },

  // Eastern Europe
  SPZOO: { label: "Sp. z o.o. (Spółka z o.o.)", region: "Poland" },
  SA_POLAND: { label: "SA (Spółka Akcyjna)", region: "Poland" },
  SRO: {
    label: "s.r.o. (Společnost s ručením omezeným)",
    region: "Czech Republic",
  },
  AS_CZECH: { label: "a.s. (Akciová společnost)", region: "Czech Republic" },

  // Asia-Pacific
  PTY_LTD: {
    label: "Pty Ltd (Proprietary Limited)",
    region: "Australia / South Africa",
  },
  PVT_LTD: {
    label: "Pvt Ltd (Private Limited)",
    region: "India / Pakistan / Bangladesh",
  },
  PUBLIC_LTD: {
    label: "Public Limited Company",
    region: "India / Singapore / Hong Kong",
  },
  SDN_BHD: { label: "Sdn Bhd (Sendirian Berhad)", region: "Malaysia / Brunei" },
  BHD: { label: "Bhd (Berhad)", region: "Malaysia" },
  PTE_LTD: { label: "Pte Ltd (Private Limited)", region: "Singapore" },
  KK: { label: "KK (株式会社 Kabushiki Kaisha)", region: "Japan" },
  GK: { label: "GK (合同会社 Godo Kaisha)", region: "Japan" },

  // Latin America
  SA_LATIN: { label: "SA (Sociedad Anónima)", region: "Latin America" },
  SRL_LATIN: {
    label: "SRL (Sociedad de Responsabilidad Limitada)",
    region: "Latin America",
  },
  LTDA: { label: "Ltda (Limitada)", region: "Brazil / Latin America" },
  SA_BRAZIL: { label: "SA (Sociedade Anônima)", region: "Brazil" },
  EIRELI: { label: "EIRELI (Empresa Individual de RL)", region: "Brazil" },
  MEI: { label: "MEI (Microempreendedor Individual)", region: "Brazil" },

  // Middle East & Africa
  LLC_MENA: {
    label: "LLC (Limited Liability Company)",
    region: "Middle East / North Africa",
  },
  FZE: { label: "FZE (Free Zone Establishment)", region: "UAE" },
  FZCO: { label: "FZCO (Free Zone Company)", region: "UAE" },
  WLL: { label: "WLL (With Limited Liability)", region: "Bahrain / Kuwait" },

  // Other
  COOPERATIVE: {
    label: "Cooperative / Co-operative Society",
    region: "Global",
  },
  TRUST: { label: "Trust", region: "Global" },
  FOUNDATION: { label: "Foundation / Stiftung", region: "Global" },
  ASSOCIATION: { label: "Association / Verein", region: "Global" },
  JOINT_VENTURE: { label: "Joint Venture", region: "Global" },
  BRANCH: { label: "Branch Office / Representative Office", region: "Global" },
  OTHER: { label: "Other Entity Type", region: "Global" },
};

// Tax ID Type display names
export const TAX_ID_TYPE_LABELS: Record<string, string> = {
  SSN: "SSN (Social Security Number)",
  EIN: "EIN (Employer Identification Number)",
  ITIN: "ITIN (Individual Taxpayer ID Number)",
  VAT: "VAT Number",
  GST: "GST Number",
  ABN: "ABN (Australian Business Number)",
  ACN: "ACN (Australian Company Number)",
  TFN: "TFN (Tax File Number - Australia)",
  NINO: "NINO (National Insurance Number - UK)",
  UTR: "UTR (Unique Taxpayer Reference - UK)",
  CRN: "CRN (Company Registration Number)",
  TVA: "Numéro de TVA (France)",
  NIF: "NIF (Número de Identificación Fiscal)",
  CIF: "CIF (Código de Identificación Fiscal - Spain)",
  SIREN: "SIREN (9 digits - France)",
  SIRET: "SIRET (14 digits - France)",
  CNPJ: "CNPJ (Cadastro Nacional - Brazil Business)",
  CPF: "CPF (Cadastro de Pessoas Físicas - Brazil)",
  RFC: "RFC (Registro Federal - Mexico)",
  RUT: "RUT (Rol Único Tributario)",
  CUIT: "CUIT (Clave Única - Argentina)",
  PAN: "PAN (Permanent Account Number - India)",
  GSTIN: "GSTIN (GST Identification - India)",
  TIN: "TIN (Tax Identification Number)",
  TRN: "TRN (Tax Registration Number)",
  OTHER: "Other Tax ID Type",
};

// Helper to determine if entity needs business tax ID (EIN/VAT) vs individual (SSN/CPF)
export function requiresBusinessTaxId(legalEntity: string): boolean {
  return legalEntity !== "SOLE_PROPRIETOR";
}

// Zod validation schema for company tax info
export const companyTaxInfoSchema = z.object({
  legalEntity: z
    .enum([
      "SOLE_PROPRIETOR",
      "SINGLE_MEMBER_LLC",
      "LLC",
      "S_CORP",
      "C_CORP",
      "GENERAL_PARTNERSHIP",
      "LIMITED_PARTNERSHIP",
      "LLP",
      "NON_PROFIT",
      "LTD",
      "PLC",
      "GMBH",
      "AG",
      "UG",
      "KG",
      "OHG",
      "SARL",
      "SA",
      "SAS",
      "SASU",
      "EURL",
      "SNC",
      "SL",
      "SA_SPAIN",
      "LDA",
      "SA_PORTUGAL",
      "SRL",
      "SPA",
      "SRLS",
      "BV",
      "NV",
      "VOF",
      "AB",
      "AS",
      "APS",
      "AS_DENMARK",
      "OY",
      "SPZOO",
      "SA_POLAND",
      "SRO",
      "AS_CZECH",
      "PTY_LTD",
      "PVT_LTD",
      "PUBLIC_LTD",
      "SDN_BHD",
      "BHD",
      "PTE_LTD",
      "KK",
      "GK",
      "SA_LATIN",
      "SRL_LATIN",
      "LTDA",
      "SA_BRAZIL",
      "EIRELI",
      "MEI",
      "LLC_MENA",
      "FZE",
      "FZCO",
      "WLL",
      "COOPERATIVE",
      "TRUST",
      "FOUNDATION",
      "ASSOCIATION",
      "JOINT_VENTURE",
      "BRANCH",
      "OTHER",
    ])
    .describe("Legal entity type"),
  taxIdType: z
    .enum([
      "SSN",
      "EIN",
      "ITIN",
      "VAT",
      "GST",
      "ABN",
      "ACN",
      "TFN",
      "NINO",
      "UTR",
      "CRN",
      "TVA",
      "NIF",
      "CIF",
      "SIREN",
      "SIRET",
      "CNPJ",
      "CPF",
      "RFC",
      "RUT",
      "CUIT",
      "PAN",
      "GSTIN",
      "TIN",
      "TRN",
      "OTHER",
    ])
    .describe("Tax ID type"),
  taxId: z
    .string()
    .min(3, "Tax ID must be at least 3 characters")
    .max(50, "Tax ID must be less than 50 characters")
    .regex(
      /^[A-Z0-9\-\/\s]+$/i,
      "Tax ID can only contain letters, numbers, hyphens, slashes, and spaces"
    ),
  taxCountry: z.string().optional(),
  vatNumber: z.string().optional(),
});

export type CompanyTaxInfoInput = z.infer<typeof companyTaxInfoSchema>;
