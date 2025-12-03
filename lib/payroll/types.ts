export interface PayrollSummaryCurrencyTotal {
  currency: string;
  gross: string;
  net: string;
  taxes: string;
  entries: number;
}

export interface PayrollSummary {
  totalEntries: number;
  staffCount: number;
  primaryCurrency?: string;
  totalGrossPay?: string;
  totalNetPay?: string;
  totalTaxes?: string;
  totalsByCurrency: PayrollSummaryCurrencyTotal[];
}

export interface PayrollProcessResultEntry {
  payrollEntryId: string;
  staffId: string;
  currency: string;
  grossAmount: string;
  netAmount: string;
  taxes: string;
}

export interface PayrollProcessSkippedEntry {
  entryId: string;
  staffId: string;
  reason: string;
}

export interface PayrollProcessResult {
  companyId: string;
  processedTimeEntries: number;
  payrollEntriesCreated: number;
  currencyBreakdown: PayrollSummaryCurrencyTotal[];
  payrollEntries: PayrollProcessResultEntry[];
  skippedTimeEntries?: PayrollProcessSkippedEntry[];
}
