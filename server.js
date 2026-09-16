require('dotenv').config();
const express = require('express');
const path = require('path');
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

// Security Headers & Content Security Policy (allows Google Fonts & Vercel Speed Insights)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https://*"], 
            connectSrc: ["'self'", "https://va.vercel-scripts.com", "https://vitals.vercel-insights.com"]
        }
    },
    xPoweredBy: false
}));

// Rate Limiters
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Terlalu banyak permintaan.' });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Terlalu banyak percobaan login.' });
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Terlalu banyak form yang dikirim.' });
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

        if (!services || !services.length) {
            await redis.set('dents:services', [
                {
                    id: 'srv_1',
                    title: 'Landing Page & Company Profile',
                    slug: 'landing-page',
                    icon: 'globe',
                    shortDescription: 'Website kustom konversi tinggi untuk ningkatin kredibilitas brand dan closing bisnis Anda.',
                    description: 'Website profesional super kencang, responsif di semua device, dan SEO-ready dari baris kode pertama.',
                    features: ['Design Eksklusif (Zero Template)', 'Core Web Vitals Skor 95+', 'Integrasi Direct WhatsApp', 'Domain, Hosting & SSL Gratis', 'Setup Google Search Console'],
                    startingPrice: 'Rp 1.500.000',
                    order: 1,
                    isFeatured: true,
                    isPublished: true
                },
                {
                    id: 'srv_2',
                    title: 'Sistem Informasi & Web App',
                    slug: 'web-app',
                    icon: 'cpu',
                    shortDescription: 'Dashboard operasional, portal pelanggan, dan manajemen data bisnis berbasis cloud.',
                    description: 'Solusi web aplikasi custom sesuai alur kerja bisnis Anda. Skalabel, aman, dan mempermudah otomasi SOP.',
                    features: ['Multi-User Role & Hak Akses', 'Database Realtime Cloud', 'Dashboard Analytics Responsif', 'Ekspor Laporan PDF/Excel', 'Garansi Dukungan Prioritas'],
                    startingPrice: 'Rp 4.500.000',
                    order: 2,
                    isFeatured: true,
                    isPublished: true
                },
                {
                    id: 'srv_3',
                    title: 'UI/UX Design & Rebranding',
                    slug: 'ui-ux',
                    icon: 'layers',
                    shortDescription: 'Desain visual berstandar internasional yang memikat pengunjung dan mudah digunakan.',
                    description: 'Riset antarmuka pengguna, wireframing, dan desain interaktif modern dengan pendekatan konversi terukur.',
                    features: ['High-Fidelity Figma Source', 'Design System & Component Kit', 'Interactive Prototype', 'Riset Audiens & UX Flow', 'Revisi Fleksibel'],
                    startingPrice: 'Rp 2.000.000',
                    order: 3,
                    isFeatured: true,
                    isPublished: true
                }
            ]);
        }

        if (!pricing || !pricing.length) {
            await redis.set('dents:pricing', [
                {
                    id: 'price_1',
                    name: 'Starter Landing Page',
                    price: 'Rp 1.500.000',
                    description: 'Cocok buat validasi produk baru, peluncuran kampanye, atau personal branding yang butuh tampil instan.',
                    features: ['1 Halaman Panjang Responsif', 'Desain Modern Kustom (Zero Template)', 'Integrasi Direct WhatsApp Chat', 'Domain (.my.id/.com) & SSL Gratis', 'Pengerjaan 3-5 Hari Kerja'],
                    isFeatured: false,
                    isPublished: true,
                    order: 1
                },
                {
                    id: 'price_2',
                    name: 'Company Profile Pro',
                    price: 'Rp 3.500.000',
                    description: 'Paling populer untuk bisnis & perusahaan yang mau bangun reputasi kredibel di Google.',
                    features: ['Hingga 7 Halaman Dinamis', 'Panel Admin / CMS Mandiri', 'Dynamic Schema SEO Google (Gold Standard)', 'Optimasi PageSpeed & Core Web Vitals', 'Garansi Bug-Free 30 Hari'],
                    isFeatured: true,
                    isPublished: true,
                    order: 2
                },
                {
                    id: 'price_3',
                    name: 'Custom Web Application',
                    price: 'Rp 7.500.000+',
                    description: 'Untuk sistem operasional bisnis, portal data, SaaS MVP, atau integrasi API kompleks.',
                    features: ['Arsitektur Sistem Khusus Sesuai SOP', 'Database Cloud Terintegrasi', 'Multi-role User & Authentication', 'Dokumentasi & 100% Hak Akses Source Code', 'Dedicated Support Prioritas'],
                    isFeatured: false,
                    isPublished: true,
                    order: 3
                }
            ]);
        }

        if (!faq || !faq.length) {
            await redis.set('dents:faq', [
                {
                    id: 'faq_1',
                    question: 'Berapa lama proses pengerjaan website?',
                    answer: 'Landing page selesai dalam 3-5 hari kerja. Company profile 7-14 hari kerja. Sistem web custom 2-4 minggu kerja, tergantung kompleksitas fitur.',
                    order: 1,
                    isPublished: true
                },
                {
                    id: 'faq_2',
                    question: 'Apakah website dijamin cepat dan SEO-friendly?',
                    answer: 'Pasti. Kami bangun menggunakan SSR Node.js dengan skor Google PageSpeed rata-rata 95+ dan Schema JSON-LD terverifikasi agar cepat terindeks di Google.',
                    order: 2,
                    isPublished: true
                },
                {
                    id: 'faq_3',
                    question: 'Apakah saya dapat akses penuh ke source code dan domain?',
                    answer: 'Ya, 100% kepemilikan menjadi milik Anda setelah serah terima tanpa ada biaya berlangganan sistem tersembunyi.',
                    order: 3,
                    isPublished: true
                },
                {
                    id: 'faq_4',
                    question: 'Bagaimana cara berkonsultasi mengenai proyek saya?',
                    answer: 'Cukup klik tombol WhatsApp di pojok kanan bawah atau kunjungi halaman kontak. Tim kami siap memberikan konsultasi gratis tanpa komitmen.',
                    order: 4,
                    isPublished: true
                }
            ]);
        }

        const REAL_PORTFOLIO_PROJECTS = [
            {
                id: 'port_1',
                title: 'BEM KBMFKG UMI — Portal Organisasi & Informasi Kabinet Ananta Anardhaya',
                slug: 'bem-kbmfkg-umi',
                client: 'BEM KBMFKG UMI',
                category: 'PORTAL ORGANISASI & KEMAHASISWAAN',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Portal Organisasi', 'Kemahasiswaan', 'Public Information', 'Responsive Web'],
                tools: ['html5', 'javascript', 'css3', 'bootstrap', 'vercel'],
                shortDescription: 'Portal resmi Badan Eksekutif Mahasiswa Keluarga Besar Mahasiswa Fakultas Kedokteran Gigi Universitas Muslim Indonesia sebagai pusat transparansi informasi, publikasi birokrasi, aspirasi mahasiswa, serta kalender program kerja kabinet aktif.',
                description: 'Portal web modern berstandar enterprise yang dirancang khusus untuk memfasilitasi kebutuhan publikasi informasi, penyaluran aspirasi mahasiswa FKG UMI secara aman, serta dokumentasi seluruh program kerja Badan Eksekutif Mahasiswa dalam satu ekosistem digital terpadu dan responsif di seluruh perangkat.',
                challenge: 'Penyebaran informasi program kerja dan penyaluran aspirasi mahasiswa sebelumnya tersebar di berbagai kanal media sosial yang tidak terpusat, menyebabkan distorsi informasi dan lambatnya respon organisasi terhadap kebutuhan mahasiswa.',
                solution: 'Mengembangkan arsitektur portal terpusat dengan sistem manajemen konten dinamis, formulir aspirasi terenkripsi, serta integrasi visual timeline program kerja kabinet berbasis mobile-first responsive design.',
                projectUrl: 'https://www.bemkbmfkgumi.com/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_2',
                title: 'HMI KOMKG UMI — Sistem Informasi Kader & Portal Perjuangan Insan Cita',
                slug: 'hmi-komkg-umi',
                client: 'HMI Komisariat Kedokteran Gigi UMI',
                category: 'SISTEM INFORMASI KADER & ORGANISASI',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Sistem Informasi', 'Database Kader', 'Digital Archive', 'Responsive Design'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Pusat data digital dan sistem informasi kader HMI Komisariat Kedokteran Gigi UMI untuk mendokumentasikan rekam jejak pengkaderan, materi perkaderan, serta literasi intelektual pergerakan mahasiswa Islam.',
                description: 'Platform digital kelembagaan yang mengintegrasikan basis data kader, modul pembelajaran Basic Training (LK 1), arsip konstitusi himpunan, serta artikel opini mahasiswa demi mewujudkan tata kelola organisasi yang transparan dan adaptif terhadap transformasi digital era modern.',
                challenge: 'Pendataan riwayat jenjang perkaderan serta inventarisasi arsip sejarah komisariat yang masih manual dan rentan tercecer saat pergantian kepengurusan periode baru.',
                solution: 'Pembangunan platform digital arsip dengan repositori materi tersentralisasi, direktori profil kader, serta sistem navigasi interaktif yang memudahkan anggota mengakses materi perkaderan kapan saja.',
                projectUrl: 'https://www.hmikomkgumi.xyz/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_3',
                title: 'Estaka Dental Clinic — Smart Clinic & AI Queue Monitor Platform',
                slug: 'estaka-dental-clinic',
                client: 'Estaka Dental Care & Aesthetics',
                category: 'HEALTHCARE & SMART CLINIC WEB APP',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Healthcare', 'Dental Clinic', 'Patient Booking', 'WhatsApp Gateway'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Aplikasi profil klinik gigi modern dan pemesanan jadwal dokter gigi berbasis sistem notifikasi otomatis WhatsApp yang efisien dan ramah pasien.',
                description: 'Platform kesehatan dental holistik yang dirancang dengan estetika premium medis, memberikan pengalaman reservasi konsultasi dokter gigi spesialis tanpa hambatan, dilengkapi katalog perawatan gigi interaktif, simulasi biaya estimasi, dan verifikasi jadwal otomatis via bot chat.',
                challenge: 'Tingginya angka pasien yang membatalkan jadwal konsultasi (no-show) karena alur pendaftaran manual via telepon yang memakan waktu dan tanpa adanya sistem pengingat otomatis.',
                solution: 'Merancang web app reservasi instan dengan kalender interaktif dokter, penghitungan kuota pasien per sesi secara realtime, dan integrasi WhatsApp auto-confirmation trigger.',
                projectUrl: 'https://estakadentalclinic.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_4',
                title: 'Klinik Fahri Dental Care — PWA Kuesioner Riset Karies Gigi Anak Usia Dini',
                slug: 'fahri-dental-care',
                client: 'drg. Fahri Dental Care',
                category: 'PWA CLINICAL RESEARCH & SCREENING',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['PWA', 'Clinical Screening', 'Dental Health', 'Pediatric Dentistry'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Aplikasi skrining dan pengumpulan data kesehatan gigi balita dan anak interaktif untuk deteksi dini risiko Early Childhood Caries (ECC).',
                description: 'Progressive Web App klinis yang menggabungkan instrumen edukasi interaktif bagi orang tua tentang kebersihan gigi anak dengan sistem surveilans karies gigi balita yang menghasilkan skor risiko langsung bagi praktisi medis gigi di klinik.',
                challenge: 'Kurangnya kesadaran orang tua mendeteksi tanda karies dini pada balita dan sulitnya mengumpulkan kuesioner klinis terstandar secara manual di ruang tunggu klinik.',
                solution: 'Implementasi PWA mobile-responsive dengan visualisasi indeks risiko gigi warna-warni ramah orang tua, kuesioner dinamis bercabang, dan penyimpanan data terstruktur.',
                projectUrl: 'https://fahridental-care.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_5',
                title: 'NovaCare.AI — Autonomous Patient Care & WhatsApp Gateway Engine',
                slug: 'novacare-ai',
                client: 'NovaCare Health Solutions',
                category: 'AI SAAS & HEALTHCARE AUTOMATION',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['AI Engine', 'SaaS', 'Healthcare Workflow', 'Multi-Agent Bot'],
                tools: ['html5', 'javascript', 'react', 'nodejs', 'express', 'redis', 'vercel'],
                shortDescription: 'Sistem operasional fasilitas kesehatan cerdas yang mengautomasi penjadwalan pasien, followup pengobatan, dan broadcast pengingat berkala terintegrasi WhatsApp API.',
                description: 'Platform SaaS manajemen komunikasi pasien berbasis AI yang memotong beban kerja front office klinik hingga 70%. Dilengkapi sistem triage gejala awal, pengingat kontrol dokter otomatis, dan dashboard analitik retensi pasien realtime.',
                challenge: 'Staf admin klinik kewalahan menangani ratusan pesan masuk WhatsApp setiap hari, menyebabkan antrean respons lambat dan keluhan pasien terkait kepastian jadwal.',
                solution: 'Pengembangan arsitektur event-driven Node.js dengan antrean Redis yang mengotomasi alur pesan WhatsApp, sinkronisasi kalender dokter, dan pencatatan riwayat konsultasi.',
                projectUrl: 'https://novacare-azure.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_6',
                title: 'E-Form Kuesioner Herlinda — Digital Survey & Prevalensi Karies Gigi Balita',
                slug: 'kuesioner-herlinda',
                client: 'Riset Kesehatan Gigi Masyarakat FKG',
                category: 'ACADEMIC SURVEY & EPIDEMIOLOGY',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['E-Form', 'Academic Research', 'Epidemiology', 'Data Collection'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Platform instrumen pengumpulan data kuesioner penelitian ilmiah kesehatan gigi balita dengan validasi input realtime dan kalkulasi indeks dmf-t otomatis.',
                description: 'Web app instrumen survei epidemiologi yang dirancang khusus untuk penelitian skripsi/tesis kedokteran gigi, mempermudah enumerator lapangan mengisi kuesioner penelitian di puskesmas/posyandu dengan visualisasi skor def-t/dmf-t otomatis.',
                challenge: 'Perekaman data penelitian gigi anak secara kertas konvensional sering menimbulkan kesalahan pengisian variabel, lembar survei basah/rusak di lapangan, dan data input manual yang memakan waktu berminggu-minggu.',
                solution: 'Membangun formulir kuesioner digital berbasis web dengan validasi kolom ketat, scoring instan tanpa kalkulasi manual, dan ekspor dataset siap olah dalam hitungan detik.',
                projectUrl: 'https://kuesionerherlinda.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_7',
                title: 'AxaBOT Portal — Dual Backend Multi-Client WhatsApp Financial Automation',
                slug: 'portal-finance-multiclient',
                client: 'Axa Enterprise Financial Services',
                category: 'FINTECH & MULTI-TENANT AUTOMATION',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Fintech', 'WhatsApp Bot', 'Multi-Client', 'Realtime Accounting'],
                tools: ['html5', 'javascript', 'nodejs', 'express', 'postgresql', 'redis', 'docker', 'vercel'],
                shortDescription: 'Portal keuangan korporat multi-klien dengan arsitektur dual backend yang mengintegrasikan bot WhatsApp interaktif untuk pencatatan kas, invoice otomatis, dan rekonsiliasi realtime.',
                description: 'Arsitektur fintech tingkat tinggi dengan sistem multi-tenant yang memungkinkan puluhan cabang bisnis mengelola pencatatan pemasukan, pengeluaran, konfirmasi mutasi bank, dan penerbitan nota transaksi langsung dari obrolan WhatsApp tanpa membuka software akuntansi rumit.',
                challenge: 'Karyawan dan tim lapangan sering lupa merekap bon transaksi operasional, menyebabkan selisih buku kas yang signifikan pada akhir bulan pelaporan.',
                solution: 'Membangun bot WhatsApp dengan microservice backend ganda yang memproses bukti foto nota melalui OCR, mencatat pembukuan otomatis ke database terpusat, dan mengirimkan alert limit saldo secara berkala.',
                projectUrl: 'https://prtal-wa-finance.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_8',
                title: 'Joki Borang PIDGI — Platform Asistensi Logbook Dokter Gigi Internsip No. 1',
                slug: 'joki-borang-pidgi',
                client: 'DentisLog Indonesia',
                category: 'EDUTECH & PROFESSIONAL ASSISTANCE',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Edutech', 'Internship Tool', 'Logbook Automation', 'Dental Care'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Layanan web komprehensif pendampingan pengisian e-borang logbook Program Internsip Dokter Gigi Indonesia (PIDGI) terstruktur, tepat waktu, dan bebas stres.',
                description: 'Platform spesifik kedokteran gigi pertama yang memfasilitasi dokter gigi internsip di seluruh wahana Indonesia dalam menyusun pelaporan kasus klinis, mini project, dan rekapitulasi kinerja harian sesuai format standar KKI dan Kemenkes RI.',
                challenge: 'Jadwal dinas yang padat di RS dan Puskesmas membuat dokter gigi internsip kekurangan waktu dalam memformat dan menyusun narasi rekam medis borang evaluasi.',
                solution: 'Menghadirkan portal panduan terstruktur dengan katalog template narasi diagnosis, kalkulator capaian target kasus, dan konsultasi privat 1-on-1 via dashboard interaktif.',
                projectUrl: 'https://jokiborangpidgi.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_9',
                title: 'Instrumen OHQE — Oral Health Quality of Life Scale for Endodontic Patients',
                slug: 'instrumen-ohqe',
                client: 'Riset Departemen Konservasi Gigi FKG',
                category: 'SCIENTIFIC RESEARCH & CLINICAL METRICS',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Clinical Scale', 'Endodontics', 'Quality of Life', 'Psychometrics'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vercel'],
                shortDescription: 'Instrumen digital pengukuran kualitas hidup pasien pasca perawatan saluran akar gigi (Endodontik) berbasis skala psikometrik terstandarisasi internasional.',
                description: 'Aplikasi klinis riset spesialis konservasi gigi untuk mengukur dampak terapi endodontik terhadap status fungsional, psikologis, dan sosial pasien melalui scoring kuesioner Oral Health-Related Quality of Life (OHRQoL) yang telah divalidasi secara saintifik.',
                challenge: 'Evaluasi kepuasan dan kualitas hidup pasien pasca perawatan saluran akar selama ini sulit dikuantifikasi secara objektif dan membutuhkan rekonsiliasi manual skala ordinal yang rumit.',
                solution: 'Digitalisasi kuesioner psikometrik OHQE dengan pembobotan Likert otomatis, deteksi anomali respons, dan visualisasi grafik radar sebelum serta sesudah perawatan.',
                projectUrl: 'https://instrumenohqe.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_10',
                title: 'DentsHub Riset — Ekosistem Riset AI Terakreditasi 2026 & Validasi Sitasi DOI',
                slug: 'dentshub-riset',
                client: 'DentsHub Academic Research Center',
                category: 'AI SCHOLAR & ACADEMIC REPOSITORY',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['AI Scholar', 'Academic Repository', 'DOI Validation', 'Research Ecosystem'],
                tools: ['html5', 'javascript', 'react', 'nextjs', 'tailwindcss', 'vercel'],
                shortDescription: 'Platform asisten penelusuran literatur ilmiah kedokteran gigi dengan kurasi jurnal bereputasi (Scopus & Sinta), pengecekan sitasi DOI, dan ringkasan makalah cerdas.',
                description: 'Ekosistem riset generasi baru bagi akademisi kedokteran gigi yang menggabungkan kecerdasan buatan untuk menganalisis ratusan jurnal internasional, menyaring literatur berbasis bukti (Evidence-Based Dentistry), memvalidasi keaslian DOI CrossRef, dan menyusun tinjauan pustaka secara etis.',
                challenge: 'Waktu yang terbuang sia-sia oleh mahasiswa dan peneliti dalam mencari jurnal relevan di antara jutaan database tanpa filter kredibilitas indeks saintifik yang ketat.',
                solution: 'Arsitektur pencarian semantik dengan integrasi API DOI resolver, klasifikasi kuartil jurnal instan, dan generator sitasi otomatis berformat Vancouver serta APA 7th Edition.',
                projectUrl: 'https://dentshubriset.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_11',
                title: 'FilterCan — Interactive Lightroom Presets & Creative LUTs Marketplace',
                slug: 'marketplace-filtercan',
                client: 'FilterCan Creative Studio',
                category: 'E-COMMERCE & DIGITAL ASSETS',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['E-Commerce', 'Digital Marketplace', 'Interactive Before-After', 'LUTs'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Toko online interaktif aset kreatif digital preset Lightroom dan Cinematic LUTs dengan fitur komparasi slider before-after foto secara langsung di web.',
                description: 'Marketplace digital modern yang menyajikan pengalaman belanja aset fotografi dan videografi kelas premium. Dilengkapi komponen split-slider real-time interaktif untuk menguji efektivitas preset warna sebelum membeli, serta sistem unduhan instan berkecepatan tinggi.',
                challenge: 'Banyak calon pembeli ragu membeli preset foto digital karena tidak bisa melihat hasil grading secara langsung pada objek foto nyata sebelum melakukan transaksi.',
                solution: 'Membangun slider komparasi interaktif ultra-responsif berbasis Canvas/CSS dengan touch-friendly gesture pada layar smartphone serta pengiriman file digital instan.',
                projectUrl: 'https://filterbycan.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_12',
                title: 'AXA XYZ Exams — AI-Powered Computer Based Test & Live Proctoring Platform',
                slug: 'portal-ujian-axa-exams',
                client: 'AXA Educational Assessment System',
                category: 'EDUTECH & CBT EXAMINATION SYSTEM',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['CBT Exam', 'Edutech', 'Anti-Cheat Protection', 'Realtime Scoring'],
                tools: ['html5', 'javascript', 'react', 'nodejs', 'express', 'postgresql', 'vercel'],
                shortDescription: 'Sistem ujian online Computer Based Test (CBT) berkemampuan tinggi dengan proteksi kecurangan tab-switching, pengacakan soal algoritmik, dan rekap nilai instan.',
                description: 'Platform evaluasi akademik dan sertifikasi online berstandar industri dengan teknologi anti-cheat berlapis (deteksi perpindahan jendela browser, penonaktifan klik kanan & screenshot), bank soal dinamis, serta analitik butir soal realtime.',
                challenge: 'Kerentanan kecurangan pada ujian daring konvensional dan seringnya server ujian drop ketika diakses ribuan peserta secara serentak pada detik yang sama.',
                solution: 'Pengembangan frontend anti-tamper yang memantau fokus jendela peramban, didukung arsitektur load balancing backend yang sanggup menangani concurrent users dengan latensi rendah.',
                projectUrl: 'https://axa-exams.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_13',
                title: 'drg. M. Rakhmat Ersyad Muchlis, S.H., Sp.RKG — Executive Radiologist Portfolio',
                slug: 'drg-rakhmat-ersyad-portfolio',
                client: 'drg. M. Rakhmat Ersyad Muchlis, S.H., Sp.RKG',
                category: 'PERSONAL PORTFOLIO & PROFESSIONAL CV',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Medical Executive', 'Radiology', 'Personal Branding', 'Tahoe Style'],
                tools: ['html5', 'javascript', 'css3', 'tailwindcss', 'vite', 'vercel'],
                shortDescription: 'Portofolio digital eksekutif dan resume interaktif Dokter Gigi Spesialis Radiologi Kedokteran Gigi (Sp.RKG) merangkap Sarjana Hukum dengan visualisasi keahlian klinis tingkat tinggi.',
                description: 'Showcase representasi reputasi profesional medis dan hukum medikolegal terdepan. Menampilkan rekam jejak riset radiologi panoramik/CBCT 3D, publikasi ilmiah, keterlibatan simposium nasional-internasional, serta layanan konsultasi keahlian medis yang terintegrasi secara elegan.',
                challenge: 'Membangun persona profesional terpercaya yang menggabungkan dua bidang kompetensi langka (Spesialis Radiologi Gigi dan Hukum Kesehatan) dalam satu identitas digital yang berkelas dan modern.',
                solution: 'Desain estetika Tahoe macOS dengan tipografi tipikal korporat, showcase sertifikasi berlisensi, dan navigasi CV interaktif berkecepatan 100/100 pada Lighthouse.',
                projectUrl: 'https://mrakhmatersyad.vercel.app/',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_14',
                title: 'Anomaly Space — Cloud Cafe POS, Kitchen Display & Customer Screen System',
                slug: 'anomaly-space-pos',
                client: 'Anomaly Space Specialty Coffee',
                category: 'F&B POS & CLOUD MANAGEMENT',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['POS System', 'F&B Tech', 'Cloud Database', 'Kitchen Display'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Aplikasi Point of Sale (POS) cloud untuk kafe modern dengan integrasi Kitchen Display System (KDS), split bill cepat, dan pelaporan omzet harian otomatis.',
                description: 'Solusi kasir digital berbasis cloud web application untuk kafe dan coffee shop sibuk. Memangkas antrean kasir dengan navigasi sentuh kilat, transmisi pesanan instan ke layar barista dapur (KDS), serta kalkulasi persediaan bahan baku biji kopi realtime.',
                challenge: 'Keterlambatan penyampaian pesanan dari kasir ke barista dan selisih stok persediaan bahan kopi akibat kasir offline konvensional yang tidak sinkron secara realtime.',
                solution: 'Pembangunan web POS interaktif yang terhubung langsung ke basis data Google Cloud Apps Script realtime dengan antarmuka dual display (layar kasir & layar barista).',
                projectUrl: 'https://script.google.com/macros/s/AKfycbw5LzOU5HJzGRhpouhF_b3ft-DelJY273xagO57W-IkBtF4-TNjX7F2ZYCtakk31Eht/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_15',
                title: 'E-Pilketos Smaga — Realtime Digital Voting System SMAN 3 Makassar',
                slug: 'e-pilketos-smaga',
                client: 'MPK & OSIS SMAN 3 Makassar',
                category: 'E-VOTING & DEMOCRACY SYSTEM',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['E-Voting', 'Realtime Quick Count', 'Token Authentication', 'Student Governance'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Sistem pemungutan suara elektronik (E-Voting) pemilihan Ketua & Wakil Ketua OSIS SMA Negeri 3 Makassar dengan verifikasi token sekali pakai dan quick count langsung.',
                description: 'Aplikasi demokrasi digital sekolah ramah lingkungan bebas kertas yang melayani ribuan pemilih siswa-siswi secara serempak. Menjamin kerahasiaan hak suara dengan token enkripsi satu kali pakai (OTP-like) dan menampilkan persentase suara masuk secara langsung di proyektor aula.',
                challenge: 'Proses pemilihan ketua OSIS manual dengan kertas suara memakan biaya tinggi, penghitungan surat suara hingga larut malam, serta risiko manipulasi suara.',
                solution: 'Merancang sistem e-voting web dengan bilik suara digital terautentikasi token unik, pencegahan suara ganda (anti-double voting), dan siaran grafik quick count transparan realtime.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbzG-WjY-bsx5I12ynk1_6ilclVM4Pli37vmpytqeaeJkESCkQqX5D9IZkBzaM6vCmcC/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_16',
                title: 'Gria Efata Permai – Interactive Real Estate & Digital Site Plan Portal',
                slug: 'gria-efata-permai',
                client: 'PT Efata Jaya Raya',
                category: 'REAL ESTATE & INTERACTIVE SITE PLAN',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Real Estate', 'Digital Site Plan', 'Unit Booking', 'Interactive Map'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Portal perumahan modern dengan denah site plan interaktif untuk memeriksa status kavling (tersedia, terpesan, terjual) dan simulasi estimasi cicilan KPR.',
                description: 'Web app pemasaran properti digital yang mentransformasikan brosur fisik menjadi pengalaman eksplorasi interaktif. Pengunjung dapat mengeklik kavling unit pada peta masterplan secara visual, melihat spesifikasi tipe rumah, mengunduh brosur PDF, dan langsung menghubungi agen pemasaran via WhatsApp.',
                challenge: 'Konsumen properti kesulitan memvisualisasikan posisi kavling strategis dari brosur cetak 2D, sehingga tim sales kesulitan mengonfirmasi ketersediaan unit yang masih kosong.',
                solution: 'Membangun peta interaktif SVG site plan berbasis vektor responsif dengan indikator warna status unit realtime yang tersinkronisasi dengan database penjualan pengembang.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbz-QT1iuDrZEf5OlTRtuAeQGOwE4pxZ_b1DmBHbYz3R-IAnOlT6BuVyZxO67cuvHG8/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_17',
                title: 'Bams Barbershop – Online Queue & Service Appointment Booking',
                slug: 'bams-barbershop-booking',
                client: 'Bams Barbershop & Grooming',
                category: 'LIFESTYLE & ONLINE QUEUE SYSTEM',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['Barbershop', 'Online Queue', 'Appointment System', 'SMS/WA Reminder'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Sistem antrean cerdas dan pemesanan layanan potong rambut secara daring untuk menghindari kerumunan ruang tunggu dengan notifikasi estimasi giliran realtime.',
                description: 'Solusi pemesanan antrean barbershop modern yang memungkinkan pelanggan memilih kapster favorit, memilih paket grooming, dan memantau posisi antrean berjalan dari rumah atau kafe, lengkap dengan estimasi menit tunggu yang akurat.',
                challenge: 'Pelanggan sering berbalik pulang karena antrean di kursi tunggu barbershop terlalu padat dan waktu tunggu tidak dapat diprediksi.',
                solution: 'Aplikasi antrean online dengan penomoran virtual otomatis, pemantauan status kursi aktif, serta tombol appointment yang ramah pengguna smartphone.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbxgGdUfpjnODbdUDdwL9hGwjJeecMflQWKoZHFaN4Wm9-b7iTI9wNozsIM3LsKT3W0/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_18',
                title: 'Smart RPP – AI-Powered Curriculum Generator & Modul Ajar Terotomasi',
                slug: 'smart-rpp-kurikulum-merdeka',
                client: 'Komunitas Guru Inovatif Nusantara',
                category: 'EDUTECH & AI PRODUCTIVITY',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['AI Generator', 'Kurikulum Merdeka', 'Edutech', 'Modul Ajar'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Platform asisten guru cerdas bertenaga AI untuk menyusun Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar Kurikulum Merdeka dalam hitungan detik.',
                description: 'Aplikasi produktivitas pendidikan revolusioner yang membantu para guru dari tingkat SD hingga SMA menyusun modul ajar, asesmen diagnostik, rubrik penilaian, dan profil pelajar pancasila sesuai capaian pembelajaran (CP) secara otomatis dan terstandarisasi Kemendikbudristek.',
                challenge: 'Beban administrasi pembuatan dokumen RPP yang sangat banyak menyita waktu tenaga pendidik hingga mengurangi fokus utama dalam mendampingi murid di kelas.',
                solution: 'Mengembangkan formulir cerdas yang menghubungkan data mata pelajaran dengan prompt AI terstruktur, menghasilkan dokumen modul ajar komprehensif yang siap unduh dan cetak.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbwaLRPdwdUYxzxstqiQUASC19ivpRyZ2oMDiDQks0Ozk9pjrd7Kp1cRgZJqlrpfaXyx/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_19',
                title: 'NGS StaffFlow – Enterprise Employee Self-Service & Expense Reimbursement',
                slug: 'ngs-staffflow-hr-portal',
                client: 'PT Nusantara Global Solusindo',
                category: 'ENTERPRISE HRIS & WORKFLOW',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['HRIS Portal', 'Staff Management', 'Reimbursement', 'Leave Approval'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Portal swakelola karyawan untuk pengajuan cuti online, klaim penggantian biaya (reimbursement) instan, dan persetujuan bertingkat manajerial.',
                description: 'Aplikasi internal perusahaan (Employee Self-Service) untuk memangkas birokrasi perizinan kerja. Karyawan dapat mengunggah struk klaim biaya, memantau sisa kuota cuti tahunan, dan mendapatkan otorisasi persetujuan atasan secara berjenjang melalui notifikasi email otomatis.',
                challenge: 'Pengajuan cuti dan klaim bon kantor yang masih menggunakan form kertas manual sering hilang di meja atasan dan menyulitkan rekapitulasi tim payroll HRD.',
                solution: 'Implementasi alur kerja approval digital terpadu dengan validasi sisa saldo cuti otomatis, lampiran dokumen digital, serta audit trail riwayat pengajuan transparan.',
                projectUrl: 'https://script.google.com/macros/s/AKfycbxXO7nf0uRRIx4dGUJzvzBg5_DCG_UmKvpeP5YHf6kQ0PjiuNtIIkpCDlNXwyn8JIav/exec',
                isFeatured: true,
                isPublished: true
            },
            {
                id: 'port_20',
                title: 'FlowSales CRM – Visual Kanban Pipeline Deals & Sales Conversion Accelerator',
                slug: 'flowsales-crm-pipeline',
                client: 'FlowSales Business Acceleration',
                category: 'CRM & B2B SALES PIPELINE',
                year: 2026,
                image: '/public/img/axalogo.png',
                tags: ['CRM', 'Sales Pipeline', 'Kanban Board', 'Lead Scoring'],
                tools: ['html5', 'javascript', 'css3', 'gcp'],
                shortDescription: 'Platform Customer Relationship Management (CRM) interaktif dengan papan Kanban drag-and-drop untuk memantau prospek penjualan dari kontak awal hingga deal closing.',
                description: 'Sistem percepatan konversi penjualan B2B yang dirancang untuk tim sales modern. Memberikan visibilitas menyeluruh terhadap performa deal di setiap tahapan corong penjualan (funnel), rekam histori interaksi prospek, kalkulasi potensi omzet tertimbang, dan metrik konversi tim.',
                challenge: 'Kehilangan prospek potensial bernilai puluhan juta rupiah karena catatan sales tersebar di buku catatan pribadi staf dan ketiadaan sistem tindak lanjut terorganisir.',
                solution: 'Pembangunan papan visual Kanban pipeline responsif dengan penanda prioritas prospek (hot/warm/cold), reminder follow-up otomatis, dan rekap metrik penjualan interaktif.',
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

        const MIGRATION_VERSION = 'v3_20_portfolio_real';
        const currentMigration = await redis.get('dents:migration:portfolio');
        if (currentMigration !== MIGRATION_VERSION) {
            console.log('[MIGRATION] Syncing 20 real portfolio projects & 20 masked testimonials to Redis...');
            await redis.set('dents:portfolio', REAL_PORTFOLIO_PROJECTS);
            await redis.set('dents:testimonials', MASKED_TESTIMONIALS);
            await redis.set('dents:migration:portfolio', MIGRATION_VERSION);
            console.log('[MIGRATION] Sync complete: 20 real projects & 20 masked testimonials updated.');
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
        analyticsId: "",
        favicon: "/public/img/axalogo.png",
        logo: "/public/img/axalogo.png"
    };

    try {
        const settings = await redis.get('dents:settings');
        // Ensure initial dummy data is ready
        ensureSeedData();

        if (settings) {
            return {
                ...defaultSettings,
                ...settings,
                socialLinks: { ...defaultSettings.socialLinks, ...(settings.socialLinks || {}) }
            };
        }
        await redis.set('dents:settings', defaultSettings);
        return defaultSettings;
    } catch (err) {
        return defaultSettings;
    }
}

// Dynamic SEO Builder (Gold Standard GSC)
function buildSEO(settings, pageData, extraData = {}) {
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://dentsweb.my.id';
    const cleanPath = pageData.path === '/' ? '' : pageData.path;
    const fullUrl = `${siteUrl}${cleanPath}`;
    
    const title = pageData.title ? `${pageData.title} | ${settings.brandName || 'Dents Web'}` : settings.defaultSeoTitle;
    const desc = pageData.desc || settings.defaultSeoDescription;
    const image = pageData.image ? (pageData.image.startsWith('http') ? pageData.image : `${siteUrl}${pageData.image}`) : `${siteUrl}${settings.defaultOgImage || '/public/img/axalogo.png'}`;
    const keywords = pageData.keywords || "jasa pembuatan website, web developer, sistem informasi, Dents Web, agensi digital, website profesional, SEO website, arsitektur web performa tinggi";

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
        "alternateName": ["Dents Web Studio", "DentsWeb"],
        "url": `${siteUrl}/`,
        "logo": {
            "@type": "ImageObject",
            "@id": `${siteUrl}/#logo`,
            "inLanguage": "id-ID",
            "url": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`,
            "contentUrl": `${siteUrl}${settings.logo || '/public/img/axalogo.png'}`,
            "caption": `Logo ${settings.brandName || 'Dents Web'}`
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
        "priceRange": "Rp 1.500.000 - Rp 15.000.000",
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

    let schemaGraph = [
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            "url": `${siteUrl}/`,
            "name": settings.brandName || "Dents Web",
            "alternateName": ["DentsWeb", "Dents Web Agency"],
            "publisher": { "@id": `${siteUrl}/#organization` },
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        },
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

    if (pageData.path !== '/') {
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
        schemaGraph.push({
            "@type": "ItemList",
            "@id": `${siteUrl}/#sitelinks`,
            "name": "Navigasi Utama Dents Web",
            "itemListElement": [
                { "@type": "SiteNavigationElement", "position": 1, "name": "Beranda", "description": "Halaman Utama Dents Web.", "url": `${siteUrl}/` },
                { "@type": "SiteNavigationElement", "position": 2, "name": "Layanan Kami", "description": "Solusi web development & digital marketing.", "url": `${siteUrl}/services` },
                { "@type": "SiteNavigationElement", "position": 3, "name": "Portfolio", "description": "Karya digital terbaik dari klien kami.", "url": `${siteUrl}/portfolio` },
                { "@type": "SiteNavigationElement", "position": 4, "name": "Harga & Paket", "description": "Investasi digital transparan.", "url": `${siteUrl}/pricing` },
                { "@type": "SiteNavigationElement", "position": 5, "name": "Tentang Kami", "description": "Profil dan filosofi tim Dents Web.", "url": `${siteUrl}/about` },
                { "@type": "SiteNavigationElement", "position": 6, "name": "FAQ", "description": "Tanya Jawab Seputar Layanan.", "url": `${siteUrl}/faq` },
                { "@type": "SiteNavigationElement", "position": 7, "name": "Hubungi Kami", "description": "Konsultasi gratis proyek website Anda.", "url": `${siteUrl}/contact` }
            ]
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
        image,
        keywords,
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

// ==========================================
// PUBLIC SSR ROUTES
// ==========================================
app.get('/', async (req, res) => {
    const settings = await getGlobalSettings();
    const rawServices = await redis.get('dents:services') || [];
    const rawPortfolio = await redis.get('dents:portfolio') || [];
    const rawTestimonials = await redis.get('dents:testimonials') || []; 
    
    const featuredServices = rawServices.filter(s => s.isPublished && s.isFeatured).slice(0, 3);
    const featuredPortfolio = rawPortfolio.filter(p => p.isPublished && p.isFeatured);
    const activeTestimonials = rawTestimonials.filter(t => t.isPublished !== false); 

    res.render('index', { 
        settings, 
        services: featuredServices.length ? featuredServices : rawServices.slice(0, 3),
        portfolio: featuredPortfolio.length ? featuredPortfolio : rawPortfolio,
        testimonials: activeTestimonials,
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
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://dentsweb.my.id';
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
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://dentsweb.my.id';
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

// Settings Admin API
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        const settings = await getGlobalSettings();
        res.json({ success: true, data: settings });
    } catch(err) { res.status(500).json({ success: false }); }
});
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        await redis.set('dents:settings', req.body);
        res.json({ success: true, message: 'Settings saved.' });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ==========================================
// SEARCH ENGINE DISCOVERY (ROBOTS & SITEMAP)
// ==========================================
app.get('/robots.txt', (req, res) => {
    const reqHost = req.get('host');
    const reqProto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    const baseUrl = reqHost ? `${reqProto}://${reqHost}` : 'https://www.dentsweb.my.id';
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin-login\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml`);
});

app.get('/sitemap.xml', async (req, res) => {
    const settings = await getGlobalSettings();
    const reqHost = req.get('host');
    const reqProto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    const baseUrl = reqHost ? `${reqProto}://${reqHost}` : (settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://www.dentsweb.my.id');
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
        xml += `  <url>\n    <loc>${baseUrl}${route.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route.freq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
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
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
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
