/**
 * DentsWeb Invoice & Gmail SMTP Email Service
 * High-End Glassmorphism Email Generator & Financial Automation Engine
 */

const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const checkOverdue = (invoice) => {
    if (!invoice) return invoice;
    if (invoice.status === 'PAID') return invoice;
    if (invoice.balance > 0 && invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'DRAFT') {
        invoice.status = 'OVERDUE';
    }
    return invoice;
};

// Default Settings (100% Dinamis dari Environment Variables)
const DEFAULT_INVOICE_SETTINGS = {
    businessName: process.env.BUSINESS_NAME || "DENTS WEB",
    tagline: process.env.BUSINESS_TAGLINE || "Build Your Digital Presence.",
    npwp: process.env.BUSINESS_NPWP || process.env.NPWP || "",
    businessEmail: process.env.ADMIN_EMAIL || process.env.BUSINESS_EMAIL || "",
    businessPhone: process.env.BUSINESS_PHONE || "",
    businessAddress: process.env.BUSINESS_ADDRESS || "Indonesia",
    bankName: process.env.BANK_NAME || "",
    bankAccount: process.env.BANK_ACCOUNT || "",
    bankAccountName: process.env.BANK_ACCOUNT_NAME || "",
    invoicePrefix: process.env.INVOICE_PREFIX || "DENTSWEB",
    defaultTaxRate: 0,
    defaultDiscRate: 0,
    invoiceNotes: process.env.INVOICE_NOTES || "Terima kasih telah mempercayakan proyek website Anda kepada Dents Web. Pembayaran dapat ditransfer ke rekening resmi kami di atas.",
    senderName: process.env.INVOICE_SENDER_NAME || process.env.SENDER_NAME || "Dents Web Billing & Invoicing",
    smtpUser: process.env.ADMIN_EMAIL || "",
    smtpPass: process.env.ADMIN_EMAIL_PASS || "",
    autoSendReceipt: true,
    siteUrl: process.env.SITE_URL || "https://www.dentsweb.my.id"
};

async function getInvoiceSettings(redis) {
    try {
        const stored = await redis.get('dents:invoice:settings');
        if (stored && typeof stored === 'object') {
            if (stored.invoiceNotes && stored.invoiceNotes.includes('Virtual Account resmi kami')) {
                stored.invoiceNotes = process.env.INVOICE_NOTES || "Terima kasih telah mempercayakan proyek website Anda kepada Dents Web. Pembayaran dapat ditransfer ke rekening resmi kami di atas.";
                await redis.set('dents:invoice:settings', stored).catch(() => { });
            }
            return { ...DEFAULT_INVOICE_SETTINGS, ...stored };
        }
    } catch (e) {
        console.error('[INVOICE] Error fetching settings:', e.message);
    }
    return { ...DEFAULT_INVOICE_SETTINGS };
}

async function saveInvoiceSettings(redis, newSettings) {
    const current = await getInvoiceSettings(redis);
    const updated = {
        ...current,
        ...newSettings,
        defaultTaxRate: parseFloat(newSettings.defaultTaxRate) || 0,
        defaultDiscRate: parseFloat(newSettings.defaultDiscRate) || 0,
        updatedAt: new Date().toISOString()
    };
    await redis.set('dents:invoice:settings', updated);
    return updated;
}

// Nodemailer Transporter Factory
async function getMailTransporter(redis) {
    const settings = await getInvoiceSettings(redis);
    const user = (settings.smtpUser && settings.smtpUser.trim()) || process.env.ADMIN_EMAIL || '';
    const rawPass = (settings.smtpPass && settings.smtpPass.trim()) || process.env.ADMIN_EMAIL_PASS || '';
    const pass = rawPass.replace(/\s+/g, '');

    // Google SMTP Configuration (Port 465 SSL)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    return { transporter, user, pass, settings };
}

/**
 * GENERATOR BUFFER DOKUMEN PDF FAKTUR RESMI (INVOICE PDF)
 * Dibuat dengan PDFKit: Resolusi tinggi, vektor tajam, logo resmi, dan siap diunduh/dicetak klien.
 */
