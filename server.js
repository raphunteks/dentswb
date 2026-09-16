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

        if (!testimonials || !testimonials.length) {
            await redis.set('dents:testimonials', [
                {
                    id: 'testi_1',
                    name: 'Budi Santoso',
                    role: 'Managing Director',
                    company: 'Nusantara Retail',
                    content: 'Website baru kami loadingnya kencang banget dan closing dari iklan naik hampir 2x lipat. Sangat puas dengan kinerjanya!',
                    rating: 5,
                    isPublished: true
                },
                {
                    id: 'testi_2',
                    name: 'Sarah Wijaya',
                    role: 'Founder',
                    company: 'Beresin Tech',
                    content: 'Komunikasi timnya asik, nggak kaku, dan eksekusi kodenya beneran rapi. Bukan template murahan!',
                    rating: 5,
                    isPublished: true
                },
                {
                    id: 'testi_3',
                    name: 'Dimas Pratama',
                    role: 'Head of Growth',
                    company: 'Anggana Logistik',
                    content: 'SEO-nya langsung naik di halaman 1 Google dalam waktu 3 minggu setelah rilis. Rekomendasi buat agensi yang butuh web performa tinggi.',
                    rating: 5,
                    isPublished: true
                },
                {
                    id: 'testi_4',
                    name: 'Citra Amelia',
                    role: 'Brand Owner',
                    company: 'Dapoer Niknik',
                    content: 'Tampilannya clean, estetik, dan responsif banget di iPhone. Klien korporat kami jadi jauh lebih percaya.',
                    rating: 5,
                    isPublished: true
                }
            ]);
        }

        if (!portfolio || !portfolio.length) {
            await redis.set('dents:portfolio', [
                {
                    id: 'port_1',
                    title: 'Beresin Services Platform',
                    slug: 'beresin-platform',
                    client: 'Beresin Tech Indonesia',
                    category: 'Web Application',
                    year: 2026,
                    image: '/public/img/axalogo.png',
                    tools: ['html5', 'javascript', 'nodejs', 'express', 'redis', 'tailwindcss'],
                    shortDescription: 'Platform digital on-demand dengan sistem booking realtime dan notifikasi WhatsApp otomatis.',
                    description: 'Membangun arsitektur web aplikasi skalabel yang memangkas waktu pemesanan dari 10 menit menjadi di bawah 60 detik.',
                    challenge: 'Trafik tinggi pada jam sibuk sering membuat website lama down dan konversi terbuang sia-sia.',
                    solution: 'Implementasi arsitektur serverless Node.js dengan caching Redis berkecepatan ultra tinggi.',
                    projectUrl: 'https://dentsweb.my.id',
                    isFeatured: true,
                    isPublished: true
                },
                {
                    id: 'port_2',
                    title: 'Anggana Global Logistics',
                    slug: 'anggana-logistics',
                    client: 'Anggana Cargo',
                    category: 'Company Profile Pro',
                    year: 2026,
                    image: '/public/img/axalogo.png',
                    tools: ['html5', 'typescript', 'nextjs', 'postgresql', 'docker', 'vercel'],
                    shortDescription: 'Company profile korporat dengan pelacakan resi instan dan skor Core Web Vitals 99.',
                    description: 'Transformasi identitas digital korporat untuk memenangkan tender logistik nasional dan regional.',
                    challenge: 'Perusahaan membutuhkan portal yang merefleksikan kredibilitas kelas dunia untuk presentasi ke klien internasional.',
                    solution: 'Desain neo-modern dengan micro-animations halus dan integrasi API tracking otomatis.',
                    projectUrl: 'https://dentsweb.my.id',
                    isFeatured: true,
                    isPublished: true
                }
            ]);
        } else {
            let modified = false;
            const updated = portfolio.map(item => {
                if (!item.tools || !item.tools.length) {
                    modified = true;
                    if (item.id === 'port_1' || item.slug === 'beresin-platform') {
                        return { ...item, tools: ['html5', 'javascript', 'nodejs', 'express', 'redis', 'tailwindcss'] };
                    } else {
                        return { ...item, tools: ['html5', 'typescript', 'nextjs', 'postgresql', 'docker', 'vercel'] };
                    }
                }
                return item;
            });
            if (modified) {
                await redis.set('dents:portfolio', updated);
            }
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
    const featuredPortfolio = rawPortfolio.filter(p => p.isPublished && p.isFeatured).slice(0, 4);
    const activeTestimonials = rawTestimonials.filter(t => t.isPublished !== false); 

    res.render('index', { 
        settings, 
        services: featuredServices.length ? featuredServices : rawServices.slice(0, 3),
        portfolio: featuredPortfolio.length ? featuredPortfolio : rawPortfolio.slice(0, 4),
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

    if (!project) return res.status(404).send('404 - Portfolio tidak ditemukan');

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
