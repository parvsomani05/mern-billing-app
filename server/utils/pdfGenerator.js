const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFGenerator {
  static async generateBillPDF(billData, customerData, companyInfo = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 30,
          info: {
            Title: `Invoice - ${billData.billNumber || "N/A"}`,
            Author: "MERN Billing App",
            Subject: "Invoice Document",
          },
        });

        const uploadsDir = path.join(__dirname, "../uploads/invoices");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const logoDir = path.join(__dirname, "../uploads/logos");
        if (!fs.existsSync(logoDir)) {
          fs.mkdirSync(logoDir, { recursive: true });
        }

        const fileName = `invoice_${
          billData.billNumber || billData._id
        }_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Sections
        this.addCompanyHeader(doc, companyInfo);
        this.addInvoiceAndCustomerSection(doc, billData, customerData);
        this.addProductsTable(doc, billData.products);
        this.addTotalsSection(doc, billData);
        this.addPaymentInfo(doc, billData);
        this.addTermsAndConditions(doc);
        this.addFooter(doc);

        doc.end();

        writeStream.on("finish", () => {
          resolve({
            fileName,
            filePath,
            url: `/uploads/invoices/${fileName}`,
          });
        });

        writeStream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 🟦 Header with Company Info + Logo + INVOICE Label
  static addCompanyHeader(doc, companyInfo) {
    const defaultCompany = {
      name: "MERN Billing App",
      address: "123 Business Street, Tech City, TC 12345",
      phone: "+1 (555) 123-4567",
      email: "info@billingapp.com",
      website: "www.billingapp.com",
    };

    const company = companyInfo || defaultCompany;

    // Background bar
    doc.rect(30, 30, 540, 60).fill("#f1f5f9").strokeColor("#e2e8f0").stroke();
    doc.fillColor("black");

    // Company info
    doc.fontSize(16).font("Helvetica-Bold").text(company.name, 40, 40);
    doc.fontSize(9).font("Helvetica");
    doc.text(company.address, 40, 58);
    doc.text(`Phone: ${company.phone} | Email: ${company.email}`, 40, 70);

    // Logo
    try {
      const logoDir = path.join(__dirname, "../uploads/logos");
      const logoPath = [
        "logo.png",
        "company-logo.png",
        "brand-logo.png",
        "logo.jpg",
        "logo.jpeg",
      ]
        .map((f) => path.join(logoDir, f))
        .find((p) => fs.existsSync(p));

      if (logoPath) {
        doc.image(logoPath, 450, 35, { width: 100 });
      } else {
        doc.fontSize(10).fillColor("#6b7280").text("LOGO", 500, 55);
      }
    } catch (e) {
      doc.fontSize(10).fillColor("#6b7280").text("LOGO", 500, 55);
    }

    // INVOICE Label
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#2563eb")
      .text("INVOICE", 450, 90);
    doc.fillColor("black");
  }

  // 🟨 Invoice & Customer Info Side by Side
  static addInvoiceAndCustomerSection(doc, billData, customerData) {
    const y = 110;

    // Left - Invoice
    doc.fontSize(10).font("Helvetica-Bold").text("Invoice Details", 40, y);
    doc.fontSize(9).font("Helvetica");
    doc.text(`Invoice No: ${billData.billNumber}`, 40, y + 15);
    doc.text(`Date: ${this.formatDate(billData.createdAt)}`, 40, y + 30);
    doc.text(`Due Date: ${this.formatDate(billData.dueDate)}`, 40, y + 45);
    doc.text(`Status:`, 40, y + 60);

    const statusColor = this.getStatusColor(billData.paymentStatus);
    doc
      .fillColor(statusColor)
      .font("Helvetica-Bold")
      .text(billData.paymentStatus.toUpperCase(), 90, y + 60);
    doc.fillColor("black");

    // Right - Customer
    doc.fontSize(10).font("Helvetica-Bold").text("Bill To", 320, y);
    doc.fontSize(9).font("Helvetica");
    doc.text(customerData.name, 320, y + 15);
    doc.text(customerData.email, 320, y + 30);
    doc.text(customerData.phone, 320, y + 45);
    if (customerData.address) {
      doc.fontSize(8).text(customerData.address, 320, y + 60, { width: 220 });
    }

    doc
      .moveTo(30, y + 90)
      .lineTo(570, y + 90)
      .strokeColor("#e5e7eb")
      .stroke();
  }

  // 📊 Products Table with alternating row colors
  static addProductsTable(doc, products) {
    const startY = 220;

    // Table header
    doc.rect(30, startY, 540, 20).fill("#2563eb");
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    doc.text("Item", 40, startY + 5);
    doc.text("Description", 120, startY + 5);
    doc.text("Qty", 320, startY + 5);
    doc.text("Rate", 370, startY + 5);
    doc.text("Amount", 450, startY + 5);
    doc.fillColor("black");

    let y = startY + 25;

    products.forEach((p, i) => {
      const rowHeight = 20;
      const rowColor = i % 2 === 0 ? "#f8fafc" : "#ffffff";

      doc.rect(30, y - 5, 540, rowHeight).fill(rowColor);

      doc.fillColor("black").fontSize(8);
      doc.text(p.productName, 40, y);
      doc.text(p.productDescription || "-", 120, y, { width: 180 });
      doc.text(p.quantity.toString(), 320, y);
      doc.text(`₹${p.price.toFixed(2)}`, 370, y);
      doc.text(`₹${p.total.toFixed(2)}`, 450, y);

      y += rowHeight;
    });

    doc
      .strokeColor("#e5e7eb")
      .rect(30, startY, 540, y - startY)
      .stroke();
  }

  // 💰 Totals Box (right aligned)
  static addTotalsSection(doc, billData) {
    const y = 600;

    doc
      .rect(330, y - 5, 240, 80)
      .fill("#f8fafc")
      .strokeColor("#e2e8f0")
      .stroke();
    doc.fillColor("black").fontSize(9);

    doc.text("Subtotal:", 350, y);
    doc.text(`₹${billData.subtotal.toFixed(2)}`, 520, y, { align: "right" });

    doc.text("Tax (18%):", 350, y + 15);
    doc.text(`₹${billData.taxAmount.toFixed(2)}`, 520, y + 15, {
      align: "right",
    });

    if (billData.discountAmount > 0) {
      doc.text("Discount:", 350, y + 30);
      doc.text(`-₹${billData.discountAmount.toFixed(2)}`, 520, y + 30, {
        align: "right",
      });
    }

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#2563eb");
    doc.text("TOTAL:", 350, y + 50);
    doc.text(`₹${billData.totalAmount.toFixed(2)}`, 520, y + 50, {
      align: "right",
    });

    doc.fillColor("black");
  }

  // 💳 Payment Info
  static addPaymentInfo(doc, billData) {
    const y = 700;

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#2563eb")
      .text("Payment Info", 40, y);
    doc.fillColor("black").fontSize(8).font("Helvetica");

    doc.text(`Status: ${billData.paymentStatus.toUpperCase()}`, 40, y + 15);
    doc.text(
      `Method: ${billData.paymentMethod || "Not specified"}`,
      200,
      y + 15
    );

    if (billData.razorpayPaymentId) {
      doc.text(`Txn ID: ${billData.razorpayPaymentId}`, 350, y + 15);
    }
    if (billData.paidAt) {
      doc.text(`Paid: ${this.formatDate(billData.paidAt)}`, 480, y + 15);
    }
  }

  // 📝 Terms & Conditions
  static addTermsAndConditions(doc) {
    const y = 750;
    doc
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor("#2563eb")
      .text("Terms & Conditions", 40, y);
    doc.fontSize(6).fillColor("black").font("Helvetica");

    const terms = [
      "• Payment due within 30 days",
      "• Late fees may apply after due date",
      "• Goods sold are not returnable",
      "• All disputes subject to local jurisdiction",
      "• Quote invoice number in all communications",
    ];

    let posY = y + 12;
    terms.forEach((term) => {
      doc.text(term, 40, posY);
      posY += 9;
    });
  }

  // 📌 Footer with page number
  static addFooter(doc) {
    const pageHeight = doc.page.height;
    const totalPages = doc.page.document._pageBuffer.length;

    doc.fontSize(8).font("Helvetica").fillColor("#6b7280");
    doc.text("Thank you for your business!", 30, pageHeight - 40);
    doc.text(
      `Generated on ${this.formatDate(new Date())}`,
      30,
      pageHeight - 28
    );
    doc.text(`Page ${doc.page.number} of ${totalPages}`, 500, pageHeight - 28, {
      align: "right",
    });
  }

  // Helper functions
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  static getStatusColor(status) {
    const colors = {
      paid: "#22c55e",
      pending: "#f59e0b",
      failed: "#ef4444",
      cancelled: "#6b7280",
    };
    return colors[status] || "#6b7280";
  }

  static async deletePDFFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting PDF file:", error);
      return false;
    }
  }
}

module.exports = PDFGenerator;
