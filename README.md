# Invoice Generation Program

## Overview

This program generates PDF invoices based on user-provided data and stores them in a MongoDB database. It utilizes Express.js for handling HTTP requests, Mongoose for MongoDB interactions, PDFKit for PDF generation, and Zod for input validation.

## Prerequisites

- Node.js (version X.X.X or higher)
- MongoDB (running locally or accessible via URI)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file and define the following variables:
   ```
   MONGODB_URI=mongodb://localhost/invoices
   ```

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3001`.

2. **API Endpoint:**
   - **POST `/api/invoices`:** Create a new invoice.

   **Request Payload Example:**
   ```json
   {
     "sellerDetails": {
       "name": "Seller Name",
       "address": "Seller Address",
       "city": "Seller City",
       "state": "Seller State",
       "pincode": "Seller Pincode",
       "pan": "Seller PAN",
       "gst": "Seller GST"
     },
     "placeOfSupply": "Place of Supply",
     "billingDetails": {
       "name": "Billing Name",
       "address": "Billing Address",
       "city": "Billing City",
       "state": "Billing State",
       "pincode": "Billing Pincode",
       "stateCode": "Billing State Code"
     },
     "shippingDetails": {
       "name": "Shipping Name",
       "address": "Shipping Address",
       "city": "Shipping City",
       "state": "Shipping State",
       "pincode": "Shipping Pincode",
       "stateCode": "Shipping State Code"
     },
     "placeOfDelivery": "Place of Delivery",
     "orderDetails": {
       "orderNumber": "Order Number",
       "orderDate": "Order Date"
     },
     "invoiceDetails": {
       "invoiceNumber": "Invoice Number",
       "details": "Invoice Details",
       "date": "Invoice Date"
     },
     "reverseCharge": "Reverse Charge",
     "items": [
       {
         "description": "Item Description",
         "unitPrice": 100,
         "quantity": 2,
         "discount": 0
       }
     ]
   }
   ```

3. **Response Example:**
   ```json
   {
     "message": "Invoice created successfully",
     "invoiceId": "6059d8e61811f52c2b9e11e7",
     "invoicePath": "./invoices/6059d8e61811f52c2b9e11e7.pdf"
   }
   ```

## PDF Structure

The generated PDF includes:
- Company logo and title
- Seller, billing, and shipping details
- Order and invoice specifics
- Itemized table with description, unit price, quantity, discounts, taxes, and totals
- Total amount and amount in words
- Signature and authorized signatory section

## Error Handling

- If validation fails (e.g., missing required fields), the server responds with a `400 Bad Request` and details of validation errors.
- Check server logs for MongoDB connection and any runtime errors.

## Conclusion

This document provides an overview of the invoice generation program, its setup, usage, and key features. For detailed customization or additional features, refer to the source code and relevant libraries' documentation.
