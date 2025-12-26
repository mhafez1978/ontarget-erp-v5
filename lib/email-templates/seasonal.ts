import { EmailTemplateType, EmailTemplateCategory } from "@prisma/client";
import {
  TemplateDefinition,
  createEmailShell,
  createContentBlock,
  createCTAButton,
  createFeatureHighlight,
} from "./index";

/**
 * SEASONAL & HOLIDAY MARKETING EMAIL TEMPLATES
 * Campaign emails for sales, promotions, and special occasions
 */

export const SEASONAL_TEMPLATES: TemplateDefinition[] = [
  // BLACK FRIDAY SALE Template
  {
    type: "BLACK_FRIDAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Black Friday Sale",
    description: "Promotional email for Black Friday deals and discounts",
    subject:
      "🖤 BLACK FRIDAY: {{discountPercentage}}% OFF Everything! | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
      "expiryDate",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Main Headline",
        type: "text",
        placeholder: "Create an attention-grabbing headline...",
        defaultValue: "BLACK FRIDAY IS HERE! 🎉",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Black Friday offer...",
        defaultValue:
          "The most anticipated sale of the year has arrived! Get ready for massive savings on everything—this is your chance to score incredible deals you won't find anywhere else.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🛍️ Shop Black Friday Now",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 38px; color: #000000; margin: 0 0 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; line-height: 1.2;">
            ${blocks.headline || "BLACK FRIDAY IS HERE! 🎉"}
          </h1>
          <div style="font-size: 56px; font-weight: 900; background: linear-gradient(135deg, #000000 0%, #434343 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 24px 0; line-height: 1;">
            ${vars.discountPercentage}% OFF
          </div>
          <p style="font-size: 18px; color: #495057; margin: 12px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Everything Must Go!
          </p>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 32px 0; text-align: center;">
          ${
            blocks.message ||
            "The most anticipated sale of the year has arrived! Get ready for massive savings on everything—this is your chance to score incredible deals you won't find anywhere else."
          }
        </p>

        ${createContentBlock(
          `<div style="text-align: center;"><strong>🎁 Your Exclusive Code:</strong><br/><span style="font-size: 28px; font-weight: 900; color: #000000; letter-spacing: 2px; display: block; margin: 12px 0;">${
            vars.promoCode || "BLACKFRIDAY"
          }</span><strong>⏰ Hurry! Ends ${
            vars.expiryDate || "11/30"
          }</strong></div>`,
          "warning"
        )}

        ${createCTAButton(
          blocks.ctaText || "🛍️ Shop Black Friday Now",
          vars.saleUrl,
          "linear-gradient(135deg, #000000 0%, #434343 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 32px 0 0; text-align: center; font-weight: 600;">
          ⚡ Limited quantities available. Shop now before items sell out!
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #000000 0%, #434343 100%)",
        headerIcon: "🖤",
        headerTitle: "BLACK FRIDAY SALE",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
BLACK FRIDAY SALE - ${vars.companyName}

${blocks.headline || "BLACK FRIDAY MEGA SALE! 🎉"}

${vars.discountPercentage}% OFF EVERYTHING!

${
  blocks.message ||
  "The biggest sale of the year is here! Enjoy massive discounts on everything."
}

🎁 PROMO CODE: ${vars.promoCode || "BLACKFRIDAY"}
⏰ LIMITED TIME: Sale ends ${vars.expiryDate || "11/30"}

Shop now: ${vars.saleUrl}

Don't miss out! This offer won't last long. ⚡

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // CHRISTMAS SALE Template
  {
    type: "CHRISTMAS_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Christmas Sale",
    description: "Festive holiday promotions and Christmas deals",
    subject: "🎄 Merry Christmas! Special Holiday Offers from {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "greeting",
        label: "Holiday Greeting",
        type: "text",
        placeholder: "Write a warm holiday message...",
        defaultValue: "Wishing you a Merry Christmas and joyful holidays! 🎅✨",
        maxLength: 200,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Christmas offer...",
        defaultValue:
          "Celebrate the season of giving with our special holiday discounts! Whether you're shopping for loved ones or treating yourself, we've got the perfect gifts at unbeatable prices.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🎁 Shop Christmas Deals",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 40px; color: #c41e3a; margin: 0 0 20px; font-weight: 800; line-height: 1.2;">
            🎄 ${blocks.greeting || "Merry Christmas and joyful holidays! 🎅✨"}
          </h1>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 32px; text-align: center;">
          ${
            blocks.message ||
            "Celebrate the season of giving with our special holiday discounts! Whether you're shopping for loved ones or treating yourself, we've got the perfect gifts at unbeatable prices."
          }
        </p>

        ${createFeatureHighlight([
          "🎁 Free gift wrapping on all orders",
          "🚚 Express delivery available",
          "💝 Special holiday bundles",
          "🎅 Satisfaction guaranteed",
        ])}

        ${createContentBlock(
          `<strong>🎉 Special Offer:</strong> <span style="font-size: 24px; font-weight: 700; color: #c41e3a;">${
            vars.discountPercentage || "25"
          }% OFF</span><br/><br/>
          Use code: <strong>${vars.promoCode || "CHRISTMAS"}</strong>`,
          "success"
        )}

        ${createCTAButton(
          blocks.ctaText || "🎁 Shop Christmas Deals",
          vars.saleUrl,
          "linear-gradient(135deg, #c41e3a 0%, #a01729 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          From our family to yours, Happy Holidays! 🎊
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #c41e3a 0%, #165b33 100%)",
        headerIcon: "🎄",
        headerTitle: "Christmas Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Christmas Sale - ${vars.companyName}

🎄 ${blocks.greeting || "Merry Christmas!"} 🎄

${blocks.message || "Celebrate the season with our special holiday discounts!"}

✓ Free gift wrapping on all orders
✓ Express delivery available
✓ Special holiday bundles
✓ Satisfaction guaranteed

🎉 SPECIAL OFFER: ${vars.discountPercentage || "25"}% OFF
Use code: ${vars.promoCode || "CHRISTMAS"}

Shop now: ${vars.saleUrl}

From our family to yours, Happy Holidays! 🎊

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // NEW YEAR SALE Template
  {
    type: "NEW_YEAR_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "New Year Sale",
    description: "New Year promotions and fresh start campaigns",
    subject:
      "🎉 New Year, New Deals! Start 2024 with {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "New Year Headline",
        type: "text",
        placeholder: "Create an inspiring New Year message...",
        defaultValue: "Start the New Year Right! 🎊",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your New Year offer...",
        defaultValue:
          "New year, new opportunities! Kick off 2024 with incredible deals on everything you need.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🎉 Shop New Year Deals",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #fbbf24; margin: 0 0 15px; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
            ${blocks.headline || "Start the New Year Right! 🎊"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            SAVE ${vars.discountPercentage || "30"}%
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "New year, new opportunities! Kick off 2024 with incredible deals."
          }
        </p>

        ${createContentBlock(
          `<strong>✨ Limited Time Offer</strong><br/>
          Use code: <span style="font-size: 20px; font-weight: 700; color: #f59e0b;">${
            vars.promoCode || "NEWYEAR2024"
          }</span><br/>
          Valid through January 15th`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "🎉 Shop New Year Deals",
          vars.saleUrl,
          "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Cheers to new beginnings! 🥂
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        headerIcon: "🎉",
        headerTitle: "New Year Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
New Year Sale - ${vars.companyName}

${blocks.headline || "Start the New Year Right! 🎊"}

SAVE ${vars.discountPercentage || "30"}%

${
  blocks.message ||
  "New year, new opportunities! Kick off 2024 with incredible deals."
}

✨ LIMITED TIME OFFER
Use code: ${vars.promoCode || "NEWYEAR2024"}
Valid through January 15th

Shop now: ${vars.saleUrl}

Cheers to new beginnings! 🥂

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // VALENTINES DAY SALE Template
  {
    type: "VALENTINES_DAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Valentine's Day Sale",
    description: "Romantic promotions for Valentine's Day",
    subject: "💕 Show Some Love! Valentine's Day Specials from {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Valentine's Headline",
        type: "text",
        placeholder: "Create a romantic headline...",
        defaultValue: "Spread the Love This Valentine's Day 💕",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Valentine's offer...",
        defaultValue:
          "Find the perfect gift for your special someone. Show them how much you care!",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "💝 Shop Valentine's Gifts",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #ec4899; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Spread the Love This Valentine's Day 💕"}
          </h1>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${blocks.message || "Find the perfect gift for your special someone."}
        </p>

        ${createFeatureHighlight([
          "💝 Curated gift collections",
          "🎁 Beautiful gift wrapping",
          "💌 Include a personal message",
          "🚚 Guaranteed delivery by Feb 14th",
        ])}

        ${createContentBlock(
          `<strong>💕 Special Valentine's Offer:</strong><br/>
          Save ${vars.discountPercentage || "20"}% with code <strong>${
            vars.promoCode || "LOVE2024"
          }</strong>`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "💝 Shop Valentine's Gifts",
          vars.saleUrl,
          "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Make this Valentine's Day unforgettable! 💖
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        headerIcon: "💕",
        headerTitle: "Valentine's Day Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Valentine's Day Sale - ${vars.companyName}

${blocks.headline || "Spread the Love This Valentine's Day 💕"}

${blocks.message || "Find the perfect gift for your special someone."}

✓ Curated gift collections
✓ Beautiful gift wrapping
✓ Include a personal message
✓ Guaranteed delivery by Feb 14th

💕 SPECIAL VALENTINE'S OFFER:
Save ${vars.discountPercentage || "20"}% with code ${
      vars.promoCode || "LOVE2024"
    }

Shop now: ${vars.saleUrl}

Make this Valentine's Day unforgettable! 💖

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // SPRING SALE Template
  {
    type: "SPRING_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Spring Sale",
    description: "Fresh spring promotions and seasonal refresh campaigns",
    subject:
      "🌸 Spring into Savings! {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Spring Headline",
        type: "text",
        placeholder: "Create a fresh spring message...",
        defaultValue: "Spring Has Sprung! 🌸",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your spring offer...",
        defaultValue:
          "Refresh your style for the new season! Discover our latest spring collection at amazing prices.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🌺 Shop Spring Collection",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #10b981; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Spring Has Sprung! 🌸"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            ${vars.discountPercentage || "25"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${blocks.message || "Refresh your style for the new season!"}
        </p>

        ${createFeatureHighlight([
          "🌺 New spring arrivals",
          "🌿 Eco-friendly options",
          "🌸 Fresh colors & styles",
          "☀️ Perfect for the season",
        ])}

        ${createContentBlock(
          `<strong>🌻 Spring Special:</strong><br/>
          Use code <strong>${
            vars.promoCode || "SPRING2024"
          }</strong> at checkout`,
          "success"
        )}

        ${createCTAButton(
          blocks.ctaText || "🌺 Shop Spring Collection",
          vars.saleUrl,
          "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Bloom into spring with fresh new looks! 🌷
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #10b981 0%, #84cc16 100%)",
        headerIcon: "🌸",
        headerTitle: "Spring Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Spring Sale - ${vars.companyName}

${blocks.headline || "Spring Has Sprung! 🌸"}

${vars.discountPercentage || "25"}% OFF

${blocks.message || "Refresh your style for the new season!"}

✓ New spring arrivals
✓ Eco-friendly options
✓ Fresh colors & styles
✓ Perfect for the season

🌻 SPRING SPECIAL:
Use code ${vars.promoCode || "SPRING2024"} at checkout

Shop now: ${vars.saleUrl}

Bloom into spring with fresh new looks! 🌷

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // SUMMER SALE Template
  {
    type: "SUMMER_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Summer Sale",
    description: "Hot summer deals and seasonal promotions",
    subject:
      "☀️ Sizzling Summer Sale! Up to {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Summer Headline",
        type: "text",
        placeholder: "Create a hot summer message...",
        defaultValue: "Beat the Heat with Hot Deals! ☀️",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your summer offer...",
        defaultValue:
          "Summer is here! Cool down with scorching hot deals on everything you need for the season.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🏖️ Shop Summer Deals",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #f59e0b; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Beat the Heat with Hot Deals! ☀️"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            UP TO ${vars.discountPercentage || "40"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "Summer is here! Cool down with scorching hot deals."
          }
        </p>

        ${createFeatureHighlight([
          "🏖️ Beach essentials",
          "🕶️ Summer accessories",
          "👕 Lightweight apparel",
          "🌊 Outdoor gear",
        ])}

        ${createContentBlock(
          `<strong>🔥 Summer Scorcher Deal:</strong><br/>
          Code: <strong style="font-size: 20px; color: #f59e0b;">${
            vars.promoCode || "SUMMER2024"
          }</strong><br/>
          <em>Limited time only!</em>`,
          "warning"
        )}

        ${createCTAButton(
          blocks.ctaText || "🏖️ Shop Summer Deals",
          vars.saleUrl,
          "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Make this summer unforgettable! 🌴
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
        headerIcon: "☀️",
        headerTitle: "Summer Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Summer Sale - ${vars.companyName}

${blocks.headline || "Beat the Heat with Hot Deals! ☀️"}

UP TO ${vars.discountPercentage || "40"}% OFF

${blocks.message || "Summer is here! Cool down with scorching hot deals."}

✓ Beach essentials
✓ Summer accessories
✓ Lightweight apparel
✓ Outdoor gear

🔥 SUMMER SCORCHER DEAL:
Code: ${vars.promoCode || "SUMMER2024"}
Limited time only!

Shop now: ${vars.saleUrl}

Make this summer unforgettable! 🌴

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // FALL SALE Template
  {
    type: "FALL_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Fall Sale",
    description: "Autumn promotions and cozy season deals",
    subject:
      "🍂 Fall into Savings! {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Fall Headline",
        type: "text",
        placeholder: "Create a cozy fall message...",
        defaultValue: "Cozy Up to Fall Savings! 🍂",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your fall offer...",
        defaultValue:
          "Embrace the autumn season with warm deals on everything you need to stay cozy.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🍁 Shop Fall Collection",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #d97706; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Cozy Up to Fall Savings! 🍂"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #d97706 0%, #92400e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            SAVE ${vars.discountPercentage || "30"}%
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${blocks.message || "Embrace the autumn season with warm deals."}
        </p>

        ${createFeatureHighlight([
          "🍁 Fall fashion essentials",
          "☕ Cozy home décor",
          "🧣 Warm accessories",
          "🎃 Seasonal favorites",
        ])}

        ${createContentBlock(
          `<strong>🍂 Autumn Special:</strong><br/>
          Use code <strong>${
            vars.promoCode || "FALL2024"
          }</strong> for extra savings`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "🍁 Shop Fall Collection",
          vars.saleUrl,
          "linear-gradient(135deg, #d97706 0%, #92400e 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Stay warm and stylish this fall! 🧡
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
        headerIcon: "🍂",
        headerTitle: "Fall Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Fall Sale - ${vars.companyName}

${blocks.headline || "Cozy Up to Fall Savings! 🍂"}

SAVE ${vars.discountPercentage || "30"}%

${blocks.message || "Embrace the autumn season with warm deals."}

✓ Fall fashion essentials
✓ Cozy home décor
✓ Warm accessories
✓ Seasonal favorites

🍂 AUTUMN SPECIAL:
Use code ${vars.promoCode || "FALL2024"} for extra savings

Shop now: ${vars.saleUrl}

Stay warm and stylish this fall! 🧡

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // CYBER MONDAY SALE Template
  {
    type: "CYBER_MONDAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Cyber Monday Sale",
    description: "Online shopping extravaganza for Cyber Monday",
    subject:
      "💻 CYBER MONDAY: {{discountPercentage}}% OFF + Free Shipping! | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
      "expiryDate",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Cyber Monday Headline",
        type: "text",
        placeholder: "Create an exciting headline...",
        defaultValue: "CYBER MONDAY BLOWOUT! 💻",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Cyber Monday offer...",
        defaultValue:
          "The online shopping event of the year! Massive discounts + FREE shipping on everything!",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🛒 Shop Cyber Monday",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #3b82f6; margin: 0 0 15px; font-weight: 800; text-transform: uppercase;">
            ${blocks.headline || "CYBER MONDAY BLOWOUT! 💻"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            ${vars.discountPercentage || "50"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "The online shopping event of the year! Massive discounts + FREE shipping!"
          }
        </p>

        ${createFeatureHighlight([
          "🚚 FREE Shipping on ALL Orders",
          "⚡ Lightning Deals Every Hour",
          "💳 Easy Returns & Exchanges",
          "🎁 Gift Cards Available",
        ])}

        ${createContentBlock(
          `<strong>💻 Exclusive Online Deal:</strong><br/>
          Code: <span style="font-size: 24px; font-weight: 700; color: #3b82f6;">${
            vars.promoCode || "CYBERMONDAY"
          }</span><br/><br/>
          <strong>⏰ Ends:</strong> ${
            vars.expiryDate || "Tonight at Midnight"
          }`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "🛒 Shop Cyber Monday",
          vars.saleUrl,
          "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
        )}

        <p style="font-size: 13px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Shop from the comfort of your home! 🏠
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        headerIcon: "💻",
        headerTitle: "CYBER MONDAY",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Cyber Monday Sale - ${vars.companyName}

${blocks.headline || "CYBER MONDAY BLOWOUT! 💻"}

${vars.discountPercentage || "50"}% OFF

${
  blocks.message ||
  "The online shopping event of the year! Massive discounts + FREE shipping!"
}

✓ FREE Shipping on ALL Orders
✓ Lightning Deals Every Hour
✓ Easy Returns & Exchanges
✓ Gift Cards Available

💻 EXCLUSIVE ONLINE DEAL:
Code: ${vars.promoCode || "CYBERMONDAY"}
⏰ Ends: ${vars.expiryDate || "Tonight at Midnight"}

Shop now: ${vars.saleUrl}

Shop from the comfort of your home! 🏠

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // MEMORIAL DAY SALE Template
  {
    type: "MEMORIAL_DAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Memorial Day Sale",
    description: "Patriotic Memorial Day promotions",
    subject:
      "🇺🇸 Memorial Day Sale: {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Memorial Day Headline",
        type: "text",
        placeholder: "Create a patriotic message...",
        defaultValue: "Honor the Day with Special Savings 🇺🇸",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Memorial Day offer...",
        defaultValue:
          "This Memorial Day, enjoy special discounts as we honor those who served.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🇺🇸 Shop Memorial Day Sale",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #dc2626; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Honor the Day with Special Savings 🇺🇸"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            ${vars.discountPercentage || "25"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "This Memorial Day, enjoy special discounts as we honor those who served."
          }
        </p>

        ${createContentBlock(
          `<strong>🇺🇸 Memorial Day Special:</strong><br/>
          Use code <strong>${vars.promoCode || "MEMORIAL2024"}</strong><br/>
          <em>Valid through May 27th</em>`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "🇺🇸 Shop Memorial Day Sale",
          vars.saleUrl,
          "linear-gradient(135deg, #dc2626 0%, #2563eb 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Remembering and honoring those who made the ultimate sacrifice. 🙏
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #dc2626 0%, #2563eb 100%)",
        headerIcon: "🇺🇸",
        headerTitle: "Memorial Day Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Memorial Day Sale - ${vars.companyName}

${blocks.headline || "Honor the Day with Special Savings 🇺🇸"}

${vars.discountPercentage || "25"}% OFF

${
  blocks.message ||
  "This Memorial Day, enjoy special discounts as we honor those who served."
}

🇺🇸 MEMORIAL DAY SPECIAL:
Use code ${vars.promoCode || "MEMORIAL2024"}
Valid through May 27th

Shop now: ${vars.saleUrl}

Remembering and honoring those who made the ultimate sacrifice. 🙏

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // INDEPENDENCE DAY SALE Template
  {
    type: "INDEPENDENCE_DAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Independence Day Sale",
    description: "4th of July promotions and patriotic celebrations",
    subject:
      "🎆 4th of July Blowout! {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "4th of July Headline",
        type: "text",
        placeholder: "Create a celebratory message...",
        defaultValue: "Celebrate Freedom with Explosive Deals! 🎆",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your 4th of July offer...",
        defaultValue:
          "Light up your Independence Day with sizzling hot deals and patriotic savings!",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🎇 Shop 4th of July Sale",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #dc2626; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Celebrate Freedom with Explosive Deals! 🎆"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            ${vars.discountPercentage || "35"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "Light up your Independence Day with sizzling hot deals!"
          }
        </p>

        ${createFeatureHighlight([
          "🎆 Patriotic party supplies",
          "🍔 Outdoor entertaining essentials",
          "👕 Red, white & blue apparel",
          "🎇 Fireworks viewing gear",
        ])}

        ${createContentBlock(
          `<strong>🇺🇸 Independence Day Special:</strong><br/>
          Code: <strong style="font-size: 20px; color: #dc2626;">${
            vars.promoCode || "JULY4TH"
          }</strong><br/>
          <em>Shop now through July 7th</em>`,
          "warning"
        )}

        ${createCTAButton(
          blocks.ctaText || "🎇 Shop 4th of July Sale",
          vars.saleUrl,
          "linear-gradient(135deg, #dc2626 0%, #2563eb 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Have a safe and spectacular Independence Day! 🇺🇸
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #dc2626 0%, #2563eb 100%)",
        headerIcon: "🎆",
        headerTitle: "Independence Day Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Independence Day Sale - ${vars.companyName}

${blocks.headline || "Celebrate Freedom with Explosive Deals! 🎆"}

${vars.discountPercentage || "35"}% OFF

${blocks.message || "Light up your Independence Day with sizzling hot deals!"}

✓ Patriotic party supplies
✓ Outdoor entertaining essentials
✓ Red, white & blue apparel
✓ Fireworks viewing gear

🇺🇸 INDEPENDENCE DAY SPECIAL:
Code: ${vars.promoCode || "JULY4TH"}
Shop now through July 7th

Shop now: ${vars.saleUrl}

Have a safe and spectacular Independence Day! 🇺🇸

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // LABOR DAY SALE Template
  {
    type: "LABOR_DAY_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Labor Day Sale",
    description: "End of summer Labor Day promotions",
    subject: "🛠️ Labor Day Sale: {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "headline",
        label: "Labor Day Headline",
        type: "text",
        placeholder: "Create a Labor Day message...",
        defaultValue: "Work Less, Save More! 🛠️",
        maxLength: 100,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Labor Day offer...",
        defaultValue:
          "Celebrate Labor Day with massive savings! One last summer blowout before fall.",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🛠️ Shop Labor Day Sale",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #0891b2; margin: 0 0 15px; font-weight: 800;">
            ${blocks.headline || "Work Less, Save More! 🛠️"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            ${vars.discountPercentage || "30"}% OFF
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${blocks.message || "Celebrate Labor Day with massive savings!"}
        </p>

        ${createContentBlock(
          `<strong>🛠️ Labor Day Special:</strong><br/>
          Use code <strong>${vars.promoCode || "LABORDAY2024"}</strong><br/>
          <em>Weekend sale - ends Monday!</em>`,
          "info"
        )}

        ${createCTAButton(
          blocks.ctaText || "🛠️ Shop Labor Day Sale",
          vars.saleUrl,
          "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Honoring the American worker. Enjoy your long weekend! 💼
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
        headerIcon: "🛠️",
        headerTitle: "Labor Day Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Labor Day Sale - ${vars.companyName}

${blocks.headline || "Work Less, Save More! 🛠️"}

${vars.discountPercentage || "30"}% OFF

${blocks.message || "Celebrate Labor Day with massive savings!"}

🛠️ LABOR DAY SPECIAL:
Use code ${vars.promoCode || "LABORDAY2024"}
Weekend sale - ends Monday!

Shop now: ${vars.saleUrl}

Honoring the American worker. Enjoy your long weekend! 💼

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },

  // THANKSGIVING SALE Template
  {
    type: "THANKSGIVING_SALE" as EmailTemplateType,
    category: "SEASONAL" as EmailTemplateCategory,
    name: "Thanksgiving Sale",
    description: "Gratitude-focused Thanksgiving promotions",
    subject:
      "🦃 Give Thanks & Save! {{discountPercentage}}% OFF | {{companyName}}",
    variables: [
      "userName",
      "discountPercentage",
      "saleUrl",
      "companyName",
      "currentYear",
      "companyLogo",
      "promoCode",
    ],
    isSystem: true,
    contentBlocks: [
      {
        id: "greeting",
        label: "Thanksgiving Greeting",
        type: "text",
        placeholder: "Express gratitude...",
        defaultValue: "We're thankful for customers like you! 🦃",
        maxLength: 200,
        required: true,
      },
      {
        id: "message",
        label: "Sale Message",
        type: "text",
        placeholder: "Describe your Thanksgiving offer...",
        defaultValue:
          "Show our gratitude with special Thanksgiving savings. Feast your eyes on these deals!",
        maxLength: 500,
        required: true,
      },
      {
        id: "ctaText",
        label: "Button Text",
        type: "button",
        placeholder: "Button text",
        defaultValue: "🍂 Shop Thanksgiving Sale",
        maxLength: 50,
        required: true,
      },
    ],
    shellHtml: (blocks, vars) => {
      const bodyContent = `
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="font-size: 36px; color: #d97706; margin: 0 0 15px; font-weight: 800;">
            ${blocks.greeting || "We're Thankful for You! 🦃"}
          </h1>
          <div style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #d97706 0%, #92400e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0;">
            SAVE ${vars.discountPercentage || "25"}%
          </div>
        </div>

        <p style="font-size: 18px; color: #212529; line-height: 1.8; margin: 0 0 25px; text-align: center;">
          ${
            blocks.message ||
            "Show our gratitude with special Thanksgiving savings!"
          }
        </p>

        ${createFeatureHighlight([
          "🦃 Holiday essentials",
          "🍂 Fall decorations",
          "🎁 Gift ideas for loved ones",
          "🏡 Home & entertaining",
        ])}

        ${createContentBlock(
          `<strong>🦃 Thanksgiving Special:</strong><br/>
          Code: <strong>${vars.promoCode || "THANKS2024"}</strong><br/>
          <em>Valid through Thanksgiving weekend</em>`,
          "success"
        )}

        ${createCTAButton(
          blocks.ctaText || "🍂 Shop Thanksgiving Sale",
          vars.saleUrl,
          "linear-gradient(135deg, #d97706 0%, #92400e 100%)"
        )}

        <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin: 25px 0 0; text-align: center;">
          Wishing you and yours a Happy Thanksgiving! 🧡
        </p>
      `;

      return createEmailShell({
        headerGradient: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
        headerIcon: "🦃",
        headerTitle: "Thanksgiving Sale",
        bodyContent,
        companyLogo: vars.companyLogo,
        companyName: vars.companyName,
        currentYear: vars.currentYear,
      });
    },
    textVersion: (blocks, vars) => `
Thanksgiving Sale - ${vars.companyName}

${blocks.greeting || "We're Thankful for You! 🦃"}

SAVE ${vars.discountPercentage || "25"}%

${blocks.message || "Show our gratitude with special Thanksgiving savings!"}

✓ Holiday essentials
✓ Fall decorations
✓ Gift ideas for loved ones
✓ Home & entertaining

🦃 THANKSGIVING SPECIAL:
Code: ${vars.promoCode || "THANKS2024"}
Valid through Thanksgiving weekend

Shop now: ${vars.saleUrl}

Wishing you and yours a Happy Thanksgiving! 🧡

---
${vars.companyName} • Powered by OnTarget ERP
© ${vars.currentYear} All rights reserved
    `,
  },
];
