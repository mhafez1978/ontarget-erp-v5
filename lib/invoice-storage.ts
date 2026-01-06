import { db } from "@/lib/db";
import { uploadDocument } from "@/lib/storage-service";

/**
 * Download Stripe invoice PDF and store it in company's file tree
 * Creates /Billing/Invoices/ folder structure if it doesn't exist
 */
export async function storeInvoicePDF(params: {
  companyId: string;
  invoiceId: string; // Local invoice ID from Invoice table
  stripeInvoicePdfUrl: string;
  invoiceNumber: string;
  userId?: string; // Optional user who owns this invoice
}): Promise<{
  fileRecordId: string;
  primaryPath: string;
  backupPath?: string;
}> {
  const { companyId, invoiceId, stripeInvoicePdfUrl, invoiceNumber, userId } =
    params;

  try {
    // 1. Download the PDF from Stripe
    const response = await fetch(stripeInvoicePdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // 2. Get or create the /Billing/Invoices/ folder structure
    const billingFolder = await getOrCreateBillingInvoicesFolder(companyId);

    // 3. Upload the PDF using the storage service (respects company's storage provider)
    const fileName = `${invoiceNumber}.pdf`;
    const storageResult = await uploadDocument(
      companyId,
      "Invoices",
      fileName,
      pdfBuffer,
      "application/pdf"
    );

    // 4. Create FileRecord entry
    const fileRecord = await db.fileRecord.create({
      data: {
        folderId: billingFolder.id,
        fileName: fileName,
        fileSize: pdfBuffer.length,
        mimeType: "application/pdf",
        primaryPath: storageResult.primaryPath,
        backupPath: storageResult.backupPath,
        storageProvider: storageResult.storageProvider,
        uploadedById: userId || null, // Can be null if system-generated
      },
    });

    // 5. Update the Invoice record to reference the FileRecord
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        fileRecordId: fileRecord.id,
      },
    });

    return {
      fileRecordId: fileRecord.id,
      primaryPath: storageResult.primaryPath,
      backupPath: storageResult.backupPath,
    };
  } catch (error) {
    console.error("Failed to store invoice PDF:", error);
    throw error;
  }
}

/**
 * Get or create the /Billing/Invoices/ folder for a company
 * Creates the hierarchy if it doesn't exist:
 * - /Billing (type: CUSTOM)
 * - /Billing/Invoices (type: CUSTOM)
 */
async function getOrCreateBillingInvoicesFolder(companyId: string): Promise<{
  id: string;
  path: string;
}> {
  // Check if /Billing/Invoices already exists
  const existingInvoicesFolder = await db.fileFolder.findFirst({
    where: {
      companyId,
      path: "/Billing/Invoices",
    },
  });

  if (existingInvoicesFolder) {
    return {
      id: existingInvoicesFolder.id,
      path: existingInvoicesFolder.path,
    };
  }

  // Check if /Billing exists
  let billingFolder = await db.fileFolder.findFirst({
    where: {
      companyId,
      path: "/Billing",
    },
  });

  // Create /Billing if it doesn't exist
  if (!billingFolder) {
    billingFolder = await db.fileFolder.create({
      data: {
        companyId,
        name: "Billing",
        path: "/Billing",
        type: "CUSTOM",
        parentId: null, // Root level folder
      },
    });
  }

  // Create /Billing/Invoices
  const invoicesFolder = await db.fileFolder.create({
    data: {
      companyId,
      name: "Invoices",
      path: "/Billing/Invoices",
      type: "CUSTOM",
      parentId: billingFolder.id,
    },
  });

  return {
    id: invoicesFolder.id,
    path: invoicesFolder.path,
  };
}

/**
 * Store invoice PDF for a user before their company is created
 * This is used during onboarding - invoice is linked to user via metadata
 * After company creation, call transferUserInvoicesToCompany()
 */
export async function storeUserInvoicePDF(params: {
  userId: string;
  invoiceId: string;
  stripeInvoicePdfUrl: string;
  invoiceNumber: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const { userId, invoiceId, stripeInvoicePdfUrl, invoiceNumber } = params;

  try {
    // Store metadata on the invoice indicating it's pending company assignment
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        userId: userId, // Link to user
        notes: `Pending company assignment - will be moved to company file tree after onboarding`,
      },
    });

    // Download PDF and store temporarily
    const response = await fetch(stripeInvoicePdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF: ${response.statusText}`);
    }

    // For now, just store the URL - we'll move it to the file tree after company creation
    // The webhook already stores externalInvoiceUrl, so this is just for tracking
    return {
      success: true,
      message: `Invoice ${invoiceNumber} will be added to company file tree after onboarding`,
    };
  } catch (error) {
    console.error("Failed to store user invoice PDF:", error);
    return {
      success: false,
      message: `Failed to store invoice: ${error}`,
    };
  }
}

/**
 * Transfer all user's invoices to their company's file tree
 * Called after company creation during onboarding
 */
export async function transferUserInvoicesToCompany(
  userId: string,
  companyId: string
): Promise<{
  transferred: number;
  errors: string[];
}> {
  try {
    // Find all invoices for this user that don't have a fileRecordId yet
    const userInvoices = await db.invoice.findMany({
      where: {
        userId: userId,
        fileRecordId: null, // Not yet stored in file tree
        externalInvoiceUrl: { not: null }, // Has a Stripe PDF URL
      },
    });

    const errors: string[] = [];
    let transferred = 0;

    for (const invoice of userInvoices) {
      try {
        // Update invoice to link to company
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            companyId: companyId,
          },
        });

        // Store the PDF in company's file tree
        if (invoice.externalInvoiceUrl) {
          await storeInvoicePDF({
            companyId,
            invoiceId: invoice.id,
            stripeInvoicePdfUrl: invoice.externalInvoiceUrl,
            invoiceNumber: invoice.invoiceNumber,
            userId,
          });
          transferred++;
        }
      } catch (error) {
        console.error(`Failed to transfer invoice ${invoice.id}:`, error);
        errors.push(`Invoice ${invoice.invoiceNumber}: ${error}`);
      }
    }

    return { transferred, errors };
  } catch (error) {
    console.error("Failed to transfer user invoices:", error);
    return {
      transferred: 0,
      errors: [`Failed to transfer invoices: ${error}`],
    };
  }
}
