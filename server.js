require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// FIX VERCEL 500 ERROR (RATE LIMIT & PROXY)
// ==========================================
app.set('trust proxy', 1);

// Initialize Redis directly from Vercel KV
const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*"], 
            connectSrc: ["'self'"]
        }
    },
    xPoweredBy: false
}));

// Rate Limiting
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 150, message: 'Terlalu banyak permintaan.' });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Terlalu banyak percobaan login.' });
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Terlalu banyak form yang dikirim.' });
app.use(publicLimiter); 

// ==========================================
// GLOBAL SETTINGS HELPER 
// ==========================================
async function getGlobalSettings() {
    const defaultSettings = {
        siteName: "ents Web", // Visual UI
        tagline: "Build Your Digital Presence.",
        siteUrl: "https://dentsweb.my.id",
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

// ==========================================
// DYNAMIC SEO & JSON-LD SCHEMA BUILDER (GSC GOLD STANDARD)
// ==========================================
function buildSEO(settings, pageData) {
    const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/$/, '') : 'https://dentsweb.my.id';
    const cleanPath = pageData.path === '/' ? '' : pageData.path;
    const fullUrl = `${siteUrl}${cleanPath}`;
    
    const title = pageData.title ? `${pageData.title} | Dents Web` : settings.defaultSeoTitle;
    const desc = pageData.desc || settings.defaultSeoDescription;
    const image = pageData.image ? (pageData.image.startsWith('http') ? pageData.image : `${siteUrl}${pageData.image}`) : `${siteUrl}${settings.defaultOgImage}`;
    const keywords = pageData.keywords || "jasa pembuatan website, web developer, aplikasi mobile, Dents Web, agensi digital, website purwokerto, SEO website";

    // MASTER SCHEMA GRAPH
    let schemaGraph = [
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            "url": `${siteUrl}/`,
            "name": "Dents Web",
            "alternateName": ["Dents Web Agency", "DentsWeb"],
            "publisher": { "@id": `${siteUrl}/#organization` },
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        },
        {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            "name": "Dents Web",
            "url": `${siteUrl}/`,
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}${settings.logo}`
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": `+${settings.whatsapp}`,
                "contactType": "customer service"
            },
            "sameAs": [settings.socialLinks?.instagram, settings.socialLinks?.facebook, settings.socialLinks?.linkedin].filter(Boolean)
        },
        {
            "@type": "WebPage",
            "@id": `${fullUrl}#webpage`,
            "url": fullUrl,
            "name": title,
            "description": desc,
            "isPartOf": { "@id": `${siteUrl}/#website` },
            "about": { "@id": `${siteUrl}/#organization` }
        }
    ];

    // BREADCRUMB SCHEMA BUILDER
    if (pageData.path !== '/') {
        const pathParts = pageData.path.split('/').filter(p => p);
        let breadcrumb = {
            "@type": "BreadcrumbList",
            "@id": `${fullUrl}#breadcrumb`,
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Beranda",
                "item": `${siteUrl}/`
            }]
        };
        let currUrl = siteUrl;
        pathParts.forEach((part, idx) => {
            currUrl += `/${part}`;
            breadcrumb.itemListElement.push({
                "@type": "ListItem",
                "position": idx + 2,
                "name": part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
                "item": currUrl
            });
        });
        schemaGraph.push(breadcrumb);
    } else {
        // SITELINKS SCHEMA FOR HOMEPAGE
        schemaGraph.push({
            "@type": "ItemList",
            "@id": `${siteUrl}/#sitelinks`,
            "name": "Navigasi Utama Dents Web",
            "itemListElement": [
                { "@type": "SiteNavigationElement", "position": 1, "name": "Layanan Kami", "url": `${siteUrl}/services` },
                { "@type": "SiteNavigationElement", "position": 2, "name": "Portfolio", "url": `${siteUrl}/portfolio` },
                { "@type": "SiteNavigationElement", "position": 3, "name": "Investasi Digital", "url": `${siteUrl}/pricing` },
                { "@type": "SiteNavigationElement", "position": 4, "name": "Hubungi Kami", "url": `${siteUrl}/contact` }
            ]
        });
    }

    // INJECT CUSTOM SPECIFIC SCHEMA (FAQ, Items, etc)
    if (pageData.schema) {
        schemaGraph.push(pageData.schema);
    }

    const finalSchema = {
        "@context": "https://schema.org",
        "@graph": schemaGraph
    };

    return {
        title,
        desc,
        url: fullUrl,
        image,
        keywords,
        schemaString: JSON.stringify(finalSchema)
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
// PUBLIC ROUTES (SSR EJS)
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
        services: featuredServices,
        portfolio: featuredPortfolio,
        testimonials: activeTestimonials,
        seo: buildSEO(settings, { title: "", desc: settings.defaultSeoDescription, path: '/' }) 
    });
});

