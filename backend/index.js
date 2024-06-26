const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const numberToWords = require("number-to-words");
const { z } = require("zod");

//zod validation
const sellerDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  pan: z.string(),
  gst: z.string(),
});

const billingDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  stateCode: z.string(),
});

const shippingDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  stateCode: z.string(),
});

const orderDetailsSchema = z.object({
  orderNumber: z.string(),
  orderDate: z.string(), // You might want to use a Date type here depending on your needs
});

const invoiceDetailsSchema = z.object({
  invoiceNumber: z.string(),
  details: z.string(),
  date: z.string(), // Again, consider using a Date type here
});

const itemSchema = z.object({
  description: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  discount: z.number(),
});

const invoiceSchemaValidate = z.object({
  sellerDetails: sellerDetailsSchema,
  placeOfSupply: z.string(),
  billingDetails: billingDetailsSchema,
  shippingDetails: shippingDetailsSchema,
  placeOfDelivery: z.string(),
  orderDetails: orderDetailsSchema,
  invoiceDetails: invoiceDetailsSchema,
  reverseCharge: z.string(),
  items: z.array(itemSchema),
});

const app = express();
app.use(bodyParser.json());

(async () => {
  try {
    await mongoose.connect("mongodb://localhost/invoices");
    console.log("Mongoose connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
})();

const invoiceSchema = new mongoose.Schema({
  sellerDetails: Object,
  placeOfSupply: String,
  billingDetails: Object,
  shippingDetails: Object,
  placeOfDelivery: String,
  orderDetails: Object,
  invoiceDetails: Object,
  reverseCharge: String,
  items: Array,
  totalAmount: Number,
  amountInWords: String,
  signature: String,
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

app.post("/api/invoices", async (req, res) => {
  try {
    const data = invoiceSchemaValidate.parse(req.body);
    
    const invoice = new Invoice(data);
    await invoice.save();

    // Generate PDF
    const doc = new PDFDocument({ margin: 30 });
    const invoicePath = `./invoices/${invoice._id}.pdf`;
    doc.pipe(fs.createWriteStream(invoicePath));

    // Header
    doc
      .image("./image/logo.png", 30, 30, { width: 40 })
      .fontSize(16)
      .text("Tax Invoice/Bill of Supply/Cash Memo", 150, 30, { align: "right" })
      .moveDown();

    const top = 90;
    const left = 30;

    // Seller Details
    doc.fontSize(10).font("Helvetica-Bold").text(`Sold By:\n`, left, top);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${invoice.sellerDetails.name}\n${invoice.sellerDetails.address}\n${invoice.sellerDetails.city}, ${invoice.sellerDetails.state}, ${invoice.sellerDetails.pincode}\nIN\n `,
        left,
        top + 10
      );

    //pan and gst registration on the left side
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`PAN No:`, left, top + 70);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${invoice.sellerDetails.pan}\n`, left + 40, top + 70);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`GST Registration No:`, left, top + 85);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${invoice.sellerDetails.gst}\n`, left + 100, top + 85);

    // Billing Details
    const topPosition = 180;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Billing Address:\n`, left, top, { align: "right" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${invoice.billingDetails.name}\n${invoice.billingDetails.address}\n${invoice.billingDetails.city}, ${invoice.billingDetails.state}, ${invoice.billingDetails.pincode}\nState/UT Code: ${invoice.billingDetails.stateCode}\n\n`,
        left,
        top + 12,
        { align: "right" }
      );

    //shopping details
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Shipping Address:\n`, left, top + 80, { align: "right" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${invoice.shippingDetails.name}\n${invoice.shippingDetails.address}\n${invoice.shippingDetails.city}, ${invoice.shippingDetails.state}, ${invoice.shippingDetails.pincode}\nState/UT Code: ${invoice.shippingDetails.stateCode}\n`,
        300,
        top + 92,
        { align: "right" }
      );

    // Place of supply and delivery Details
    doc.text(
      `Place of delivery: ${invoice.placeOfDelivery.toUpperCase()}\nPlace of supply: ${invoice.placeOfSupply.toUpperCase()}`,
      30,
      topPosition + 90,
      { align: "right" }
    );

    // Order Details
    doc.text(
      `Order Number: ${invoice.orderDetails.orderNumber}\nOrder Date: ${invoice.orderDetails.orderDate}`,
      30,
      topPosition + 120
    );

    //invoice details
    doc.text(
      `Invoice Number: ${invoice.invoiceDetails.invoiceNumber}\nInvoice Details: ${invoice.invoiceDetails.details}\nInvoice Date: ${invoice.invoiceDetails.date}\n\n`,
      30,
      topPosition + 120,
      { align: "right" }
    );

    //table*******************************************************
    const tableTop = topPosition + 200;
    const tableHeaderHeight = 30;
    const tableColumnPositions = [30, 70, 250, 310, 350, 395, 435, 475, 520];
    const tableWidths = [40, 180, 60, 40, 40, 40, 40, 60, 70]; // Adjust as needed

    // Draw the table header background
    doc
      .rect(
        tableColumnPositions[0],
        tableTop,
        tableWidths.reduce((a, b) => a + b, 0),
        tableHeaderHeight
      )
      .fillColor("#d3d3d3")
      .fill();

    // Draw the table header text
    const headers = [
      "Sl. No",
      "Description",
      "Unit Price",
      "Qty",
      "Net\nAmount",
      "Tax\nRate%",
      "Tax\nType",
      "Tax\nAmount",
      "Total\nAmount",
    ];
    headers.forEach((header, i) => {
      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(header, tableColumnPositions[i], tableTop + 5, {
          width: tableWidths[i],
          align: "center",
        });
    });

    // Function to calculate the height needed for each row
    const calculateRowHeight = (doc, text, width) => {
      const wrappedText = doc.widthOfString(text, { width });
      const lines = Math.ceil(wrappedText / width);
      return lines * doc.heightOfString("A");
    };

    // Draw the table content
    var totalSumOfProduct = 0;
    let itemPosition = tableTop + tableHeaderHeight + 10;
    invoice.items.forEach((item, index) => {
      const netAmount = item.unitPrice * item.quantity - item.discount;
      const taxAmount = netAmount * (18 / 100);
      const totalAmount = netAmount + taxAmount;

      totalSumOfProduct += totalAmount + taxAmount;
      var taxType = "";
      var taxRate = "";

      //checking the tax type on the basic of placeOfDelivery and placeOfSupply
      if (invoice.placeOfDelivery === invoice.placeOfSupply) {
        taxType = "CGST SGST";
        taxRate = "9%\n9%";
      } else {
        taxType = "IGST";
        taxRate = "18%";
      }

      const itemData = [
        (index + 1).toString(),
        item.description,
        item.unitPrice.toFixed(2),
        item.quantity.toString(),
        netAmount.toFixed(2),
        taxRate,
        taxType,
        taxAmount.toFixed(2),
        totalAmount.toFixed(2),
      ];

      // Calculate the row height based on the tallest cell
      const rowHeight = 30;

      itemData.forEach((data, i) => {
        const options = { width: tableWidths[i], align: "center" };
        doc
          .fontSize(8)
          .fillColor("#000000")
          .text(data, tableColumnPositions[i], itemPosition, options);
      });

      itemPosition += rowHeight;
    });

    // Draw table borders
    const drawTableBorders = (doc, top, left, width, height, rows, cols) => {
      for (let i = 0; i <= rows; i++) {
        doc
          .moveTo(left, top + i * tableRowHeight)
          .lineTo(left + width, top + i * tableRowHeight)
          .stroke();
      }

      let x = left;
      tableWidths.forEach((width) => {
        doc
          .moveTo(x, top)
          .lineTo(x, top + height)
          .stroke();
        x += width;
      });
    };

    const tableRowHeight = 30;
    const totalTableHeight = (invoice.items.length + 1) * tableRowHeight;
    const totalTableWidth = tableWidths.reduce((a, b) => a + b, 0);
    drawTableBorders(
      doc,
      tableTop,
      tableColumnPositions[0],
      totalTableWidth,
      totalTableHeight,
      invoice.items.length + 1,
      headers.length
    );

    //table*******************************************************

    const totalInWords = numberToWords.toWords(totalSumOfProduct);
    // Footer
    doc
      .fontSize(10)
      .text(
        `TOTAL: ${totalSumOfProduct.toFixed(
          2
        )}\nAmount in Words: ${totalInWords}`,
        30,
        itemPosition + 20
      )
      .text(`For ${invoice.sellerDetails.name}:`, 30, itemPosition + 70, {
        align: "right",
      })
      .image("./image/signature.png", 510, itemPosition + 90, {
        width: 80,
        height: 30,
      })
      .text("Authorised Signatory", 30, itemPosition + 130, { align: "right" });

    doc.end();

    res.json({
      message: "Invoice created successfully",
      invoiceId: invoice._id,
      invoicePath,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.errors });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3002");
});