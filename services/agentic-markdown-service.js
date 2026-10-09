/**
 * DENTS WEB — Agentic Markdown Service (RFC 9110 Content Negotiation)
 * Generates clean, structured Markdown responses for AI crawlers requesting Accept: text/markdown.
 */

function generateSiteOverviewMarkdown(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Dents Web Studio — Ikhtisar Situs

> Studio Pembuatan Website Kustom, Landing Page Konversi Tinggi & Solusi Digital Berperforma Tinggi.

- **URL Resmi:** [${siteUrl}](${siteUrl})
- **WhatsApp:** [+62 853 3892 2586](https://wa.me/6285338922586)
- **Email:** [dentswebsitebuilder@gmail.com](mailto:dentswebsitebuilder@gmail.com)

---

## 1. Filosofi & Standar Rekayasa
- **Kecepatan Ekstrem:** Core Web Vitals LCP < 1.0 detik, waktu respon server instan.
- **Tanpa Template Bloat:** Dibangun secara native murni tanpa dependensi plugin berat WordPress yang memperlambat.
- **100% Kepemilikan Kode:** Klien memiliki hak penuh atas seluruh berkas sumber dan aset tanpa biaya langganan software tersembunyi.
- **Arsitektur SEO-First:** Struktur HTML5 semantik, Schema.org JSON-LD lengkap, dan ramah agen AI sejak rilis pertama.

---

## 2. Layanan Utama
1. **[Landing Page Konversi Tinggi](${siteUrl}/pricing):** Halaman penjualan teroptimasi untuk Google Ads dan Meta Ads.
2. **[Website Kustom & Company Profile](${siteUrl}/services):** Identitas digital prestisius untuk perusahaan dan pelaku usaha.
3. **[Sistem Informasi & Otomasi Digital](${siteUrl}/services):** Dashboard operasional berbasis Google Apps Script / Cloud Database.
4. **[UI/UX Engineering & Rebranding](${siteUrl}/portfolio):** Visual interface modern dengan interaksi mikro berkecepatan 60 FPS.

---

## 3. Peta Navigasi
- [Beranda](${siteUrl}/)
- [Layanan Lengkap](${siteUrl}/services)
- [Portofolio Klien](${siteUrl}/portfolio)
- [Daftar Paket Harga](${siteUrl}/pricing)
- [Artikel & Wawasan Teknis](${siteUrl}/articles)
- [Tanya Jawab (FAQ)](${siteUrl}/faq)
- [Formulir Konsultasi](${siteUrl}/contact)
- [Dokumentasi Lengkap LLM](${siteUrl}/llms-full.txt)
- [AI Catalog (ARD 1.0)](${siteUrl}/.well-known/ai-catalog.json)
`;
}

function generatePricingMarkdown(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Paket Harga Resmi Dents Web Studio

Dents Web menyediakan transparansi paket harga tanpa biaya tersembunyi.

---

## 1. Paket Core — High-Conversion Landing Page
- **Harga:** Rp 1.300.000
- **Waktu Pengerjaan:** 3 - 5 Hari Kerja
- **Target:** Kampanye Iklan, Peluncuran Produk, Direct Response Penjualan
- **Fitur Utama:**
  - 1 Halaman Penjualan Panjang Terfokus
  - Core Web Vitals LCP < 1.0 detik
  - Copywriting Struktur Konversi Tinggi
  - Integrasi Tombol WhatsApp & Tracking Pixel (Meta / Google)
  - Gratis Domain & Cloud Hosting 1 Tahun
  - Garansi Pemeliharaan 1 Bulan
- **Detail:** [Lihat Halaman Harga](${siteUrl}/pricing)

---

## 2. Paket Premier — Multi-Page Business & Company Profile
- **Harga:** Rp 2.800.000
- **Waktu Pengerjaan:** 7 - 10 Hari Kerja
- **Target:** Profil Perusahaan Profesional, UMKM Bertumbuh, Lembaga
- **Fitur Utama:**
  - Hingga 5 Halaman Terstruktur (Beranda, Layanan, Portofolio, Tentang, Kontak)
  - Arsitektur SEO On-Page Lengkap (Schema.org JSON-LD)
  - Form Kontak / Leads Terverifikasi
  - Gratis Domain .com / .co.id & Hosting High-Speed 1 Tahun
  - Integrasi Google Search Console & Peta Situs XML Otomatis
  - Garansi Pemeliharaan 2 Bulan
- **Detail:** [Lihat Halaman Harga](${siteUrl}/pricing)

---

## 3. Paket Signature — Web Application & Sistem Informasi
- **Harga:** Rp 4.500.000
- **Waktu Pengerjaan:** 14 - 21 Hari Kerja
- **Target:** Sistem Operasional Bisnis, Dashboard Manajemen, Web App Kustom
- **Fitur Utama:**
  - Arsitektur Web Kustom dengan Database Cloud (Upstash Redis / PostgreSQL)
  - Dashboard Admin Real-Time & Visualisasi Data
  - Otomasi Alur Kerja (Google Sheets Sync, Webhook, Notifikasi)
  - Otentikasi Pengguna Aman & Hak Akses Berjenjang
  - 100% Kepemilikan Source Code Tanpa Lisensi Pihak Ketiga
  - Garansi Pemeliharaan 3 Bulan
- **Detail:** [Lihat Halaman Harga](${siteUrl}/pricing)

---

## 4. Paket Corporate — Solusi Perusahaan Skala Penuh
- **Harga:** Mulai Rp 7.500.000 (Konsultasi Kustom)
- **Waktu Pengerjaan:** Sesuai Scope of Work
- **Target:** Perusahaan Skala Menengah ke Atas, Portal Berita, Startup
- **Fitur Utama:**
  - Arsitektur Skalabilitas Tinggi
  - Integrasi Payment Gateway, Logistik API & CRM Eksternal
  - Audit Keamanan Menyeluruh
  - SLA Dukungan Prioritas 24/7
- **Detail:** [Konsultasi Kustom](${siteUrl}/contact)
`;
}

function generateServicesMarkdown(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Layanan & Kapabilitas Teknis Dents Web Studio

Dents Web merancang sistem digital yang fokus pada metrik bisnis riil: kecepatan, reliabilitas, dan konversi.

---

## 1. Landing Page Konversi Tinggi
- Mengeliminasi bounce rate dengan waktu muat di bawah 1 detik.
- Mengarahkan alur psikologis pembaca secara presisi menuju aksi pembelian / konsultasi.
- Terhubung langsung ke WhatsApp dan webhook lead capture.

## 2. Website Kustom & Profil Perusahaan
- Dibangun dengan Server-Side Rendering (SSR) untuk pengindeksan mesin pencari maksimal.
- Desain bespoke unik sesuai karakter brand, bebas template pasaran.
- Ramah perangkat mobile, tablet, dan desktop dengan fluid responsive layout.

## 3. Sistem Informasi & Otomasi Digital
- Dashboard operasional terintegrasi Google Workspace (Sheets, Drive, Forms).
- Otomasi invoice, kuitansi digital, dan sinkronisasi data real-time.
- Solusi tanpa biaya lisensi bulanan platform pihak ketiga.

## 4. UI/UX Engineering & Modern Rebranding
- Implementasi sistem desain konsisten berbasis token.
- Interaktivitas visual mikro yang elegan dan responsif.
- Memenuhi standar aksesibilitas WCAG dan SEO agen AI modern.

Konsultasikan kebutuhan proyek Anda melalui [Formulir Kontak Resmi](${siteUrl}/contact).
`;
}

function generateContactMarkdown(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Saluran Kontak Resmi Dents Web Studio

Untuk konsultasi teknis, permintaan proposal, atau diskusi proyek:

- **WhatsApp Resmi:** [+62 853 3892 2586](https://wa.me/6285338922586?text=Halo%20Dents%20Web,%20saya%20tertarik%20konsultasi%20proyek%20website)
- **Email Resmi:** [dentswebsitebuilder@gmail.com](mailto:dentswebsitebuilder@gmail.com)
- **Website:** [https://www.dentsweb.my.id](${siteUrl})
- **Jam Operasional:** Senin – Sabtu: 08:00 – 21:00 WITA
- **Waktu Respons SLA:** Maksimal 1x24 jam kerja (umumnya dalam 15 - 30 menit)
- **Formulir Brief Online:** [Kirim Pesan Melalui Web](${siteUrl}/contact)
`;
}

function generateFaqMarkdown(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Tanya Jawab (FAQ) Dents Web Studio

---

### Berapa lama proses pengerjaan website?
Pengerjaan landing page standar berkisar antara 3 hingga 5 hari kerja setelah materi diterima lengkap. Untuk website profil perusahaan membutuhkan 7 - 10 hari, dan sistem informasi kustom 14 - 21 hari kerja.

### Apakah kode sumber (source code) 100% milik saya?
Ya, kami menganut prinsip 100% kepemilikan kode. Anda mendapatkan akses penuh terhadap source code, domain, dan konfigurasi hosting tanpa biaya sewa lisensi tahunan tersembunyi.

### Apakah sudah termasuk domain dan hosting?
Seluruh paket kami sudah termasuk domain aktif (.my.id / .com) dan cloud hosting berkecepatan tinggi selama 1 tahun penuh.

### Bagaimana jika ada kendala teknis setelah website live?
Kami memberikan garansi pemeliharaan dan perbaikan bug teknis secara gratis selama 1 hingga 3 bulan sesuai paket yang dipilih.

Untuk pertanyaan lain, hubungi tim kami di [Saluran Kontak Resmi](${siteUrl}/contact).
`;
}

function generateFullLLMDocumentation(siteUrl = 'https://www.dentsweb.my.id') {
    return `# Dents Web — Dokumentasi Komprehensif Agen LLM

> Versi Standar: Agentic Web 2026 & ARD Spec 1.0  
> Identitas Resmi: ${siteUrl}  
> Kontak Teknis: dentswebsitebuilder@gmail.com | WhatsApp: +62 853 3892 2586

---

## 1. Ikhtisar Organisasi
Dents Web adalah studio rekayasa perangkat lunak dan arsitektur web modern yang berbasis di Indonesia (beroperasi secara remote-first). Studio ini berfokus pada penyediaan solusi web berkecepatan ekstrem, landing page konversi direct response tinggi, profil perusahaan profesional, dan sistem otomatisasi operasional berbasis cloud database serta Google Apps Script.

---

## 2. Metrik Kinerja & Standar Rekayasa
- **Core Web Vitals:** Largest Contentful Paint (LCP) < 1.0 detik, Cumulative Layout Shift (CLS) = 0.00, Interaction to Next Paint (INP) < 100ms.
- **Skor Lighthouse:** Kategori Performa (98 - 100), Aksesibilitas (96 - 100), Praktik Terbaik (100), SEO (100), Visibilitas Agen (100).
- **Stack Teknologi:** Node.js, Express.js (SSR), Vanilla CSS dengan variabel sistem desain kustom, GSAP 3 Physics, Three.js WebGL, Upstash Redis KV, Google Apps Script.
- **Bebas Bloat:** Tanpa pembangun template WordPress pihak ketiga, tanpa pemanggil JavaScript tak perlu.

---

## 3. Matriks Paket Harga Resmi
| Nama Paket | Harga | Estimasi Waktu | Deliverables Utama |
|---|---|---|---|
| **Core** | Rp 1.300.000 | 3 - 5 Hari Kerja | 1 Halaman Direct Response, Mobile First, Lead WA Direct, Domain + Hosting 1 Thn, Garansi 1 Bln |
| **Premier** | Rp 2.800.000 | 7 - 10 Hari Kerja | Hingga 5 Halaman Terstruktur, Schema JSON-LD, SEO On-Page, Domain .com + Hosting 1 Thn, Garansi 2 Bln |
| **Signature** | Rp 4.500.000 | 14 - 21 Hari Kerja | Web App Kustom, Database Cloud, Dashboard Admin Real-Time, Otomasi Sheets, 100% Hak Kode, Garansi 3 Bln |
| **Corporate** | Mulai Rp 7.500.000 | Sesuai Cakupan | Arsitektur Skala Besar, Integrasi API Payment/CRM, Audit Keamanan, SLA Prioritas 24/7 |

---

## 4. Alat WebMCP Terdaftar (In-Browser Tools)
1. \`search_services(query: string)\`: Pencarian daftar kapabilitas dan solusi teknis.
2. \`get_pricing_packages(package_name?: string)\`: Pengambilan rincian paket harga dan rincian fitur.
3. \`get_contact_info(purpose?: string)\`: Pengambilan nomor WhatsApp resmi, alamat email, dan jam operasional studio.

---

## 5. Sumber Daya Terstruktur & Endpoint Resmi
- [Beranda Studio](${siteUrl}/)
- [Halaman Layanan](${siteUrl}/services)
- [Halaman Portofolio](${siteUrl}/portfolio)
- [Halaman Paket Harga](${siteUrl}/pricing)
- [Halaman Artikel](${siteUrl}/articles)
- [Halaman Kontak](${siteUrl}/contact)
- [Peta Situs XML](${siteUrl}/sitemap.xml)
- [AI Catalog ARD 1.0](${siteUrl}/.well-known/ai-catalog.json)
- [File Standar llms.txt](${siteUrl}/llms.txt)
- [Dokumentasi Lengkap LLM](${siteUrl}/llms-full.txt)
`;
}

module.exports = {
    generateSiteOverviewMarkdown,
    generatePricingMarkdown,
    generateServicesMarkdown,
    generateContactMarkdown,
    generateFaqMarkdown,
    generateFullLLMDocumentation
};