app.get('/services', async (req, res) => {
    const settings = await getGlobalSettings();
    const services = await redis.get('dents:services') || [];
    const publishedServices = services.filter(s => s.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    const serviceSchema = {
        "@type": "ItemList",
        "itemListElement": publishedServices.map((s, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `${settings.siteUrl}/services#${s.slug || idx}`,
            "name": s.title,
            "description": s.shortDescription || s.description
        }))
    };

    res.render('services', {
        settings,
        services: publishedServices,
        seo: buildSEO(settings, { title: 'Layanan Kami', desc: 'Jelajahi layanan web development premium kami.', path: '/services', schema: serviceSchema })
    });
});

app.get('/portfolio', async (req, res) => {
    const settings = await getGlobalSettings();
    const portfolio = await redis.get('dents:portfolio') || [];
    const publishedPortfolio = portfolio.filter(p => p.isPublished).sort((a, b) => b.year - a.year);

    res.render('portfolio', {
        settings,
        portfolio: publishedPortfolio,
        seo: buildSEO(settings, { title: 'Portfolio', desc: 'Karya digital dari klien-klien Dents Web.', path: '/portfolio' })
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
        seo: buildSEO(settings, { title: project.seoTitle || project.title, desc: project.seoDescription || project.shortDescription, path: `/portfolio/${project.slug}`, image: project.image })
    });
});

app.get('/pricing', async (req, res) => {
    const settings = await getGlobalSettings();
    const pricing = await redis.get('dents:pricing') || [];
    const activePricing = pricing.filter(p => p.isPublished !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    res.render('pricing', {
        settings,
        pricing: activePricing,
        seo: buildSEO(settings, { title: 'Investasi Digital', desc: 'Harga dan paket transparan untuk kebutuhan website Anda.', path: '/pricing' })
    });
});

app.get('/faq', async (req, res) => {
    const settings = await getGlobalSettings();
    const faq = await redis.get('dents:faq') || [];
    const publishedFaq = faq.filter(f => f.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

    const faqSchema = publishedFaq.length > 0 ? {
        "@type": "FAQPage",
        "mainEntity": publishedFaq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
    } : null;

    res.render('faq', {
        settings,
        faq: publishedFaq,
        seo: buildSEO(settings, { title: 'FAQ', desc: 'Pertanyaan yang sering diajukan mengenai layanan Dents Web.', path: '/faq', schema: faqSchema })
    });
});

app.get('/about', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('about', {
        settings,
        seo: buildSEO(settings, { title: 'Tentang Kami', desc: 'Misi dan filosofi agensi Dents Web.', path: '/about' })
    });
});

app.get('/contact', async (req, res) => {
    const settings = await getGlobalSettings();
    res.render('contact', {
        settings,
        seo: buildSEO(settings, { title: 'Hubungi Kami', desc: 'Konsultasikan kebutuhan website Anda sekarang.', path: '/contact' })
    });
});

// ==========================================
// PUBLIC API
// ==========================================
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
// ADMIN ROUTES & API (Unchanged)
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

app.get('/api/admin/leads', requireAdmin, (req, res) => handleListGet(req, res, 'dents:leads'));
app.patch('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));
app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:leads'));

app.get('/api/admin/portfolio', requireAdmin, (req, res) => handleListGet(req, res, 'dents:portfolio'));
app.post('/api/admin/portfolio', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.put('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));
app.delete('/api/admin/portfolio/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:portfolio'));

app.get('/api/admin/services', requireAdmin, (req, res) => handleListGet(req, res, 'dents:services'));
app.post('/api/admin/services', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.put('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));
app.delete('/api/admin/services/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:services'));

app.get('/api/admin/pricing', requireAdmin, (req, res) => handleListGet(req, res, 'dents:pricing'));
app.post('/api/admin/pricing', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));
app.put('/api/admin/pricing/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));
app.delete('/api/admin/pricing/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:pricing'));

app.get('/api/admin/faq', requireAdmin, (req, res) => handleListGet(req, res, 'dents:faq'));
app.post('/api/admin/faq', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.put('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));
app.delete('/api/admin/faq/:id', requireAdmin, (req, res) => handleListUpdate(req, res, 'dents:faq'));

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
// SEO & ERRORS
// ==========================================
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin-login\nDisallow: /api/`);
});

app.get('/sitemap.xml', async (req, res) => {
    const settings = await getGlobalSettings();
    const baseUrl = settings.siteUrl ? settings.siteUrl.replace(/\/$/, '') : `https://${req.get('host')}`;
    
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

app.use((req, res, next) => {
    res.status(404).send('404 - Halaman Tidak Ditemukan. Silakan kembali ke beranda.'); 
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
