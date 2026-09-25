require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy for Vercel
app.set('trust proxy', 1);

// HTTP Response Compression (Gzip / Brotli)
app.use(compression());

// Initialize Upstash Redis
const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Direct Browser Asset Protection: Block direct URL browsing to private assets (/public/css, /public/js)
// When accessed directly via address bar, returns customized 404.ejs with status 404
// Subresource requests (<link rel="stylesheet">, <script src="...">) pass through transparently
app.use(['/public/css', '/public/js'], async (req, res, next) => {
    const secFetchDest = req.headers['sec-fetch-dest'];
    const secFetchMode = req.headers['sec-fetch-mode'];
    const accept = req.headers['accept'] || '';

    const isDirectNavigation = 
        secFetchDest === 'document' || 
        secFetchMode === 'navigate' || 
        (!secFetchDest && accept.includes('text/html'));

    if (isDirectNavigation) {
        try {
            const settings = await getGlobalSettings();
            return res.status(404).render('404', {
                settings,
                seo: buildSEO(settings, {
                    title: '404 - Halaman Tidak Ditemukan | Dents Web',
                    desc: 'Aset ini dilindungi dan tidak dapat diakses langsung via peramban.',
                    path: req.originalUrl || req.path
                })
            });
        } catch (e) {
            return res.status(404).send('404 Not Found');
        }
    }
    next();
});

// Static assets with cache-control headers (7 days) for high Google PageSpeed score
app.use('/public', express.static(path.join(process.cwd(), 'public'), {
    maxAge: '7d',
    etag: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security Headers & Content Security Policy (allows Google Fonts, Google Analytics 4, GTM & Vercel Speed Insights)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://va.vercel-scripts.com",
                "https://www.googletagmanager.com",
                "https://*.google-analytics.com",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https://*"], 
            connectSrc: [
                "'self'", 
                "https://va.vercel-scripts.com", 
                "https://vitals.vercel-insights.com",
                "https://*.google-analytics.com",
                "https://analytics.google.com",
                "https://*.analytics.google.com",
                "https://*.googletagmanager.com",
                "https://app.pakasir.com"
            ]
        }
    },
    xPoweredBy: false
}));

// Rate Limiters
const isLocalOrInternal = (req) => {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) return true;
    const p = req.path || req.url || '';
    if (p.startsWith('/admin') || p.startsWith('/api/admin') || p.startsWith('/api/chat/messages') || p.startsWith('/api/webhook/pakasir') || p.startsWith('/webhook-') || p.startsWith('/test-login') || p.startsWith('/api/webhook-') || p === '/sitemap.xml' || p === '/robots.txt' || p.startsWith('/google')) return true;
    return false;
};

const publicLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 2500, 
    message: 'Terlalu banyak permintaan.',
    skip: isLocalOrInternal
});
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Terlalu banyak percobaan login.' });
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Terlalu banyak form yang dikirim.' });
app.use(publicLimiter); 

