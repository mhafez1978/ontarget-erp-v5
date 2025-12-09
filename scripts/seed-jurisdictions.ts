import { db } from "../lib/db";
import type { TaxConfig } from "../lib/payroll/tax-calculator";

/**
 * Seed PayrollJurisdiction data with real tax configurations
 *
 * Includes:
 * - US Federal (base configuration)
 * - US States: California, New York, Texas, Florida
 * - International: United Kingdom, Canada (Ontario)
 */

const jurisdictions = [
  {
    code: "US-FEDERAL",
    name: "United States Federal",
    countryCode: "US",
    regionCode: null,
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 11000, rate: 10 },
          { min: 11000, max: 44725, rate: 12 },
          { min: 44725, max: 95375, rate: 22 },
          { min: 95375, max: 182100, rate: 24 },
          { min: 182100, max: 231250, rate: 32 },
          { min: 231250, max: 578125, rate: 35 },
          { min: 578125, max: null, rate: 37 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 6.2,
          employerRate: 6.2,
          wageBase: 168600, // 2024 wage base
        },
        medicare: {
          employeeRate: 1.45,
          employerRate: 1.45,
          additionalRate: 0.9,
          additionalThreshold: 200000, // Additional Medicare Tax threshold
        },
      },
    } as TaxConfig,
    requiredForms: ["W-4", "I-9", "W-2"],
    filingFrequency: "QUARTERLY",
    isActive: true,
  },
  {
    code: "US-CA",
    name: "California",
    countryCode: "US",
    regionCode: "CA",
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 10099, rate: 1.0 },
          { min: 10099, max: 23942, rate: 2.0 },
          { min: 23942, max: 37788, rate: 4.0 },
          { min: 37788, max: 52455, rate: 6.0 },
          { min: 52455, max: 66295, rate: 8.0 },
          { min: 66295, max: 338639, rate: 9.3 },
          { min: 338639, max: 406364, rate: 10.3 },
          { min: 406364, max: 677275, rate: 11.3 },
          { min: 677275, max: 1000000, rate: 12.3 },
          { min: 1000000, max: null, rate: 13.3 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 6.2,
          employerRate: 6.2,
          wageBase: 168600,
        },
        medicare: {
          employeeRate: 1.45,
          employerRate: 1.45,
          additionalRate: 0.9,
          additionalThreshold: 200000,
        },
        stateDisabilityInsurance: {
          employeeRate: 1.1,
          employerRate: 0,
          wageBase: 153164, // 2024 CA SDI wage base
        },
        stateUnemployment: {
          employeeRate: 0,
          employerRate: 3.4, // Employer only
          wageBase: 7000,
        },
      },
      regionalTaxes: {
        state: {
          type: "PROGRESSIVE",
          brackets: [
            { min: 0, max: 10099, rate: 1.0 },
            { min: 10099, max: 23942, rate: 2.0 },
            { min: 23942, max: 37788, rate: 4.0 },
            { min: 37788, max: 52455, rate: 6.0 },
            { min: 52455, max: 66295, rate: 8.0 },
            { min: 66295, max: 338639, rate: 9.3 },
            { min: 338639, max: 406364, rate: 10.3 },
            { min: 406364, max: 677275, rate: 11.3 },
            { min: 677275, max: 1000000, rate: 12.3 },
            { min: 1000000, max: null, rate: 13.3 },
          ],
        },
      },
    } as TaxConfig,
    requiredForms: ["W-4", "I-9", "CA DE-4", "W-2"],
    filingFrequency: "QUARTERLY",
    isActive: true,
  },
  {
    code: "US-NY",
    name: "New York",
    countryCode: "US",
    regionCode: "NY",
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 8500, rate: 4.0 },
          { min: 8500, max: 11700, rate: 4.5 },
          { min: 11700, max: 13900, rate: 5.25 },
          { min: 13900, max: 80650, rate: 5.5 },
          { min: 80650, max: 215400, rate: 6.0 },
          { min: 215400, max: 1077550, rate: 6.85 },
          { min: 1077550, max: 5000000, rate: 9.65 },
          { min: 5000000, max: 25000000, rate: 10.3 },
          { min: 25000000, max: null, rate: 10.9 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 6.2,
          employerRate: 6.2,
          wageBase: 168600,
        },
        medicare: {
          employeeRate: 1.45,
          employerRate: 1.45,
          additionalRate: 0.9,
          additionalThreshold: 200000,
        },
        stateUnemployment: {
          employeeRate: 0,
          employerRate: 3.4,
          wageBase: 12300,
        },
      },
      regionalTaxes: {
        state: {
          type: "PROGRESSIVE",
          brackets: [
            { min: 0, max: 8500, rate: 4.0 },
            { min: 8500, max: 11700, rate: 4.5 },
            { min: 11700, max: 13900, rate: 5.25 },
            { min: 13900, max: 80650, rate: 5.5 },
            { min: 80650, max: 215400, rate: 6.0 },
            { min: 215400, max: 1077550, rate: 6.85 },
            { min: 1077550, max: 5000000, rate: 9.65 },
            { min: 5000000, max: 25000000, rate: 10.3 },
            { min: 25000000, max: null, rate: 10.9 },
          ],
        },
      },
    } as TaxConfig,
    requiredForms: ["W-4", "I-9", "NY IT-2104", "W-2"],
    filingFrequency: "QUARTERLY",
    isActive: true,
  },
  {
    code: "US-TX",
    name: "Texas",
    countryCode: "US",
    regionCode: "TX",
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 11000, rate: 10 },
          { min: 11000, max: 44725, rate: 12 },
          { min: 44725, max: 95375, rate: 22 },
          { min: 95375, max: 182100, rate: 24 },
          { min: 182100, max: 231250, rate: 32 },
          { min: 231250, max: 578125, rate: 35 },
          { min: 578125, max: null, rate: 37 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 6.2,
          employerRate: 6.2,
          wageBase: 168600,
        },
        medicare: {
          employeeRate: 1.45,
          employerRate: 1.45,
          additionalRate: 0.9,
          additionalThreshold: 200000,
        },
        stateUnemployment: {
          employeeRate: 0,
          employerRate: 2.7,
          wageBase: 9000,
        },
      },
      regionalTaxes: {
        state: {
          type: "NONE", // Texas has no state income tax
        },
      },
    } as TaxConfig,
    requiredForms: ["W-4", "I-9", "W-2"],
    filingFrequency: "QUARTERLY",
    isActive: true,
  },
  {
    code: "US-FL",
    name: "Florida",
    countryCode: "US",
    regionCode: "FL",
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 11000, rate: 10 },
          { min: 11000, max: 44725, rate: 12 },
          { min: 44725, max: 95375, rate: 22 },
          { min: 95375, max: 182100, rate: 24 },
          { min: 182100, max: 231250, rate: 32 },
          { min: 231250, max: 578125, rate: 35 },
          { min: 578125, max: null, rate: 37 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 6.2,
          employerRate: 6.2,
          wageBase: 168600,
        },
        medicare: {
          employeeRate: 1.45,
          employerRate: 1.45,
          additionalRate: 0.9,
          additionalThreshold: 200000,
        },
        stateUnemployment: {
          employeeRate: 0,
          employerRate: 2.7,
          wageBase: 7000,
        },
      },
      regionalTaxes: {
        state: {
          type: "NONE", // Florida has no state income tax
        },
      },
    } as TaxConfig,
    requiredForms: ["W-4", "I-9", "W-2"],
    filingFrequency: "QUARTERLY",
    isActive: true,
  },
  {
    code: "UK",
    name: "United Kingdom",
    countryCode: "GB",
    regionCode: null,
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 12570, rate: 0 }, // Personal allowance
          { min: 12570, max: 50270, rate: 20 }, // Basic rate
          { min: 50270, max: 125140, rate: 40 }, // Higher rate
          { min: 125140, max: null, rate: 45 }, // Additional rate
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 12, // National Insurance Class 1 (employee)
          employerRate: 13.8, // National Insurance Class 1 (employer)
          wageBase: 50270, // Upper earnings limit
        },
      },
      regionalTaxes: {
        state: {
          type: "PROGRESSIVE",
          brackets: [
            { min: 0, max: 12570, rate: 0 },
            { min: 12570, max: 50270, rate: 20 },
            { min: 50270, max: 125140, rate: 40 },
            { min: 125140, max: null, rate: 45 },
          ],
        },
      },
    } as TaxConfig,
    requiredForms: ["P45", "P46", "P60"],
    filingFrequency: "MONTHLY",
    isActive: true,
  },
  {
    code: "CA-ON",
    name: "Ontario, Canada",
    countryCode: "CA",
    regionCode: "ON",
    taxConfig: {
      incomeTax: {
        type: "PROGRESSIVE",
        brackets: [
          { min: 0, max: 15000, rate: 15 }, // Federal basic rate
          { min: 15000, max: 53359, rate: 20.5 },
          { min: 53359, max: 106717, rate: 26 },
          { min: 106717, max: 165430, rate: 29 },
          { min: 165430, max: 235675, rate: 31 },
          { min: 235675, max: null, rate: 33 },
        ],
      },
      payrollTaxes: {
        socialSecurity: {
          employeeRate: 5.95, // CPP contribution rate
          employerRate: 5.95,
          wageBase: 68500, // 2024 CPP maximum pensionable earnings
        },
        stateUnemployment: {
          employeeRate: 1.58, // EI employee rate
          employerRate: 2.21, // EI employer rate (1.4x employee)
          wageBase: 63200, // 2024 EI maximum insurable earnings
        },
      },
      regionalTaxes: {
        state: {
          type: "PROGRESSIVE",
          brackets: [
            { min: 0, max: 51446, rate: 5.05 }, // Ontario provincial
            { min: 51446, max: 102894, rate: 9.15 },
            { min: 102894, max: 150000, rate: 11.16 },
            { min: 150000, max: 220000, rate: 12.16 },
            { min: 220000, max: null, rate: 13.16 },
          ],
        },
      },
    } as TaxConfig,
    requiredForms: ["TD1", "TD1ON", "T4"],
    filingFrequency: "MONTHLY",
    isActive: true,
  },
];

