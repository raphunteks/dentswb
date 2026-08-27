require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis (Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env automatically)
const redis = Redis.fromEnv();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Headers (Helmet config adjusted for Inline Scripts if needed for EJS/VanillaJS interactions)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allowed for EJS injected scripts
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*"], // allow external image hosts for portfolio
            connectSrc: ["'self'"]
        }
    },
    xPoweredBy: false
}));

// Rate Limiting
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per windowMs
    message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 failed attempts allowed
    message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit.',
});

const leadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Terlalu banyak form yang dikirim. Silakan tunggu beberapa saat.',
});

app.use(publicLimiter); // Apply to all by default

// Helper to fetch global settings (mocking a cache pattern)
async function getGlobalSettings() {
    try {
        const settings = await redis.get('dents:settings');
        if (settings) return settings;
        
        // Fallback default settings
        const defaultSettings = {
            siteName: 'Dents Web',
            tagline: 'Build Your Digital Presence.',
            defaultSeoTitle: 'Dents Web — Agency Digital Premium',
            defaultSeoDescription: 'Website Custom untuk Bisnis yang Ingin Tampil Serius. Jasa pembuatan website premium, SEO, dan performa tinggi.',
            email: 'hello@dentsweb.com',
            whatsapp: '+6281234567890'
        };
        // Save defaults if not exist
        await redis.set('dents:settings', defaultSettings);
        return defaultSettings;
    } catch (err) {
        console.error('[ERROR] Failed to fetch settings from Redis', err);
        return { siteName: 'Dents Web', defaultSeoTitle: 'Dents Web' };
    }
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

        // Refresh TTL on activity (30 mins)
        await redis.expire(`dents:admin:sessions:${sessionId}`, 1800);
        next();
    } catch (err) {
        console.error('[ERROR] Auth Check Failed', err);
        res.status(500).send('Internal Server Error');
    }
}

// ==========================================
// PUBLIC ROUTES (SSR EJS)
// ==========================================

app.get('/', async (req, res) => {
    const settings = await getGlobalSettings();
    // Fetch featured portfolio & services for homepage
    const rawServices = await redis.get('dents:services') || [];
    const rawPortfolio = await redis.get('dents:portfolio') || [];
    
    const featuredServices = rawServices.filter(s => s.isPublished && s.isFeatured).slice(0, 3);
    const featuredPortfolio = rawPortfolio.filter(p => p.isPublished && p.isFeatured).slice(0, 4);

    res.render('index', { 
        settings, 
        services: featuredServices,
        portfolio: featuredPortfolio,
        seo: { title: settings.defaultSeoTitle, desc: settings.defaultSeoDescription, path: '/' } 
    });
});

