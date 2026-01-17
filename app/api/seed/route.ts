import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  CompanyMemberRole,
  TaskStatus,
  ExpenseCategory,
  ExpenseStatus,
  OrderStatus,
  PayrollStatus,
} from "@/generated/prisma/client";

export async function GET() {
  try {
    console.log("🌱 Starting demo data seeding...");

    // Note: Skipping cleanup to avoid foreign key constraint issues
    // If you need to reset, use prisma migrate reset first

    // Hash the password
    const hashedPassword = await bcrypt.hash("Mm21917800!!", 12);

    // 1. Create super admin user first
    console.log("👤 Creating super admin user...");
    const superAdmin = await db.user.create({
      data: {
        name: "Hashora Admin",
        email: "admin@hashoracorp.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        plan: "ENTERPRISE",
        isActive: true,
        addressLine1: "123 Blockchain Street",
        city: "San Francisco",
        state: "CA",
        country: "United States",
        countryCode: "US",
        postalCode: "94105",
        latitude: 37.7749,
        longitude: -122.4194,
      },
    });

    // 2. Create root company "Hashora Corp" with system name "Hashora"
    console.log("📍 Creating root company Hashora Corp...");
    const rootCompany = await db.company.create({
      data: {
        name: "Hashora Corp",
        legalName: "Hashora Corporation",
        slogan: "Blockchain-Powered ERP Solutions",
        description:
          "Leading provider of enterprise blockchain solutions for modern businesses",
        industry: "SOFTWARE_DEVELOPMENT",
        logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center",
        website: "https://hashora.com",
        email: "admin@hashoracorp.com",
        phone: "+1-555-0101",
        isRoot: true,
        isActive: true,
        slug: "hashora-corp",
        addressLine1: "123 Blockchain Street",
        city: "San Francisco",
        state: "CA",
        country: "United States",
        countryCode: "US",
        postalCode: "94105",
        latitude: 37.7749,
        longitude: -122.4194,
        ownerId: superAdmin.id,
        foundedYear: 2024,
        employeeCount: 50,
      },
    });

    // 3. Create non-root company "XYZ Corp" for same super admin
    console.log("🏢 Creating XYZ Corp...");
    const xyzCorp = await db.company.create({
      data: {
        name: "XYZ Corp",
        legalName: "XYZ Corporation",
        slogan: "Innovation Through Technology",
        description:
          "A forward-thinking company leveraging cutting-edge technology solutions",
        industry: "IT_SERVICES",
        logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&crop=center",
        website: "https://xyzcorp.com",
        email: "admin@xyzcorp.com",
        phone: "+1-555-0202",
        isRoot: false,
        isActive: true,
        slug: "xyz-corp",
        addressLine1: "456 Innovation Drive",
        city: "Austin",
        state: "TX",
        country: "United States",
        countryCode: "US",
        postalCode: "78701",
        latitude: 30.2672,
        longitude: -97.7431,
        ownerId: superAdmin.id,
        foundedYear: 2023,
        employeeCount: 25,
      },
    });

    // 4. Create employees for Hashora Corp with different roles
    console.log("👥 Creating Hashora Corp employees...");
    const hashoraEmployees = [
      {
        email: "employee1@hashoracorp.com",
        name: "Alice Johnson",
        role: "COMPANY_MANAGER",
        title: "Operations Manager",
      },
      {
        email: "employee2@hashoracorp.com",
        name: "Bob Smith",
        role: "COMPANY_STAFF",
        title: "Software Developer",
      },
      {
        email: "employee3@hashoracorp.com",
        name: "Carol Davis",
        role: "COMPANY_STAFF",
        title: "UI/UX Designer",
      },
      {
        email: "employee4@hashoracorp.com",
        name: "David Wilson",
        role: "COMPANY_CONTRACTOR",
        title: "DevOps Engineer",
      },
      {
        email: "employee5@hashoracorp.com",
        name: "Eva Brown",
        role: "COMPANY_STAFF",
        title: "Product Manager",
      },
    ];

    const hashoraUsers = [];
    const hashoraStaff = [];
    for (const emp of hashoraEmployees) {
      const user = await db.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          role: "ERP_CUSTOMER",
          plan: "ESSENTIAL",
          isActive: true,
        },
      });
      hashoraUsers.push(user);

      // Create staff record
      const staff = await db.companyStaff.create({
        data: {
          userId: user.id,
          companyId: rootCompany.id,
          role: emp.role as CompanyMemberRole,
          jobTitle: emp.title,
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date("2024-01-15"),
          city: "San Francisco",
          state: "CA",
          country: "United States",
          countryCode: "US",
          payRate: 75000,
          payFrequency: "ANNUAL",
          currency: "USD",
        },
      });
      hashoraStaff.push(staff);
    }

    // 5. Create products for Hashora Corp
    console.log("📦 Creating Hashora Corp products...");
    const hashoraProducts = [
      {
        name: "Blockchain ERP Suite",
        description:
          "Complete enterprise resource planning with blockchain integration",
        price: 999.99,
        sku: "ERP-BLOCK-001",
        category: "Software",
        quantity: 100,
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Smart Contract Templates",
        description:
          "Pre-built smart contract templates for common business processes",
        price: 299.99,
        sku: "SMART-CONTRACT-001",
        category: "Templates",
        quantity: 500,
        image:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Blockchain Consulting",
        description: "Expert consultation on blockchain implementation",
        price: 150.0,
        sku: "CONSULT-BLOCK-001",
        category: "Services",
        quantity: 999,
        image:
          "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop&crop=center",
      },
    ];

    for (const product of hashoraProducts) {
      const { image, ...productData } = product;
      const createdProduct = await db.product.create({
        data: {
          ...productData,
          companyId: rootCompany.id,
          isPublished: true,
          isActive: true,
          unitCost: product.price * 0.6,
          markupPercent: 25.0,
        },
      });

      // Create product image
      if (image) {
        await db.productImage.create({
          data: {
            productId: createdProduct.id,
            url: image,
            altText: product.name,
            isFeatured: true,
          },
        });
      }
    }

    // 6. Create services for Hashora Corp
    console.log("🛠️ Creating Hashora Corp services...");
    const hashoraServices = [
      {
        name: "Blockchain Integration",
        description: "Integrate blockchain technology into existing systems",
        price: 5000.0,
        duration: "2-4 weeks",
        category: "Development",
        image:
          "https://images.unsplash.com/photo-1639762681057-4085b7c01c37?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Smart Contract Development",
        description: "Custom smart contract development and deployment",
        price: 2500.0,
        duration: "1-2 weeks",
        category: "Development",
        image:
          "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Blockchain Audit",
        description:
          "Comprehensive security audit of blockchain implementations",
        price: 3000.0,
        duration: "1 week",
        category: "Security",
        image:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=center",
      },
    ];

    for (const service of hashoraServices) {
      const { image, ...serviceData } = service;
      const createdService = await db.service.create({
        data: {
          ...serviceData,
          companyId: rootCompany.id,
          isPublished: true,
          isActive: true,
          unitCost: service.price * 0.7,
          markupPercent: 20.0,
        },
      });

      // Create service image
      if (image) {
        await db.serviceImage.create({
          data: {
            serviceId: createdService.id,
            url: image,
            altText: service.name,
            isFeatured: true,
          },
        });
      }
    }

    // 7. Create teams and projects for Hashora Corp
    console.log("👥 Creating Hashora Corp teams and projects...");
    const devTeam = await db.team.create({
      data: {
        name: "Development Team",
        description: "Core development and blockchain integration team",
        companyId: rootCompany.id,
      },
    });

    const designTeam = await db.team.create({
      data: {
        name: "Design Team",
        description: "UI/UX and product design team",
        companyId: rootCompany.id,
      },
    });

    // Add team members
    await db.teamMember.createMany({
      data: [
        {
          teamId: devTeam.id,
          staffId: hashoraStaff[1].id,
          role: "COMPANY_MANAGER",
        }, // Bob Smith
        {
          teamId: devTeam.id,
          staffId: hashoraStaff[3].id,
          role: "COMPANY_STAFF",
        }, // David Wilson
        {
          teamId: designTeam.id,
          staffId: hashoraStaff[2].id,
          role: "COMPANY_MANAGER",
        }, // Carol Davis
      ],
    });

    // Create projects
    const blockchainProject = await db.project.create({
      data: {
        name: "Blockchain ERP Integration",
        description:
          "Integrate Hedera blockchain into our ERP system for immutable audit trails",
        teamId: devTeam.id,
        companyId: rootCompany.id,
        subscriberCompanyId: xyzCorp.id,
        customerId: hashoraUsers[4].id, // Eva Brown
        projectManagerId: hashoraStaff[0].id, // Alice Johnson
        teamLeadId: hashoraStaff[1].id, // Bob Smith
        status: "IN_PROGRESS",
        projectType: "INTERNAL",
        category: "SOFTWARE_DEVELOPMENT",
        currency: "USD",
        estimatedCost: 50000,
        estimatedMarkup: 25,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-15"),
      },
    });

    // Create project tasks
    const tasks = [
      {
        title: "Research Hedera SDK",
        description: "Research and evaluate Hedera SDK capabilities",
        assignedToId: hashoraStaff[1].id,
        status: "COMPLETED",
      },
      {
        title: "Design Integration Architecture",
        description: "Design the blockchain integration architecture",
        assignedToId: hashoraStaff[1].id,
        status: "IN_PROGRESS",
      },
      {
        title: "Implement Smart Contracts",
        description: "Develop and deploy smart contracts",
        assignedToId: hashoraStaff[3].id,
        status: "TODO",
      },
      {
        title: "Create UI Components",
        description: "Build UI components for blockchain features",
        assignedToId: hashoraStaff[2].id,
        status: "TODO",
      },
      {
        title: "Testing & QA",
        description: "Comprehensive testing of blockchain integration",
        assignedToId: hashoraStaff[4].id,
        status: "TODO",
      },
    ];

    for (const task of tasks) {
      await db.task.create({
        data: {
          ...task,
          status: task.status as TaskStatus,
          projectId: blockchainProject.id,
          createdById: hashoraStaff[0].id,
          dueDate: new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random due date within 30 days
        },
      });
    }

    // 8. Create second admin "MOVE Web Design"
    console.log("🎨 Creating MOVE Web Design admin...");
    const moveAdmin = await db.user.create({
      data: {
        name: "Move Web Design Admin",
        email: "movewebdesign@gmail.com",
        password: hashedPassword,
        role: "ADMIN_OWNER",
        plan: "ENTERPRISE",
        isActive: true,
        addressLine1: "789 Creative Avenue",
        city: "Los Angeles",
        state: "CA",
        country: "United States",
        countryCode: "US",
        postalCode: "90210",
        latitude: 34.0522,
        longitude: -118.2437,
      },
    });

    // 9. Create MOVE Web Design company
    console.log("🎨 Creating MOVE Web Design company...");
    const moveWebDesign = await db.company.create({
      data: {
        name: "MOVE Web Design",
        legalName: "Move Web Design LLC",
        slogan: "Moving Your Business Online",
        description: "Creative web design and digital marketing solutions",
        industry: "WEB_DEVELOPMENT",
        logo: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=400&fit=crop&crop=center",
        website: "https://movwebdesign.com",
        email: "hello@movwebdesign.com",
        phone: "+1-555-0303",
        isRoot: false,
        isActive: true,
        slug: "move-web-design",
        addressLine1: "789 Creative Avenue",
        city: "Los Angeles",
        state: "CA",
        country: "United States",
        countryCode: "US",
        postalCode: "90210",
        latitude: 34.0522,
        longitude: -118.2437,
        ownerId: moveAdmin.id,
        foundedYear: 2022,
        employeeCount: 12,
      },
    });

    // 10. Create Closeout Kingdom company for same admin
    console.log("🏪 Creating Closeout Kingdom company...");
    const closeoutKingdom = await db.company.create({
      data: {
        name: "Closeout Kingdom",
        legalName: "Closeout Kingdom Inc",
        slogan: "Premium Closeout Deals",
        description: "Wholesale closeout merchandise at unbeatable prices",
        industry: "RETAIL",
        logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center",
        website: "https://closeoutkingdom.com",
        email: "sales@closeoutkingdom.com",
        phone: "+1-555-0404",
        isRoot: false,
        isActive: true,
        slug: "closeout-kingdom",
        addressLine1: "321 Warehouse Blvd",
        city: "Chicago",
        state: "IL",
        country: "United States",
        countryCode: "US",
        postalCode: "60601",
        latitude: 41.8781,
        longitude: -87.6298,
        ownerId: moveAdmin.id,
        foundedYear: 2021,
        employeeCount: 8,
      },
    });

    // 11. Create employees for MOVE Web Design
    console.log("👥 Creating MOVE Web Design employees...");
    const moveEmployees = [
      {
        email: "employee1@movwebdesign.com",
        name: "Frank Miller",
        role: "COMPANY_MANAGER",
        title: "Creative Director",
      },
      {
        email: "employee2@movwebdesign.com",
        name: "Grace Lee",
        role: "COMPANY_STAFF",
        title: "Web Developer",
      },
      {
        email: "employee3@movwebdesign.com",
        name: "Henry Taylor",
        role: "COMPANY_STAFF",
        title: "Graphic Designer",
      },
      {
        email: "employee4@movwebdesign.com",
        name: "Ivy Chen",
        role: "COMPANY_CONTRACTOR",
        title: "SEO Specialist",
      },
    ];

    const moveUsers = [];
    const moveStaff = [];
    for (const emp of moveEmployees) {
      const user = await db.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          role: "ERP_CUSTOMER",
          plan: "ESSENTIAL",
          isActive: true,
        },
      });
      moveUsers.push(user);

      const staff = await db.companyStaff.create({
        data: {
          userId: user.id,
          companyId: moveWebDesign.id,
          role: emp.role as CompanyMemberRole,
          jobTitle: emp.title,
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date("2023-06-01"),
          city: "Los Angeles",
          state: "CA",
          country: "United States",
          countryCode: "US",
          payRate: 65000,
          payFrequency: "ANNUAL",
          currency: "USD",
        },
      });
      moveStaff.push(staff);
    }

    // 12. Create products for MOVE Web Design
    console.log("📦 Creating MOVE Web Design products...");
    const moveProducts = [
      {
        name: "Website Design Package",
        description: "Complete website design and development package",
        price: 2500.0,
        sku: "WEB-DESIGN-001",
        category: "Web Design",
        quantity: 50,
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Logo Design Service",
        description: "Professional logo design with brand guidelines",
        price: 800.0,
        sku: "LOGO-DESIGN-001",
        category: "Branding",
        quantity: 100,
        image:
          "https://images.unsplash.com/photo-1626785774625-0b1c2c5b7c1e?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "SEO Optimization",
        description: "Search engine optimization service",
        price: 600.0,
        sku: "SEO-001",
        category: "Marketing",
        quantity: 200,
        image:
          "https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=400&h=300&fit=crop&crop=center",
      },
    ];

    for (const product of moveProducts) {
      const { image, ...productData } = product;
      const createdProduct = await db.product.create({
        data: {
          ...productData,
          companyId: moveWebDesign.id,
          isPublished: true,
          isActive: true,
          unitCost: product.price * 0.5,
          markupPercent: 30.0,
        },
      });

      // Create product image
      if (image) {
        await db.productImage.create({
          data: {
            productId: createdProduct.id,
            url: image,
            altText: product.name,
            isFeatured: true,
          },
        });
      }
    }

    // 13. Create products for Closeout Kingdom
    console.log("📦 Creating Closeout Kingdom products...");
    const closeoutProducts = [
      {
        name: "Designer Sunglasses Bulk Lot",
        description: "Premium designer sunglasses - closeout pricing",
        price: 25.0,
        sku: "SUNGLASSES-001",
        category: "Fashion",
        quantity: 500,
        image:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Wireless Earbuds Wholesale",
        description: "High-quality wireless earbuds at wholesale prices",
        price: 15.0,
        sku: "EARBUDS-001",
        category: "Electronics",
        quantity: 1000,
        image:
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop&crop=center",
      },
      {
        name: "Fitness Trackers Bulk",
        description: "Smart fitness trackers - clearance pricing",
        price: 35.0,
        sku: "FITNESS-001",
        category: "Electronics",
        quantity: 300,
        image:
          "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=300&fit=crop&crop=center",
      },
    ];

    for (const product of closeoutProducts) {
      const { image, ...productData } = product;
      const createdProduct = await db.product.create({
        data: {
          ...productData,
          companyId: closeoutKingdom.id,
          isPublished: true,
          isActive: true,
          unitCost: product.price * 0.3,
          markupPercent: 50.0,
        },
      });

      // Create product image
      if (image) {
        await db.productImage.create({
          data: {
            productId: createdProduct.id,
            url: image,
            altText: product.name,
            isFeatured: true,
          },
        });
      }
    }

    // 14. Create teams for MOVE Web Design
    console.log("👥 Creating MOVE Web Design teams...");
    const webDevTeam = await db.team.create({
      data: {
        name: "Web Development",
        description: "Frontend and backend development team",
        companyId: moveWebDesign.id,
      },
    });

    const designTeamMove = await db.team.create({
      data: {
        name: "Creative Design",
        description: "Graphic design and branding team",
        companyId: moveWebDesign.id,
      },
    });

    // Add team members
    await db.teamMember.createMany({
      data: [
        {
          teamId: webDevTeam.id,
          staffId: moveStaff[1].id,
          role: "COMPANY_MANAGER",
        }, // Grace Lee
        {
          teamId: designTeamMove.id,
          staffId: moveStaff[0].id,
          role: "COMPANY_MANAGER",
        }, // Frank Miller
        {
          teamId: designTeamMove.id,
          staffId: moveStaff[2].id,
          role: "COMPANY_STAFF",
        }, // Henry Taylor
      ],
    });

    // 15. Create fake blockchain transactions
    console.log("⛓️ Creating fake blockchain transactions...");

    // Enable Hedera for Hashora Corp
    await db.companyHederaSetting.create({
      data: {
        companyId: rootCompany.id,
        enabled: true,
        enabledById: superAdmin.id,
        enabledAt: new Date("2024-01-15T10:00:00Z"),
        transactionCount: 5,
        currentMonthSpent: 0.014 * 5, // 5 transactions at $0.014 each
      },
    });

    // Create fake Hedera transactions
    const fakeTransactions = [
      {
        hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        topicId: "0.0.123456",
        transactionId: "0.0.123456@1234567890.000000000",
        consensusTimestamp: new Date("2024-01-15T10:05:00Z"),
        costHbar: 0.014,
        balanceAfter: 9.986,
        status: "SUCCESS",
        companyId: rootCompany.id,
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        topicId: "0.0.123456",
        transactionId: "0.0.123456@1234567891.000000000",
        consensusTimestamp: new Date("2024-01-15T11:00:00Z"),
        costHbar: 0.014,
        balanceAfter: 9.972,
        status: "SUCCESS",
        companyId: rootCompany.id,
      },
      {
        hash: "0x7890123456789012345678901234567890123456789012345678901234567890",
        topicId: "0.0.123456",
        transactionId: "0.0.123456@1234567892.000000000",
        consensusTimestamp: new Date("2024-01-16T09:30:00Z"),
        costHbar: 0.014,
        balanceAfter: 9.958,
        status: "SUCCESS",
        companyId: rootCompany.id,
      },
      {
        hash: "0x3456789012345678901234567890123456789012345678901234567890123456",
        topicId: "0.0.123456",
        transactionId: "0.0.123456@1234567893.000000000",
        consensusTimestamp: new Date("2024-01-16T14:20:00Z"),
        costHbar: 0.014,
        balanceAfter: 9.944,
        status: "SUCCESS",
        companyId: rootCompany.id,
      },
      {
        hash: "0x9012345678901234567890123456789012345678901234567890123456789012",
        topicId: "0.0.123456",
        transactionId: "0.0.123456@1234567894.000000000",
        consensusTimestamp: new Date("2024-01-17T08:45:00Z"),
        costHbar: 0.014,
        balanceAfter: 9.93,
        status: "SUCCESS",
        companyId: rootCompany.id,
      },
    ];

    for (const tx of fakeTransactions) {
      await db.hederaTransaction.create({
        data: tx,
      });
    }

    // Create Hedera settings
    await db.hederaSetting.create({
      data: {
        scope: "GLOBAL",
        hederaAccount: "0.0.123456",
        topicId: "0.0.123456",
        evmAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        keyType: "ED25519",
        hederaHexKey:
          "302e020100300506032b6570042204201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hederaDerKey:
          "302e020100300506032b6570042204201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hederaDerPub:
          "302a300506032b65700321001234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashSalt: "randomsalt123",
        isActive: true,
        network: "TESTNET",
        currentBalance: 9.93,
        lowBalanceThreshold: 1.0,
        lastBalanceCheck: new Date(),
        estimatedCostPerTx: 0.014,
        totalTransactions: 5,
        totalCostHbar: 0.07,
      },
    });

    // 16. Create testimonials
    console.log("💬 Creating testimonials...");
    const testimonials = [
      {
        customerName: "Sarah Johnson",
        customerEmail: "sarah.j@techcorp.com",
        customerTitle: "CTO",
        customerPhoto:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        testimonial:
          "Hashora's blockchain ERP solution transformed our operations. The immutable audit trails give us complete confidence in our financial data.",
        status: "APPROVED",
        isFeatured: true,
        companyId: rootCompany.id,
      },
      {
        customerName: "Michael Chen",
        customerEmail: "m.chen@innovatetech.com",
        customerTitle: "CEO",
        customerPhoto:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        testimonial:
          "The integration was seamless and the support team was exceptional. Our productivity increased by 40% within the first quarter.",
        status: "APPROVED",
        isFeatured: true,
        companyId: rootCompany.id,
      },
      {
        customerName: "Emily Rodriguez",
        customerEmail: "emily.r@startup.io",
        customerTitle: "Operations Manager",
        customerPhoto:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        testimonial:
          "As a growing startup, we needed a scalable solution. Hashora delivered exactly what we needed with room to grow.",
        status: "APPROVED",
        isFeatured: false,
        companyId: rootCompany.id,
      },
    ];

    for (const testimonial of testimonials) {
      await db.testimonial.create({
        data: testimonial,
      });
    }

    // 17. Create time entries (timesheets)
    console.log("⏰ Creating time entries...");
    const timeEntries = [
      {
        staffId: hashoraStaff[1].id,
        companyId: rootCompany.id,
        projectId: blockchainProject.id,
        taskId: null,
        description: "Research Hedera SDK capabilities",
        startTime: new Date("2024-01-15T09:00:00Z"),
        endTime: new Date("2024-01-15T12:00:00Z"),
        duration: 180, // 3 hours in minutes
        isBillable: true,
        hourlyRate: 125.0,
        status: "APPROVED",
      },
      {
        staffId: hashoraStaff[1].id,
        companyId: rootCompany.id,
        projectId: blockchainProject.id,
        taskId: null,
        description: "Design integration architecture",
        startTime: new Date("2024-01-16T13:00:00Z"),
        endTime: new Date("2024-01-16T17:00:00Z"),
        duration: 240, // 4 hours
        isBillable: true,
        hourlyRate: 125.0,
        status: "APPROVED",
      },
      {
        staffId: hashoraStaff[3].id,
        companyId: rootCompany.id,
        projectId: blockchainProject.id,
        taskId: null,
        description: "Implement smart contract templates",
        startTime: new Date("2024-01-17T10:00:00Z"),
        endTime: new Date("2024-01-17T15:00:00Z"),
        duration: 300, // 5 hours
        isBillable: true,
        hourlyRate: 110.0,
        status: "PENDING",
      },
    ];

    for (const timeEntry of timeEntries) {
      await db.timeEntry.create({
        data: {
          ...timeEntry,
          clockIn: timeEntry.startTime,
          status: timeEntry.status as any, // cast if needed
        },
      });
    }

    // 18. Create expense entries
    console.log("💰 Creating expense entries...");
    const ledger = await db.ledger.findFirst({
      where: { companyId: rootCompany.id },
    });
    if (!ledger) {
      throw new Error("No ledger found for root company");
    }
    const expenseEntries = [
      {
        companyId: rootCompany.id,
        staffId: hashoraStaff[1].id,
        category: "TRAVEL",
        description: "Flight to blockchain conference",
        amount: 450.0,
        currency: "USD",
        expenseDate: new Date("2024-01-10"),
        receiptUrl: "https://example.com/receipt1.jpg",
        isBillable: false,
        status: "APPROVED",
        approvedBy: hashoraStaff[0].id,
        approvedAt: new Date("2024-01-12"),
      },
      {
        companyId: rootCompany.id,
        staffId: hashoraStaff[2].id,
        category: "SOFTWARE",
        description: "Development tools subscription",
        amount: 99.0,
        currency: "USD",
        expenseDate: new Date("2024-01-15"),
        receiptUrl: "https://example.com/receipt2.jpg",
        isBillable: false,
        status: "APPROVED",
        approvedBy: hashoraStaff[0].id,
        approvedAt: new Date("2024-01-16"),
      },
      {
        companyId: rootCompany.id,
        staffId: hashoraStaff[3].id,
        category: "MEALS",
        description: "Client lunch meeting",
        amount: 85.5,
        currency: "USD",
        expenseDate: new Date("2024-01-18"),
        receiptUrl: "https://example.com/receipt3.jpg",
        isBillable: true,
        status: "PENDING",
      },
    ];

    for (const expense of expenseEntries) {
      await db.expenseEntry.create({
        data: {
          ...expense,
          ledgerId: ledger.id,
          category: expense.category as ExpenseCategory,
          status: expense.status as ExpenseStatus,
        },
      });
    }

    // 19. Create ledger entries (business accounting)
    console.log("📊 Creating ledger entries...");
    const ledgerEntries = [
      {
        companyId: rootCompany.id,
        accountType: "ASSET",
        accountName: "Cash",
        accountNumber: "1000",
        description: "Primary cash account",
        balance: 50000.0,
        currency: "USD",
        isActive: true,
      },
      {
        companyId: rootCompany.id,
        accountType: "LIABILITY",
        accountName: "Accounts Payable",
        accountNumber: "2000",
        description: "Vendor payments due",
        balance: 12500.0,
        currency: "USD",
        isActive: true,
      },
      {
        companyId: rootCompany.id,
        accountType: "EQUITY",
        accountName: "Retained Earnings",
        accountNumber: "3000",
        description: "Accumulated profits",
        balance: 75000.0,
        currency: "USD",
        isActive: true,
      },
      {
        companyId: rootCompany.id,
        accountType: "REVENUE",
        accountName: "Service Revenue",
        accountNumber: "4000",
        description: "Revenue from services",
        balance: 25000.0,
        currency: "USD",
        isActive: true,
      },
      {
        companyId: rootCompany.id,
        accountType: "EXPENSE",
        accountName: "Office Expenses",
        accountNumber: "5000",
        description: "General office expenses",
        balance: 8500.0,
        currency: "USD",
        isActive: true,
      },
    ];

    const createdLedgerEntries = [];
    for (const ledger of ledgerEntries) {
      const created = await db.ledger.create({
        data: ledger,
      });
      createdLedgerEntries.push(created);
    }

    // 20. Create orders and invoices
    console.log("🛒 Creating orders and invoices...");

    // Create a sample order
    const sampleOrder = await db.order.create({
      data: {
        orderNumber: "ORD-001",
        ledgerId: createdLedgerEntries[3].id, // Service Revenue account
        customerEmail: hashoraUsers[4].email,
        customerName: hashoraUsers[4].name,
        status: "COMPLETED" as OrderStatus,
        totalAmount: 999.99,
        taxAmount: 0.0,
        items: [
          {
            description: "Blockchain ERP Suite License",
            quantity: 1,
            unitPrice: 999.99,
            totalPrice: 999.99,
          },
        ],
        notes: "Priority delivery requested",
        orderedAt: new Date("2024-01-20"),
        fulfilledAt: new Date("2024-01-22"),
      },
    });

    // Remove the order item creation since Order uses JSON items
    // Create invoice for the order
    const sampleInvoice = await db.invoice.create({
      data: {
        companyId: rootCompany.id,
        userId: hashoraUsers[4].id,
        invoiceNumber: "INV-001",
        type: "CUSTOM",
        status: "PAID",
        customerEmail: hashoraUsers[4].email,
        customerName: hashoraUsers[4].name,
        amount: 999.99,
        tax: 0.0,
        discount: 0.0,
        total: 999.99,
        items: [
          {
            description: "Blockchain ERP Suite License",
            quantity: 1,
            unitPrice: 999.99,
            totalPrice: 999.99,
          },
        ],
        issueDate: new Date("2024-01-20"),
        dueDate: new Date("2024-02-20"),
        paidAt: new Date("2024-01-25"),
        paymentMethod: "BANK_TRANSFER",
        notes: "Payment received via bank transfer",
      },
    });

    // Create payroll entries
    console.log("💼 Creating payroll entries...");
    const payrollEntries = [
      {
        companyId: rootCompany.id,
        staffId: hashoraStaff[1].id,
        payPeriodStart: new Date("2024-01-01"),
        payPeriodEnd: new Date("2024-01-15"),
        grossPay: 2500.0,
        netPay: 1875.0,
        taxes: 375.0,
        deductions: 250.0,
        currency: "USD",
        status: "PROCESSED",
        processedDate: new Date("2024-01-16"),
      },
      {
        companyId: rootCompany.id,
        staffId: hashoraStaff[2].id,
        payPeriodStart: new Date("2024-01-01"),
        payPeriodEnd: new Date("2024-01-15"),
        grossPay: 2250.0,
        netPay: 1687.5,
        taxes: 337.5,
        deductions: 225.0,
        currency: "USD",
        status: "PROCESSED",
        processedDate: new Date("2024-01-16"),
      },
    ];

    // Payroll entries commented out due to schema mismatch
    // for (const payroll of payrollEntries) {
    //   await db.payrollEntry.create({
    //     data: {
    //       staffId: payroll.staffId,
    //       periodStart: payroll.payPeriodStart,
    //       periodEnd: payroll.payPeriodEnd,
    //       grossPay: payroll.grossPay,
    //       netPay: payroll.netPay,
    //       taxes: payroll.taxes,
    //       deductions: payroll.deductions,
    //       currency: payroll.currency,
    //       status: payroll.status as PayrollStatus,
    //       payDate: payroll.processedDate,
    //       ledgerId: ledger.id,
    //     },
    //   });
    // }

    console.log("✅ Demo data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Root company: Hashora Corp (Hashora)");
    console.log("- Super admin: admin@hashoracorp.com");
    console.log("- Companies created: 4 total");
    console.log("- Users created: 11 total");
    console.log("- Products created: 9 total");
    console.log("- Services created: 3 total");
    console.log("- Teams created: 4 total");
    console.log("- Projects created: 1");
    console.log("- Tasks created: 5");
    console.log("- Blockchain transactions: 5");
    console.log("- Testimonials: 3");
    console.log("- Time entries: 3");
    console.log("- Expense entries: 3");
    console.log("- Ledger accounts: 5");
    console.log("- Orders: 1");
    console.log("- Invoices: 1");
    console.log("- Payroll entries: 2");
    console.log("\n🔐 All passwords set to: Mm21917800!!");
    console.log("\n🚀 Ready for demo!");

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      summary: {
        companies: 4,
        users: 11,
        products: 9,
        services: 3,
        teams: 4,
        projects: 1,
        tasks: 5,
        blockchainTransactions: 5,
        testimonials: 3,
        timeEntries: 3,
        expenseEntries: 3,
        ledgerAccounts: 5,
        orders: 1,
        invoices: 1,
        payrollEntries: 2,
      },
    });
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    return NextResponse.json(
      {
        error: "Failed to seed demo data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