async function seedJurisdictions() {
  console.log("🌍 Seeding PayrollJurisdiction data...\n");

  for (const jurisdiction of jurisdictions) {
    try {
      const existing = await db.payrollJurisdiction.findUnique({
        where: { code: jurisdiction.code },
      });
      if (existing) {
        console.log(`⚠️  ${jurisdiction.code} already exists, updating...`);
        await db.payrollJurisdiction.update({
          where: { code: jurisdiction.code },
          data: {
            name: jurisdiction.name,
            countryCode: jurisdiction.countryCode,
            regionCode: jurisdiction.regionCode,
            taxConfig: JSON.parse(JSON.stringify(jurisdiction.taxConfig)),
            requiredForms: jurisdiction.requiredForms,
            filingFrequency: jurisdiction.filingFrequency,
            isActive: jurisdiction.isActive,
          },
        });
        console.log(`✅ Updated ${jurisdiction.name} (${jurisdiction.code})\n`);
      } else {
        await db.payrollJurisdiction.create({
          data: {
            code: jurisdiction.code,
            name: jurisdiction.name,
            countryCode: jurisdiction.countryCode,
            regionCode: jurisdiction.regionCode,
            taxConfig: JSON.parse(JSON.stringify(jurisdiction.taxConfig)),
            requiredForms: jurisdiction.requiredForms,
            filingFrequency: jurisdiction.filingFrequency,
            isActive: jurisdiction.isActive,
          },
        });
        console.log(`✅ Created ${jurisdiction.name} (${jurisdiction.code})\n`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${jurisdiction.code}:`, error);
    }
  }

  console.log("✨ Jurisdiction seeding complete!");

  // Display summary
  const count = await db.payrollJurisdiction.count();
  console.log(`\n📊 Total jurisdictions in database: ${count}`);

  const allJurisdictions = await db.payrollJurisdiction.findMany({
    select: { code: true, name: true, isActive: true },
  });

  console.log("\n🗺️  Available jurisdictions:");
  allJurisdictions.forEach((j) => {
    console.log(`   ${j.isActive ? "✓" : "✗"} ${j.code} - ${j.name}`);
  });
}

seedJurisdictions()
  .catch((error) => {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