function generateInvoicePdfBuffer({ invoice, customer, settings }) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const logoPath = path.join(__dirname, '../public/img/axalogo.png');
            const paidStampPath = path.join(__dirname, '../public/img/axapaid.png');

            // Generate QR Code Buffer for Online Verification & Payment
            const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');
            const invoicePublicUrl = `${siteUrl}/invoice/${invoice.publicId || invoice.id}`;
            let qrBuffer = null;
            try {
                qrBuffer = await QRCode.toBuffer(invoicePublicUrl, { width: 160, margin: 1 });
            } catch (qrErr) {
                console.error('[PDF-QR] Error generating invoice QR code:', qrErr);
            }

            // 1. TOP LEFT: Logo
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 40, { width: 48, height: 48 });
            }

            // 2. TOP RIGHT: Business Information (Right-aligned)
            doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
                .text(settings.businessName || process.env.BUSINESS_NAME || 'DENTS WEB', 320, 42, { align: 'right', width: 235 });
            doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
                .text(settings.businessAddress || process.env.BUSINESS_ADDRESS || 'Indonesia', 320, 58, { align: 'right', width: 235 })
                .text(settings.businessEmail || process.env.ADMIN_EMAIL || '', 320, 70, { align: 'right', width: 235 })
                .text(settings.businessPhone || process.env.BUSINESS_PHONE || '', 320, 82, { align: 'right', width: 235 });
            if (settings.npwp || process.env.BUSINESS_NPWP) {
                doc.text(`NPWP: ${settings.npwp || process.env.BUSINESS_NPWP}`, 320, 94, { align: 'right', width: 235 });
            }

            // 3. BELOW LOGO: Title INVOICE & Number
            const invNumber = invoice.number || invoice.invoiceNumber || 'INV-000';
            doc.fillColor('#0284c7').fontSize(24).font('Helvetica-Bold').text('INVOICE', 40, 96);
            doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(`#${invNumber}`, 40, 124);

            // 4. HEADER DIVIDER LINE
            doc.strokeColor('#e2e8f0').lineWidth(1.2).moveTo(40, 146).lineTo(555, 146).stroke();

            // 5. BILL TO (Left)
            doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('BILL TO:', 40, 160);
            doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(40, 172).lineTo(140, 172).stroke();

            const cName = customer.companyName || customer.name || 'PT. Axa Xyz';
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(cName, 40, 180);
            let custY = 195;
            if (customer.address) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(customer.address, 40, custY);
                custY += 12;
            }
            const cityPostal = `${customer.city || ''} ${customer.postalCode || ''}`.trim();
            if (cityPostal) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(cityPostal, 40, custY);
                custY += 12;
            }
            if (customer.email) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(customer.email, 40, custY);
            }

            // 6. STATUS PILL & DATES (Right)
            const isPaid = (invoice.status || '').toUpperCase() === 'PAID';
            const isOverdue = (invoice.status || '').toUpperCase() === 'OVERDUE';
            let pillBg = '#fef3c7'; // yellow
            let pillColor = '#b45309';
            let statusLabel = 'UNPAID';

            if (isPaid) {
                pillBg = '#dcfce7'; // green
                pillColor = '#15803d';
                statusLabel = 'PAID';
            } else if (isOverdue) {
                pillBg = '#fee2e2'; // red
                pillColor = '#b91c1c';
                statusLabel = 'OVERDUE';
            }

            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Status:', 380, 163);
            doc.roundedRect(485, 158, 70, 18, 9).fill(pillBg);
            doc.fillColor(pillColor).fontSize(8.5).font('Helvetica-Bold').text(statusLabel, 485, 163, { width: 70, align: 'center' });

            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Invoice Date:', 380, 184);
            doc.fillColor('#475569').font('Helvetica').text(formatDate(invoice.invoiceDate), 450, 184, { align: 'right', width: 105 });

            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Due Date:', 380, 204);
            doc.fillColor('#475569').font('Helvetica').text(formatDate(invoice.dueDate), 450, 204, { align: 'right', width: 105 });

            // 7. CLEAN ITEMS TABLE
            const tableTop = 240;
            doc.rect(40, tableTop, 515, 22).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold')
                .text('DESCRIPTION', 50, tableTop + 6)
                .text('QTY', 330, tableTop + 6, { width: 40, align: 'center' })
                .text('PRICE', 380, tableTop + 6, { width: 85, align: 'right' })
                .text('TOTAL', 475, tableTop + 6, { width: 70, align: 'right' });

            let y = tableTop + 28;
            (invoice.items || []).forEach(item => {
                const itemQty = item.quantity || 1;
                const itemPrice = item.price !== undefined ? item.price : (item.unitPrice || 0);
                const itemTotal = item.total || (itemQty * itemPrice);

                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(item.description || '-', 50, y, { width: 275 });
                if (item.period) {
                    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(item.period, 50, y + 12);
                }

                doc.fillColor('#334155').fontSize(9).font('Helvetica')
                    .text(String(itemQty), 330, y, { width: 40, align: 'center' })
                    .text(formatRupiah(itemPrice), 380, y, { width: 85, align: 'right' });
                doc.fillColor('#0f172a').font('Helvetica-Bold')
                    .text(formatRupiah(itemTotal), 475, y, { width: 70, align: 'right' });

                y += item.period ? 28 : 22;
                doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(40, y - 4).lineTo(555, y - 4).stroke();
            });

            // 8. BOTTOM PAYMENT DETAILS & SUMMARY
            const bottomY = Math.max(y + 16, 370);

            // Left: Payment Details Card
            doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text('Payment Details', 40, bottomY);
            doc.roundedRect(40, bottomY + 12, 240, 68, 6).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Bank Transfer:', 50, bottomY + 20);
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
                .text(`${settings.bankName || process.env.BANK_NAME || 'Bank Transfer'} - ${settings.bankAccount || process.env.BANK_ACCOUNT || ''}`, 50, bottomY + 34)
                .text(`A/N: ${settings.bankAccountName || process.env.BANK_ACCOUNT_NAME || ''}`, 50, bottomY + 48);

            if (invoice.notes) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Notes:', 40, bottomY + 90);
                doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(invoice.notes, 40, bottomY + 102, { width: 240 });
            }

            // Stamp Lunas if PAID
            if (isPaid && fs.existsSync(paidStampPath)) {
                doc.image(paidStampPath, 50, bottomY + 90, { width: 115 });
            }

            // Right: Financial Summary
            const sumX = 350;
            const sumW = 205;
            let sy = bottomY + 4;

            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Subtotal', sumX, sy);
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatRupiah(invoice.subtotal), sumX, sy, { align: 'right', width: sumW });
            sy += 16;

            const discRate = Number(invoice.discountRate || 0);
            const discVal = Number(invoice.discountAmount || invoice.discount || (discRate > 0 ? Math.round((invoice.subtotal * discRate) / 100) : 0));
            if (discVal > 0 || discRate > 0) {
                doc.fillColor('#dc2626').fontSize(9).font('Helvetica').text(`Discount (${discRate}%)`, sumX, sy);
                doc.fillColor('#dc2626').font('Helvetica-Bold').text(`-${formatRupiah(discVal)}`, sumX, sy, { align: 'right', width: sumW });
                sy += 16;
            }

            const taxVal = invoice.tax || invoice.taxAmount || 0;
            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`PPN (${invoice.taxRate || 0}%)`, sumX, sy);
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(`+${formatRupiah(taxVal)}`, sumX, sy, { align: 'right', width: sumW });
            sy += 16;

            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(sumX, sy).lineTo(555, sy).stroke();
            sy += 6;

            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Grand Total', sumX, sy);
            doc.fillColor('#0284c7').fontSize(12).font('Helvetica-Bold').text(formatRupiah(invoice.total), sumX, sy, { align: 'right', width: sumW });
            sy += 20;

            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Amount Paid', sumX, sy);
            doc.fillColor('#16a34a').font('Helvetica-Bold').text(formatRupiah(invoice.amountPaid || 0), sumX, sy, { align: 'right', width: sumW });
            sy += 18;

            doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Balance Due', sumX, sy);
            const balColor = (invoice.balance > 0) ? '#0f172a' : '#16a34a';
            doc.fillColor(balColor).fontSize(14).font('Helvetica-Bold').text(formatRupiah(invoice.balance || 0), sumX, sy, { align: 'right', width: sumW });

            // QR Code Verifikasi & Bayar Online (Kanan Bawah Sejajar axapaid.png di sisi kiri)
            if (qrBuffer) {
                const qrX = 475;
                const qrY = sy + 18;
                doc.image(qrBuffer, qrX, qrY, { width: 75, height: 75 });
                doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold')
                    .text('SCAN VERIFIKASI SAH', qrX - 10, qrY + 78, { width: 95, align: 'center' });
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * GENERATOR BUFFER DOKUMEN PDF KUITANSI LUNAS RESMI (RECEIPT PDF)
 * Dibuat identik 1:1 dengan Web Print Kuitansi (receipt-print.ejs):
 * - Judul OFFICIAL RECEIPT (Hijau), No. Kuitansi #KW-... & Ref. Faktur di bawah logo
 * - Profil agensi DENTS WEB rata kanan
 * - Garis pembatas
 * - RECEIVED FROM di kiri, Status PAID IN FULL (Pill Badge hijau) di kanan
 * - Card Payment Verified dengan riwayat pembayaran sah & stempel axapaid.png
 * - Ringkasan finansial pelunasan
 */
function generateReceiptPdfBuffer({ invoice, customer, settings, paymentInfo }) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const logoPath = path.join(__dirname, '../public/img/axalogo.png');
            const paidStampPath = path.join(__dirname, '../public/img/axapaid.png');

            // Generate QR Code Buffer for Online Receipt Verification
            const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');
            const receiptPublicUrl = `${siteUrl}/receipt/${invoice.publicId || invoice.id}`;
            let qrBuffer = null;
            try {
                qrBuffer = await QRCode.toBuffer(receiptPublicUrl, { width: 160, margin: 1 });
            } catch (qrErr) {
                console.error('[PDF-QR] Error generating receipt QR code:', qrErr);
            }

            // 1. TOP LEFT: Logo
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 40, { width: 48, height: 48 });
            }

            // 2. TOP RIGHT: Business Information (Right-aligned)
            doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
                .text(settings.businessName || process.env.BUSINESS_NAME || 'DENTS WEB', 320, 42, { align: 'right', width: 235 });
            doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
                .text(settings.businessAddress || process.env.BUSINESS_ADDRESS || 'Indonesia', 320, 58, { align: 'right', width: 235 })
                .text(settings.businessEmail || process.env.ADMIN_EMAIL || '', 320, 70, { align: 'right', width: 235 })
                .text(settings.businessPhone || process.env.BUSINESS_PHONE || '', 320, 82, { align: 'right', width: 235 });
            if (settings.npwp || process.env.BUSINESS_NPWP) {
                doc.text(`NPWP: ${settings.npwp || process.env.BUSINESS_NPWP}`, 320, 94, { align: 'right', width: 235 });
            }

            // 3. BELOW LOGO: Title OFFICIAL RECEIPT & Receipt No.
            const invNumber = invoice.number || invoice.invoiceNumber || 'INV-000';
            doc.fillColor('#15803d').fontSize(22).font('Helvetica-Bold').text('OFFICIAL RECEIPT', 40, 96);
            doc.fillColor('#64748b').fontSize(9.5).font('Helvetica')
                .text(`No. Kuitansi: #KW-${invNumber}`, 40, 122)
                .text(`Ref. Faktur: #${invNumber}`, 40, 134);

            // 4. HEADER DIVIDER LINE
            doc.strokeColor('#e2e8f0').lineWidth(1.2).moveTo(40, 148).lineTo(555, 148).stroke();

            // 5. RECEIVED FROM (Left)
            doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('RECEIVED FROM:', 40, 160);
            doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(40, 172).lineTo(150, 172).stroke();

            const cName = customer.companyName || customer.name || 'PT. Axa Xyz';
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(cName, 40, 180);
            let custY = 195;
            if (customer.address) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(customer.address, 40, custY);
                custY += 12;
            }
            const cityPostal = `${customer.city || ''} ${customer.postalCode || ''}`.trim();
            if (cityPostal) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(cityPostal, 40, custY);
                custY += 12;
            }
            if (customer.email) {
                doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(customer.email, 40, custY);
            }

            // 6. STATUS PILL & DATES (Right)
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Status:', 370, 163);
            doc.roundedRect(470, 158, 85, 18, 9).fill('#dcfce7');
            doc.fillColor('#15803d').fontSize(8.5).font('Helvetica-Bold').text('PAID IN FULL', 470, 163, { width: 85, align: 'center' });

            const receiptDate = paymentInfo?.paidAt || invoice.completed_at || invoice.updatedAt || new Date().toISOString();

            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Invoice Date:', 370, 184);
            doc.fillColor('#475569').font('Helvetica').text(formatDate(invoice.invoiceDate), 450, 184, { align: 'right', width: 105 });

            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Receipt Date:', 370, 204);
            doc.fillColor('#475569').font('Helvetica').text(formatDate(receiptDate), 450, 204, { align: 'right', width: 105 });

            // 7. CLEAN ITEMS TABLE
            const tableTop = 240;
            doc.rect(40, tableTop, 515, 22).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold')
                .text('DESCRIPTION', 50, tableTop + 6)
                .text('QTY', 330, tableTop + 6, { width: 40, align: 'center' })
                .text('PRICE', 380, tableTop + 6, { width: 85, align: 'right' })
                .text('TOTAL', 475, tableTop + 6, { width: 70, align: 'right' });

            let y = tableTop + 28;
            (invoice.items || []).forEach(item => {
                const itemQty = item.quantity || 1;
                const itemPrice = item.price !== undefined ? item.price : (item.unitPrice || 0);
                const itemTotal = item.total || (itemQty * itemPrice);

                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(item.description || '-', 50, y, { width: 275 });
                if (item.period) {
                    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(item.period, 50, y + 12);
                }

                doc.fillColor('#334155').fontSize(9).font('Helvetica')
                    .text(String(itemQty), 330, y, { width: 40, align: 'center' })
                    .text(formatRupiah(itemPrice), 380, y, { width: 85, align: 'right' });
                doc.fillColor('#0f172a').font('Helvetica-Bold')
                    .text(formatRupiah(itemTotal), 475, y, { width: 70, align: 'right' });

                y += item.period ? 28 : 22;
                doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(40, y - 4).lineTo(555, y - 4).stroke();
            });

            // 8. BOTTOM PAYMENT VERIFIED & SUMMARY
            const bottomY = Math.max(y + 16, 370);

            // Left: Payment Verified Box
            doc.fillColor('#15803d').fontSize(9.5).font('Helvetica-Bold').text('Payment Verified', 40, bottomY);
            doc.roundedRect(40, bottomY + 12, 240, 72, 6).fillAndStroke('#f0fdf4', '#86efac');
            doc.fillColor('#166534').fontSize(8.5).font('Helvetica')
                .text('Thank you for your business. This document serves as official proof of payment.', 50, bottomY + 20, { width: 220 });

            const payMethod = paymentInfo?.method || 'Transfer Bank';
            doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
                .text(`Metode: ${payMethod}`, 50, bottomY + 46);
            doc.fillColor('#64748b').fontSize(8).font('Helvetica')
                .text(`Waktu Bayar: ${formatDate(receiptDate)}`, 50, bottomY + 60);

            // Paid Stamp
            if (fs.existsSync(paidStampPath)) {
                doc.image(paidStampPath, 50, bottomY + 92, { width: 115 });
            }

            // Right: Financial Summary
            const sumX = 350;
            const sumW = 205;
            let sy = bottomY + 4;

            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Subtotal', sumX, sy);
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatRupiah(invoice.subtotal), sumX, sy, { align: 'right', width: sumW });
            sy += 16;

            const discVal = invoice.discountAmount || invoice.discount || 0;
            if (discVal > 0) {
                doc.fillColor('#dc2626').fontSize(9).font('Helvetica').text(`Discount (${invoice.discountRate || 0}%)`, sumX, sy);
                doc.fillColor('#dc2626').font('Helvetica-Bold').text(`-${formatRupiah(discVal)}`, sumX, sy, { align: 'right', width: sumW });
                sy += 16;
            }

            const taxVal = invoice.tax || invoice.taxAmount || 0;
            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`PPN (${invoice.taxRate || 0}%)`, sumX, sy);
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(`+${formatRupiah(taxVal)}`, sumX, sy, { align: 'right', width: sumW });
            sy += 16;

            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(sumX, sy).lineTo(555, sy).stroke();
            sy += 6;

            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Grand Total', sumX, sy);
            doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(formatRupiah(invoice.total), sumX, sy, { align: 'right', width: sumW });
            sy += 20;

            doc.fillColor('#15803d').fontSize(10).font('Helvetica-Bold').text('Amount Paid', sumX, sy);
            doc.fillColor('#15803d').fontSize(12).font('Helvetica-Bold').text(formatRupiah(invoice.amountPaid || invoice.total), sumX, sy, { align: 'right', width: sumW });
            sy += 20;

            doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold').text('Balance Due', sumX, sy);
            doc.fillColor('#64748b').fontSize(12).font('Helvetica-Bold').text('Rp 0', sumX, sy, { align: 'right', width: sumW });

            // QR Code Verifikasi Sah (Kanan Bawah Sejajar axapaid.png di sisi kiri)
            if (qrBuffer) {
                const qrX = 475;
                const qrY = sy + 18;
                doc.image(qrBuffer, qrX, qrY, { width: 75, height: 75 });
                doc.fillColor('#15803d').fontSize(6.5).font('Helvetica-Bold')
                    .text('SCAN VERIFIKASI SAH', qrX - 10, qrY + 78, { width: 95, align: 'center' });
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Uji Koneksi Gmail SMTP
 */
async function testSmtpConnection(redisOrOptions, targetEmailArg) {
    const redis = (redisOrOptions && redisOrOptions.redis) ? redisOrOptions.redis : redisOrOptions;
    const targetEmail = (redisOrOptions && redisOrOptions.targetEmail) ? redisOrOptions.targetEmail : targetEmailArg;
    const { transporter, user, settings } = await getMailTransporter(redis);
    const destination = targetEmail || user;
    const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');

    // Verify SMTP connection first
    await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
            if (error) reject(error);
            else resolve(success);
        });
    });

    const mailOptions = {
        from: `"${settings.senderName || 'Dents Web Billing'}" <${user}>`,
        to: destination,
        subject: `[DIAGNOSTIK] Uji Koneksi Gmail SMTP Dents Web Berhasil! ✅`,
        html: `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title>Uji Koneksi Gmail SMTP</title>
        </head>
        <body style="margin: 0; padding: 24px 12px; background-color: #e6f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; background-image: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #bae6fd; border-radius: 20px; box-shadow: 0 16px 40px rgba(2, 132, 199, 0.12); overflow: hidden; padding: 0;">
                            <tr>
                                <td style="padding: 28px 28px 20px 28px; border-bottom: 2px solid #e0f2fe;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td valign="middle" align="left">
                                                <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                                                    <span style="color: #0284c7;">DENTS</span><span style="color: #0f172a;">WEB</span>
                                                </div>
                                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 3px; letter-spacing: 0.8px; text-transform: uppercase;">
                                                    DIAGNOSTIC &amp; SYSTEM TEST
                                                </div>
                                            </td>
                                            <td valign="top" align="right" style="width: 60px;">
                                                <img src="${siteUrl}/public/img/axalogo.png" alt="DENTS WEB Logo" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 12px; border: 1.5px solid #bae6fd; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15); object-fit: cover; margin-left: auto;">
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 28px 28px 16px 28px;">
                                    <div style="display: inline-block; background-color: #dcfce7; border: 2px solid #22c55e; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; text-align: center; font-size: 28px;">
                                        ⚡
                                    </div>
                                    <h2 style="color: #0f172a; margin: 16px 0 6px 0; font-size: 21px; font-weight: 900;">Koneksi Gmail SMTP Aktif &amp; Terhubung!</h2>
                                    <p style="color: #475569; font-size: 13.5px; margin: 0; line-height: 1.5;">Platform pengiriman email otomatis Dents Web telah berhasil diautentikasi oleh server Google.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 28px 24px 28px;">
                                    <div style="background-color: #f0f9ff; border: 1.5px solid #7dd3fc; border-radius: 14px; padding: 18px 22px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Akun Gmail Pengirim:</td>
                                                <td style="padding: 5px 0; font-weight: 800; color: #0284c7; text-align: right;">${user}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Waktu Diagnostik:</td>
                                                <td style="padding: 5px 0; font-weight: 700; color: #0f172a; text-align: right;">${new Date().toLocaleString('id-ID')}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Status Server:</td>
                                                <td style="padding: 5px 0; font-weight: 800; color: #15803d; text-align: right;">✓ 250 OK (Authenticated)</td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 28px; text-align: center; font-size: 11px; color: #64748b; background-color: #f0f9ff; border-top: 1.5px solid #e0f2fe;">
                                    &copy; ${new Date().getFullYear()} ${settings.businessName || 'DENTS WEB'}. Hak cipta dilindungi.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    };

    return await transporter.sendMail(mailOptions);
}

/**
 * GENERATOR EMAIL TAGIHAN (INVOICE) BERGAYA SOFT BLUE CYAN AESTHETIC
 * Super Big Upgrade: Ultra High-Contrast Typography & Logo Kanan Atas
 * Responsif sempurna di Smartphone (Gmail App Android/iOS), Tablet, dan Desktop.
 */
function generateInvoiceEmailHtml({ invoice, customer, settings, paymentInfo }) {
    const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');
    const invoicePublicUrl = `${siteUrl}/invoice/${invoice.publicId}`;

    // Payment Options (Pakasir or Bank)
    const pakasirLink = paymentInfo?.payment_link || invoice.paymentLink || '';
    const vaNumber = paymentInfo?.va_number || invoice.vaNumber || '';
    const paymentMethodName = paymentInfo?.method_name || invoice.paymentMethodName || '';

    // Status Badge generator with high contrast
    let statusBadgeHtml = '';
    const st = String(invoice.status || 'UNPAID').toUpperCase();
    if (st === 'PAID') {
        statusBadgeHtml = `
        <span style="display: inline-block; background-color: #dcfce7; color: #15803d; border: 1.5px solid #22c55e; border-radius: 999px; padding: 4px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
            ✓ LUNAS (PAID)
        </span>`;
    } else if (st === 'OVERDUE') {
        statusBadgeHtml = `
        <span style="display: inline-block; background-color: #fee2e2; color: #b91c1c; border: 1.5px solid #ef4444; border-radius: 999px; padding: 4px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
            LEWAT JATUH TEMPO (OVERDUE)
        </span>`;
    } else {
        statusBadgeHtml = `
        <span style="display: inline-block; background-color: #fef3c7; color: #b45309; border: 1.5px solid #f59e0b; border-radius: 999px; padding: 4px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
            BELUM LUNAS (UNPAID)
        </span>`;
    }

    // Render items table rows
    let itemsRows = '';
    if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
            const itemPrice = item.price !== undefined ? item.price : (item.unitPrice || 0);
            const itemQty = item.quantity || 1;
            const itemTotal = item.total || (itemQty * itemPrice);
            itemsRows += `
            <tr style="border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                <td style="padding: 12px 14px; vertical-align: top;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 13.5px; line-height: 1.4;">${item.description || '-'}</div>
                    ${item.period ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500;">Periode: ${item.period}</div>` : ''}
                </td>
                <td style="padding: 12px 8px; text-align: center; color: #334155; font-size: 13px; font-weight: 700; vertical-align: top; width: 45px;">${itemQty}</td>
                <td style="padding: 12px 12px; text-align: right; color: #334155; font-size: 13px; font-weight: 600; vertical-align: top; white-space: nowrap;">${formatRupiah(itemPrice)}</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #0284c7; font-size: 13.5px; vertical-align: top; white-space: nowrap;">${formatRupiah(itemTotal)}</td>
            </tr>
            `;
        });
    }

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <title>Tagihan Faktur #${invoice.number || invoice.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #e6f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    
                    <!-- MAIN CARD: SOFT BLUE CYAN AESTHETIC -->
                    <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; background-image: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #bae6fd; border-radius: 20px; box-shadow: 0 16px 40px rgba(2, 132, 199, 0.12); overflow: hidden; padding: 0;">
                        
                        <!-- HEADER BAR WITH LOGO IN TOP-RIGHT -->
                        <tr>
                            <td style="padding: 28px 28px 20px 28px; border-bottom: 2px solid #e0f2fe;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <!-- LEFT: AGENCY BRAND & INVOICE NUMBER -->
                                        <td valign="middle" align="left">
                                            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                                                <span style="color: #0284c7;">DENTS</span><span style="color: #0f172a;">WEB</span>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 3px; letter-spacing: 0.8px; text-transform: uppercase;">
                                                OFFICIAL AGENCY INVOICE
                                            </div>
                                            <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 8px;">
                                                #${invoice.number || invoice.invoiceNumber}
                                            </div>
                                            <div style="margin-top: 6px;">
                                                ${statusBadgeHtml}
                                            </div>
                                        </td>

                                        <!-- RIGHT: LOGO AXA DENTSWEB (RESPONSIVE TOP-RIGHT) -->
                                        <td valign="top" align="right" style="width: 70px;">
                                            <img src="${siteUrl}/public/img/axalogo.png" alt="DENTS WEB Logo" width="62" height="62" style="display: block; width: 62px; height: 62px; border-radius: 14px; border: 1.5px solid #bae6fd; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15); object-fit: cover; margin-left: auto;">
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- BILLING INFO CARD -->
                        <tr>
                            <td style="padding: 20px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;">
                                    <tr>
                                        <td width="55%" valign="top" style="padding-right: 12px;">
                                            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">DITUJUKAN KEPADA:</div>
                                            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${customer.companyName || 'Klien Terhormat'}</div>
                                            ${customer.contactPerson ? `<div style="font-size: 13px; color: #334155; font-weight: 600; margin-top: 3px;">u.p. ${customer.contactPerson}</div>` : ''}
                                            ${customer.email ? `<div style="font-size: 12.5px; color: #0284c7; font-weight: 600; margin-top: 3px;"><a href="mailto:${customer.email}" style="color: #0284c7; text-decoration: none;">${customer.email}</a></div>` : ''}
                                            ${customer.phone ? `<div style="font-size: 12px; color: #475569; margin-top: 3px;">${customer.phone}</div>` : ''}
                                            ${customer.address ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4;">${customer.address}</div>` : ''}
                                        </td>
                                        <td width="45%" valign="top" align="right">
                                            <table border="0" cellspacing="0" cellpadding="0" style="font-size: 12.5px;">
                                                <tr>
                                                    <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600; text-align: right;">Tgl Faktur:</td>
                                                    <td style="padding: 4px 0; font-weight: 800; color: #0f172a; text-align: right;">${formatDate(invoice.invoiceDate)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600; text-align: right;">Jatuh Tempo:</td>
                                                    <td style="padding: 4px 0; font-weight: 800; color: #dc2626; text-align: right;">${formatDate(invoice.dueDate)}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- ITEMS TABLE -->
                        <tr>
                            <td style="padding: 0 28px 16px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1.5px solid #e0f2fe; border-radius: 12px; overflow: hidden;">
                                    <thead>
                                        <tr style="background-color: #e0f2fe; border-bottom: 2px solid #bae6fd;">
                                            <th align="left" style="padding: 12px 14px; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Rincian Layanan</th>
                                            <th align="center" style="padding: 12px 8px; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; width: 45px;">Qty</th>
                                            <th align="right" style="padding: 12px 12px; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Harga</th>
                                            <th align="right" style="padding: 12px 14px; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsRows}
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- TOTALS CALCULATION -->
                        <tr>
                            <td style="padding: 0 28px 20px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50%" valign="top">
                                            ${invoice.notes ? `
                                            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #475569; line-height: 1.5;">
                                                <strong style="color: #0f172a;">Catatan:</strong><br>${invoice.notes}
                                            </div>
                                            ` : ''}
                                        </td>
                                        <td width="50%" valign="top" align="right">
                                            <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 250px; font-size: 13px; margin-left: auto;">
                                                <tr>
                                                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Subtotal:</td>
                                                    <td style="padding: 4px 0; text-align: right; font-weight: 800; color: #0f172a;">${formatRupiah(invoice.subtotal)}</td>
                                                </tr>
                                                ${(() => {
            const discRate = Number(invoice.discountRate || 0);
            const discVal = Number(invoice.discountAmount || invoice.discount || (discRate > 0 ? Math.round((invoice.subtotal * discRate) / 100) : 0));
            if (discVal > 0 || discRate > 0) {
                return `
                                                        <tr>
                                                            <td style="padding: 4px 0; color: #dc2626; font-weight: 600;">Discount (${discRate}%):</td>
                                                            <td style="padding: 4px 0; text-align: right; font-weight: 800; color: #dc2626;">-${formatRupiah(discVal)}</td>
                                                        </tr>`;
            }
            return '';
        })()}
                                                ${(invoice.tax || invoice.taxAmount) > 0 ? `
                                                <tr>
                                                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">PPN / Pajak (${invoice.taxRate}%):</td>
                                                    <td style="padding: 4px 0; text-align: right; font-weight: 800; color: #0f172a;">+${formatRupiah(invoice.tax || invoice.taxAmount)}</td>
                                                </tr>
                                                ` : ''}
                                                <tr>
                                                    <td colspan="2" style="padding-top: 10px;">
                                                        <div style="background-color: #ecfdf5; border: 1.5px solid #86efac; border-radius: 10px; padding: 10px 14px;">
                                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                <tr>
                                                                    <td style="font-weight: 900; font-size: 12px; color: #166534; text-transform: uppercase;">TOTAL TAGIHAN:</td>
                                                                    <td style="text-align: right; font-weight: 900; font-size: 17px; color: #15803d;">${formatRupiah(invoice.total)}</td>
                                                                </tr>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                                ${invoice.amountPaid > 0 ? `
                                                <tr>
                                                    <td style="padding: 6px 0 2px 0; color: #16a34a; font-weight: 700;">Sudah Dibayar:</td>
                                                    <td style="padding: 6px 0 2px 0; text-align: right; font-weight: 800; color: #16a34a;">-${formatRupiah(invoice.amountPaid)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 4px 0; font-weight: 900; color: #b45309;">SISA TAGIHAN:</td>
                                                    <td style="padding: 4px 0; text-align: right; font-weight: 900; font-size: 15px; color: #b45309;">${formatRupiah(invoice.balance)}</td>
                                                </tr>
                                                ` : ''}
                                                <tr>
                                                    <td colspan="2" align="right" style="padding-top: 14px;">
                                                        <div style="display: inline-block; background-color: #ffffff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 6px 8px; text-align: center; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);">
                                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=2&data=${encodeURIComponent(invoicePublicUrl)}" alt="QR Code Verifikasi" width="85" height="85" style="display: block; margin: 0 auto; border-radius: 6px;">
                                                            <div style="font-size: 9.5px; font-weight: 800; color: #0284c7; margin-top: 3px; letter-spacing: 0.3px; text-transform: uppercase;">
                                                                Scan Verifikasi Sah
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- PAYMENT ACTION & BANK REKENING (SOFT BLUE CYAN HIGHLIGHT) -->
                        <tr>
                            <td style="padding: 0 28px 24px 28px;">
                                
                                ${pakasirLink ? `
                                <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 16px auto;">
                                    <tr>
                                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 4px 16px rgba(2, 132, 199, 0.35);">
                                            <a href="${pakasirLink}" target="_blank" style="font-size: 14px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 30px; display: inline-block; border-radius: 12px; letter-spacing: 0.3px;">
                                                ⚡ BAYAR SEKARANG VIA PAKASIR (QRIS / VA) &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                ` : ''}

                                ${vaNumber ? `
                                <div style="background-color: #f0f9ff; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 14px 20px; text-align: center; margin-bottom: 16px;">
                                    <div style="font-size: 11px; text-transform: uppercase; color: #0369a1; font-weight: 800;">Nomor Virtual Account (${paymentMethodName || 'VA'}):</div>
                                    <div style="font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: 2px; margin-top: 4px;">${vaNumber}</div>
                                </div>
                                ` : ''}

                                <!-- REKENING TRANSFER BANK RESMI -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff; border: 1.5px solid #38bdf8; border-radius: 14px; padding: 18px 22px;">
                                    <tr>
                                        <td>
                                            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0369a1; letter-spacing: 0.6px; margin-bottom: 8px;">
                                                🏛️ REKENING TRANSFER BANK RESMI:
                                            </div>
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                                                <tr>
                                                    <td style="color: #64748b; font-weight: 600; width: 95px; padding: 4px 0;">Bank:</td>
                                                    <td style="font-weight: 800; color: #0f172a; padding: 4px 0;">${settings.bankName || 'BCA'}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #64748b; font-weight: 600; padding: 4px 0;">No. Rekening:</td>
                                                    <td style="font-weight: 900; color: #0284c7; font-size: 17px; letter-spacing: 1px; padding: 4px 0;">
                                                        ${settings.bankAccount || '-'}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #64748b; font-weight: 600; padding: 4px 0;">Atas Nama:</td>
                                                    <td style="font-weight: 800; color: #0f172a; padding: 4px 0;">${settings.bankAccountName || 'Dents Web'}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA BUTTON: BUKA DOKUMEN PDF -->
                                <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 20px auto 0 auto;">
                                    <tr>
                                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);">
                                            <a href="${invoicePublicUrl}" target="_blank" style="font-size: 13.5px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 13px 26px; display: inline-block; border-radius: 12px; letter-spacing: 0.3px;">
                                                📄 Buka &amp; Cetak Faktur PDF Resmi &#8599;
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td style="padding: 22px 28px; text-align: center; font-size: 11.5px; color: #64748b; background-color: #f0f9ff; border-top: 1.5px solid #e0f2fe;">
                                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 13px;">
                                    ${settings.businessName || 'DENTS WEB'} &bull; ${settings.tagline || 'Build Your Digital Presence.'}
                                </div>
                                <div style="color: #475569; margin-bottom: 6px;">
                                    Email: <a href="mailto:${settings.businessEmail || process.env.ADMIN_EMAIL || ''}" style="color: #0284c7; text-decoration: none;">${settings.businessEmail || process.env.ADMIN_EMAIL || ''}</a> | WhatsApp: ${settings.businessPhone || process.env.BUSINESS_PHONE || ''}
                                </div>
                                <div style="color: #94a3b8; font-size: 10.5px;">
                                    Email ini dibuat dan dikirim secara otomatis oleh platform penagihan resmi Dents Web. Dokumen faktur resmi (.PDF) terlampir di email ini.
                                </div>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * GENERATOR EMAIL KUITANSI RESMI (OFFICIAL RECEIPT) BERGAYA SOFT BLUE CYAN AESTHETIC
 * Super Big Upgrade: Ultra High-Contrast Typography & Logo Kanan Atas
 * Dikirim otomatis saat pembayaran lunas (via Webhook Pakasir atau Catat Manual)
 */
function generateReceiptEmailHtml({ invoice, customer, settings, paymentInfo }) {
    const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');
    const receiptPublicUrl = `${siteUrl}/receipt/${invoice.publicId}`;

    const paidDate = paymentInfo?.paidAt || invoice.completed_at || invoice.updatedAt || new Date().toISOString();
    const paymentMethod = paymentInfo?.method || invoice.paymentMethodName || 'Pakasir Payment Gateway';
    const reference = paymentInfo?.reference || invoice.txn_id || invoice.order_id || '-';

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <title>Kwitansi Resmi Pembayaran Lunas #${invoice.number || invoice.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #e6f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    
                    <!-- MAIN CARD: SOFT BLUE CYAN AESTHETIC -->
                    <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; background-image: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #86efac; border-radius: 20px; box-shadow: 0 16px 40px rgba(22, 163, 74, 0.12); overflow: hidden; padding: 0;">
                        
                        <!-- HEADER BAR WITH LOGO IN TOP-RIGHT -->
                        <tr>
                            <td style="padding: 28px 28px 20px 28px; border-bottom: 2px solid #e0f2fe;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <!-- LEFT: AGENCY BRAND & RECEIPT TITLE -->
                                        <td valign="middle" align="left">
                                            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                                                <span style="color: #16a34a;">DENTS</span><span style="color: #0f172a;">WEB</span>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: #15803d; margin-top: 3px; letter-spacing: 0.8px; text-transform: uppercase;">
                                                OFFICIAL PAYMENT RECEIPT
                                            </div>
                                            <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 8px;">
                                                No. Kuitansi: #KW-${invoice.number || invoice.invoiceNumber}
                                            </div>
                                            <div style="margin-top: 6px;">
                                                <span style="display: inline-block; background-color: #dcfce7; color: #15803d; border: 1.5px solid #22c55e; border-radius: 999px; padding: 4px 14px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    ✓ LUNAS / PAID IN FULL
                                                </span>
                                            </div>
                                        </td>

                                        <!-- RIGHT: LOGO AXA DENTSWEB (RESPONSIVE TOP-RIGHT) -->
                                        <td valign="top" align="right" style="width: 70px;">
                                            <img src="${siteUrl}/public/img/axalogo.png" alt="DENTS WEB Logo" width="62" height="62" style="display: block; width: 62px; height: 62px; border-radius: 14px; border: 1.5px solid #86efac; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15); object-fit: cover; margin-left: auto;">
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- CONFIRMATION HERO -->
                        <tr>
                            <td align="center" style="padding: 26px 28px 18px 28px; background-color: #f0fdf4;">
                                <div style="display: inline-block; background-color: #dcfce7; border: 2px solid #22c55e; border-radius: 50%; width: 58px; height: 58px; line-height: 58px; text-align: center; font-size: 26px; margin-bottom: 12px;">
                                    🧾
                                </div>
                                <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 21px; font-weight: 900;">Pembayaran Berhasil Diverifikasi!</h2>
                                <p style="color: #475569; font-size: 13.5px; margin: 0; max-width: 440px; line-height: 1.5;">
                                    Terima kasih, tagihan Anda sebesar <strong style="color: #15803d; font-size: 15px;">${formatRupiah(invoice.total)}</strong> telah terverifikasi lunas secara resmi di platform Dents Web.
                                </p>
                            </td>
                        </tr>

                        <!-- RECEIPT SUMMARY CARD -->
                        <tr>
                            <td style="padding: 16px 28px 24px 28px;">
                                <div style="background-color: #ffffff; border: 1.5px solid #e0f2fe; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.06);">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                                        <tr>
                                            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Diterima Dari:</td>
                                            <td style="padding: 7px 0; font-weight: 800; color: #0f172a; text-align: right;">${customer.companyName || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Metode Pembayaran:</td>
                                            <td style="padding: 7px 0; font-weight: 700; color: #0284c7; text-align: right;">${paymentMethod}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Nomor Referensi:</td>
                                            <td style="padding: 7px 0; font-family: monospace; font-size: 12.5px; text-align: right; color: #334155; font-weight: 700;">${reference}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Waktu Transaksi:</td>
                                            <td style="padding: 7px 0; font-weight: 700; color: #0f172a; text-align: right;">${formatDate(paidDate)}</td>
                                        </tr>
                                        <tr style="border-top: 1.5px solid #f1f5f9;">
                                            <td style="padding: 12px 0 2px 0; font-weight: 900; color: #0f172a; font-size: 13px;">JUMLAH DIBAYAR:</td>
                                            <td style="padding: 12px 0 2px 0; text-align: right; font-weight: 900; font-size: 17px; color: #15803d;">${formatRupiah(invoice.total)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Sisa Tagihan:</td>
                                            <td style="padding: 4px 0; text-align: right; font-weight: 900; color: #16a34a;">Rp 0 (LUNAS)</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" align="right" style="padding-top: 14px; border-top: 1px dashed #e2e8f0;">
                                                <div style="display: inline-block; background-color: #ffffff; border: 1.5px solid #86efac; border-radius: 12px; padding: 6px 8px; text-align: center; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08);">
                                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=2&data=${encodeURIComponent(receiptPublicUrl)}" alt="QR Code Verifikasi" width="85" height="85" style="display: block; margin: 0 auto; border-radius: 6px;">
                                                    <div style="font-size: 9.5px; font-weight: 800; color: #15803d; margin-top: 3px; letter-spacing: 0.3px; text-transform: uppercase;">
                                                        Scan Verifikasi Sah
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>

                        <!-- RECEIPT ACTION BUTTON -->
                        <tr>
                            <td align="center" style="padding: 0 28px 28px 28px;">
                                <table border="0" cellspacing="0" cellpadding="0" align="center">
                                    <tr>
                                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);">
                                            <a href="${receiptPublicUrl}" target="_blank" style="font-size: 14px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 30px; display: inline-block; border-radius: 12px; letter-spacing: 0.3px;">
                                                🧾 BUKA &amp; CETAK KUITANSI RESMI PDF &#8599;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td style="padding: 22px 28px; text-align: center; font-size: 11.5px; color: #64748b; background-color: #f0f9ff; border-top: 1.5px solid #e0f2fe;">
                                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 13px;">
                                    ${settings.businessName || 'DENTS WEB'} &bull; ${settings.tagline || 'Build Your Digital Presence.'}
                                </div>
                                <div style="color: #475569; margin-bottom: 6px;">
                                    Email: <a href="mailto:${settings.businessEmail || process.env.ADMIN_EMAIL || ''}" style="color: #0284c7; text-decoration: none;">${settings.businessEmail || process.env.ADMIN_EMAIL || ''}</a> | WhatsApp: ${settings.businessPhone || process.env.BUSINESS_PHONE || ''}
                                </div>
                                <div style="color: #94a3b8; font-size: 10.5px;">
                                    Kuitansi elektronik ini sah dan diakui sebagai bukti tanda terima pembayaran resmi Dents Web. Dokumen kuitansi resmi (.PDF) terlampir di email ini.
                                </div>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * KIRIM EMAIL INVOICE KE GMAIL KLIEN
 * Melampirkan file resmi Faktur (.PDF) beresolusi tinggi langsung di email.
 * Logo resmi ditampilkan di HTML melalui direct hosted link tanpa menjadi attachment chip axalogo.png.
 */
async function sendInvoiceEmail({ redis, invoice, customer, paymentInfo, targetEmail }) {
    const destination = targetEmail || (customer && customer.email);
    if (!destination) {
        throw new Error('Customer tidak memiliki alamat email yang valid.');
    }

    const { transporter, user, settings } = await getMailTransporter(redis);
    const htmlContent = generateInvoiceEmailHtml({ invoice, customer, settings, paymentInfo });

    // Generate Official Invoice PDF Attachment Buffer
    let attachments = [];
    try {
        const pdfBuffer = await generateInvoicePdfBuffer({ invoice, customer, settings });
        const invNum = invoice.number || invoice.invoiceNumber || 'FAKTUR';
        attachments.push({
            filename: `Invoice_${invNum}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
    } catch (pdfErr) {
        console.error('[INVOICE-PDF] Gagal generate PDF attachment:', pdfErr.message);
    }

    const mailOptions = {
        from: `"${settings.senderName || 'Dents Web Billing'}" <${user}>`,
        to: destination,
        replyTo: settings.businessEmail || user,
        subject: `[Tagihan] Invoice #${invoice.number || invoice.invoiceNumber} dari ${settings.businessName || 'Dents Web'}`,
        attachments: attachments,
        html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId, recipient: destination };
}

/**
 * KIRIM EMAIL KUITANSI LUNAS (RECEIPT) KE GMAIL KLIEN
 * Melampirkan file resmi Kuitansi Pelunasan (.PDF) beresolusi tinggi langsung di email.
 * Logo resmi ditampilkan di HTML melalui direct hosted link tanpa menjadi attachment chip axalogo.png.
 */
async function sendReceiptEmail({ redis, invoice, customer, paymentInfo, targetEmail }) {
    const destination = targetEmail || (customer && customer.email);
    if (!destination) {
        throw new Error('Customer tidak memiliki alamat email yang valid.');
    }

    const { transporter, user, settings } = await getMailTransporter(redis);
    const htmlContent = generateReceiptEmailHtml({ invoice, customer, settings, paymentInfo });

    // Generate Official Receipt PDF Attachment Buffer
    let attachments = [];
    try {
        const pdfBuffer = await generateReceiptPdfBuffer({ invoice, customer, settings, paymentInfo });
        const invNum = invoice.number || invoice.invoiceNumber || 'KWITANSI';
        attachments.push({
            filename: `Receipt_KW-${invNum}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
    } catch (pdfErr) {
        console.error('[RECEIPT-PDF] Gagal generate PDF attachment:', pdfErr.message);
    }

    const mailOptions = {
        from: `"${settings.senderName || 'Dents Web Billing'}" <${user}>`,
        to: destination,
        replyTo: settings.businessEmail || user,
        subject: `[Lunas] Kuitansi Pembayaran #${invoice.number || invoice.invoiceNumber} - ${settings.businessName || 'Dents Web'}`,
        attachments: attachments,
        html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId, recipient: destination };
}

/**
 * GENERATOR EMAIL INSTRUKSI PEMBAYARAN PAKASIR (QRIS / VIRTUAL ACCOUNT / PAYMENT LINK)
 * High-End Soft Blue Cyan Aesthetic, Mobile & Desktop Friendly.
 */
function generatePakasirPaymentEmailHtml({ transaction, customer, settings }) {
    const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/$/, '');
    const clientName = customer?.name || customer?.companyName || transaction.customer_name || 'Klien Terhormat';
    const clientEmail = customer?.email || transaction.customer_email || '-';
    const orderId = transaction.order_id || transaction.id;
    const methodName = transaction.method_name || transaction.method || 'Pakasir Payment';
    const totalAmount = transaction.total_payment || transaction.amount || 0;
    const feeAmount = transaction.fee || 0;
    const baseAmount = transaction.amount || totalAmount;
    const notes = transaction.notes || '-';
    const expiredText = transaction.expired_at ? formatDate(transaction.expired_at) : '1x24 Jam dari pembuatan transaksi';

    // QRIS specific
    const qrString = transaction.qr_string || '';
    const qrImgUrl = qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrString)}` : '';

    // VA specific
    const vaNumber = transaction.va_number || '';

    // Link specific
    const payLink = transaction.payment_link || (transaction.txn_id ? `https://app.pakasir.com/pay-v2/${transaction.txn_id}` : '');

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <title>Instruksi Pembayaran #${orderId} - ${methodName}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #e6f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    
                    <!-- MAIN CARD: SOFT BLUE CYAN AESTHETIC -->
                    <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; background-image: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #bae6fd; border-radius: 20px; box-shadow: 0 16px 40px rgba(2, 132, 199, 0.12); overflow: hidden; padding: 0;">
                        
                        <!-- HEADER WITH LOGO ON TOP RIGHT -->
                        <tr>
                            <td style="padding: 28px 28px 20px 28px; border-bottom: 2px solid #e0f2fe;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <!-- LEFT: BRAND & TITLE -->
                                        <td valign="middle" align="left">
                                            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                                                <span style="color: #0284c7;">DENTS</span><span style="color: #0f172a;">WEB</span>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                                ${settings.tagline || 'Build Your Digital Presence.'}
                                            </div>
                                            <div style="margin-top: 10px;">
                                                <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; border: 1.5px solid #38bdf8; border-radius: 999px; padding: 4px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    💳 INSTRUKSI PEMBAYARAN RESMI
                                                </span>
                                            </div>
                                        </td>
                                        <!-- RIGHT: HOSTED LOGO (NO ATTACHMENT CHIP) -->
                                        <td valign="middle" align="right" style="width: 75px;">
                                            <img src="${siteUrl}/public/img/axalogo.png" alt="DENTS WEB Logo" width="62" height="62" style="display: block; width: 62px; height: 62px; border-radius: 14px; border: 1.5px solid #bae6fd; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15); object-fit: cover; margin-left: auto;">
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- ORDER SUMMARY STRIP -->
                        <tr>
                            <td style="padding: 20px 28px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="font-size: 12px; color: #64748b;">
                                            Order ID: <strong style="color: #0f172a; font-size: 13.5px;">#${orderId}</strong>
                                        </td>
                                        <td style="text-align: right; font-size: 12px; color: #64748b;">
                                            Metode: <strong style="color: #0284c7; font-size: 13px;">${methodName}</strong>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- CLIENT & BILLING INFO -->
                        <tr>
                            <td style="padding: 24px 28px 16px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1.5px solid #e0f2fe; border-radius: 14px; padding: 16px 20px;">
                                    <tr>
                                        <td valign="top" style="width: 50%;">
                                            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">DITUJUKAN KEPADA:</div>
                                            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${clientName}</div>
                                            <div style="font-size: 12.5px; color: #0284c7; font-weight: 600; margin-top: 2px;">${clientEmail}</div>
                                        </td>
                                        <td valign="top" style="width: 50%; text-align: right;">
                                            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">BATAS WAKTU BAYAR:</div>
                                            <div style="font-size: 13px; font-weight: 800; color: #dc2626;">${expiredText}</div>
                                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Otomatis diverifikasi 24/7</div>
                                        </td>
                                    </tr>
                                    ${notes && notes !== '-' ? `
                                    <tr>
                                        <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #e2e8f0; margin-top: 10px;">
                                            <div style="font-size: 11px; color: #64748b; font-weight: 700;">Keperluan / Catatan:</div>
                                            <div style="font-size: 12.5px; color: #334155; margin-top: 2px;">${notes}</div>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </td>
                        </tr>

                        <!-- DYNAMIC PAYMENT METHOD INSTRUCTIONS -->
                        <tr>
                            <td style="padding: 10px 28px 20px 28px;">
                                
                                ${transaction.method === 'qris' ? `
                                <!-- QRIS PAYMENT CARD -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #38bdf8; border-radius: 16px; padding: 22px; text-align: center; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 11px; font-weight: 900; padding: 3px 10px; border-radius: 6px; letter-spacing: 1px; margin-bottom: 12px;">
                                                QRIS STANDAR PEMBAYARAN NASIONAL
                                            </div>
                                            ${qrImgUrl ? `
                                            <div style="background-color: #ffffff; padding: 12px; border-radius: 12px; display: inline-block; border: 1.5px solid #e2e8f0; margin-bottom: 12px;">
                                                <img src="${qrImgUrl}" alt="QRIS Code" width="220" height="220" style="display: block; width: 220px; height: 220px; border-radius: 6px;">
                                            </div>
                                            ` : `
                                            <div style="padding: 20px; color: #64748b;">Kode QRIS dapat dibuka melalui link pembayaran di bawah.</div>
                                            `}
                                            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                                Scan menggunakan aplikasi e-Wallet atau Mobile Banking Anda
                                            </div>
                                            <div style="font-size: 11.5px; color: #64748b; max-width: 420px; margin: 0 auto; line-height: 1.4;">
                                                Mendukung GoPay, OVO, DANA, ShopeePay, LinkAja, BCA Mobile, Livin' Mandiri, BRImo, BNI Mobile, CIMB Octo, dan seluruh aplikasi berlogo QRIS.
                                            </div>
                                            ${payLink ? `
                                            <div style="margin-top: 16px;">
                                                <a href="${payLink}" target="_blank" style="background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 10px 24px; border-radius: 8px; display: inline-block;">
                                                    Buka Halaman Pembayaran QRIS &rarr;
                                                </a>
                                            </div>
                                            ` : ''}
                                        </td>
                                    </tr>
                                </table>
                                ` : ''}

                                ${transaction.method && transaction.method.endsWith('_va') ? `
                                <!-- VIRTUAL ACCOUNT CARD -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #38bdf8; border-radius: 16px; padding: 22px; text-align: center; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);">
                                    <tr>
                                        <td>
                                            <div style="font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                                                NOMOR VIRTUAL ACCOUNT (${methodName}):
                                            </div>
                                            <div style="font-size: 26px; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: #0284c7; letter-spacing: 3px; margin: 10px 0;">
                                                ${vaNumber || '-'}
                                            </div>
                                            <div style="display: inline-block; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 6px 14px; font-size: 12px; color: #0369a1; font-weight: 700;">
                                                Atas Nama: DENTS WEB / Pakasir
                                            </div>
                                            <div style="margin-top: 18px; text-align: left; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
                                                <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Cara Pembayaran via m-Banking / ATM:</div>
                                                <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
                                                    <li>Buka aplikasi Mobile Banking atau kunjungi ATM bank Anda.</li>
                                                    <li>Pilih menu <strong>Transfer &gt; Virtual Account</strong>.</li>
                                                    <li>Masukkan nomor VA di atas: <strong style="color: #0284c7;">${vaNumber}</strong>.</li>
                                                    <li>Pastikan jumlah transfer tepat senilai <strong style="color: #15803d;">${formatRupiah(totalAmount)}</strong>.</li>
                                                </ol>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                ` : ''}

                                ${transaction.method === 'payment_link' || (!transaction.method.endsWith('_va') && transaction.method !== 'qris') ? `
                                <!-- PAYMENT LINK CARD -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #38bdf8; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);">
                                    <tr>
                                        <td>
                                            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
                                                Klik tombol di bawah ini untuk menyelesaikan pembayaran melalui portal resmi Pakasir:
                                            </div>
                                            <table border="0" cellspacing="0" cellpadding="0" align="center">
                                                <tr>
                                                    <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);">
                                                        <a href="${payLink}" target="_blank" style="font-size: 15px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 34px; display: inline-block; border-radius: 12px; letter-spacing: 0.4px;">
                                                            ⚡ BAYAR SEKARANG VIA PAKASIR &rarr;
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="font-size: 11.5px; color: #64748b; margin-top: 14px;">
                                                Pilihan QRIS, Virtual Account, &amp; E-Wallet tersedia di dalam halaman pembayaran.
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                ` : ''}

                            </td>
                        </tr>

                        <!-- FINANCIAL SUMMARY BOX -->
                        <tr>
                            <td style="padding: 0 28px 24px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 20px;">
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Nominal Tagihan:</td>
                                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${formatRupiah(baseAmount)}</td>
                                    </tr>
                                    ${feeAmount > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Biaya Layanan Gateway:</td>
                                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">+${formatRupiah(feeAmount)}</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td colspan="2" style="padding-top: 8px;">
                                            <div style="background-color: #ecfdf5; border: 1.5px solid #86efac; border-radius: 10px; padding: 10px 14px;">
                                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td style="font-weight: 900; font-size: 12px; color: #166534; text-transform: uppercase;">TOTAL YANG HARUS DIBAYAR:</td>
                                                        <td style="text-align: right; font-weight: 900; font-size: 18px; color: #15803d;">${formatRupiah(totalAmount)}</td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- FOOTER & ASSISTANCE -->
                        <tr>
                            <td style="padding: 24px 28px; background-color: #f0fdf4; border-top: 1.5px solid #bbf7d0; text-align: center;">
                                <div style="font-size: 12px; font-weight: 800; color: #15803d; margin-bottom: 4px;">
                                    ✅ Pembayaran Diverifikasi Secara Otomatis
                                </div>
                                <div style="font-size: 11.5px; color: #475569; max-width: 460px; margin: 0 auto; line-height: 1.5;">
                                    Setelah pembayaran berhasil diselesaikan, sistem kami akan langsung mencatat status lunas dan mengirimkan kuitansi resmi ke email Anda.
                                </div>
                                <div style="margin-top: 14px; font-size: 11px; color: #64748b;">
                                    Butuh bantuan? Hubungi WhatsApp kami di <strong style="color: #0284c7;">${settings.businessPhone || process.env.BUSINESS_PHONE || ''}</strong> atau email <strong style="color: #0284c7;">${settings.businessEmail || process.env.ADMIN_EMAIL || ''}</strong>
                                </div>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * KIRIM EMAIL INSTRUKSI PEMBAYARAN PAKASIR KE GMAIL KLIEN
 */
async function sendPakasirPaymentEmail({ redis, transaction, customer, targetEmail }) {
    const destination = targetEmail || (customer && customer.email) || transaction.customer_email;
    if (!destination) {
        throw new Error('Alamat email penerima tidak valid atau tidak diisi.');
    }

    const { transporter, user, settings } = await getMailTransporter(redis);
    const htmlContent = generatePakasirPaymentEmailHtml({ transaction, customer, settings });

    const orderId = transaction.order_id || transaction.id;
    const methodName = transaction.method_name || transaction.method || 'Pakasir';

    const mailOptions = {
        from: `"${settings.senderName || 'Dents Web Billing'}" <${user}>`,
        to: destination,
        replyTo: settings.businessEmail || user,
        subject: `[Instruksi Bayar] Tagihan #${orderId} (${methodName}) - ${settings.businessName || 'Dents Web'}`,
        html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId, recipient: destination };
}

/**
 * GENERATE HTML EMAIL BUKTI PEMBAYARAN LUNAS PAKASIR KE GMAIL KLIEN
 * Desain Glassmorphism Emerald & Soft Blue dengan Logo Hosted axalogo.png
 */
function generatePakasirCompletionEmailHtml({ transaction, customer, settings }) {
    const siteUrl = (settings.siteUrl || 'https://www.dentsweb.my.id').replace(/\/+$/, '');
    const clientName = (customer && customer.name) || transaction.customer_name || 'Klien Dents Web';
    const clientEmail = (customer && customer.email) || transaction.customer_email || '-';
    const orderId = transaction.order_id || transaction.id;
    const txnId = transaction.txn_id || '-';
    const methodName = transaction.method_name || (transaction.method === 'qris' ? 'QRIS Standar Pembayaran Nasional' : transaction.method) || 'Pakasir Payment';
    const totalAmount = transaction.total_payment || transaction.amount || 0;
    const feeAmount = transaction.fee || 0;
    const baseAmount = transaction.amount || totalAmount;
    const notes = transaction.notes || '-';
    const completedDate = transaction.completed_at ? formatDate(transaction.completed_at) : formatDate(new Date());

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <title>Bukti Pembayaran Lunas #${orderId} - ${methodName}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    
                    <!-- MAIN CARD: EMERALD / SOFT CYAN SUCCESS THEME -->
                    <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; background-image: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border: 2px solid #86efac; border-radius: 20px; box-shadow: 0 16px 40px rgba(16, 185, 129, 0.14); overflow: hidden; padding: 0;">
                        
                        <!-- HEADER WITH HOSTED LOGO ON TOP RIGHT -->
                        <tr>
                            <td style="padding: 28px 28px 20px 28px; border-bottom: 2px solid #bbf7d0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <!-- LEFT: BRAND & TITLE -->
                                        <td valign="middle" align="left">
                                            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                                                <span style="color: #0284c7;">DENTS</span><span style="color: #0f172a;">WEB</span>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                                ${settings.tagline || 'Build Your Digital Presence.'}
                                            </div>
                                            <div style="margin-top: 10px;">
                                                <span style="display: inline-block; background-color: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 999px; padding: 4px 12px; font-size: 10.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    ✅ PEMBAYARAN BERHASIL DITERIMA &amp; LUNAS
                                                </span>
                                            </div>
                                        </td>
                                        <!-- RIGHT: HOSTED LOGO (NO ATTACHMENT CHIP) -->
                                        <td valign="middle" align="right" style="width: 75px;">
                                            <img src="${siteUrl}/public/img/axalogo.png" alt="DENTS WEB Logo" width="62" height="62" style="display: block; width: 62px; height: 62px; border-radius: 14px; border: 1.5px solid #86efac; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.18); object-fit: cover; margin-left: auto;">
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- HERO BANNER: GREEN CHECKMARK & THANKS -->
                        <tr>
                            <td style="padding: 24px 28px 16px 28px; text-align: center; background-color: #f0fdf4; border-bottom: 1px solid #dcfce7;">
                                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 28px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); margin-bottom: 12px;">
                                    ✓
                                </div>
                                <div style="font-size: 19px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">
                                    Terima Kasih! Pembayaran Telah Dikonfirmasi
                                </div>
                                <div style="font-size: 12.5px; color: #475569; max-width: 460px; margin: 0 auto; line-height: 1.5;">
                                    Transaksi pembayaran Anda telah kami terima dan diverifikasi secara sah. Berikut adalah rincian bukti transaksi resmi Anda:
                                </div>
                            </td>
                        </tr>

                        <!-- ORDER DETAIL STRIP -->
                        <tr>
                            <td style="padding: 18px 28px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="font-size: 12px; color: #64748b;">
                                            Order ID: <strong style="color: #0f172a; font-size: 13.5px;">#${orderId}</strong>
                                        </td>
                                        <td style="text-align: right; font-size: 12px; color: #64748b;">
                                            Status: <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-weight: 900; font-size: 11px; padding: 2px 10px; border-radius: 6px; border: 1px solid #86efac;">LUNAS / COMPLETED</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 6px; font-size: 11.5px; color: #64748b;">
                                            ID Transaksi Gateway: <strong style="color: #0284c7; font-family: monospace;">${txnId}</strong>
                                        </td>
                                        <td style="padding-top: 6px; text-align: right; font-size: 11.5px; color: #64748b;">
                                            Tanggal Lunas: <strong style="color: #0f172a;">${completedDate}</strong>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- CLIENT & BILLING INFO -->
                        <tr>
                            <td style="padding: 20px 28px 14px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1.5px solid #dcfce7; border-radius: 14px; padding: 16px 20px;">
                                    <tr>
                                        <td valign="top" style="width: 50%;">
                                            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">DIBAYARKAN OLEH:</div>
                                            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${clientName}</div>
                                            <div style="font-size: 12.5px; color: #0284c7; font-weight: 600; margin-top: 2px;">${clientEmail}</div>
                                        </td>
                                        <td valign="top" style="width: 50%; text-align: right;">
                                            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">METODE PEMBAYARAN:</div>
                                            <div style="font-size: 13.5px; font-weight: 800; color: #047857;">${methodName}</div>
                                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Verifikasi Gateway Realtime</div>
                                        </td>
                                    </tr>
                                    ${notes && notes !== '-' ? `
                                    <tr>
                                        <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #e2e8f0; margin-top: 10px;">
                                            <div style="font-size: 11px; color: #64748b; font-weight: 700;">Keperluan / Catatan Transaksi:</div>
                                            <div style="font-size: 12.5px; color: #334155; margin-top: 2px;">${notes}</div>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </td>
                        </tr>

                        <!-- FINANCIAL SUMMARY BOX -->
                        <tr>
                            <td style="padding: 0 28px 20px 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 20px;">
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Nominal Tagihan:</td>
                                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${formatRupiah(baseAmount)}</td>
                                    </tr>
                                    ${feeAmount > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Biaya Layanan Gateway:</td>
                                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">+${formatRupiah(feeAmount)}</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td colspan="2" style="padding-top: 8px;">
                                            <div style="background-color: #ecfdf5; border: 1.5px solid #86efac; border-radius: 10px; padding: 12px 16px;">
                                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td style="font-weight: 900; font-size: 12px; color: #166534; text-transform: uppercase;">TOTAL TELAH DIBAYAR (LUNAS):</td>
                                                        <td style="text-align: right; font-weight: 900; font-size: 20px; color: #15803d;">${formatRupiah(totalAmount)}</td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- OFFICIAL VERIFICATION BADGE BOX -->
                        <tr>
                            <td style="padding: 0 28px 24px 28px;">
                                <div style="background-color: #ffffff; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; text-align: center;">
                                    <div style="font-size: 12px; font-weight: 800; color: #15803d; margin-bottom: 3px;">
                                        🛡️ BUKTI PEMBAYARAN SAH &amp; TERVERIFIKASI SISTEM
                                    </div>
                                    <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                                        Dokumen ini diterbitkan secara elektronik oleh sistem Dents Web dan berlaku sebagai bukti penerimaan pembayaran yang sah.
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <!-- FOOTER & ASSISTANCE -->
                        <tr>
                            <td style="padding: 24px 28px; background-color: #f0fdf4; border-top: 1.5px solid #bbf7d0; text-align: center;">
                                <div style="font-size: 12px; font-weight: 800; color: #15803d; margin-bottom: 4px;">
                                    ✅ Layanan &amp; Pesanan Anda Sedang / Siap Diproses
                                </div>
                                <div style="font-size: 11.5px; color: #475569; max-width: 460px; margin: 0 auto; line-height: 1.5;">
                                    Terima kasih telah mempercayakan proyek dan transaksi Anda kepada Dents Web. Tim kami siap memberikan layanan terbaik untuk kesuksesan digital Anda.
                                </div>
                                <div style="margin-top: 14px; font-size: 11px; color: #64748b;">
                                    Ada pertanyaan? Hubungi kami via WhatsApp <strong style="color: #0284c7;">${settings.businessPhone || process.env.BUSINESS_PHONE || ''}</strong> atau email <strong style="color: #0284c7;">${settings.businessEmail || process.env.ADMIN_EMAIL || ''}</strong>
                                </div>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * KIRIM EMAIL BUKTI PEMBAYARAN LUNAS PAKASIR KE GMAIL KLIEN
 */
async function sendPakasirCompletionEmail({ redis, transaction, customer, targetEmail }) {
    const destination = targetEmail || (customer && customer.email) || transaction.customer_email;
    if (!destination) {
        throw new Error('Alamat email penerima tidak valid atau tidak diisi.');
    }

    const { transporter, user, settings } = await getMailTransporter(redis);
    const htmlContent = generatePakasirCompletionEmailHtml({ transaction, customer, settings });

    const orderId = transaction.order_id || transaction.id;
    const methodName = transaction.method_name || (transaction.method === 'qris' ? 'QRIS' : transaction.method) || 'Pakasir';

    const mailOptions = {
        from: `"${settings.senderName || 'Dents Web Billing'}" <${user}>`,
        to: destination,
        replyTo: settings.businessEmail || user,
        subject: `[Pembayaran Berhasil] Bukti Pembayaran #${orderId} (${methodName}) - ${settings.businessName || 'Dents Web'}`,
        html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId, recipient: destination };
}

module.exports = {
    formatRupiah,
    formatDate,
    checkOverdue,
    getInvoiceSettings,
    saveInvoiceSettings,
    getMailTransporter,
    testSmtpConnection,
    generateInvoicePdfBuffer,
    generateReceiptPdfBuffer,
    generateInvoiceEmailHtml,
    generateReceiptEmailHtml,
    generatePakasirPaymentEmailHtml,
    generatePakasirCompletionEmailHtml,
    sendInvoiceEmail,
    sendReceiptEmail,
    sendPakasirPaymentEmail,
    sendPakasirCompletionEmail
};