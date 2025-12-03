import { Decimal } from "@prisma/client/runtime/library";

// Tax Configuration Types
export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  baseAmount?: number;
}

export interface PayrollTax {
  employeeRate: number;
  employerRate: number;
  wageBase?: number;
  additionalRate?: number;
  additionalThreshold?: number;
}

export interface TaxConfig {
  incomeTax: {
    type: "FLAT" | "PROGRESSIVE" | "NONE";
    flatRate?: number;
    brackets?: TaxBracket[];
  };
  payrollTaxes: {
    socialSecurity?: PayrollTax;
    medicare?: PayrollTax;
    stateUnemployment?: PayrollTax;
    stateDisabilityInsurance?: PayrollTax;
  };
  regionalTaxes?: {
    state?: {
      type: "FLAT" | "PROGRESSIVE" | "NONE";
      flatRate?: number;
      brackets?: TaxBracket[];
    };
    local?: {
      type: "FLAT" | "NONE";
      flatRate?: number;
    };
  };
}

export interface TaxWithholdingConfig {
  filingStatus?:
    | "SINGLE"
    | "MARRIED_JOINT"
    | "MARRIED_SEPARATE"
    | "HEAD_OF_HOUSEHOLD";
  allowances?: number;
  additionalWithholding?: number;
}

export interface TaxBreakdown {
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurity: number;
  medicare: number;
  medicareAdditional: number;
  stateUnemployment: number;
  stateDisabilityInsurance: number;
  totals: {
    totalTaxes: number;
    totalDeductions: number;
    netPay: number;
  };
}

export interface DeductionsBreakdown {
  healthInsurance?: number;
  dentalInsurance?: number;
  visionInsurance?: number;
  retirement401k?: number;
  rothIRA?: number;
  hsa?: number;
  fsa?: number;
  lifeInsurance?: number;
  other?: Record<string, number>;
  total: number;
}

/**
 * Tax Calculator Engine for Multi-Jurisdiction Payroll
 *
 * Calculates federal, state, local, and payroll taxes based on jurisdiction configuration.
 * Supports progressive and flat tax structures, multiple filing statuses, and various deductions.
 */
export class TaxCalculator {
  /**
   * Calculate federal income tax using progressive brackets
   */
  static calculateFederalIncomeTax(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    withholding?: TaxWithholdingConfig
  ): number {
    if (taxConfig.incomeTax.type === "NONE") {
      return 0;
    }

    const gross = grossPay.toNumber();

    if (taxConfig.incomeTax.type === "FLAT" && taxConfig.incomeTax.flatRate) {
      const tax = gross * (taxConfig.incomeTax.flatRate / 100);
      return this.applyWithholding(tax, withholding);
    }

    if (
      taxConfig.incomeTax.type === "PROGRESSIVE" &&
      taxConfig.incomeTax.brackets
    ) {
      const tax = this.calculateProgressiveTax(
        gross,
        taxConfig.incomeTax.brackets
      );
      return this.applyWithholding(tax, withholding);
    }

    return 0;
  }

  /**
   * Calculate state income tax using progressive or flat brackets
   */
  static calculateStateIncomeTax(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    withholding?: TaxWithholdingConfig
  ): number {
    if (
      !taxConfig.regionalTaxes?.state ||
      taxConfig.regionalTaxes.state.type === "NONE"
    ) {
      return 0;
    }

    const gross = grossPay.toNumber();
    const stateTax = taxConfig.regionalTaxes.state;

    if (stateTax.type === "FLAT" && stateTax.flatRate) {
      const tax = gross * (stateTax.flatRate / 100);
      return this.applyWithholding(tax, withholding);
    }

    if (stateTax.type === "PROGRESSIVE" && stateTax.brackets) {
      const tax = this.calculateProgressiveTax(gross, stateTax.brackets);
      return this.applyWithholding(tax, withholding);
    }

    return 0;
  }

  /**
   * Calculate local income tax (usually flat rate)
   */
  static calculateLocalIncomeTax(
    grossPay: Decimal,
    taxConfig: TaxConfig
  ): number {
    if (
      !taxConfig.regionalTaxes?.local ||
      taxConfig.regionalTaxes.local.type === "NONE"
    ) {
      return 0;
    }

    const gross = grossPay.toNumber();
    const localTax = taxConfig.regionalTaxes.local;

    if (localTax.type === "FLAT" && localTax.flatRate) {
      return gross * (localTax.flatRate / 100);
    }

    return 0;
  }

