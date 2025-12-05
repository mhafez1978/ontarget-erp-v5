/*
 Note: Prisma CLI and some CI environments run the seed directly with node.
 To avoid TypeScript/ts-node permission problems, a JS seed is available at
 `prisma/seed.mjs` and package.json's `seed` script calls it. Prefer `npm run seed`.
*/
import { db as prisma } from "../scripts/db.mjs";

async function main() {
  console.log("Starting seed...");

  // Find MOVE web design 1 company
  const company = await prisma.company.findFirst({
    where: { name: { contains: "MOVE web design 1" } },
  });

  if (!company) {
    console.log("Company 'MOVE web design 1' not found. Skipping seed.");
    return;
  }

  console.log(`Found company: ${company.name} (ID: ${company.id})`);

  // Create 6 additional products similar to the existing ones
  const productsToCreate = [
    {
      name: "Premium Web Design Package",
      description:
        "A comprehensive web design solution that includes responsive layouts, modern UI/UX principles, and cross-browser compatibility. Perfect for businesses looking to establish a strong online presence with professional aesthetics and functionality.",
      price: 149.99,
      category: "Web Design",
      sku: "WD-PREM-001",
      companyId: company.id,
    },
    {
      name: "E-Commerce Storefront Template",
      description:
        "Ready-to-deploy e-commerce template featuring product catalogs, shopping cart integration, secure checkout flows, and inventory management. Built with scalability and performance in mind for growing online stores.",
      price: 199.99,
      category: "E-Commerce",
      sku: "EC-STORE-002",
      companyId: company.id,
    },
    {
      name: "Corporate Website Solution",
      description:
        "Professional corporate website package including about pages, service listings, team profiles, and contact forms. Designed to convey trust and professionalism while maintaining easy content management capabilities.",
      price: 179.99,
      category: "Corporate",
      sku: "CORP-WEB-003",
      companyId: company.id,
    },
    {
      name: "Landing Page Builder Kit",
      description:
        "High-converting landing page templates optimized for lead generation and marketing campaigns. Includes A/B testing capabilities, form integration, and analytics tracking for maximum conversion rates.",
      price: 89.99,
      category: "Marketing",
      sku: "LAND-PAGE-004",
      companyId: company.id,
    },
    {
      name: "Portfolio Showcase Template",
      description:
        "Elegant portfolio template perfect for creative professionals, photographers, and agencies. Features stunning galleries, project case studies, client testimonials, and smooth animations to showcase your best work.",
      price: 119.99,
      category: "Portfolio",
      sku: "PORT-SHOW-005",
      companyId: company.id,
    },
    {
      name: "Blog & Content Platform",
      description:
        "Feature-rich blogging platform with article management, category organization, author profiles, and SEO optimization. Includes commenting system, social sharing, and newsletter integration for engaging content delivery.",
      price: 129.99,
      category: "Content",
      sku: "BLOG-PLAT-006",
      companyId: company.id,
    },
  ];

  for (const productData of productsToCreate) {
    const product = await prisma.product.create({
      data: productData,
    });
    console.log(`Created product: ${product.name} (ID: ${product.id})`);
  }

  // Create 9 services for the company
  const servicesToCreate = [
    {
      name: "Custom Web Development",
      description:
        "Full-stack web development services tailored to your specific business needs. Our team builds scalable, secure, and performant web applications using modern technologies and best practices.",
      price: 2999.99,
      category: "Development",
      duration: "4-6 weeks",
      companyId: company.id,
    },
    {
      name: "Website Redesign & Modernization",
      description:
        "Transform your outdated website into a modern, responsive, and user-friendly platform. We refresh your brand identity while improving performance, accessibility, and overall user experience.",
      price: 1999.99,
      category: "Design",
      duration: "3-4 weeks",
      companyId: company.id,
    },
    {
      name: "SEO Optimization Service",
      description:
        "Comprehensive search engine optimization to improve your website's visibility and rankings. Includes keyword research, on-page optimization, technical SEO, and ongoing performance monitoring.",
      price: 799.99,
      category: "Marketing",
      duration: "Ongoing",
      companyId: company.id,
    },
    {
      name: "Website Maintenance & Support",
      description:
        "Monthly maintenance package including security updates, bug fixes, content updates, performance monitoring, and technical support. Keep your website running smoothly 24/7.",
      price: 299.99,
      category: "Support",
      duration: "Monthly",
      companyId: company.id,
    },
    {
      name: "E-Commerce Integration",
      description:
        "Complete e-commerce solution setup including payment gateway integration, inventory management, order processing, and shipping configuration. Get your online store ready to sell.",
      price: 3499.99,
      category: "E-Commerce",
      duration: "5-7 weeks",
      companyId: company.id,
    },
    {
      name: "Mobile App Development",
      description:
        "Native and cross-platform mobile application development for iOS and Android. Create engaging mobile experiences that complement your web presence and reach customers on the go.",
      price: 4999.99,
      category: "Development",
      duration: "8-12 weeks",
      companyId: company.id,
    },
    {
      name: "UI/UX Design Consultation",
      description:
        "Expert design consultation to enhance user interface and user experience. Includes user research, wireframing, prototyping, and usability testing to ensure optimal user satisfaction.",
      price: 1299.99,
      category: "Design",
      duration: "2-3 weeks",
      companyId: company.id,
    },
    {
      name: "Digital Marketing Strategy",
      description:
        "Comprehensive digital marketing strategy including social media marketing, content marketing, email campaigns, and paid advertising. Drive traffic and convert visitors into customers.",
      price: 1499.99,
      category: "Marketing",
      duration: "Ongoing",
      companyId: company.id,
    },
    {
      name: "API Development & Integration",
      description:
        "Custom API development and third-party integration services. Connect your systems, automate workflows, and enable seamless data exchange between platforms for improved efficiency.",
      price: 2499.99,
      category: "Development",
      duration: "3-5 weeks",
      companyId: company.id,
    },
  ];

  for (const serviceData of servicesToCreate) {
    const service = await prisma.service.create({
      data: serviceData,
    });
    console.log(`Created service: ${service.name} (ID: ${service.id})`);
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