app.get('/services', async (req, res) => {
    const settings = await getGlobalSettings();
    const services = await redis.get('dents:services') || [];
    const publishedServices = services.filter(s => s.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('services', {
        settings,
        services: publishedServices,
        seo: { title: `Layanan Kami | ${settings.siteName}`, desc: 'Jelajahi layanan web development dan maintenance premium kami.', path: '/services' }
    });
});

app.get('/portfolio', async (req, res) => {
    const settings = await getGlobalSettings();
    const portfolio = await redis.get('dents:portfolio') || [];
    const publishedPortfolio = portfolio.filter(p => p.isPublished).sort((a, b) => b.year - a.year);

    res.render('portfolio', {
        settings,
        portfolio: publishedPortfolio,
        seo: { title: `Portfolio | ${settings.siteName}`, desc: 'Karya digital dan case study website dari klien-klien Dents Web.', path: '/portfolio' }
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
        seo: { 
            title: `${project.seoTitle || project.title} | ${settings.siteName}`, 
            desc: project.seoDescription || project.shortDescription, 
            path: `/portfolio/${project.slug}`,
            image: project.image
        }
    });
});

app.get('/pricing', async (req, res) => {
    const settings = await getGlobalSettings();
    const pricing = await redis.get('dents:pricing') || [];
    const activePricing = pricing.filter(p => p.isPublished !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('pricing', {
        settings,
        pricing: activePricing,
        seo: { title: `Investasi Digital | ${settings.siteName}`, desc: 'Harga dan paket transparan untuk kebutuhan website bisnis Anda.', path: '/pricing' }
    });
});

app.get('/faq', async (req, res) => {
    const settings = await getGlobalSettings();
    const faq = await redis.get('dents:faq') || [];
    const publishedFaq = faq.filter(f => f.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('faq', {
        settings,
        faq: publishedFaq,
        seo: { title: `FAQ | ${settings.siteName}`, desc: 'Pertanyaan yang sering diajukan mengenai layanan Dents Web.', path: '/faq' }
    });
});

app.get('/about', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('about', {
        settings,
        seo: { title: `Tentang Kami | ${settings.siteName}`, desc: 'Misi dan filosofi Dents Web dalam membangun kehadiran digital.', path: '/about' }
    });
});

app.get('/contact', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('contact', {
        settings,
        seo: { title: `Hubungi Kami | ${settings.siteName}`, desc: 'Mari berdiskusi. Konsultasikan kebutuhan website Anda hari ini.', path: '/contact' }
    });
});

// ==========================================
// PUBLIC API (Form Submission)
// ==========================================
app.post('/api/leads', leadLimiter, async (req, res) => {
    try {
        const { name, whatsapp, email, company, message } = req.body;
        
        // Basic Server-side validation
        if (!name || !whatsapp || !message) {
            return res.status(400).json({ success: false, message: 'Nama, WhatsApp, dan Pesan wajib diisi.' });
        }

        const newLead = {
            id: `lead_${Date.now()}`,
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            email: email ? email.trim() : '',
            company: company ? company.trim() : '',
            message: message.trim(),
            status: 'NEW', // NEW, CONTACTED, QUOTED, WON, LOST
            createdAt: new Date().toISOString()
        };

        const leads = await redis.get('dents:leads') || [];
        leads.unshift(newLead); // Add to beginning
        
        // Keep only last 500 leads to prevent memory bloat in Redis Array (optional optimization)
        if (leads.length > 500) leads.pop();

        await redis.set('dents:leads', leads);
        
        console.log(`[INFO] New lead submitted: ${newLead.id}`);
        res.status(201).json({ success: true, message: 'Pesan berhasil dikirim.' });
    } catch (err) {
        console.error('[ERROR] /api/leads', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// ==========================================
// ADMIN ROUTES (Views & Auth)
// ==========================================
app.get('/admin', (req, res) => {
    if (req.cookies.admin_session) return res.redirect('/admin-dashboard');
    res.redirect('/admin-login');
});

app.get('/admin-login', (req, res) => {
    if (req.cookies.admin_session) return res.redirect('/admin-dashboard');
    res.render('admin-login', { seo: { title: 'Admin Login', desc: '', path: '' }});
});

app.post('/admin/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const envUser = process.env.ADMIN_USERNAME || 'admin';
        const envPassHash = process.env.ADMIN_PASSWORD_HASH;

        if (!envPassHash) {
            console.error('[FATAL] ADMIN_PASSWORD_HASH is not configured in .env');
            return res.status(500).json({ success: false, message: 'Server misconfiguration.' });
        }

        if (username !== envUser) {
            return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });
        }

        const isValid = await bcrypt.compare(password, envPassHash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });
        }

        // Generate Secure Session
        const sessionId = crypto.randomUUID();
        const sessionData = { username, loginAt: new Date().toISOString() };
        
        // Store in Redis (Expire in 1 hour)
        await redis.set(`dents:admin:sessions:${sessionId}`, sessionData, { ex: 3600 });

        // Set HttpOnly Cookie
        res.cookie('admin_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000 // 1 hour
        });

        console.log(`[AUTH] Admin logged in: ${username}`);
        res.json({ success: true, redirect: '/admin-dashboard' });
    } catch (err) {
        console.error('[ERROR] Login failed', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
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

// ==========================================
// ADMIN API (CRUD Endpoints)
// ==========================================
// All these routes are protected by requireAdmin middleware

// Utility function for basic Redis List CRUD
async function handleListGet(req, res, redisKey) {
    try {
        const data = await redis.get(redisKey) || [];
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
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
    } catch (err) {
        console.error(`[ERROR] CRUD on ${redisKey}`, err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Leads API
app.get('/api/admin/leads', requireAdmin, (req, res) => handleListGet(req, res, 'dents:leads'));
app.patch('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));
app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));

// Portfolio API
app.get('/api/admin/portfolio', requireAdmin, (req, res) => handleListGet(req, res, 'dents:portfolio'));
app.post('/api/admin/portfolio', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.put('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.delete('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));

// Services API
app.get('/api/admin/services', requireAdmin, (req, res) => handleListGet(req, res, 'dents:services'));
app.post('/api/admin/services', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.put('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.delete('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));

// FAQ API
app.get('/api/admin/faq', requireAdmin, (req, res) => handleListGet(req, res, 'dents:faq'));
app.post('/api/admin/faq', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.put('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.delete('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));

// Settings API
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
// SEO & SYSTEM ROUTES
// ==========================================
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin-login\nDisallow: /api/`);
});

app.get('/sitemap.xml', async (req, res) => {
    const settings = await getGlobalSettings();
    const baseUrl = settings.siteUrl || `https://${req.get('host')}`;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    const staticRoutes = ['/', '/services', '/portfolio', '/pricing', '/about', '/contact', '/faq'];
    staticRoutes.forEach(route => {
        xml += `<url><loc>${baseUrl}${route}</loc><changefreq>weekly</changefreq><priority>${route==='/'?'1.0':'0.8'}</priority></url>\n`;
    });

    const portfolio = await redis.get('dents:portfolio') || [];
    portfolio.filter(p => p.isPublished).forEach(p => {
        xml += `<url><loc>${baseUrl}/portfolio/${p.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
    });

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

// 404 Fallback
app.use((req, res, next) => {
    res.status(404).send('404 - Halaman Tidak Ditemukan. Silakan kembali ke beranda.'); 
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[FATAL] Uncaught Error:', err);
    res.status(500).send('500 - Terjadi kesalahan internal server.');
});

// ==========================================
// SERVER BOOTSTRAP (For Vercel)
// ==========================================
// Vercel serverless functions need the app instance exported
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[DENTS WEB] Server running on http://localhost:${PORT}`);
    });
}