  /**
   * Calculate Social Security tax (FICA) with wage base limit
   */
  static calculateSocialSecurity(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    yearToDateGross: number = 0
  ): number {
    const ssConfig = taxConfig.payrollTaxes.socialSecurity;
    if (!ssConfig) return 0;

    const gross = grossPay.toNumber();
    const wageBase = ssConfig.wageBase || 999999999; // Very high default if no limit

    // Calculate how much is subject to SS tax
    const newYtdGross = yearToDateGross + gross;
    let taxableAmount = gross;

    if (yearToDateGross >= wageBase) {
      // Already exceeded wage base
      return 0;
    } else if (newYtdGross > wageBase) {
      // This payment exceeds wage base
      taxableAmount = wageBase - yearToDateGross;
    }

    return taxableAmount * (ssConfig.employeeRate / 100);
  }

  /**
   * Calculate Medicare tax with additional Medicare tax for high earners
   */
  static calculateMedicare(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    yearToDateGross: number = 0,
    filingStatus?: string
  ): { medicare: number; medicareAdditional: number } {
    const medicareConfig = taxConfig.payrollTaxes.medicare;
    if (!medicareConfig) return { medicare: 0, medicareAdditional: 0 };

    const gross = grossPay.toNumber();
    const medicare = gross * (medicareConfig.employeeRate / 100);

    // Additional Medicare Tax (0.9% for high earners)
    let medicareAdditional = 0;
    if (medicareConfig.additionalRate && medicareConfig.additionalThreshold) {
      const newYtdGross = yearToDateGross + gross;
      if (newYtdGross > medicareConfig.additionalThreshold) {
        const amountOverThreshold =
          yearToDateGross >= medicareConfig.additionalThreshold
            ? gross
            : newYtdGross - medicareConfig.additionalThreshold;
        medicareAdditional =
          amountOverThreshold * (medicareConfig.additionalRate / 100);
      }
    }

    return { medicare, medicareAdditional };
  }

  /**
   * Calculate state unemployment insurance (SUI) - employee portion if applicable
   */
  static calculateStateUnemployment(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    yearToDateGross: number = 0
  ): number {
    const suiConfig = taxConfig.payrollTaxes.stateUnemployment;
    if (!suiConfig) return 0;

    const gross = grossPay.toNumber();
    const wageBase = suiConfig.wageBase || 999999999;

    const newYtdGross = yearToDateGross + gross;
    let taxableAmount = gross;

    if (yearToDateGross >= wageBase) {
      return 0;
    } else if (newYtdGross > wageBase) {
      taxableAmount = wageBase - yearToDateGross;
    }

    return taxableAmount * (suiConfig.employeeRate / 100);
  }

  /**
   * Calculate state disability insurance (SDI) - common in CA, NY, etc.
   */
  static calculateStateDisabilityInsurance(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    yearToDateGross: number = 0
  ): number {
    const sdiConfig = taxConfig.payrollTaxes.stateDisabilityInsurance;
    if (!sdiConfig) return 0;

    const gross = grossPay.toNumber();
    const wageBase = sdiConfig.wageBase || 999999999;

    const newYtdGross = yearToDateGross + gross;
    let taxableAmount = gross;

    if (yearToDateGross >= wageBase) {
      return 0;
    } else if (newYtdGross > wageBase) {
      taxableAmount = wageBase - yearToDateGross;
    }

    return taxableAmount * (sdiConfig.employeeRate / 100);
  }

  /**
   * Calculate total deductions from gross pay
   */
  static calculateDeductions(deductionsConfig?: DeductionsBreakdown): number {
    if (!deductionsConfig) return 0;

    let total = 0;
    if (deductionsConfig.healthInsurance)
      total += deductionsConfig.healthInsurance;
    if (deductionsConfig.dentalInsurance)
      total += deductionsConfig.dentalInsurance;
    if (deductionsConfig.visionInsurance)
      total += deductionsConfig.visionInsurance;
    if (deductionsConfig.retirement401k)
      total += deductionsConfig.retirement401k;
    if (deductionsConfig.rothIRA) total += deductionsConfig.rothIRA;
    if (deductionsConfig.hsa) total += deductionsConfig.hsa;
    if (deductionsConfig.fsa) total += deductionsConfig.fsa;
    if (deductionsConfig.lifeInsurance) total += deductionsConfig.lifeInsurance;

    if (deductionsConfig.other) {
      Object.values(deductionsConfig.other).forEach((amount) => {
        total += amount;
      });
    }

    return total;
  }