// Global Initial Seed Data
async function ensureSeedData() {
    try {
        const [services, pricing, faq, testimonials, portfolio, articles] = await Promise.all([
            redis.get('dents:services'),
            redis.get('dents:pricing'),
            redis.get('dents:faq'),
            redis.get('dents:testimonials'),
            redis.get('dents:portfolio'),
            redis.get('dents:articles')
        ]);

        const INITIAL_SERVICES_4_TIERS = [
            {
                id: 'srv_1',
                title: 'Starter — Web Form & Otomasi Google Apps Script',
                slug: 'starter-web-automation',
                icon: 'cpu',
                shortDescription: 'Website 1-3 halaman terintegrasi Google Sheets tanpa biaya sewa hosting bulanan.',
                description: 'Solusi digitalisasi hemat biaya memanfaatkan infrastruktur cloud Google. Data formulir pendaftaran, pesanan, atau inventaris langsung masuk ke Google Sheets Anda secara real-time.',
                features: ['1 - 3 Halaman & 1 - 4 Section', 'Database Realtime Google Sheets', 'Integrasi Direct WhatsApp & Maps', 'Zero Server Fee Selamanya', 'Pengerjaan Cepat 2 - 4 Hari'],
                startingPrice: 'Rp 500.000',
                order: 1,
                isFeatured: false,
                isPublished: true
            },
            {
                id: 'srv_2',
                title: 'Business — High-Converting Landing Page',
                slug: 'landing-page',
                icon: 'globe',
                shortDescription: 'Website 1-6 halaman terintegrasi fokus closing tinggi yang siap dihubungkan ke iklan Meta Ads dan Google Ads.',
                description: 'Website 1 - 6 halaman (atau sales page panjang) dengan copywriting persuasif dan kecepatan loading di bawah 1 detik untuk memaksimalkan hasil belanja iklan Anda.',
                features: ['1 - 6 Halaman Responsif (Sales Page)', 'Core Web Vitals Skor 95+', 'WhatsApp Direct Click', 'Domain, Hosting & SSL Gratis 1 Thn', 'Pengerjaan Cepat 3 - 5 Hari'],
                startingPrice: 'Rp 1.500.000',
                order: 2,
                isFeatured: false,
                isPublished: true
            },
            {
                id: 'srv_3',
                title: 'Pro — Corporate Company Profile',
                slug: 'company-profile',
                icon: 'layers',
                shortDescription: 'Website profil perusahaan multi-halaman berwibawa dengan CMS mandiri dan optimasi SEO Google.',
                description: 'Bangun otoritas bisnis Anda di hadapan klien dan investor dengan website 5-8 halaman berstandar internasional, dilengkapi CMS mandiri dan email bisnis resmi.',
                features: ['5 - 8 Halaman Dinamis', 'Panel Admin / CMS Mandiri', 'Google SEO Schema Gold Standard', 'Hingga 1 Email Bisnis Resmi (@perusahaan.com)', 'Garansi 30 Hari & Tutorial Admin'],
                startingPrice: 'Rp 3.500.000',
                order: 3,
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'srv_4',
                title: 'Custom+ — Web Application & Sistem Bisnis',
                slug: 'web-app',
                icon: 'cpu',
                shortDescription: 'Aplikasi web khusus sesuai alur SOP bisnis dengan database cloud dan multi-role user.',
                description: 'Solusi pengembangan web 10-12 halaman terintegrasi untuk kasir web, sistem reservasi, portal karyawan, atau dashboard analitik operasional perusahaan.',
                features: ['10 - 12 Halaman Alur Khusus', 'Multi-Role User & Hak Akses', 'Database Cloud PostgreSQL/Redis', 'Integrasi API & Payment Gateway', '100% Hak Milik Source Code'],
                startingPrice: 'Rp 7.500.000+',
                order: 4,
                isFeatured: false,
                isPublished: true
            }
        ];

        const INITIAL_PRICING_4_TIERS = [
            {
                id: 'price_1',
                name: 'Starter — Web Form & Otomasi (GAS)',
                price: 'Rp 500.000',
                description: 'Website 1 - 3 halaman dan 1 - 4 section ringkas dengan integrasi database Google Sheets tanpa biaya hosting selamanya.',
                features: [
                    '1 - 3 Halaman Responsif',
                    '1 - 4 Section Fokus Konversi',
                    'Database Realtime Google Sheets',
                    'Integrasi Direct WhatsApp & Maps',
                    'Nol Biaya Server / Hosting Selamanya',
                    'Pengerjaan Cepat 2 - 4 Hari Kerja'
                ],
                limitations: [
                    'Cold Start: Butuh 1-2 detik saat dibuka pertama kali',
                    'Batas Kuota Google: Eksekusi maks. 6 menit per proses',
                    'Bukan untuk checkout ribuan user bersamaan'
                ],
                isFeatured: false,
                isPublished: true,
                order: 1
            },
            {
                id: 'price_2',
                name: 'Business — High-Converting Landing Page',
                price: 'Rp 1.500.000',
                description: 'Landing page 1 - 6 halaman terintegrasi yang dirancang khusus untuk mengubah pengunjung iklan menjadi pembeli.',
                features: [
                    '1 - 6 Halaman Responsif (Sales Page)',
                    'Struktur Psikologi Closing & Copywriting',
                    'Core Web Vitals Skor 95+ (Super Cepat)',
                    'Gratis Domain (.com/.my.id) & SSL 1 Tahun',
                    'High-Speed SSD Cloud Hosting 1 Tahun',
                    'Direct WhatsApp Button Teks Otomatis',
                    'Pengerjaan 3 - 5 Hari Kerja (Garansi 14 Hari)'
                ],
                isFeatured: false,
                isPublished: true,
                order: 2
            },
            {
                id: 'price_3',
                name: 'Pro — Corporate Company Profile',
                price: 'Rp 3.500.000',
                description: 'Website profil bisnis multi-halaman berwibawa dengan CMS mandiri dan optimasi SEO Google untuk reputasi perusahaan.',
                features: [
                    '5 - 8 Halaman Dinamis Premium',
                    'Panel Admin / CMS Mandiri (Edit Tanpa Koding)',
                    'Gratis Domain (.com/.id/.co.id) & Cloud Host 1 Thn',
                    'Hingga 1 Email Bisnis Resmi (@perusahaan.com)',
                    'Dynamic Schema Google SEO & Sitemap XML',
                    'Formulir Leads Masuk & Google Maps Interaktif',
                    'Proteksi Keamanan SSL & Firewall Tingkat Lanjut',
                    'Garansi Bug-Free 30 Hari & Video Tutorial Admin'
                ],
                isFeatured: true,
                isPublished: true,
                order: 3
            },
            {
                id: 'price_4',
                name: 'Custom+ — Web Application & Sistem Bisnis',
                price: 'Rp 7.500.000+',
                description: 'Sistem web aplikasi khusus untuk operasional bisnis, kasir web, reservasi, portal data, dan integrasi database cloud.',
                features: [
                    '10 - 12 Halaman Terintegrasi Sesuai SOP',
                    'Full-Stack Software Architecture (Node.js/Cloud DB)',
                    'Database Terdedikasi (PostgreSQL / Redis / MySQL)',
                    'Multi-Role User Privilege (Admin, Staf, Klien)',
                    'Integrasi API Pihak Ketiga (Payment Gateway/WA API)',
                    'Laporan Otomatis & Ekspor Data (PDF/Excel)',
                    '100% Hak Milik Source Code & Dokumentasi',
                    'Dedicated Developer SLA Prioritas 60 Hari'
                ],
                isFeatured: false,
                isPublished: true,
                order: 4
            }
        ];

        if (!services || !services.length) {
            await redis.set('dents:services', INITIAL_SERVICES_4_TIERS);
        }

        if (!pricing || !pricing.length) {
            await redis.set('dents:pricing', INITIAL_PRICING_4_TIERS);
        }

        const INITIAL_8_FAQS = [
            {
                id: 'faq_1',
                question: 'Berapa lama waktu pengerjaan proyek?',
                answer: 'Untuk tier Starter (Web Form GAS) pengerjaan berkisar 2–4 hari kerja. Business (Landing Page) memakan waktu 3–5 hari kerja. Pro (Company Profile) membutuhkan 7–14 hari kerja, dan Custom+ (Web Application) berkisar 2–4 minggu kerja tergantung pada kompleksitas fitur dan kesiapan materi brief.',
                order: 1,
                isPublished: true
            },
            {
                id: 'faq_2',
                question: 'Apakah ada biaya revisi?',
                answer: 'Tidak ada biaya tambahan selama revisi masih dalam koridor ruang lingkup (scope) paket yang disepakati di awal. Kami memberikan garansi revisi minor gratis (1–2 kali putaran) hingga desain dan fungsionalitas disetujui.',
                order: 2,
                isPublished: true
            },
            {
                id: 'faq_3',
                question: 'Domain dan hosting sudah termasuk dalam paket?',
                answer: 'Ya, untuk paket Business, Pro, dan Custom+, domain kustom (.com / .id / .my.id) dan cloud hosting berkecepatan tinggi dengan proteksi sertifikat SSL sudah termasuk gratis untuk 1 tahun pertama. Untuk Starter GAS, gratis hosting via Google Cloud / Vercel selamanya tanpa biaya server.',
                order: 3,
                isPublished: true
            },
            {
                id: 'faq_4',
                question: 'Bagaimana cara memulai proyek bersama DentsWeb?',
                answer: 'Cukup hubungi kami melalui tombol WhatsApp atau form Live Chat di pojok kiri bawah. Tim DentsWeb akan mendengarkan kebutuhan bisnis Anda, memberikan estimasi harga transparan, lalu memulai tahap perancangan setelah kesepakatan DP.',
                order: 4,
                isPublished: true
            },
            {
                id: 'faq_5',
                question: 'Apakah bisa request fitur di luar paket yang ada?',
                answer: 'Tentu saja bisa. Anda dapat memilih paket terdekat lalu menambahkan fitur kustom (add-ons), atau langsung memesan paket Custom+ untuk membangun arsitektur sistem bisnis spesifik sesuai Standar Operasional Prosedur (SOP) perusahaan Anda.',
                order: 5,
                isPublished: true
            },
            {
                id: 'faq_6',
                question: 'Metode pembayaran apa yang tersedia?',
                answer: 'Kami menerima transfer bank lokal (BCA, Mandiri, BNI, BRI), QRIS, serta e-wallet. Skema pembayaran pada umumnya adalah sistem DP 50% di awal sebagai tanda jadi pengerjaan dan pelunasan 50% setelah website selesai diuji dan siap serah terima (live).',
                order: 6,
                isPublished: true
            },
            {
                id: 'faq_7',
                question: 'Apakah saya akan mendapatkan source code proyeknya?',
                answer: 'Ya, 100% hak milik penuh atas source code, basis data, dan akun domain menjadi milik Anda setelah pelunasan. Kami tidak menerapkan sistem sewa atau vendor lock-in yang mengikat klien.',
                order: 7,
                isPublished: true
            },
            {
                id: 'faq_8',
                question: 'Apakah DentsWeb melayani klien dari luar kota / seluruh Indonesia?',
                answer: 'Ya, kami melayani klien dari seluruh Indonesia hingga mancanegara. Seluruh proses komunikasi, konsultasi desain, presentasi progres pengerjaan, hingga serah terima dapat dilakukan secara efisien melalui WhatsApp, Google Meet, atau Zoom.',
                order: 8,
                isPublished: true
            }
        ];

        if (!faq || !faq.length) {
            await redis.set('dents:faq', INITIAL_8_FAQS);
        }

        const REAL_PORTFOLIO_PROJECTS = [
            {
                id: 'port_1',
                title: 'BEM KBMFKG UMI — Portal Organisasi & Aspirasi Mahasiswa',
                slug: 'bem-kbmfkg-umi',
                client: 'BEM KBMFKG UMI',
                category: 'PORTAL ORGANISASI & KAMPUS',
                year: 2026,
                image: '/public/img/portfolio/port_1.webp',
                tags: ['Portal Organisasi', 'Kemahasiswaan', 'Public Information', 'Responsive Web'],
                tools: ['html5', 'javascript', 'css3', 'bootstrap', 'vercel'],
                shortDescription: 'Website resmi BEM FKG UMI untuk transparansi kegiatan kabinet, kalender acara kampus, dan saluran penyampaian aspirasi mahasiswa yang mudah diakses dari HP.',
                description: 'Portal terpadu yang menyatukan publikasi birokrasi kampus, dokumentasi program kerja, dan formulir aspirasi online agar komunikasi antara pengurus BEM dan mahasiswa berlangsung terbuka dan cepat.',
                challenge: 'Informasi kegiatan kampus sebelumnya tercecer di berbagai grup chat dan media sosial, sehingga mahasiswa sering terlewat agenda penting dan aspirasi lambat direspons.',
                solution: 'Merancang portal satu pintu berbasis mobile-first dengan kalender kegiatan interaktif dan form aspirasi yang langsung terhubung ke pengurus.',
                projectUrl: 'https://www.bemkbmfkgumi.com/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_2',
                title: 'HMI Kedokteran Gigi UMI — Pusat Arsip & Database Kader',
                slug: 'hmi-komkg-umi',
                client: 'HMI Komisariat Kedokteran Gigi UMI',
                category: 'SISTEM INFORMASI & ARSIP DIGITAL',
                year: 2026,
                image: '/public/img/portfolio/port_2.webp',
                tags: ['Sistem Informasi', 'Database Kader', 'Digital Archive', 'Responsive Design'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Sistem informasi kader dan perpustakaan digital materi perkaderan HMI Komisariat Kedokteran Gigi UMI yang dapat diakses kapan saja oleh anggota.',
                description: 'Platform kelembagaan yang mengarsipkan data kader, materi pelatihan Basic Training (LK 1), serta artikel pemikiran mahasiswa untuk menjaga rekam jejak organisasi tetap rapi dari generasi ke generasi.',
                challenge: 'Berkas materi perkaderan dan data anggota sering hilang atau tercecer setiap kali terjadi pergantian periode kepengurusan.',
                solution: 'Membangun sistem arsip digital berbasis web yang tersentralisasi dengan navigasi sederhana dan modul yang siap diunduh anggota.',
                projectUrl: 'https://www.hmikomkgumi.xyz/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_3',
                title: 'Estaka Dental Clinic — Web Klinik & Booking WhatsApp',
                slug: 'estaka-dental-clinic',
                client: 'Estaka Dental Care & Aesthetics',
                category: 'LAYANAN KESEHATAN & BOOKING ONLINE',
                year: 2026,
                image: '/public/img/portfolio/port_3.webp',
                tags: ['Healthcare', 'Dental Clinic', 'Patient Booking', 'WhatsApp Gateway'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Website profil klinik gigi modern yang dilengkapi jadwal dokter, estimasi biaya perawatan, dan tombol reservasi instan via WhatsApp resepsionis.',
                description: 'Menghadirkan wajah digital klinik gigi yang ramah dan menenangkan bagi calon pasien. Pasien dapat melihat profil dokter gigi, jenis perawatan, dan memilih jam kunjungan dengan mudah tanpa perlu mengantre lama.',
                challenge: 'Banyak pasien batal periksa karena proses pendaftaran lewat telepon sering sibuk dan tidak ada konfirmasi jadwal yang jelas.',
                solution: 'Mengintegrasikan kalender jadwal dokter dengan alur booking WhatsApp langsung yang otomatis mengisi format pendaftaran pasien.',
                projectUrl: 'https://estakadentalclinic.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_4',
                title: 'Fahri Dental Care — Skrining Risiko Karies Gigi Anak',
                slug: 'fahri-dental-care',
                client: 'drg. Fahri Dental Care',
                category: 'SKRINING KESEHATAN & KUESIONER',
                year: 2026,
                image: '/public/img/portfolio/port_4.webp',
                tags: ['PWA', 'Clinical Screening', 'Dental Health', 'Pediatric Dentistry'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Aplikasi kuesioner interaktif bagi orang tua untuk memeriksa risiko gigi berlubang pada balita sejak dini langsung dari browser HP.',
                description: 'Progressive Web App (PWA) edukasi kesehatan gigi anak yang memandu orang tua menjawab pertanyaan sederhana mengenai pola makan dan sikat gigi anak, lalu memberikan skor risiko kesehatan gigi secara langsung.',
                challenge: 'Orang tua sering terlambat menyadari kerusakan gigi balita dan kuesioner klinis manual di ruang tunggu klinik sering diabaikan.',
                solution: 'Membuat aplikasi survei visual warna-warni yang ringan, mudah diisi dalam 2 menit, dan langsung memunculkan saran tindak lanjut.',
                projectUrl: 'https://fahridental-care.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_5',
                title: 'NovaCare.AI — Otomasi Notifikasi & Jadwal Pasien Klinik',
                slug: 'novacare-ai',
                client: 'NovaCare Health Solutions',
                category: 'SISTEM INFORMASI & OTOMASI KLINIK',
                year: 2026,
                image: '/public/img/portfolio/port_5.webp',
                tags: ['AI Engine', 'SaaS', 'Healthcare Workflow', 'Multi-Agent Bot'],
                tools: ['html5', 'javascript', 'react', 'nodejs', 'express', 'redis', 'vercel'],
                shortDescription: 'Sistem pengingat jadwal kontrol dan konfirmasi kedatangan pasien otomatis via WhatsApp untuk meringankan tugas admin klinik.',
                description: 'Platform otomasi komunikasi pasien yang membantu klinik mengurangi tingkat ketidakhadiran (no-show). Sistem secara terjadwal mengirimkan pesan konfirmasi kedatangan dan instruksi perawatan tanpa perlu staf mengetik satu per satu.',
                challenge: 'Staf pendaftaran kewalahan membalas chat dan menelepon puluhan pasien setiap hari untuk memastikan jadwal kontrol besok.',
                solution: 'Membangun sistem antrean pesan otomatis berbasis server ringan yang sinkron dengan kalender dokter dan riwayat janji temu pasien.',
                projectUrl: 'https://novacare-azure.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_6',
                title: 'Kuesioner Herlinda — E-Form Riset Kesehatan Gigi Balita',
                slug: 'kuesioner-herlinda',
                client: 'Riset Kesehatan Gigi Masyarakat FKG',
                category: 'RISET MEDIS & PENGUMPULAN DATA',
                year: 2026,
                image: '/public/img/portfolio/port_6.webp',
                tags: ['E-Form', 'Academic Research', 'Epidemiology', 'Data Collection'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Formulir digital survei lapangan kedokteran gigi dengan perhitungan otomatis indeks def-t/dmf-t tanpa perlu menghitung manual di kertas.',
                description: 'Web formulir ramah smartphone untuk peneliti lapangan di posyandu atau puskesmas. Data yang diisi langsung divalidasi dan skor kerusakan gigi langsung terkalkulasi rapi untuk siap diekspor ke Excel.',
                challenge: 'Lembar survei kertas rawan sobek/rusak di lapangan, rentan salah hitung angka, dan proses entri data ke komputer memakan waktu berminggu-minggu.',
                solution: 'Formulir web mobile yang bekerja cepat di area jaringan minim, validasi input otomatis, dan sekali klik langsung ekspor dataset rapi.',
                projectUrl: 'https://kuesionerherlinda.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_7',
                title: 'AxaBOT Portal — Rekap Kas & Nota Usaha via WhatsApp',
                slug: 'portal-finance-multiclient',
                client: 'Axa Enterprise Financial Services',
                category: 'OTOMASI FINANSIAL & KASIR',
                year: 2026,
                image: '/public/img/portfolio/port_7.webp',
                tags: ['Fintech', 'WhatsApp Bot', 'Multi-Client', 'Realtime Accounting'],
                tools: ['html5', 'javascript', 'nodejs', 'express', 'postgresql', 'redis', 'docker', 'vercel'],
                shortDescription: 'Bot WhatsApp untuk mencatat pengeluaran harian dan foto nota belanja toko yang otomatis terangkum dalam laporan keuangan realtime.',
                description: 'Solusi praktis pembukuan bagi pemilik bisnis yang memiliki banyak cabang. Karyawan cukup mengirimkan teks pemasukan atau foto kuitansi ke nomor WhatsApp khusus, dan sistem akan mencatatnya langsung ke rekap keuangan pusat.',
                challenge: 'Karyawan di cabang sering lupa merekap nota belanja harian, menyebabkan selisih uang kas yang sulit dilacak di akhir bulan.',
                solution: 'Memanfaatkan bot WhatsApp pintar yang membaca bukti transaksi dan menyimpannya langsung ke database laporan kas harian.',
                projectUrl: 'https://prtal-wa-finance.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_8',
                title: 'PIDGI Assist — Panduan & Logbook Dokter Gigi Internsip',
                slug: 'joki-borang-pidgi',
                client: 'DentisLog Indonesia',
                category: 'PORTAL EDUKASI & ASISTENSI PROFESI',
                year: 2026,
                image: '/public/img/portfolio/port_8.webp',
                tags: ['Edutech', 'Internship Tool', 'Logbook Automation', 'Dental Care'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Portal panduan lengkap penyusunan laporan kasus klinis dan pengisian e-borang harian dokter gigi internsip di seluruh Indonesia.',
                description: 'Platform pendampingan belajar bagi dokter gigi muda yang sedang menjalani masa internsip. Menyediakan contoh format laporan medis terstandar, panduan diagnosis, dan manajemen tugas harian agar lulus tepat waktu.',
                challenge: 'Jadwal dinas rumah sakit dan puskesmas yang padat membuat dokter gigi internsip kelelahan merapikan laporan borang evaluasi kinerja.',
                solution: 'Menghadirkan portal terstruktur dengan katalog template laporan kasus dan panduan ringkas yang bisa dibaca kapan saja dari smartphone.',
                projectUrl: 'https://jokiborangpidgi.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_9',
                title: 'Instrumen OHQE — Kuesioner Kualitas Hidup Pasien Gigi',
                slug: 'instrumen-ohqe',
                client: 'Riset Departemen Konservasi Gigi FKG',
                category: 'APLIKASI RISET & PENGUKURAN KLINIS',
                year: 2026,
                image: '/public/img/portfolio/port_9.webp',
                tags: ['Clinical Scale', 'Endodontics', 'Quality of Life', 'Psychometrics'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Aplikasi digital pengisian skala kepuasan dan kualitas hidup pasien setelah menjalani perawatan saluran akar gigi.',
                description: 'Web instrumen penelitian spesialis konservasi gigi untuk mengukur kenyamanan makan, bicara, dan percaya diri pasien pasca tindakan endodontik melalui sistem penskoran digital terstandar ilmiah.',
                challenge: 'Pengumpulan angket kepuasan pasien secara konvensional sering tidak lengkap dan butuh waktu lama untuk menghitung bobot nilai tiap kriteria.',
                solution: 'Digitalisasi kuesioner dengan slider nilai intuitif yang langsung menampilkan grafik perbandingan kenyamanan pasien sebelum dan sesudah terapi.',
                projectUrl: 'https://instrumenohqe.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_10',
                title: 'DentsHub Riset — Portal Pencarian Jurnal & Sitasi Medis',
                slug: 'dentshub-riset',
                client: 'DentsHub Academic Research Center',
                category: 'REPOSITORI AKADEMIK & LITERATUR',
                year: 2026,
                image: '/public/img/portfolio/port_10.webp',
                tags: ['AI Scholar', 'Academic Repository', 'DOI Validation', 'Research Ecosystem'],
                tools: ['html5', 'javascript', 'react', 'nextjs', 'tailwindcss', 'vercel'],
                shortDescription: 'Platform penelusuran referensi jurnal kedokteran gigi terakreditasi lengkap dengan verifikasi DOI dan generator format sitasi otomatis.',
                description: 'Asisten pintar bagi mahasiswa dan dosen kedokteran gigi untuk menemukan literatur ilmiah berbasis bukti (Evidence-Based Dentistry). Dilengkapi pembuat daftar pustaka otomatis format Vancouver dan APA.',
                challenge: 'Menghabiskan waktu berjam-jam menyortir jurnal yang valid dan sering terjadi kesalahan ketik pada penulisan daftar pustaka skripsi/jurnal.',
                solution: 'Portal pencarian literatur terpusat yang memverifikasi nomor DOI dan menghasilkan kutipan sitasi yang langsung siap di-copy.',
                projectUrl: 'https://dentshubriset.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_11',
                title: 'FilterCan — Toko Online Preset Foto & Slider Before-After',
                slug: 'marketplace-filtercan',
                client: 'FilterCan Creative Studio',
                category: 'E-COMMERCE & ASET DIGITAL',
                year: 2026,
                image: '/public/img/portfolio/port_11.webp',
                tags: ['E-Commerce', 'Digital Marketplace', 'Interactive Before-After', 'LUTs'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Website penjualan preset Lightroom dan LUTs video dengan fitur geser before-after interaktif untuk melihat hasil edit foto secara langsung.',
                description: 'Toko digital aset fotografi modern di mana pengunjung dapat langsung mencoba efek tone warna pada sampel foto nyata menggunakan slider sentuh sebelum memutuskan untuk membeli.',
                challenge: 'Pembeli sering ragu membeli preset foto karena contoh gambar di media sosial dianggap tidak menampilkan kondisi foto aslinya.',
                solution: 'Membangun komponen pembanding foto before-after yang mulus di layar sentuh HP dan sistem download file instan setelah checkout.',
                projectUrl: 'https://filterbycan.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_12',
                title: 'AXA Exams — Sistem Ujian Online (CBT) Anti-Curang',
                slug: 'portal-ujian-axa-exams',
                client: 'AXA Educational Assessment System',
                category: 'APLIKASI UJIAN & EVALUASI ONLINE',
                year: 2026,
                image: '/public/img/portfolio/port_12.webp',
                tags: ['CBT Exam', 'Edutech', 'Anti-Cheat Protection', 'Realtime Scoring'],
                tools: ['html5', 'javascript', 'react', 'nodejs', 'express', 'postgresql', 'vercel'],
                shortDescription: 'Platform ujian Computer Based Test (CBT) berbasis web dengan deteksi ganti tab browser, acak soal otomatis, dan nilai keluar seketika.',
                description: 'Sistem ujian daring stabil yang mampu menampung ratusan peserta ujian secara serentak. Dilengkapi sistem pengawasan otomatis yang mencatat jika peserta mencoba membuka jendela lain atau melakukan copy-paste jawaban.',
                challenge: 'Ujian online biasa sangat rawan kecurangan (peserta browsing jawaban) dan server sering lambat ketika seluruh peserta mengklik submit bersamaan.',
                solution: 'Membangun sistem ujian dengan proteksi fokus layar, pengacakan nomor soal, serta penyimpanan jawaban berkala agar tidak hilang jika koneksi putus.',
                projectUrl: 'https://axa-exams.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_13',
                title: 'drg. M. Rakhmat Ersyad, Sp.RKG — Portofolio Dokter Gigi Spesialis',
                slug: 'drg-rakhmat-ersyad-portfolio',
                client: 'drg. M. Rakhmat Ersyad Muchlis, S.H., Sp.RKG',
                category: 'PORTOFOLIO PRIBADI & BRANDING PROFESIONAL',
                year: 2026,
                image: '/public/img/portfolio/port_13.webp',
                tags: ['Medical Executive', 'Radiology', 'Personal Branding', 'Tahoe Style'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Website portofolio profesional dan profil keahlian klinis Dokter Gigi Spesialis Radiologi Kedokteran Gigi (Sp.RKG) berbalut desain elegan.',
                description: 'Profil digital representatif yang merangkum keahlian analisis radiografi gigi 3D (CBCT), riwayat pendidikan, publikasi ilmiah, dan layanan konsultasi medikolegal dalam tampilan yang berkelas dan bersih.',
                challenge: 'Perlunya wadah digital yang kredibel untuk menampilkan rekam jejak dua bidang keahlian (Radiologi Gigi & Hukum Kesehatan) yang mudah diakses mitra rumah sakit.',
                solution: 'Mendesain website portofolio modern bergaya Tahoe dengan navigasi cepat, tata letak resume yang rapi, dan tombol kontak langsung.',
                projectUrl: 'https://mrakhmatersyad.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_14',
                title: 'Anomaly Space — Kasir Web & Layanan Dapur Kafe (POS)',
                slug: 'anomaly-space-pos',
                client: 'Anomaly Space Specialty Coffee',
                category: 'SISTEM KASIR KAFE (F&B POS)',
                year: 2026,
                image: '/public/img/portfolio/port_14.webp',
                tags: ['POS System', 'F&B Tech', 'Cloud Database', 'Kitchen Display'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Aplikasi kasir kafe berbasis web yang langsung mengirim pesanan meja kasir ke layar barista dapur tanpa kertas struk manual.',
                description: 'Sistem kasir ringkas untuk coffee shop yang mempercepat antrean pelanggan. Kasir menginput pesanan di tablet, barista langsung melihat daftar kopi yang harus dibuat, dan laporan penjualan harian terekam otomatis.',
                challenge: 'Pesanan kopi sering salah atau terlambat dibuat saat jam ramai karena kasir menggunakan nota kertas yang tercecer.',
                solution: 'Membuat sistem kasir web dua layar (layar kasir & layar barista) yang terhubung realtime tanpa perlu langganan software kasir mahal.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbw5LzOU5HJzGRhpouhF_b3ft-DelJY273xagO57W-IkBtF4-TNjX7F2ZYCtakk31Eht/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_15',
                title: 'E-Pilketos Smaga — E-Voting Pemilihan Ketua OSIS SMAN 3',
                slug: 'e-pilketos-smaga',
                client: 'MPK & OSIS SMAN 3 Makassar',
                category: 'E-VOTING & PEMUNGUTAN SUARA',
                year: 2026,
                image: '/public/img/portfolio/port_15.webp',
                tags: ['E-Voting', 'Realtime Quick Count', 'Token Authentication', 'Student Governance'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Sistem pemungutan suara online pemilihan OSIS dengan token unik sekali pakai dan grafik perolehan suara (quick count) langsung transparan.',
                description: 'Platform pemilu digital sekolah yang ramah lingkungan dan bebas kertas. Ribuan siswa memilih kandidat di bilik suara komputer secara rahasia, cepat, dan hasilnya langsung tampil di layar aula tanpa hitung suara manual.',
                challenge: 'Pemilihan manual menghabiskan banyak kertas suara, biaya cetak tinggi, dan penghitungan suara sering memakan waktu hingga malam hari.',
                solution: 'Mengembangkan sistem e-voting web yang memverifikasi token khusus pemilih, mencegah voting ganda, dan menghitung hasil suara secara otomatis.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbzG-WjY-bsx5I12ynk1_6ilclVM4Pli37vmpytqeaeJkESCkQqX5D9IZkBzaM6vCmcC/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_16',
                title: 'Gria Efata Permai — Peta Kavling Interaktif & Brosur Properti',
                slug: 'gria-efata-permai',
                client: 'PT Efata Jaya Raya',
                category: 'PROPERTI & MASTERPLAN DIGITAL',
                year: 2026,
                image: '/public/img/portfolio/port_16.webp',
                tags: ['Real Estate', 'Digital Site Plan', 'Unit Booking', 'Interactive Map'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Website perumahan dengan denah interaktif untuk mengecek nomor kavling yang masih kosong dan simulasi cicilan rumah.',
                description: 'Media promosi perumahan modern yang memudahkan calon pembeli mengeklik denah unit rumah secara visual. Pembeli dapat langsung melihat tipe rumah, harga, status ketersediaan unit, dan mengunduh brosur via WhatsApp agen.',
                challenge: 'Pembeli kesulitan membayangkan lokasi rumah dari brosur kertas biasa dan staf sales sering salah info mengenai kavling yang sudah laku.',
                solution: 'Membuat peta denah perumahan interaktif berbasis web dengan warna penanda ketersediaan unit yang diperbarui langsung dari smartphone tim sales.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbz-QT1iuDrZEf5OlTRtuAeQGOwE4pxZ_b1DmBHbYz3R-IAnOlT6BuVyZxO67cuvHG8/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_17',
                title: 'Bams Barbershop — Booking Jadwal & Antrean Online',
                slug: 'bams-barbershop-booking',
                client: 'Bams Barbershop & Grooming',
                category: 'ANTREAN ONLINE & RESERVASI JASA',
                year: 2026,
                image: '/public/img/portfolio/port_17.webp',
                tags: ['Barbershop', 'Online Queue', 'Appointment System', 'SMS/WA Reminder'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Web pemesanan jadwal pangkas rambut untuk memilih kapster dan memantau antrean dari rumah tanpa perlu menunggu lama di kursi barbershop.',
                description: 'Solusi antrean bagi pelanggan barbershop. Pelanggan dapat melihat jadwal kapster yang bertugas, memesan jam potong rambut, dan datang tepat waktu sesuai estimasi giliran.',
                challenge: 'Pelanggan sering batal potong rambut karena ruang tunggu penuh sesak dan waktu tunggu giliran tidak pasti.',
                solution: 'Membangun aplikasi antrean web dengan nomor tiket virtual dan perkiraan waktu giliran yang bisa dipantau langsung lewat HP pelanggan.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbxgGdUfpjnODbdUDdwL9hGwjJeecMflQWKoZHFaN4Wm9-b7iTI9wNozsIM3LsKT3W0/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_18',
                title: 'Smart RPP — Generator Modul Ajar Kurikulum Merdeka',
                slug: 'smart-rpp-kurikulum-merdeka',
                client: 'Komunitas Guru Inovatif Nusantara',
                category: 'APLIKASI PENDIDIKAN & ADMINISTRASI GURU',
                year: 2026,
                image: '/public/img/portfolio/port_18.webp',
                tags: ['AI Generator', 'Kurikulum Merdeka', 'Edutech', 'Modul Ajar'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Alat bantu guru untuk menyusun modul ajar, rubrik penilaian, dan Rencana Pembelajaran (RPP) Kurikulum Merdeka secara praktis.',
                description: 'Membantu para guru memangkas waktu pembuatan berkas administrasi mengajar. Cukup memilih mata pelajaran dan capaian pembelajaran, sistem akan menyusun draf modul ajar terstruktur yang siap cetak dan dipakai di kelas.',
                challenge: 'Guru menghabiskan terlalu banyak waktu malam hari untuk mengetik puluhan halaman RPP, mengurangi energi untuk mengajar murid di kelas.',
                solution: 'Merancang formulir pembuatan RPP otomatis dengan susunan baku Kemendikbud yang mudah disesuaikan kebutuhan guru.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbwaLRPdwdUYxzxstqiQUASC19ivpRyZ2oMDiDQks0Ozk9pjrd7Kp1cRgZJqlrpfaXyx/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_19',
                title: 'NGS StaffFlow — Pengajuan Cuti & Klaim Biaya Kantor',
                slug: 'ngs-staffflow-hr-portal',
                client: 'PT Nusantara Global Solusindo',
                category: 'PORTAL KARYAWAN & ADMINISTRASI KANTOR',
                year: 2026,
                image: '/public/img/portfolio/port_19.webp',
                tags: ['HRIS Portal', 'Staff Management', 'Reimbursement', 'Leave Approval'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Portal internal karyawan untuk mengajukan cuti online, klaim uang transport/bon kantor, dan persetujuan atasan tanpa formulir kertas.',
                description: 'Aplikasi mandiri karyawan kantor yang merapikan alur persetujuan kerja. Karyawan cukup foto bukti kuitansi atau ajukan tanggal libur dari HP, dan atasan bisa langsung menyetujui lewat satu klik notifikasi email.',
                challenge: 'Berkas klaim uang dan formulir cuti kertas sering hilang di meja manajer dan merepotkan rekapitulasi bagian keuangan di akhir bulan.',
                solution: 'Mengganti formulir fisik dengan alur persetujuan digital yang mencatat sisa cuti dan riwayat transaksi secara transparan dan rapi.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbxXO7nf0uRRIx4dGUJzvzBg5_DCG_UmKvpeP5YHf6kQ0PjiuNtIIkpCDlNXwyn8JIav/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_20',
                title: 'FlowSales CRM — Papan Pantau Prospek & Penjualan Sales',
                slug: 'flowsales-crm-pipeline',
                client: 'FlowSales Business Acceleration',
                category: 'MANAJEMEN PENJUALAN & CRM BISNIS',
                year: 2026,
                image: '/public/img/portfolio/port_20.webp',
                tags: ['CRM', 'Sales Pipeline', 'Kanban Board', 'Lead Scoring'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Papan visual geser-tarik (Kanban) untuk memantau proses negosiasi tim sales dari chat awal, jadwal presentasi, hingga deal penjualan.',
                description: 'Membantu pemilik bisnis dan manajer memantau kemajuan setiap calon klien yang sedang dihubungi tim sales. Setiap penawaran dikelompokkan dalam kolom tahapan penjualan sehingga tidak ada prospek yang terlupakan.',
                challenge: 'Catatan calon klien sering tercecer di WhatsApp pribadi sales dan pimpinan kesulitan mengetahui potensi omzet yang akan masuk bulan ini.',
                solution: 'Membangun papan pipeline penjualan visual yang mudah digeser antar status, dilengkapi catatan hasil telepon dan pengingat jadwal follow-up.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbxG5OeF3_ekRRekIQr05xtZZ2hvdA4b5mUFM6CzEYxaiSbwSNO6xD_vJwJbr0R9FTCu/exec',
                isFeatured: true,
                isPublished: true
            }
        ];

        const MASKED_TESTIMONIALS = [
            {
                id: 'testi_1',
                name: 'drg. Ah*** Fau**, Sp.KG',
                role: 'Ketua Umum BEM Periode 2025/2026',
                company: 'BEM KBMFKG UMI',
                content: 'Portal BEM KBMFKG UMI yang dibangun oleh Dents Web benar-benar melampaui ekspektasi kabinet kami. Tampilannya modern, sangat cepat dibuka oleh mahasiswa di smartphone, dan fitur penyaluran aspirasinya membuat komunikasi mahasiswa jadi transparan dan profesional.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_2',
                name: 'Muh. Rid*** Pra****, S.KG',
                role: 'Sekretaris Umum Komisariat',
                company: 'HMI KOMKG UMI',
                content: 'Digitalisasi sistem informasi kader kami kini tertata sangat rapi. Database anggota dan arsip materi perkaderan tersimpan dengan aman serta mudah diakses kader di mana saja. Pekerjaan Dents Web sangat sistematis dan rapi!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_3',
                name: 'drg. Es** Ward****, Sp.Pros',
                role: 'Founder & Principal Dentist',
                company: 'Estaka Modern Dental Clinic',
                content: 'Sistem booking konsultasi gigi yang terhubung ke WhatsApp otomatis telah memangkas angka pembatalan jadwal pasien kami hingga lebih dari 60%. Desain visualnya juga sangat elegan dan merepresentasikan standar klinik premium.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_4',
                name: 'drg. Fah** Rama******',
                role: 'Dokter Penanggung Jawab Klinik',
                company: 'Klinik Fahri Dental Care',
                content: 'PWA kuesioner karies gigi anak kami sangat responsif dan mudah digunakan oleh para orang tua di ruang tunggu. Data survei klinis terdata akurat tanpa perlu rekap kertas manual lagi. Luar biasa!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_5',
                name: 'dr. No** Arya****, M.Biomed',
                role: 'Chief Medical Technology Officer',
                company: 'NovaCare.AI Healthcare',
                content: 'Integrasi backend Node.js dan WhatsApp gateway engine yang dibangun Dents Web sangat stabil melayani ribuan pesan pasien harian tanpa kendala down. Solusi rekayasa perangkat lunak kelas dunia!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_6',
                name: 'drg. Herl****, M.Kes',
                role: 'Ketua Tim Peneliti Epidemiologi',
                company: 'Riset Karies Gigi Anak FKG',
                content: 'Aplikasi E-Form penelitian karies gigi balita ini sangat membantu pengumpulan data lapangan di berbagai puskesmas. Perhitungan skor indeks dmf-t otomatis sangat menghemat waktu analisis tesis kami.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_7',
                name: 'Hen*** Guna***, S.E.',
                role: 'Managing Partner',
                company: 'AxaBOT Multi-Client Finance',
                content: 'Arsitektur multi-tenant dan integrasi bot WhatsApp finance dari Dents Web memungkinkan klien-klien kami merekonsiliasi kas cabang dalam hitungan detik. Benar-benar game changer untuk efisiensi bisnis!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_8',
                name: 'drg. Nadh*** Salsab***',
                role: 'Koordinator Asistensi Internsip',
                company: 'DentisLog PIDGI Assistance',
                content: 'Platform joki borang PIDGI ini membantu dokter gigi internsip menyusun logbook kasus klinis dengan sangat terstruktur dan tepat waktu. Tampilan platformnya bersih dan layanannya sangat profesional.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_9',
                name: 'drg. Absab**** Aul** R., S.KG',
                role: 'Peneliti Utama Departemen Konservasi',
                company: 'Instrumen OHQE Endodontik',
                content: 'Instrumen digital pengukuran kualitas hidup pasien endodontik ini memudahkan scoring psikometrik OHRQoL secara instan dan akurat. Validasi data dan grafik visualisasinya sangat memuaskan pembimbing riset kami.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_10',
                name: 'M. Azh** Arsy**, S.KG',
                role: 'Lead Academic Researcher',
                company: 'DentsHub Riset Academic Platform',
                content: 'Pencarian literatur jurnal Scopus dan validasi DOI otomatis di platform DentsHub Riset bekerja sangat cepat dan akurat. Menyelesaikan tinjauan pustaka saintifik kedokteran gigi kini jauh lebih efisien.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_11',
                name: 'Ri** Ardia*****',
                role: 'Creative Director',
                company: 'FilterCan Creative Studio',
                content: 'Fitur interactive before-after slider di website FilterCan meningkatkan konversi penjualan preset Lightroom kami secara drastis. Pembeli bisa langsung melihat efek warna sebelum checkout. UI/UX-nya top markotop!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_12',
                name: 'Dr. Ir. H. Mans***, M.T.',
                role: 'Kepala Pusat Evaluasi Akademik',
                company: 'AXA XYZ Enterprise Exam System',
                content: 'Platform CBT AXA Exams sangat tangguh menangani ribuan peserta ujian bersamaan. Sistem proteksi anti-kecurangan tab switching dan auto scoring-nya membuat jalannya ujian online terjamin kredibilitasnya.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_13',
                name: 'drg. M. Rakh*** Ers***, Sp.RKG',
                role: 'Spesialis Radiologi Kedokteran Gigi & Konsultan Hukum',
                company: 'drg. M. Rakhmat Ersyad Muchlis, S.H., Sp.RKG',
                content: 'Portofolio profesional saya tampil begitu presisi, eksklusif, dan berwibawa dengan gaya visual Tahoe macOS. Representasi kompetensi ganda di bidang radiologi dental dan hukum kesehatan tersampaikan dengan sempurna.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_14',
                name: 'Kev** Sanj***',
                role: 'Operational Manager',
                company: 'Anomaly Space Cafe',
                content: 'Aplikasi kasir POS cloud dan kitchen display system Anomaly Space mempercepat alur operasional kafe kami di jam padat. Antrean kasir berkurang drastis dan rekap omzet harian selalu akurat.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_15',
                name: 'Fadh** Nurhid****',
                role: 'Ketua Panitia Pemilihan MPK',
                company: 'E-Pilketos SMAN 3 Makassar',
                content: 'Pemilihan ketua OSIS SMA Negeri 3 Makassar berlangsung sangat sukses dan transparan dengan sistem e-voting ini. Penghitungan suara yang biasanya sampai malam kini selesai dalam 1 detik setelah bilik suara ditutup!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_16',
                name: 'Ir. Hend**** Ef****, M.M.',
                role: 'Direktur Utama',
                company: 'PT Efata Jaya Raya / Gria Efata Permai',
                content: 'Portal digital site plan interaktif Gria Efata Permai sangat memudahkan calon pembeli rumah memilih blok kavling favorit secara visual. Penjualan unit perumahan kami meningkat signifikan berkat web ini!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_17',
                name: 'Bamb*** "Bams" Kurnia***',
                role: 'Owner & Head Barber',
                company: 'Bams Barbershop',
                content: 'Sistem antrean online dan booking jadwal Bams Barbershop membuat ruang tunggu kami bebas dari kerumunan tidak menentu. Pelanggan sangat senang karena bisa memantau giliran potong langsung dari HP mereka.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_18',
                name: 'Siti Rahm****, M.Pd.',
                role: 'Koordinator Kurikulum Sekolah Penggerak',
                company: 'Smart RPP Modul Ajar',
                content: 'Platform AI Smart RPP ini adalah anugerah bagi rekan-rekan guru. Pembuatan modul ajar dan rubrik asesmen Kurikulum Merdeka yang biasanya berhari-hari kini tuntas dalam beberapa menit dengan mutu terstandar!',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_19',
                name: 'Alex Pra****, S.Psi.',
                role: 'People Operations Manager',
                company: 'PT Nusantara Global Solusindo',
                content: 'Portal NGS StaffFlow memangkas alur birokrasi izin cuti dan klaim bon kantor kami menjadi serba otomatis. Rekapitulasi bulanan tim HRD kini 100% bebas dari berkas kertas tercecer.',
                rating: 5,
                isPublished: true
            },
            {
                id: 'testi_20',
                name: 'Dim** Prasety*, B.B.A.',
                role: 'VP of Business Development',
                company: 'FlowSales CRM Solutions',
                content: 'Papan Kanban visual deals FlowSales CRM memudahkan tim account executive kami memantau setiap tahapan follow-up prospek. Tingkat closing proyek enterprise kami melonjak lebih dari 45%!',
                rating: 5,
                isPublished: true
            }
        ];

        const MIGRATION_VERSION = 'v7_pricing_services_refinements';
        const currentMigration = await redis.get('dents:migration:portfolio');
        if (currentMigration !== MIGRATION_VERSION) {
            console.log('[MIGRATION v7] Syncing refined Pricing & Services tiers (1-6 hal Business, 1 email Pro, no email Starter, no pixel Business) & verifying Base64 WebP in Redis DB...');
            
            // Ambil portfolio yang sudah ada di Redis untuk mempertahankan data kustom
            const existingPortfolio = await redis.get('dents:portfolio') || [];
            const imageMap = {};
            if (Array.isArray(existingPortfolio)) {
                existingPortfolio.forEach(p => {
                    if (p.id && p.image && p.image !== '/public/img/axalogo.png') imageMap[p.id] = p.image;
                    if (p.slug && p.image && p.image !== '/public/img/axalogo.png') imageMap[p.slug] = p.image;
                });
            }

            const syncedPortfolio = REAL_PORTFOLIO_PROJECTS.map((proj, idx) => {
                let img = imageMap[proj.id] || imageMap[proj.slug] || proj.image;
                // If it's a file path, convert to Base64 WebP Data URI so it lives 100% in Redis DB
                if (!img || img.startsWith('/public/img/portfolio/')) {
                    const localPath = path.join(process.cwd(), 'public/img/portfolio', `port_${idx + 1}.webp`);
                    if (fs.existsSync(localPath)) {
                        try {
                            const buf = fs.readFileSync(localPath);
                            img = 'data:image/webp;base64,' + buf.toString('base64');
                        } catch (e) {}
                    }
                }
                return { ...proj, image: img };
            });

            await redis.set('dents:portfolio', syncedPortfolio);
            await redis.set('dents:faq', INITIAL_8_FAQS);
            await redis.set('dents:pricing', INITIAL_PRICING_4_TIERS);
            await redis.set('dents:services', INITIAL_SERVICES_4_TIERS);
            await redis.set('dents:testimonials', MASKED_TESTIMONIALS);
            await redis.set('dents:migration:portfolio', MIGRATION_VERSION);
            console.log('[MIGRATION v7] Sync complete: Pricing & Services tiers refined in Redis DB.');
        }

        if (!testimonials || !testimonials.length) {
            await redis.set('dents:testimonials', MASKED_TESTIMONIALS);
        }

        if (!portfolio || !portfolio.length) {
            await redis.set('dents:portfolio', REAL_PORTFOLIO_PROJECTS);
        }

        if (!articles || !articles.length) {
            await redis.set('dents:articles', [
                {
                    id: 'art_1',
                    title: 'Panduan Lengkap HTML5 Semantik: Fondasi Struktur Web Standar W3C',
                    slug: 'panduan-lengkap-html5-semantik',
                    category: 'Frontend',
                    excerpt: 'Pahami elemen semantik HTML5 seperti header, main, section, dan article untuk meningkatkan aksesibilitas dan ranking SEO Google.',
                    coverImage: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '5 menit baca',
                    tags: ['HTML5', 'Frontend', 'SEO', 'Web Development'],
                    isPublished: true,
                    publishedAt: '2026-03-10',
                    updatedAt: '2026-03-15',
                    content: `<h2>Mengapa HTML5 Semantik Sangat Krusial?</h2>
<p>Dalam rekayasa web modern, HTML bukan sekadar sekumpulan tag untuk menampilkan teks di layar. HTML semantik memberikan makna struktural eksplisit pada setiap elemen konten kepada peramban (browser), pembaca layar (screen reader) disabilitas, serta perayap mesin pencari (Googlebot).</p>

<h3>Struktur Semantik Inti</h3>
<p>Sebelum HTML5, pengembang web menggunakan tag generik <code>&lt;div class="header"&gt;</code> atau <code>&lt;div class="footer"&gt;</code>. Praktik terbaik saat ini menggantinya dengan tag semantik standar:</p>

<pre><code>&lt;header&gt;
  &lt;nav&gt;
    &lt;ul&gt;
      &lt;li&gt;&lt;a href="/"&gt;Beranda&lt;/a&gt;&lt;/li&gt;
      &lt;li&gt;&lt;a href="/articles"&gt;Artikel&lt;/a&gt;&lt;/li&gt;
    &lt;/ul&gt;
  &lt;/nav&gt;
&lt;/header&gt;
&lt;main&gt;
  &lt;article&gt;
    &lt;h1&gt;Judul Artikel Utama&lt;/h1&gt;
    &lt;p&gt;Konten artikel...&lt;/p&gt;
  &lt;/article&gt;
&lt;/main&gt;
&lt;footer&gt;
  &lt;p&gt;&copy; 2026 Dents Web. Hak cipta dilindungi undang-undang.&lt;/p&gt;
&lt;/footer&gt;</code></pre>

<h3>Dampak Langsung Terhadap SEO</h3>
<p>Google memprioritaskan situs dengan hierarki semantik jelas. Elemen <code>&lt;article&gt;</code> dan <code>&lt;h1&gt;</code> hingga <code>&lt;h6&gt;</code> membantu algoritma memahami konteks topik halaman secara akurat tanpa ambigu.</p>`
                },
                {
                    id: 'art_2',
                    title: 'Modern CSS3, Flexbox & Grid: Membangun Tata Letak Responsif Tanpa Pusing',
                    slug: 'modern-css3-flexbox-grid-tata-letak-responsif',
                    category: 'Frontend',
                    excerpt: 'Kuasai teknik layouting satu dimensi dengan Flexbox dan dua dimensi dengan CSS Grid untuk tampilan responsif di smartphone hingga desktop 4K.',
                    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '6 menit baca',
                    tags: ['CSS3', 'Flexbox', 'CSS Grid', 'Responsive Design'],
                    isPublished: true,
                    publishedAt: '2026-03-11',
                    updatedAt: '2026-03-15',
                    content: `<h2>Kapan Menggunakan Flexbox vs CSS Grid?</h2>
<p>Sering timbul perdebatan di kalangan pengembang pemula mengenai Flexbox dan CSS Grid. Faktanya, keduanya saling melengkapi secara harmonis:</p>
<ul>
  <li><strong>Flexbox:</strong> Ideal untuk tata letak satu dimensi (baris horizontal ATAU kolom vertikal), seperti navbar, badge kelompok, atau baris tombol.</li>
  <li><strong>CSS Grid:</strong> Didesain untuk tata letak dua dimensi (baris DAN kolom sekaligus), seperti galeri kartu portofolio dan dashboard multi-panel.</li>
</ul>

<h3>Contoh Grid Responsif Otomatis</h3>
<pre><code>.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}</code></pre>

<p>Satu baris kode <code>repeat(auto-fit, minmax(...))</code> di atas otomatis mengatur jumlah kolom tanpa memerlukan media query berulang kali!</p>`
                },
                {
                    id: 'art_3',
                    title: 'Logika & Variabel JavaScript ES6+: Dasar Pemrograman Modern untuk Pemula',
                    slug: 'logika-variabel-javascript-es6-dasar-pemrograman',
                    category: 'Frontend',
                    excerpt: 'Pelajari perbedaan const, let, arrow functions, destructuring, dan async/await yang menjadi fondasi ekosistem web saat ini.',
                    coverImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '7 menit baca',
                    tags: ['JavaScript', 'ES6', 'Programming', 'Clean Code'],
                    isPublished: true,
                    publishedAt: '2026-03-12',
                    updatedAt: '2026-03-15',
                    content: `<h2>Revolusi Fitur Modern ECMAScript (ES6+)</h2>
<p>JavaScript telah bertransformasi dari sekadar bahasa skrip interaktif sederhana di browser menjadi bahasa serba bisa di frontend dan backend server.</p>

<h3>1. Deklarasi: Hindari 'var', Gunakan 'const' & 'let'</h3>
<p><code>var</code> memiliki sifat function-scope dan rawan bug hoisting. Gunakan <code>const</code> sebagai opsi utama untuk variabel immutable, dan <code>let</code> saat nilainya perlu dimutasi.</p>

<h3>2. Destructuring & Arrow Functions</h3>
<pre><code>// Modern Destructuring & Default Value
const formatUser = ({ name, role = 'Member' }) => {
  return \`Halo, \${name}! Status Anda: \${role}.\`;
};

console.log(formatUser({ name: 'Ahmad' }));</code></pre>

<p>Sintaks ringkas ini membuat kode lebih bersih, mudah diuji (unit testing), dan minim potensi bug.</p>`
                },
                {
                    id: 'art_4',
                    title: 'Mengenal Ekosistem React & Komponen Deklaratif untuk Antarmuka Modern',
                    slug: 'mengenal-ekosistem-react-komponen-deklaratif',
                    category: 'Frontend',
                    excerpt: 'Pahami paradigma komponen, state reaktif dengan useState & useEffect, serta cara kerja Virtual DOM dalam menciptakan UX kilat.',
                    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '6 menit baca',
                    tags: ['React', 'Frontend', 'SPA', 'UI Component'],
                    isPublished: true,
                    publishedAt: '2026-03-13',
                    updatedAt: '2026-03-15',
                    content: `<h2>Mengapa Industri Mengadopsi React?</h2>
<p>React yang dirilis oleh Meta mengubah cara insinyur perangkat lunak membangun antarmuka pengguna. Alih-alih memanipulasi DOM secara imperatif seperti jQuery, React menggunakan pendekatan deklaratif berbasis komponen independen yang dapat digunakan kembali (reusable).</p>

<h3>Memahami State & Reaktivitas</h3>
<pre><code>import React, { useState } from 'react';

export function CounterButton() {
  const [count, setCount] = useState(0);

  return (
    &lt;button onClick={() =&gt; setCount(count + 1)}&gt;
      Klik Saya: {count}
    &lt;/button&gt;
  );
}</code></pre>

<p>Setiap kali state <code>count</code> berubah, React melakukan reconcilliation di memori (Virtual DOM) dan hanya memperbarui elemen DOM nyata yang benar-benar mengalami perubahan.</p>`
                },
                {
                    id: 'art_5',
                    title: 'Membangun RESTful API Pertama dengan Node.js dan Express.js',
                    slug: 'membangun-restful-api-nodejs-expressjs',
                    category: 'Backend',
                    excerpt: 'Langkah praktis membuat endpoint CRUD lengkap, middleware validasi, dan manajemen respons JSON yang terstruktur.',
                    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '8 menit baca',
                    tags: ['Node.js', 'Express.js', 'Backend', 'REST API'],
                    isPublished: true,
                    publishedAt: '2026-03-14',
                    updatedAt: '2026-03-15',
                    content: `<h2>Arsitektur RESTful API</h2>
<p>Representational State Transfer (REST) adalah standar arsitektur komunikasi antara aplikasi klien dan server melalui protokol HTTP menggunakan metode standar:</p>
<ul>
  <li><strong>GET:</strong> Mengambil resource data.</li>
  <li><strong>POST:</strong> Membuat resource data baru.</li>
  <li><strong>PUT / PATCH:</strong> Memperbarui resource yang sudah ada.</li>
  <li><strong>DELETE:</strong> Menghapus resource data.</li>
</ul>

<h3>Contoh Server Express Minimalis</h3>
<pre><code>const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.listen(3000, () => console.log('Server berjalan di port 3000'));</code></pre>`
                },
                {
                    id: 'art_6',
                    title: 'Pengenalan Bahasa Pemrograman Python: Sintaks Bersih untuk Web & Otomasi',
                    slug: 'pengenalan-bahasa-python-sintaks-bersih-otomasi',
                    category: 'Backend',
                    excerpt: 'Kenapa Python menjadi bahasa terpopuler di dunia? Pelajari sintaks mudah dibaca, tipe data dinamis, dan integrasi library AI.',
                    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '5 menit baca',
                    tags: ['Python', 'Backend', 'Automation', 'Data Science'],
                    isPublished: true,
                    publishedAt: '2026-03-14',
                    updatedAt: '2026-03-15',
                    content: `<h2>Filosofi The Zen of Python</h2>
<p>Python dirancang oleh Guido van Rossum dengan filosofi utama: <em>"Readability counts"</em> (keterbacaan kode adalah prioritas utama). Indentasi spasi menggantikan kurung kurawal, menghasilkan kode yang bersih dan teratur.</p>

<h3>Ekosistem Python di Dunia Industri</h3>
<ol>
  <li><strong>Backend Web:</strong> Framework Django dan FastAPI untuk performa tinggi dan skalabilitas enterprise.</li>
  <li><strong>Otomasi Skrip:</strong> Membaca berkas Excel, web scraping, dan sinkronisasi berkas otomatis.</li>
  <li><strong>AI & Machine Learning:</strong> Standar industri untuk TensorFlow, PyTorch, dan pengolahan data NumPy/Pandas.</li>
</ol>`
                },
                {
                    id: 'art_7',
                    title: 'Manajemen Basis Data: Perbedaan Fundamental SQL Relasional vs NoSQL Dokumen',
                    slug: 'manajemen-database-sql-relasional-vs-nosql-dokumen',
                    category: 'Database',
                    excerpt: 'Panduan memilih database yang tepat untuk aplikasi Anda: PostgreSQL, MySQL, vs MongoDB, Redis, dan Upstash serverless.',
                    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '7 menit baca',
                    tags: ['Database', 'SQL', 'NoSQL', 'PostgreSQL', 'Redis'],
                    isPublished: true,
                    publishedAt: '2026-03-14',
                    updatedAt: '2026-03-16',
                    content: `<h2>Kriteria Pemilihan Database Proyek</h2>
<p>Memilih basis data yang keliru di awal fase pengembangan dapat memperlambat performa sistem saat trafik melonjak tajam.</p>

<h3>SQL (Relasional: MySQL, PostgreSQL)</h3>
<p>Cocok untuk data dengan skema terstruktur ketat, relasi antar tabel (Foreign Keys), serta transaksi finansial yang membutuhkan jaminan kepatuhan ACID (Atomicity, Consistency, Isolation, Durability).</p>

<h3>NoSQL (Dokumen & Key-Value: MongoDB, Redis)</h3>
<p>Sangat ideal untuk penyimpanan data skema fleksibel (JSON documents) dan operasi caching berkecepatan tinggi di memori RAM untuk mengurangi beban kueri database utama.</p>`
                },
                {
                    id: 'art_8',
                    title: 'Pengantar Docker & Kontainerisasi: Solusi Mengatasi "It Works on My Machine"',
                    slug: 'pengantar-docker-kontainerisasi-solusi-deployment',
                    category: 'DevOps',
                    excerpt: 'Cara mengemas aplikasi beserta pustaka dependensinya ke dalam Docker Image agar berjalan identik di komputer lokal maupun server produksi.',
                    coverImage: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '6 menit baca',
                    tags: ['Docker', 'DevOps', 'Containers', 'Cloud Infrastructure'],
                    isPublished: true,
                    publishedAt: '2026-03-15',
                    updatedAt: '2026-03-16',
                    content: `<h2>Masalah Klasik Lingkungan Pengembangan</h2>
<p>Pernahkah kode Anda berjalan mulus di laptop lokal, namun langsung error ketika dideploy ke server VPS karena perbedaan versi Node.js atau modul OS? Docker menyelesaikan masalah ini secara definitif melalui kontainerisasi.</p>

<h3>Contoh Dockerfile Ringkas Node.js</h3>
<pre><code>FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]</code></pre>

<p>Dengan Dockerfile ini, siapa pun yang menjalankan <code>docker run</code> akan mendapatkan lingkungan eksekusi yang 100% identik tanpa perbedaan konfigurasi.</p>`
                },
                {
                    id: 'art_9',
                    title: 'Alur Kerja Git & GitHub untuk Kolaborasi Tim Pengembang Software Profesional',
                    slug: 'alur-kerja-git-github-kolaborasi-tim-pengembang',
                    category: 'DevOps',
                    excerpt: 'Kuasai branch strategy, semantic commit messages, merge conflict resolution, dan Pull Request review untuk kerja tim yang produktif.',
                    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '6 menit baca',
                    tags: ['Git', 'GitHub', 'Version Control', 'Workflow'],
                    isPublished: true,
                    publishedAt: '2026-03-15',
                    updatedAt: '2026-03-16',
                    content: `<h2>Pola Kerja Git Branching Standar Industri</h2>
<p>Dalam proyek piranti lunak tim, jangan pernah langsung melakukan commit ke branch <code>main</code> atau <code>production</code>. Terapkan alur Feature Branch:</p>
<ol>
  <li>Tarik pembaruan terbaru: <code>git checkout main && git pull origin main</code></li>
  <li>Buat branch fitur: <code>git checkout -b feature/auth-jwt-system</code></li>
  <li>Commit perubahan dengan pesan semantik: <code>git commit -m "feat(auth): add jwt token generation"</code></li>
  <li>Dorong branch ke remote: <code>git push origin feature/auth-jwt-system</code></li>
  <li>Buka Pull Request (PR) untuk direview oleh rekan tim sebelum di-merge.</li>
</ol>`
                },
                {
                    id: 'art_10',
                    title: 'Keamanan Web Esensial: Praktik Terbaik Mencegah SQL Injection, XSS, dan CSRF',
                    slug: 'keamanan-web-esensial-mencegah-sql-injection-xss-csrf',
                    category: 'Security',
                    excerpt: 'Panduan pertahanan siber untuk aplikasi web modern: sanitasi input pengguna, HTTP security headers, Helmet.js, dan token proteksi.',
                    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
                    author: 'Dents Web Engineering',
                    readingTime: '8 menit baca',
                    tags: ['Security', 'Cybersecurity', 'Web Security', 'OWASP'],
                    isPublished: true,
                    publishedAt: '2026-03-16',
                    updatedAt: '2026-03-16',
                    content: `<h2>Tiga Ancaman Siber Terbesar Web Application (OWASP Top 10)</h2>
<p>Keamanan bukan fitur opsional, melainkan bagian integral dari arsitektur perangkat lunak yang harus diterapkan sejak baris pertama kode ditulis.</p>

<h3>1. Cross-Site Scripting (XSS)</h3>
<p>Terjadi ketika penyerang berhasil menyuntikkan skrip JavaScript jahat ke halaman yang dilihat pengguna lain. Pencegahan: selalu loloskan (escape) karakter HTML berbahaya dan terapkan Content Security Policy (CSP) ketat via Helmet.js.</p>

<h3>2. SQL Injection</h3>
<p>Pencegahan absolut: <strong>JANGAN PERNAH</strong> menggabungkan string query SQL secara manual. Gunakan parameterized queries atau ORM terpercaya seperti Prisma atau Drizzle.</p>

<h3>3. Cross-Site Request Forgery (CSRF)</h3>
<p>Lindungi endpoint state-changing dengan cookie bervalidasi <code>SameSite=Lax</code> atau <code>SameSite=Strict</code> serta token autentikasi rahasia.</p>`
                }
            ]);
        }
    } catch (err) {
        console.error('[SEED] Warning auto-seeding:', err.message);
    }
}

// Global Settings
async function getGlobalSettings() {
    const defaultSettings = {
        siteName: "ents Web",
        brandName: "Dents Web",
        tagline: "Build Your Digital Presence.",
        siteUrl: "https://www.dentsweb.my.id",
        email: "dentswebsitebuilder@gmail.com",
        whatsapp: "6285338922586",
        address: "Indonesia",
        socialLinks: { instagram: "", linkedin: "", facebook: "" },
        defaultSeoTitle: "Dents Web — Website Custom untuk Bisnis yang Ingin Tampil Serius",
        defaultSeoDescription: "Dents Web membantu bisnis membangun website custom yang profesional, cepat, SEO-ready, dan fokus pada konversi.",
        defaultOgImage: "/public/img/axalogo.png",
        googleVerification: "e67nOsjn34kGZ_5feJrhj68I24DnRqzB2OZOpgxIuY4",
        analyticsId: process.env.GOOGLE_ANALYTICS_ID || "",
        favicon: "/public/img/axalogo.png",
        logo: "/public/img/axalogo.png",
        pakasirApiKey: process.env.APIKEY_PAKASIR || "",
        pakasirSlug: process.env.PAKASIR_SLUG || "dentsweb",
        pakasirWebhookSecret: process.env.APIKEY_WEBHOOK_PAKASIR || process.env.PAKASIR_WEBHOOK_SECRET || ""
    };

    try {
        const settings = await redis.get('dents:settings');
        // Ensure initial dummy data is ready
        ensureSeedData();

        if (settings) {
            const merged = {
                ...defaultSettings,
                ...settings,
                analyticsId: (settings.analyticsId && settings.analyticsId.trim() !== '') ? settings.analyticsId : (process.env.GOOGLE_ANALYTICS_ID || defaultSettings.analyticsId),
                pakasirApiKey: (settings.pakasirApiKey && settings.pakasirApiKey.trim() !== '') ? settings.pakasirApiKey : (process.env.APIKEY_PAKASIR || defaultSettings.pakasirApiKey),
                pakasirSlug: (settings.pakasirSlug && settings.pakasirSlug.trim() !== '') ? settings.pakasirSlug : (process.env.PAKASIR_SLUG || defaultSettings.pakasirSlug),
                pakasirWebhookSecret: (settings.pakasirWebhookSecret && settings.pakasirWebhookSecret.trim() !== '') ? settings.pakasirWebhookSecret : (process.env.APIKEY_WEBHOOK_PAKASIR || process.env.PAKASIR_WEBHOOK_SECRET || defaultSettings.pakasirWebhookSecret),
                socialLinks: { ...defaultSettings.socialLinks, ...(settings.socialLinks || {}) }
            };
            if (merged.siteUrl && merged.siteUrl.includes('dentsweb.my.id') && !merged.siteUrl.includes('www.dentsweb.my.id')) {
                merged.siteUrl = merged.siteUrl.replace('dentsweb.my.id', 'www.dentsweb.my.id');
                redis.set('dents:settings', merged).catch(() => {});
            }
            return merged;
        }
        await redis.set('dents:settings', defaultSettings);
        return defaultSettings;
    } catch (err) {
        return defaultSettings;
    }
}

// Helper: Sanitasi input Google Site Verification (Mendukung token polos, meta tag lengkap, atau nama file googleXYZ.html)
function cleanGoogleVerification(code) {
    if (!code || typeof code !== 'string') return '';
    let val = code.trim();
    // Jika user menempel tag meta lengkap: <meta name="google-site-verification" content="..." />
    const metaMatch = val.match(/content=["']([^"']+)["']/i);
    if (metaMatch) return metaMatch[1].trim();
    // Jika user menempel format file: google<hash>.html
    const htmlMatch = val.match(/^google([a-zA-Z0-9_-]+)\.html$/i);
    if (htmlMatch) return htmlMatch[1].trim();
    // Jika user menempel format teks header Google
    val = val.replace(/^google-site-verification:\s*/i, '');
    return val.trim();
}

// Dynamic SEO Builder (Gold Standard Google Search Console & Sitelinks Navigation Parity)
function buildSEO(settings, pageData, extraData = {}) {
    const siteUrl = (settings.siteUrl && settings.siteUrl.trim()) ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const cleanPath = pageData.path === '/' ? '' : (pageData.path || '');
    const fullUrl = `${siteUrl}${cleanPath}`;
    
    const title = pageData.title ? `${pageData.title} | ${settings.brandName || 'Dents Web'}` : settings.defaultSeoTitle;
    const desc = pageData.desc || settings.defaultSeoDescription;
    const image = pageData.image ? (pageData.image.startsWith('http') ? pageData.image : `${siteUrl}${pageData.image}`) : `${siteUrl}${settings.defaultOgImage || '/public/img/axalogo.png'}`;
    const keywords = pageData.keywords || "jasa pembuatan website, web developer profesional, landing page konversi tinggi, sistem informasi kustom, Dents Web, Google Sitelinks, SEO website, arsitektur web performa tinggi";
    const googleVerification = cleanGoogleVerification(settings.googleVerification);

    // Testimonial Reviews & AggregateRating for Google Search Console Rich Results
    let reviewsList = [];
    let ratingValue = "5.0";
    if (extraData.testimonials && extraData.testimonials.length > 0) {
        const pub = extraData.testimonials.filter(t => t.isPublished !== false);
        if (pub.length > 0) {
            const sum = pub.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
            ratingValue = (sum / pub.length).toFixed(1);
            reviewsList = pub.map(t => ({
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": t.name || "Klien Terverifikasi"
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": String(t.rating || 5),
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "reviewBody": t.content || "",
                "publisher": {
                    "@type": "Organization",
                    "name": settings.brandName || "Dents Web"
                }
            }));
        }
    }

    const orgEntity = {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#organization`,
        "name": settings.brandName || "Dents Web",
        "alternateName": ["Dents Web Studio", "DentsWeb", "Dents Web Technology"],
        "url": `${siteUrl}/`,
        "logo": {
            "@type": "ImageObject",
            "@id": `${siteUrl}/#logo`,
            "inLanguage": "id-ID",
            "url": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`,
            "contentUrl": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`,
            "caption": `Logo Resmi ${settings.brandName || 'Dents Web'}`
        },
        "image": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`,
        "description": desc,
        "telephone": `+${settings.whatsapp || '6285338922586'}`,
        "email": settings.email || "dentswebsitebuilder@gmail.com",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "ID",
            "addressLocality": settings.address || "Indonesia"
        },
        "priceRange": "Rp 500.000 - Rp 15.000.000",
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "08:00",
            "closes": "22:00"
        },
        "sameAs": [
            settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : "https://wa.me/6285338922586",
            settings.socialLinks?.instagram,
            settings.socialLinks?.facebook,
            settings.socialLinks?.linkedin
        ].filter(Boolean)
    };

    if (reviewsList.length > 0) {
        orgEntity.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": ratingValue,
            "reviewCount": String(reviewsList.length),
            "bestRating": "5",
            "worstRating": "1"
        };
        orgEntity.review = reviewsList;
    }

    // Core Sitelink Entities for Sitelinks Search & Navigation (Reference: BEM KBMFKG UMI Parity)
    const sitelinkElements = [
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-services`,
            "name": "Layanan Kami",
            "description": "Layanan pembuatan website profesional, landing page konversi tinggi, otomasi Google Sheets, hingga web app kustom.",
            "url": `${siteUrl}/services`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-portfolio`,
            "name": "Portofolio Karya",
            "description": "Galeri proyek website nyata, studi kasus performa, dan solusi digital yang telah sukses diluncurkan.",
            "url": `${siteUrl}/portfolio`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-pricing`,
            "name": "Paket Harga & Investasi",
            "description": "Skema harga transparan tanpa biaya tersembunyi mulai dari Starter, Business, Pro, hingga Custom Enterprise.",
            "url": `${siteUrl}/pricing`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-articles`,
            "name": "Portal Artikel & Edukasi",
            "description": "Wawasan arsitektur performa web, optimasi SEO Google organik, dan strategi digital branding modern.",
            "url": `${siteUrl}/articles`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-about`,
            "name": "Tentang Dents Web",
            "description": "Filosofi rekayasa perangkat lunak, standar performa kecepatan, dan profil studio teknologi Dents Web.",
            "url": `${siteUrl}/about`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-contact`,
            "name": "Hubungi Kami",
            "description": "Konsultasi proyek gratis, audit kebutuhan website bisnis, dan penawaran langsung melalui WhatsApp.",
            "url": `${siteUrl}/contact`
        },
        {
            "@type": "SiteNavigationElement",
            "@id": `${siteUrl}/#nav-faq`,
            "name": "Pusat Bantuan & FAQ",
            "description": "Pertanyaan yang sering diajukan mengenai domain, hosting, waktu pengerjaan, dan dukungan teknis.",
            "url": `${siteUrl}/faq`
        }
    ];

    const websiteEntity = {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": `${siteUrl}/`,
        "name": settings.brandName || "Dents Web",
        "alternateName": ["DentsWeb", "Dents Web Agency", "Dents Web Studio"],
        "description": settings.defaultSeoDescription,
        "publisher": { "@id": `${siteUrl}/#organization` },
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${siteUrl}/articles?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        },
        "hasPart": [
            { "@type": "WebPage", "@id": `${siteUrl}/services#webpage`, "name": "Layanan Kami", "url": `${siteUrl}/services` },
            { "@type": "WebPage", "@id": `${siteUrl}/portfolio#webpage`, "name": "Portofolio Karya", "url": `${siteUrl}/portfolio` },
            { "@type": "WebPage", "@id": `${siteUrl}/pricing#webpage`, "name": "Paket Harga", "url": `${siteUrl}/pricing` },
            { "@type": "WebPage", "@id": `${siteUrl}/articles#webpage`, "name": "Portal Artikel", "url": `${siteUrl}/articles` },
            { "@type": "WebPage", "@id": `${siteUrl}/about#webpage`, "name": "Tentang Kami", "url": `${siteUrl}/about` },
            { "@type": "WebPage", "@id": `${siteUrl}/contact#webpage`, "name": "Hubungi Kami", "url": `${siteUrl}/contact` },
            { "@type": "WebPage", "@id": `${siteUrl}/faq#webpage`, "name": "Pusat Bantuan & FAQ", "url": `${siteUrl}/faq` }
        ]
    };

    let schemaGraph = [
        websiteEntity,
        orgEntity,
        {
            "@type": "WebPage",
            "@id": `${fullUrl}#webpage`,
            "url": fullUrl,
            "name": title,
            "description": desc,
            "isPartOf": { "@id": `${siteUrl}/#website` },
            "about": { "@id": `${siteUrl}/#organization` },
            "breadcrumb": { "@id": `${fullUrl}#breadcrumb` }
        }
    ];

    let breadcrumbElements = [{
        "@type": "ListItem",
        "position": 1,
        "name": "Beranda",
        "item": `${siteUrl}/`
    }];

    if (pageData.path && pageData.path !== '/') {
        const pathParts = pageData.path.split('/').filter(p => p);
        let currUrl = siteUrl;
        pathParts.forEach((part, idx) => {
            currUrl += `/${part}`;
            breadcrumbElements.push({
                "@type": "ListItem",
                "position": idx + 2,
                "name": part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
                "item": currUrl
            });
        });
    }

    schemaGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${fullUrl}#breadcrumb`,
        "name": `Breadcrumb ${title}`,
        "itemListElement": breadcrumbElements
    });

    if (pageData.path === '/') {
        // Inject standalone SiteNavigationElement objects for Google Sitelinks parser
        schemaGraph.push(...sitelinkElements);
        schemaGraph.push({
            "@type": "ItemList",
            "@id": `${siteUrl}/#sitelinks-list`,
            "name": "Navigasi Utama Dents Web",
            "itemListElement": sitelinkElements.map((el, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "item": el
            }))
        });
    }

    if (pageData.schema) {
        schemaGraph.push(pageData.schema);
    }

    const finalSchema = {
        "@context": "https://schema.org",
        "@graph": schemaGraph
    };

    const safeSchemaString = JSON.stringify(finalSchema).replace(/</g, '\\u003c');

    return {
        title,
        desc,
        url: fullUrl,
        path: pageData.path || '/',
        siteUrl,
        image,
        keywords,
        googleVerification,
        analyticsId: settings.analyticsId || '',
        schemaString: safeSchemaString
    };
}

// Authentication Middleware
async function requireAdmin(req, res, next) {
    const sessionId = req.cookies.admin_session;
    if (!sessionId) {
        if (req.path.startsWith('/api/')) return res.status(401).json({ success: false, message: 'Unauthorized' });
        return res.redirect('/admin-login');
    }
    try {
        const sessionData = await redis.get(`dents:admin:sessions:${sessionId}`);
        if (!sessionData) {
            res.clearCookie('admin_session');
            if (req.path.startsWith('/api/')) return res.status(401).json({ success: false, message: 'Session expired' });
            return res.redirect('/admin-login');
        }
        await redis.expire(`dents:admin:sessions:${sessionId}`, 1800);
        next();
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
}

// Reviewer & Sandbox Testing Authentication Middleware (Supports tester_session or admin_session)
async function requireTesterOrAdmin(req, res, next) {
    const adminSessionId = req.cookies.admin_session;
    const testerSessionId = req.cookies.tester_session;

    // 1. If active admin session exists and is valid
    if (adminSessionId) {
        try {
            const adminData = await redis.get(`dents:admin:sessions:${adminSessionId}`);
            if (adminData) {
                req.testerUser = adminData.username || 'admin';
                req.isAdminUser = true;
                await redis.expire(`dents:admin:sessions:${adminSessionId}`, 1800);
                return next();
            }
        } catch (e) {}
    }

    // 2. If active tester session exists and is valid
    if (testerSessionId) {
        try {
            const testerData = await redis.get(`dents:tester:sessions:${testerSessionId}`);
            if (testerData) {
                req.testerUser = testerData.username || 'pakasir_reviewer';
                req.isAdminUser = false;
                await redis.expire(`dents:tester:sessions:${testerSessionId}`, 7200);
                return next();
            }
        } catch (e) {}
    }

    // If neither session is valid
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Silakan login ke portal pengujian /webhook-login.' });
    }
    return res.redirect('/webhook-login');
}

// ==========================================
// PUBLIC SSR ROUTES
// ==========================================
app.get('/', async (req, res) => {
    const settings = await getGlobalSettings();
    const rawServices = await redis.get('dents:services') || [];
    const rawPortfolio = await redis.get('dents:portfolio') || [];
    const rawTestimonials = await redis.get('dents:testimonials') || []; 
    const rawFaq = await redis.get('dents:faq') || [];
    
    const publishedServices = (Array.isArray(rawServices) ? rawServices : [])
        .filter(s => s.isPublished !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const featuredPortfolio = (Array.isArray(rawPortfolio) ? rawPortfolio : [])
        .filter(p => p.isPublished && p.isFeatured);
    const activeTestimonials = (Array.isArray(rawTestimonials) ? rawTestimonials : [])
        .filter(t => t.isPublished !== false); 
    const publishedFaq = (Array.isArray(rawFaq) ? rawFaq : [])
        .filter(f => f.isPublished !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('index', { 
        settings, 
        services: publishedServices.slice(0, 4),
        portfolio: featuredPortfolio.length ? featuredPortfolio : rawPortfolio,
        testimonials: activeTestimonials,
        faq: publishedFaq.length ? publishedFaq : INITIAL_8_FAQS,
        seo: buildSEO(settings, { title: "", desc: settings.defaultSeoDescription, path: '/' }, { testimonials: activeTestimonials, services: rawServices, portfolio: rawPortfolio }) 
    });
});

app.get('/services', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const services = await redis.get('dents:services') || [];
    const publishedServices = services.filter(s => s.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    const serviceSchema = {
        "@type": "ItemList",
        "@id": `${siteUrl}/services#list`,
        "name": "Daftar Layanan Dents Web",
        "itemListElement": publishedServices.map((s, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `${siteUrl}/services#${s.slug || idx}`,
            "name": s.title,
            "description": s.shortDescription || s.description
        }))
    };

    res.render('services', {
        settings,
        services: publishedServices,
        seo: buildSEO(settings, { title: 'Layanan Kami', desc: 'Jelajahi layanan pembuatan website dan aplikasi custom Dents Web.', path: '/services', schema: serviceSchema })
    });
});

// Serve Portfolio Image Directly from Redis Database (Self-Contained DB-driven)
app.get('/api/portfolio/:id/image', async (req, res) => {
    const { id } = req.params;
    try {
        const portfolio = await redis.get('dents:portfolio') || [];
        const item = (Array.isArray(portfolio) ? portfolio : []).find(p => p.id === id || p.slug === id || p.id === 'port_' + id || p.id === `port_0${id}`);
        if (!item || !item.image) {
            return res.redirect('/public/img/axalogo.png');
        }
        if (item.image.startsWith('data:')) {
            const matches = item.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const contentType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                res.set('Content-Type', contentType);
                res.set('Cache-Control', 'public, max-age=604800');
                return res.send(buffer);
            }
        }
        return res.redirect(item.image);
    } catch (e) {
        return res.redirect('/public/img/axalogo.png');
    }
});

app.get('/portfolio', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const portfolio = await redis.get('dents:portfolio') || [];
    const publishedPortfolio = portfolio.filter(p => p.isPublished).sort((a, b) => (b.year || 0) - (a.year || 0));

    const portfolioSchema = {
        "@type": "ItemList",
        "@id": `${siteUrl}/portfolio#list`,
        "name": "Studi Kasus Portofolio Dents Web",
        "itemListElement": publishedPortfolio.map((p, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `${siteUrl}/portfolio/${p.slug}`,
            "name": p.title,
            "description": p.shortDescription || p.description
        }))
    };

    res.render('portfolio', {
        settings,
        portfolio: publishedPortfolio,
        seo: buildSEO(settings, { title: 'Portfolio Kami', desc: 'Karya digital dan studi kasus proyek dari klien-klien Dents Web.', path: '/portfolio', schema: portfolioSchema })
    });
});

app.get('/portfolio/:slug', async (req, res) => {
    const settings = await getGlobalSettings();
    const portfolioList = await redis.get('dents:portfolio') || [];
    const project = portfolioList.find(p => p.slug === req.params.slug && p.isPublished);

    if (!project) {
        return res.status(404).render('404', {
            settings,
            seo: buildSEO(settings, {
                title: '404 - Portofolio Tidak Ditemukan | Dents Web',
                desc: 'Studi kasus portofolio yang Anda tuju tidak ditemukan atau telah dipindahkan.',
                path: req.originalUrl || req.path
            })
        });
    }

    res.render('portfolio-detail', {
        settings,
        project,
        seo: buildSEO(settings, { title: project.seoTitle || project.title, desc: project.seoDescription || project.shortDescription || project.description, path: `/portfolio/${project.slug}`, image: project.image })
    });
});

app.get('/pricing', async (req, res) => {
    const settings = await getGlobalSettings();
    const pricing = await redis.get('dents:pricing') || [];
    const activePricing = pricing.filter(p => p.isPublished !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('pricing', {
        settings,
        pricing: activePricing,
        seo: buildSEO(settings, { title: 'Investasi Digital & Paket Harga', desc: 'Skema harga transparan tanpa biaya tersembunyi untuk website dan aplikasi Anda.', path: '/pricing' })
    });
});

app.get('/faq', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const faq = await redis.get('dents:faq') || [];
    const publishedFaq = faq.filter(f => f.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    const faqSchema = publishedFaq.length > 0 ? {
        "@type": "FAQPage",
        "@id": `${siteUrl}/faq#faq`,
        "mainEntity": publishedFaq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
    } : null;

    res.render('faq', {
        settings,
        faq: publishedFaq,
        seo: buildSEO(settings, { title: 'FAQ & Tanya Jawab', desc: 'Pertanyaan yang sering diajukan mengenai layanan dan proses pembuatan website Dents Web.', path: '/faq', schema: faqSchema })
    });
});

app.get('/about', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('about', {
        settings,
        seo: buildSEO(settings, { title: 'Tentang Kami', desc: 'Filosofi rekayasa, standar kualitas, dan profil studio teknologi Dents Web.', path: '/about' })
    });
});

app.get('/contact', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('contact', {
        settings,
        seo: buildSEO(settings, { title: 'Hubungi Kami', desc: 'Konsultasikan kebutuhan website dan aplikasi Anda dengan tim Dents Web.', path: '/contact' })
    });
});

// ==========================================
// ARTICLES SSR ROUTES (Gold Standard SEO)
// ==========================================
app.get('/articles', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const allArticles = await redis.get('dents:articles') || [];
    let articles = allArticles.filter(a => a.isPublished !== false).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    const selectedCategory = req.query.category || 'All';
    const searchQuery = (req.query.q || '').trim().toLowerCase();

    if (selectedCategory && selectedCategory !== 'All') {
        articles = articles.filter(a => (a.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery) {
        articles = articles.filter(a => 
            (a.title || '').toLowerCase().includes(searchQuery) ||
            (a.excerpt || '').toLowerCase().includes(searchQuery) ||
            (a.tags && a.tags.some(t => t.toLowerCase().includes(searchQuery)))
        );
    }

    const categories = ['All', 'Frontend', 'Backend', 'Database', 'DevOps', 'Security'];

    const articleListSchema = {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/articles#collection`,
        "name": "Kumpulan Artikel & Tutorial Pemrograman Dents Web",
        "description": "Materi, panduan teknis, dan artikel pengembangan web modern berstandar industri.",
        "url": `${siteUrl}/articles`,
        "mainEntity": {
            "@type": "ItemList",
            "name": "Daftar Artikel Rekayasa Web",
            "itemListElement": articles.map((a, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "url": `${siteUrl}/article/${a.slug}`,
                "name": a.title,
                "description": a.excerpt
            }))
        }
    };

    res.render('article', {
        settings,
        articles,
        categories,
        selectedCategory,
        searchQuery,
        seo: buildSEO(settings, {
            title: 'Artikel & Panduan Pemrograman Modern',
            desc: 'Kumpulan artikel mendalam, dokumentasi teknis, dan tutorial pemrograman web untuk pengembang modern.',
            path: '/articles',
            schema: articleListSchema
        })
    });
});

app.get('/article/:slug', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    const allArticles = await redis.get('dents:articles') || [];
    const article = allArticles.find(a => a.slug === req.params.slug && a.isPublished !== false);

    if (!article) {
        return res.status(404).render('404', {
            settings,
            seo: buildSEO(settings, { title: 'Artikel Tidak Ditemukan', desc: 'Maaf, artikel yang Anda cari tidak tersedia atau telah dipindahkan.', path: req.path })
        });
    }

    // Related articles
    const relatedArticles = allArticles
        .filter(a => a.id !== article.id && a.isPublished !== false && (a.category === article.category || !article.category))
        .slice(0, 3);

    const articleSchema = {
        "@type": "TechArticle",
        "@id": `${siteUrl}/article/${article.slug}#article`,
        "headline": article.title,
        "description": article.excerpt,
        "image": article.coverImage ? (article.coverImage.startsWith('http') ? article.coverImage : `${siteUrl}${article.coverImage}`) : `${siteUrl}${settings.defaultOgImage || '/public/img/axalogo.png'}`,
        "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
        "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
        "author": {
            "@type": "Organization",
            "name": article.author || settings.brandName || "Dents Web Engineering",
            "url": `${siteUrl}/`
        },
        "publisher": {
            "@type": "Organization",
            "name": settings.brandName || "Dents Web",
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${siteUrl}/article/${article.slug}`
        },
        "keywords": (article.tags || []).join(', ')
    };

    res.render('article-detail', {
        settings,
        article,
        relatedArticles,
        seo: buildSEO(settings, {
            title: article.title,
            desc: article.excerpt,
            path: `/article/${article.slug}`,
            image: article.coverImage,
            keywords: (article.tags || []).join(', '),
            schema: articleSchema
        })
    });
});

// Leads API
app.post('/api/leads', leadLimiter, async (req, res) => {
    try {
        const { name, whatsapp, email, company, message } = req.body;
        if (!name || !whatsapp || !message) return res.status(400).json({ success: false, message: 'Nama, WhatsApp, dan Pesan wajib diisi.' });

        const newLead = {
            id: `lead_${Date.now()}`,
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            email: email ? email.trim() : '',
            company: company ? company.trim() : '',
            message: message.trim(),
            status: 'NEW', 
            createdAt: new Date().toISOString()
        };

        const leads = await redis.get('dents:leads') || [];
        leads.unshift(newLead);
        if (leads.length > 500) leads.pop();
        await redis.set('dents:leads', leads);
        res.status(201).json({ success: true, message: 'Pesan berhasil dikirim.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// ==========================================
// PUBLIC LIVE CHAT CS APIS (TAWK.TO STYLE)
// ==========================================
app.post('/api/chat/start', async (req, res) => {
    try {
        const { name, email, phone, category, message, sessionId } = req.body;
        if (!name || !message) {
            return res.status(400).json({ success: false, message: 'Nama dan pesan wajib diisi.' });
        }

        const sid = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];

        let existingChat = chats.find(c => c.sessionId === sid);
        const timestamp = new Date().toISOString();
        const clientName = name.trim();
        const clientEmail = email ? email.trim() : '';
        const clientPhone = phone ? phone.trim() : '';
        const clientCategory = category || 'Jasa Pembuatan Website Baru';

        const initialMsg = {
            id: `msg_${Date.now()}`,
            sender: 'CUSTOMER',
            senderName: clientName,
            text: message.trim(),
            timestamp
        };

        if (existingChat) {
            existingChat.name = clientName;
            existingChat.email = clientEmail || existingChat.email;
            existingChat.phone = clientPhone || existingChat.phone;
            existingChat.category = clientCategory || existingChat.category;
            existingChat.customer = {
                name: existingChat.name,
                email: existingChat.email,
                phone: existingChat.phone,
                category: existingChat.category
            };
            existingChat.status = 'open';
            existingChat.unreadByAdmin = (existingChat.unreadByAdmin || 0) + 1;
            existingChat.lastMessage = message.trim();
            existingChat.lastMessageAt = timestamp;
            existingChat.messages.push(initialMsg);
        } else {
            const newChat = {
                id: `chat_${Date.now()}`,
                sessionId: sid,
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
                category: clientCategory,
                customer: {
                    name: clientName,
                    email: clientEmail,
                    phone: clientPhone,
                    category: clientCategory
                },
                status: 'open',
                unreadByAdmin: 1,
                lastMessage: message.trim(),
                lastMessageAt: timestamp,
                createdAt: timestamp,
                messages: [initialMsg]
            };
            chats.unshift(newChat);
            if (chats.length > 500) chats.pop();
            existingChat = newChat;
        }

        await redis.set('dents:chats', chats);
        res.status(201).json({ 
            success: true, 
            sessionId: sid, 
            chat: existingChat, 
            messages: existingChat.messages 
        });
    } catch (err) {
        console.error('[CHAT START ERROR]', err);
        res.status(500).json({ success: false, message: 'Gagal memulai chat.' });
    }
});

app.get('/api/chat/messages/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const chats = await redis.get('dents:chats') || [];
        const chat = Array.isArray(chats) ? chats.find(c => c.sessionId === sessionId || c.id === sessionId) : null;
        if (chat) {
            const cust = chat.customer || {};
            chat.name = chat.name || cust.name || 'Klien';
            chat.email = chat.email || cust.email || '';
            chat.phone = chat.phone || cust.phone || '';
            chat.category = chat.category || cust.category || 'Jasa Pembuatan Website Baru';
            chat.customer = {
                name: chat.name,
                email: chat.email,
                phone: chat.phone,
                category: chat.category
            };
        }
        res.json({ 
            success: true, 
            chat: chat, 
            messages: chat ? chat.messages : [] 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memuat pesan.' });
    }
});

app.post('/api/chat/send', async (req, res) => {
    try {
        const { sessionId, message, sender, senderName } = req.body;
        if (!sessionId || !message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
        }

        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];

        const chat = chats.find(c => c.sessionId === sessionId || c.id === sessionId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Sesi chat tidak ditemukan.' });
        }

        const timestamp = new Date().toISOString();
        const clientName = (chat.customer && chat.customer.name) || chat.name || senderName || 'Klien';
        const newMsg = {
            id: `msg_${Date.now()}`,
            sender: 'CUSTOMER',
            senderName: clientName,
            text: message.trim(),
            timestamp
        };

        chat.messages.push(newMsg);
        chat.lastMessage = newMsg.text;
        chat.lastMessageAt = timestamp;
        chat.status = 'open';
        chat.unreadByAdmin = (chat.unreadByAdmin || 0) + 1;

        await redis.set('dents:chats', chats);
        res.json({ success: true, message: newMsg, chat });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan.' });
    }
});

// Admin Auth & Endpoints
app.get('/admin', (req, res) => {
    if (req.cookies.admin_session) return res.redirect('/admin-dashboard');
    res.redirect('/admin-login');
});

app.get('/admin-login', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.cookies.admin_session) return res.redirect('/admin-dashboard');
    res.render('admin-login', { seo: { title: 'Admin Login', desc: '', path: '' }});
});

app.post('/admin/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const envUser = process.env.ADMIN_USERNAME;
        const envPass = process.env.ADMIN_PASSWORD;

        if (!envUser || !envPass) return res.status(500).json({ success: false, message: 'Server misconfiguration.' });
        if (username !== envUser || password !== envPass) return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });

        const sessionId = crypto.randomUUID();
        await redis.set(`dents:admin:sessions:${sessionId}`, { username, loginAt: new Date().toISOString() }, { ex: 3600 });
        res.cookie('admin_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 3600000 });
        res.json({ success: true, redirect: '/admin-dashboard' });
    } catch (err) { res.status(500).json({ success: false, message: 'Internal Server Error' }); }
});

app.post('/admin/logout', async (req, res) => {
    const sessionId = req.cookies.admin_session;
    if (sessionId) {
        await redis.del(`dents:admin:sessions:${sessionId}`);
        res.clearCookie('admin_session');
    }
    res.json({ success: true });
});

app.get('/admin-dashboard', requireAdmin, async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('admin-dashboard', { settings, seo: { title: 'Dashboard Admin', desc: '', path: '' }});
});

// Pakasir KYC Reviewer & Testing Portal Routes
app.get(['/webhook-login', '/test-login'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.cookies.tester_session || req.cookies.admin_session) {
        return res.redirect('/webhook-dashboard');
    }
    res.render('test-login', { seo: { title: 'Pakasir Reviewer Login', desc: '', path: req.path }});
});

app.post('/api/webhook-login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const envUser = process.env.ADMINTESTING_USER || 'pakasirtest123';
        const envPass = process.env.ADMINTESTING_PASS || 'pakasirtest321';

        if (!username || !password || username !== envUser || password !== envPass) {
            return res.status(401).json({ success: false, message: 'Kredensial login testing tidak valid. Periksa kembali username & password.' });
        }

        const sessionId = crypto.randomUUID();
        await redis.set(`dents:tester:sessions:${sessionId}`, { username, loginAt: new Date().toISOString() }, { ex: 7200 });
        res.cookie('tester_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7200000
        });
        res.json({ success: true, redirect: '/webhook-dashboard' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/api/webhook-logout', async (req, res) => {
    const sessionId = req.cookies.tester_session;
    if (sessionId) {
        await redis.del(`dents:tester:sessions:${sessionId}`);
        res.clearCookie('tester_session');
    }
    res.json({ success: true });
});

app.get('/webhook-dashboard', requireTesterOrAdmin, async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('webhook-dashboard', {
        settings,
        user: req.testerUser || 'Reviewer Pakasir',
        seo: { title: 'Pakasir KYC Reviewer Console', desc: '', path: req.path }
    });
});

async function handleListGet(req, res, redisKey) {
    try {
        const data = await redis.get(redisKey) || [];
        res.json({ success: true, data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function handleListUpdate(req, res, redisKey, idField = 'id') {
    try {
        const payload = req.body;
        let list = await redis.get(redisKey) || [];
        
        if (req.method === 'POST') {
            payload[idField] = `${redisKey.split(':').pop()}_${Date.now()}`;
            payload.createdAt = new Date().toISOString();
            list.unshift(payload);
        } else if (req.method === 'PUT' || req.method === 'PATCH') {
            const index = list.findIndex(item => item[idField] === req.params.id);
            if (index === -1) return res.status(404).json({ success: false, message: 'Not found' });
            payload.updatedAt = new Date().toISOString();
            list[index] = { ...list[index], ...payload };
        } else if (req.method === 'DELETE') {
            list = list.filter(item => item[idField] !== req.params.id);
        }

        await redis.set(redisKey, list);
        res.json({ success: true, message: 'Operasi berhasil.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
}

// Leads Admin API
app.get('/api/admin/leads', requireAdmin, (req, res) => handleListGet(req, res, 'dents:leads'));
app.patch('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));
app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));

// Portfolio Admin API
app.get('/api/admin/portfolio', requireAdmin, (req, res) => handleListGet(req, res, 'dents:portfolio'));
app.post('/api/admin/portfolio', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.put('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.delete('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));

// Articles Admin API (NEW)
app.get('/api/admin/articles', requireAdmin, (req, res) => handleListGet(req, res, 'dents:articles'));
app.post('/api/admin/articles', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:articles'));
app.put('/api/admin/articles/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:articles'));
app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:articles'));

// Services Admin API
app.get('/api/admin/services', requireAdmin, (req, res) => handleListGet(req, res, 'dents:services'));
app.post('/api/admin/services', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.put('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.delete('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));

// Pricing Admin API
app.get('/api/admin/pricing', requireAdmin, (req, res) => handleListGet(req, res, 'dents:pricing'));
app.post('/api/admin/pricing', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));
app.put('/api/admin/pricing/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));
app.delete('/api/admin/pricing/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));

// FAQ Admin API
app.get('/api/admin/faq', requireAdmin, (req, res) => handleListGet(req, res, 'dents:faq'));
app.post('/api/admin/faq', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.put('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.delete('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));

// Testimonials Admin API
app.get('/api/admin/testimonials', requireAdmin, (req, res) => handleListGet(req, res, 'dents:testimonials'));
app.post('/api/admin/testimonials', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:testimonials'));
app.put('/api/admin/testimonials/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:testimonials'));
app.delete('/api/admin/testimonials/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:testimonials'));

// Live Chat Admin API
app.get('/api/admin/chats', requireAdmin, async (req, res) => {
    try {
        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];
        const normalized = chats.map(c => {
            const cust = c.customer || {};
            const name = c.name || cust.name || 'Klien';
            const email = c.email || cust.email || '-';
            const phone = c.phone || cust.phone || '-';
            const category = c.category || cust.category || 'Umum';
            return {
                ...c,
                name,
                email,
                phone,
                category,
                customer: {
                    name,
                    email,
                    phone,
                    category
                }
            };
        });
        res.json({ success: true, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memuat percakapan.' });
    }
});

app.get('/api/admin/chats/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];
        const chat = chats.find(c => c.id === id || c.sessionId === id);
        if (!chat) return res.status(404).json({ success: false, message: 'Chat tidak ditemukan.' });
        
        // Normalize customer info
        const cust = chat.customer || {};
        chat.name = chat.name || cust.name || 'Klien';
        chat.email = chat.email || cust.email || '-';
        chat.phone = chat.phone || cust.phone || '-';
        chat.category = chat.category || cust.category || 'Umum';
        chat.customer = {
            name: chat.name,
            email: chat.email,
            phone: chat.phone,
            category: chat.category
        };

        // Mark read by admin
        chat.unreadByAdmin = 0;
        await redis.set('dents:chats', chats);
        res.json({ success: true, data: chat });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

app.post('/api/admin/chats/:id/reply', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, adminName } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Pesan balasan wajib diisi.' });
        }

        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];
        const chat = chats.find(c => c.id === id || c.sessionId === id);
        if (!chat) return res.status(404).json({ success: false, message: 'Chat tidak ditemukan.' });

        const timestamp = new Date().toISOString();
        const replyMsg = {
            id: `msg_${Date.now()}`,
            sender: 'ADMIN',
            senderName: adminName || 'CS Support (Anda)',
            text: message.trim(),
            timestamp
        };

        if (!Array.isArray(chat.messages)) chat.messages = [];
        chat.messages.push(replyMsg);
        chat.lastMessage = `Admin: ${replyMsg.text}`;
        chat.lastMessageAt = timestamp;
        chat.unreadByAdmin = 0;
        chat.unreadByCustomer = (chat.unreadByCustomer || 0) + 1;
        await redis.set('dents:chats', chats);
        res.json({ success: true, message: replyMsg });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengirim balasan.' });
    }
});

app.patch('/api/admin/chats/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];
        const chat = chats.find(c => c.id === id || c.sessionId === id);
        if (!chat) return res.status(404).json({ success: false, message: 'Chat tidak ditemukan.' });

        chat.status = status || 'RESOLVED';
        await redis.set('dents:chats', chats);
        res.json({ success: true, message: 'Status berhasil diubah.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal update status.' });
    }
});

app.delete('/api/admin/chats/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let chats = await redis.get('dents:chats') || [];
        if (!Array.isArray(chats)) chats = [];
        chats = chats.filter(c => c.id !== id && c.sessionId !== id);
        await redis.set('dents:chats', chats);
        res.json({ success: true, message: 'Percakapan berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menghapus percakapan.' });
    }
});

// ==========================================
// PAKASIR PAYMENT GATEWAY INTEGRATION (API v2)
// ==========================================

const PAKASIR_BASE_URL = 'https://app.pakasir.com';

// Payment methods metadata with limits (from official docs & user spec)
const PAKASIR_PAYMENT_METHODS = {
    payment_link: { code: 'payment_link', name: 'Payment Link', min: 500, max: 50000000, type: 'link' },
    qris: { code: 'qris', name: 'QRIS', min: 500, max: 10000000, type: 'qr' },
    bri_va: { code: 'bri_va', name: 'BRI Virtual Account', min: 10000, max: 50000000, type: 'va' },
    bni_va: { code: 'bni_va', name: 'BNI Virtual Account', min: 10000, max: 50000000, type: 'va' },
    cimb_niaga_va: { code: 'cimb_niaga_va', name: 'CIMB Niaga Virtual Account', min: 10000, max: 50000000, type: 'va' },
    maybank_va: { code: 'maybank_va', name: 'Maybank Virtual Account', min: 10000, max: 50000000, type: 'va' },
    permata_va: { code: 'permata_va', name: 'Permata Virtual Account', min: 10000, max: 50000000, type: 'va' },
    bnc_va: { code: 'bnc_va', name: 'Bank Neo Commerce Virtual Account', min: 10000, max: 50000000, type: 'va' },
    artha_graha_va: { code: 'artha_graha_va', name: 'Artha Graha Virtual Account', min: 10000, max: 50000000, type: 'va' },
    sampoerna_va: { code: 'sampoerna_va', name: 'Bank Sahabat Sampoerna VA', min: 10000, max: 50000000, type: 'va' }
};

// Helper: Get active Pakasir configuration from Redis settings or .env fallback
async function getPakasirConfig() {
    const settings = await getGlobalSettings();
    const apiKey = settings.pakasirApiKey || process.env.APIKEY_PAKASIR || '';
    const slug = settings.pakasirSlug || process.env.PAKASIR_SLUG || 'dentsweb';
    const webhookSecret = settings.pakasirWebhookSecret || process.env.APIKEY_WEBHOOK_PAKASIR || process.env.PAKASIR_WEBHOOK_SECRET || '';
    return { apiKey, slug, webhookSecret };
}

// 1. PUBLIC WEBHOOK ROUTER (Pakasir Callback Receiver)
// Receives notifications when transactions are completed
app.post('/api/webhook/pakasir', async (req, res) => {
    try {
        const payload = req.body || {};
        const incomingSecret = req.headers['x-secret'] || req.headers['x-api-key'] || '';
        const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
        const config = await getPakasirConfig();

        const secretMatched = (!config.webhookSecret) || (incomingSecret === config.webhookSecret);

        const logEntry = {
            id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            receivedAt: new Date().toISOString(),
            ip: clientIp,
            secretMatched: !!secretMatched,
            txn_id: payload.txn_id || '-',
            order_id: payload.order_id || '-',
            amount: payload.amount || 0,
            status: payload.status || 'unknown',
            is_sandbox: !!payload.is_sandbox,
            completed_at: payload.completed_at || null,
            rawPayload: payload,
            headers: {
                'x-secret': incomingSecret ? (incomingSecret.slice(0, 4) + '...' + incomingSecret.slice(-4)) : 'missing',
                'user-agent': req.headers['user-agent'] || '-'
            }
        };

        // Save to Redis Webhook Logs (Keep last 150 entries)
        let webhookLogs = await redis.get('dents:pakasir:webhook_logs') || [];
        if (!Array.isArray(webhookLogs)) webhookLogs = [];
        webhookLogs.unshift(logEntry);
        if (webhookLogs.length > 150) webhookLogs = webhookLogs.slice(0, 150);
        await redis.set('dents:pakasir:webhook_logs', webhookLogs);

        // If secret matches (or no secret configured), update corresponding transaction status
        if (secretMatched && (payload.txn_id || payload.order_id)) {
            let txns = await redis.get('dents:pakasir:transactions') || [];
            if (Array.isArray(txns)) {
                let matchedIndex = -1;
                if (payload.txn_id) {
                    matchedIndex = txns.findIndex(t => t.txn_id === payload.txn_id);
                }
                if (matchedIndex === -1 && payload.order_id) {
                    matchedIndex = txns.findIndex(t => t.order_id === payload.order_id);
                }

                if (matchedIndex !== -1) {
                    txns[matchedIndex].status = payload.status || 'completed';
                    if (payload.completed_at) txns[matchedIndex].completed_at = payload.completed_at;
                    txns[matchedIndex].updatedAt = new Date().toISOString();
                    txns[matchedIndex].lastWebhookReceivedAt = new Date().toISOString();
                    await redis.set('dents:pakasir:transactions', txns);
                }
            }
        }

        return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    } catch (err) {
        console.error('Error handling Pakasir webhook:', err);
        return res.status(200).json({ success: false, error: err.message }); // Always return 200 to prevent webhook retry spam
    }
});

// 2. ADMIN & REVIEWER API: Get & Update Pakasir Config
app.get('/api/admin/pakasir/config', requireTesterOrAdmin, async (req, res) => {
    try {
        const config = await getPakasirConfig();
        const settings = await getGlobalSettings();
        res.json({
            success: true,
            data: {
                slug: config.slug,
                apiKey: config.apiKey,
                webhookSecret: config.webhookSecret,
                webhookUrl: `${settings.siteUrl}/api/webhook/pakasir`
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/pakasir/config', requireAdmin, async (req, res) => {
    try {
        const { slug, apiKey, webhookSecret } = req.body || {};
        const settings = await getGlobalSettings();
        const updated = {
            ...settings,
            pakasirSlug: (slug !== undefined ? slug.trim() : settings.pakasirSlug),
            pakasirApiKey: (apiKey !== undefined ? apiKey.trim() : settings.pakasirApiKey),
            pakasirWebhookSecret: (webhookSecret !== undefined ? webhookSecret.trim() : settings.pakasirWebhookSecret)
        };
        await redis.set('dents:settings', updated);
        res.json({ success: true, message: 'Konfigurasi Pakasir berhasil diperbarui!', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi Pakasir.' });
    }
});

// 3. ADMIN & REVIEWER API: Create Transaction (POST /api/v2/create-transaction/{slug}/{order_id})
app.post('/api/admin/pakasir/transactions', requireTesterOrAdmin, async (req, res) => {
    try {
        const { method, amount, order_id, customer_name, customer_email, notes } = req.body || {};
        const numAmount = parseInt(amount, 10);
        if (!method || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Metode pembayaran dan nominal amount (angka positif) wajib diisi.' });
        }

        const methodMeta = PAKASIR_PAYMENT_METHODS[method];
        if (!methodMeta) {
            return res.status(400).json({ success: false, message: `Metode pembayaran '${method}' tidak valid.` });
        }
        if (numAmount < methodMeta.min || numAmount > methodMeta.max) {
            return res.status(400).json({
                success: false,
                message: `Nominal untuk ${methodMeta.name} harus antara Rp ${methodMeta.min.toLocaleString('id-ID')} s/d Rp ${methodMeta.max.toLocaleString('id-ID')}.`
            });
        }

        const config = await getPakasirConfig();
        if (!config.apiKey || !config.slug) {
            return res.status(400).json({
                success: false,
                message: 'API Key atau Project Slug Pakasir belum disetel. Periksa konfigurasi Pakasir di tab Pengaturan.'
            });
        }

        // Clean / Generate Order ID
        let cleanOrderId = (order_id || '').trim();
        if (!cleanOrderId) {
            cleanOrderId = `DW-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Call Pakasir API v2: POST /api/v2/create-transaction/{slug}/{order_id}
        const endpoint = `${PAKASIR_BASE_URL}/api/v2/create-transaction/${encodeURIComponent(config.slug)}/${encodeURIComponent(cleanOrderId)}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': config.apiKey
            },
            body: JSON.stringify({
                method: method,
                amount: numAmount
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: data.message || data.error || 'Gagal membuat transaksi di Pakasir.',
                raw: data
            });
        }

        // Construct standardized transaction record
        const nowIso = new Date().toISOString();
        const transactionRecord = {
            id: `pakasir_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            txn_id: data.txn_id,
            order_id: cleanOrderId,
            project_slug: config.slug,
            method: method,
            method_name: methodMeta.name,
            amount: numAmount,
            fee: data.fee || 0,
            total_payment: data.total_payment || numAmount,
            payment_link: data.payment_link || (method === 'payment_link' ? `https://app.pakasir.com/pay-v2/${data.txn_id}` : ''),
            qr_string: data.qr_string || '',
            va_number: data.va_number || '',
            expired_at: data.expired_at || null,
            is_sandbox: !!data.is_sandbox,
            status: data.status || 'pending',
            completed_at: data.completed_at || null,
            customer_name: (customer_name || '').trim(),
            customer_email: (customer_email || '').trim(),
            notes: (notes || '').trim(),
            createdAt: nowIso,
            updatedAt: nowIso
        };

        // Save to Redis
        let txns = await redis.get('dents:pakasir:transactions') || [];
        if (!Array.isArray(txns)) txns = [];
        txns.unshift(transactionRecord);
        await redis.set('dents:pakasir:transactions', txns);

        res.json({
            success: true,
            message: 'Transaksi berhasil dibuat!',
            data: transactionRecord
        });
    } catch (err) {
        console.error('Error creating Pakasir transaction:', err);
        res.status(500).json({ success: false, message: 'Server error saat menghubungi Pakasir: ' + err.message });
    }
});

// 4. ADMIN & REVIEWER API: List Transactions
app.get('/api/admin/pakasir/transactions', requireTesterOrAdmin, async (req, res) => {
    try {
        let txns = await redis.get('dents:pakasir:transactions') || [];
        if (!Array.isArray(txns)) txns = [];
        res.json({ success: true, data: txns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. ADMIN & REVIEWER API: Check Transaction Status (Live from Pakasir GET /api/v2/transaction-status/{slug}/{txn_id})
app.get('/api/admin/pakasir/transactions/:id/status', requireTesterOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let txns = await redis.get('dents:pakasir:transactions') || [];
        if (!Array.isArray(txns)) txns = [];

        const index = txns.findIndex(t => t.id === id || t.txn_id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan di database.' });
        }

        const txn = txns[index];
        const config = await getPakasirConfig();
        const slug = txn.project_slug || config.slug;

        // Call Pakasir API: GET /api/v2/transaction-status/{slug}/{txn_id}
        const endpoint = `${PAKASIR_BASE_URL}/api/v2/transaction-status/${encodeURIComponent(slug)}/${encodeURIComponent(txn.txn_id)}`;
        const response = await fetch(endpoint, {
            headers: { 'X-Api-Key': config.apiKey }
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: data.message || 'Gagal mengecek status transaksi di Pakasir.'
            });
        }

        // Update local status in database
        txns[index].status = data.status || txns[index].status;
        txns[index].completed_at = data.completed_at || txns[index].completed_at;
        txns[index].is_sandbox = (data.is_sandbox !== undefined) ? data.is_sandbox : txns[index].is_sandbox;
        txns[index].lastCheckedAt = new Date().toISOString();
        await redis.set('dents:pakasir:transactions', txns);

        res.json({
            success: true,
            message: `Status transaksi: ${String(data.status).toUpperCase()}`,
            data: txns[index],
            pakasirResponse: data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// 6. ADMIN & REVIEWER API: Cancel Transaction (POST /api/v2/cancel-transaction/{slug}/{txn_id})
app.post('/api/admin/pakasir/transactions/:id/cancel', requireTesterOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let txns = await redis.get('dents:pakasir:transactions') || [];
        if (!Array.isArray(txns)) txns = [];

        const index = txns.findIndex(t => t.id === id || t.txn_id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }

        const txn = txns[index];
        const config = await getPakasirConfig();
        const slug = txn.project_slug || config.slug;

        // Call Pakasir API: POST /api/v2/cancel-transaction/{slug}/{txn_id}
        const endpoint = `${PAKASIR_BASE_URL}/api/v2/cancel-transaction/${encodeURIComponent(slug)}/${encodeURIComponent(txn.txn_id)}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'X-Api-Key': config.apiKey }
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: data.message || 'Gagal membatalkan transaksi di Pakasir.'
            });
        }

        // Update local status to canceled
        txns[index].status = 'canceled';
        txns[index].canceled_at = new Date().toISOString();
        txns[index].updatedAt = new Date().toISOString();
        await redis.set('dents:pakasir:transactions', txns);

        res.json({
            success: true,
            message: data.message || 'Transaksi berhasil dibatalkan!',
            data: txns[index]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// 7. ADMIN & REVIEWER API: Delete Transaction Record from local database
app.delete('/api/admin/pakasir/transactions/:id', requireTesterOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let txns = await redis.get('dents:pakasir:transactions') || [];
        if (!Array.isArray(txns)) txns = [];
        const filtered = txns.filter(t => t.id !== id && t.txn_id !== id);
        await redis.set('dents:pakasir:transactions', filtered);
        res.json({ success: true, message: 'Riwayat transaksi berhasil dihapus dari sistem.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8. ADMIN & REVIEWER API: Fee Calculator (Proxy to Pakasir GET /api/v2/payment-fee/{amount})
app.get('/api/admin/pakasir/fee-calculator', requireTesterOrAdmin, async (req, res) => {
    try {
        const amount = parseInt(req.query.amount, 10);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Nominal amount harus berupa angka bulat positif.' });
        }

        const endpoint = `${PAKASIR_BASE_URL}/api/v2/payment-fee/${amount}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ success: false, message: 'Gagal mengambil data kalkulator fee dari Pakasir.' });
        }

        res.json({ success: true, data, amount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error kalkulator fee: ' + err.message });
    }
});

// 9. ADMIN & REVIEWER API: Get & Delete Webhook Logs
app.get('/api/admin/pakasir/webhook-logs', requireTesterOrAdmin, async (req, res) => {
    try {
        let logs = await redis.get('dents:pakasir:webhook_logs') || [];
        if (!Array.isArray(logs)) logs = [];
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/pakasir/webhook-logs', requireTesterOrAdmin, async (req, res) => {
    try {
        await redis.set('dents:pakasir:webhook_logs', []);
        res.json({ success: true, message: 'Log webhook berhasil dibersihkan.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Settings Admin API
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        const settings = await getGlobalSettings();
        res.json({ success: true, data: settings });
    } catch(err) { res.status(500).json({ success: false }); }
});
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        const current = await getGlobalSettings();
        const incoming = req.body || {};
        if (incoming.googleVerification !== undefined) {
            incoming.googleVerification = cleanGoogleVerification(incoming.googleVerification);
        }
        if (incoming.siteUrl !== undefined) {
            incoming.siteUrl = incoming.siteUrl.trim().replace(/\/+$/, '');
            if (incoming.siteUrl.includes('dentsweb.my.id') && !incoming.siteUrl.includes('www.dentsweb.my.id')) {
                incoming.siteUrl = incoming.siteUrl.replace('dentsweb.my.id', 'www.dentsweb.my.id');
            }
        }
        const updated = {
            ...current,
            ...incoming,
            socialLinks: {
                ...(current.socialLinks || {}),
                ...(incoming.socialLinks || {})
            }
        };
        await redis.set('dents:settings', updated);
        res.json({ success: true, message: 'Pengaturan global & SEO berhasil diperbarui!', data: updated });
    } catch (err) { res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' }); }
});

// Dynamic Google Site Verification HTML File Route (e.g. /google<hash>.html)
app.get('/google:code.html', async (req, res) => {
    const code = req.params.code;
    res.type('text/html');
    res.send(`google-site-verification: google${code}.html`);
});

// ==========================================
// SEARCH ENGINE DISCOVERY (ROBOTS & SITEMAP)
// ==========================================
app.get('/robots.txt', async (req, res) => {
    const settings = await getGlobalSettings();
    const siteUrl = (settings.siteUrl && settings.siteUrl.trim()) ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
    res.type('text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send([
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        'Disallow: /admin-login',
        'Disallow: /admin-dashboard',
        'Disallow: /webhook-login',
        'Disallow: /test-login',
        'Disallow: /webhook-dashboard',
        'Disallow: /api/',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`
    ].join('\n'));
});

app.all('/sitemap.xml', async (req, res) => {
    try {
        const settings = await getGlobalSettings();
        const baseUrl = (settings.siteUrl && settings.siteUrl.trim()) ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id';
        const today = new Date().toISOString().split('T')[0];
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        const staticRoutes = [
            { path: '/', priority: '1.0', freq: 'daily' },
            { path: '/services', priority: '0.9', freq: 'weekly' },
            { path: '/portfolio', priority: '0.9', freq: 'weekly' },
            { path: '/articles', priority: '0.9', freq: 'daily' },
            { path: '/pricing', priority: '0.8', freq: 'weekly' },
            { path: '/about', priority: '0.7', freq: 'monthly' },
            { path: '/faq', priority: '0.8', freq: 'weekly' },
            { path: '/contact', priority: '0.8', freq: 'monthly' }
        ];

        staticRoutes.forEach(route => {
            const loc = route.path === '/' ? `${baseUrl}/` : `${baseUrl}${route.path}`;
            xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route.freq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
        });

        const [portfolio, articles] = await Promise.all([
            redis.get('dents:portfolio'),
            redis.get('dents:articles')
        ]);

        if (portfolio && Array.isArray(portfolio)) {
            portfolio.filter(p => p.isPublished).forEach(p => {
                xml += `  <url>\n    <loc>${baseUrl}/portfolio/${p.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
            });
        }

        if (articles && Array.isArray(articles)) {
            articles.filter(a => a.isPublished !== false).forEach(a => {
                const artDate = (a.updatedAt || a.publishedAt || today).split('T')[0];
                xml += `  <url>\n    <loc>${baseUrl}/article/${a.slug}</loc>\n    <lastmod>${artDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
            });
        }

        xml += `</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (req.method === 'HEAD') {
            return res.status(200).end();
        }
        res.status(200).send(xml);
    } catch (err) {
        console.error('[SITEMAP] Error generating sitemap:', err);
        res.status(500).send('Error generating sitemap');
    }
});

app.use(async (req, res) => {
    const settings = await getGlobalSettings();
    res.status(404).render('404', {
        settings,
        seo: buildSEO(settings, { title: '404 - Halaman Tidak Ditemukan', desc: 'Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.', path: req.path })
    });
});

app.use((err, req, res, next) => {
    console.error('[FATAL] Uncaught Error:', err);
    res.status(500).send('500 - Terjadi kesalahan internal server.');
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[DENTS WEB] Server running on http://localhost:${PORT}`);
    });
}