  /**
   * Master calculation: Calculate complete tax breakdown and net pay
   */
  static calculatePayroll(
    grossPay: Decimal,
    taxConfig: TaxConfig,
    options?: {
      withholding?: TaxWithholdingConfig;
      deductions?: DeductionsBreakdown;
      yearToDateGross?: number;
    }
  ): TaxBreakdown {
    const yearToDateGross = options?.yearToDateGross || 0;

    // Calculate all taxes
    const federalIncomeTax = this.calculateFederalIncomeTax(
      grossPay,
      taxConfig,
      options?.withholding
    );

    const stateIncomeTax = this.calculateStateIncomeTax(
      grossPay,
      taxConfig,
      options?.withholding
    );

    const localIncomeTax = this.calculateLocalIncomeTax(grossPay, taxConfig);

    const socialSecurity = this.calculateSocialSecurity(
      grossPay,
      taxConfig,
      yearToDateGross
    );

    const { medicare, medicareAdditional } = this.calculateMedicare(
      grossPay,
      taxConfig,
      yearToDateGross,
      options?.withholding?.filingStatus
    );

    const stateUnemployment = this.calculateStateUnemployment(
      grossPay,
      taxConfig,
      yearToDateGross
    );

    const stateDisabilityInsurance = this.calculateStateDisabilityInsurance(
      grossPay,
      taxConfig,
      yearToDateGross
    );

    // Calculate deductions
    const totalDeductions = this.calculateDeductions(options?.deductions);

    // Calculate totals
    const totalTaxes =
      federalIncomeTax +
      stateIncomeTax +
      localIncomeTax +
      socialSecurity +
      medicare +
      medicareAdditional +
      stateUnemployment +
      stateDisabilityInsurance;

    const netPay = grossPay.toNumber() - totalTaxes - totalDeductions;

    return {
      federalIncomeTax: this.roundToTwo(federalIncomeTax),
      stateIncomeTax: this.roundToTwo(stateIncomeTax),
      localIncomeTax: this.roundToTwo(localIncomeTax),
      socialSecurity: this.roundToTwo(socialSecurity),
      medicare: this.roundToTwo(medicare),
      medicareAdditional: this.roundToTwo(medicareAdditional),
      stateUnemployment: this.roundToTwo(stateUnemployment),
      stateDisabilityInsurance: this.roundToTwo(stateDisabilityInsurance),
      totals: {
        totalTaxes: this.roundToTwo(totalTaxes),
        totalDeductions: this.roundToTwo(totalDeductions),
        netPay: this.roundToTwo(netPay),
      },
    };
  }

  /**
   * Helper: Calculate progressive tax based on brackets
   */
  private static calculateProgressiveTax(
    income: number,
    brackets: TaxBracket[]
  ): number {
    let tax = 0;

    for (const bracket of brackets) {
      const bracketMin = bracket.min;
      const bracketMax = bracket.max || Infinity;

      if (income <= bracketMin) {
        break;
      }

      const taxableInBracket = Math.min(income, bracketMax) - bracketMin;
      const bracketTax = taxableInBracket * (bracket.rate / 100);
      tax += bracketTax;

      if (income <= bracketMax) {
        break;
      }
    }

    return tax;
  }

  /**
   * Helper: Apply withholding adjustments (allowances, additional withholding)
   */
  private static applyWithholding(
    calculatedTax: number,
    withholding?: TaxWithholdingConfig
  ): number {
    if (!withholding) return calculatedTax;

    let adjustedTax = calculatedTax;

    // Reduce tax based on allowances (simplified - in reality uses IRS tables)
    if (withholding.allowances) {
      const allowanceReduction = withholding.allowances * 80; // Simplified: $80 per allowance per pay period
      adjustedTax = Math.max(0, adjustedTax - allowanceReduction);
    }

    // Add additional withholding if requested
    if (withholding.additionalWithholding) {
      adjustedTax += withholding.additionalWithholding;
    }

    return adjustedTax;
  }

  /**
   * Helper: Round to 2 decimal places
   */
  private static roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }
}
