/**
 * DENTS WEB — WebMCP (Web Model Context Protocol) progressive enhancement
 * Registered according to W3C Web Machine Learning CG Draft & Google Lighthouse 13.5.0 standards.
 * Provides safe, read-only AI agent tools directly in-browser.
 */

(function () {
    'use strict';

    const mc = (typeof document !== 'undefined' && document.modelContext) 
        ? document.modelContext 
        : (typeof navigator !== 'undefined' && navigator.modelContext ? navigator.modelContext : null);

    if (!mc || typeof mc.registerTool !== 'function') {
        // WebMCP not supported in this client environment; standard HTML/DOM tree serves as fallback.
        return;
    }

    const abortController = new AbortController();

    // 1. Tool: search_services
    try {
        mc.registerTool({
            name: "search_services",
            title: "Cari Layanan Dents Web",
            description: "Mencari layanan pembuatan website, spesifikasi teknis, dan kapabilitas rekayasa digital studio Dents Web berdasarkan kata kunci.",
            inputSchema: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Kata kunci pencarian layanan, solusi, atau teknologi (contoh: 'landing page', 'company profile', 'sistem informasi', 'otomasi')"
                    }
                },
                required: ["query"]
            },
            annotations: {
                readOnlyHint: true
            },
            async execute({ query }) {
                const q = (query || '').toLowerCase().trim();
                const services = [
                    {
                        name: "Landing Page Konversi Tinggi",
                        target: "Direct Response & Kampanye Iklan (Meta/Google Ads)",
                        tech: "Vanilla CSS, Vanilla JS, SSR Express, Ultra-Fast Assets",
                        performance: "Core Web Vitals LCP < 1.0 detik, Skor PageSpeed 98-100",
                        description: "Halaman penjualan dengan psikologi copywriting teruji, tombol CTA berdaya tekan tinggi, form lead terintegrasi langsung ke WhatsApp & Google Sheets.",
                        url: "https://www.dentsweb.my.id/pricing"
                    },
                    {
                        name: "Website Kustom & Company Profile",
                        target: "Korporasi, UMKM Bertumbuh, Agensi, Profesional",
                        tech: "Custom Backend SSR, Zero Template Bloat, 100% Kepemilikan Source Code",
                        performance: "Optimal untuk SEO Organik Google, Mobile-First Responsif",
                        description: "Arsitektur web kustom yang mencerminkan otoritas brand premium. Tidak ada plugin pihak ketiga yang memperlambat situs.",
                        url: "https://www.dentsweb.my.id/services"
                    },
                    {
                        name: "Sistem Informasi & Otomasi Digital",
                        target: "Operasional Bisnis, Dashboard Internal, Database Sinkron",
                        tech: "Google Apps Script, REST API, Upstash Redis KV, Webhook Otomatis",
                        performance: "0 ms Latensi UI dengan Client-Side Rendering + Cache Terintegrasi",
                        description: "Sistem pendataan kustom, form survei real-time, dashboard pelaporan multi-cabang yang terhubung langsung ke Google Sheets/Drive.",
                        url: "https://www.dentsweb.my.id/services"
                    },
                    {
                        name: "UI/UX Engineering & Modern Rebranding",
                        target: "Produk Digital & Web Interaktif",
                        tech: "Design Token Architecture, GSAP 3 Physics, Three.js WebGL Subtle FX",
                        performance: "60 FPS Animasi Mulus Tanpa Layout Shift",
                        description: "Desain antarmuka berstandar studio internasional dengan palet warna harmonis, tipografi kurasi, dan interaktivitas mikro.",
                        url: "https://www.dentsweb.my.id/portfolio"
                    }
                ];

                const results = services.filter(s => 
                    s.name.toLowerCase().includes(q) ||
                    s.target.toLowerCase().includes(q) ||
                    s.tech.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q)
                );

                const output = results.length > 0 ? results : services;

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: query,
                                total_found: output.length,
                                services: output
                            }, null, 2)
                        }
                    ]
                };
            }
        }, { signal: abortController.signal }).catch(err => {
            console.debug('[WebMCP] Tool search_services registration note:', err?.message || err);
        });
    } catch (e) {
        // Fallback for draft variance
    }

    // 2. Tool: get_pricing_packages
    try {
        mc.registerTool({
            name: "get_pricing_packages",
            title: "Paket Harga Resmi Dents Web",
            description: "Mengambil data resmi paket harga pembuatan website Dents Web (Core Landing Page, Premier Business, Signature Web App, Corporate Custom).",
            inputSchema: {
                type: "object",
                properties: {
                    package_name: {
                        type: "string",
                        description: "Pilihan nama paket: 'core', 'premier', 'signature', 'corporate', atau 'all'",
                        default: "all"
                    }
                }
            },
            annotations: {
                readOnlyHint: true
            },
            async execute({ package_name }) {
                const pkgKey = (package_name || 'all').toLowerCase().trim();
                const packages = {
                    core: {
                        name: "Core — High-Conversion Landing Page",
                        price: "Rp 1.300.000",
                        turnaround: "3 - 5 Hari Kerja",
                        target: "Kampanye Iklan, Peluncuran Produk, Direct Response",
                        features: [
                            "1 Halaman Panjang Penjualan (Direct Response Flow)",
                            "Optimasi Kecepatan Ekstrem (Core Web Vitals < 1.0 detik)",
                            "Copywriting Struktur Konversi Tinggi",
                            "Integrasi Lead WhatsApp Langsung & Tracking Pixel Siap Pakai",
                            "Domain .my.id / .com & Hosting High-Speed 1 Tahun Penuh",
                            "Garansi Teknis & Revisi Minor 1 Bulan"
                        ]
                    },
                    premier: {
                        name: "Premier — Multi-Page Business & Company Profile",
                        price: "Rp 2.800.000",
                        turnaround: "7 - 10 Hari Kerja",
                        target: "Profil Perusahaan Profesional, UMKM Berkembang, Lembaga",
                        features: [
                            "Hingga 5 Halaman Terstruktur (Beranda, Layanan, Portofolio, Tentang, Kontak)",
                            "Arsitektur SEO On-Page Lengkap (Schema.org JSON-LD)",
                            "Panel Konten Terkelola / Form Pengajuan Pesan Terverifikasi",
                            "Free Domain .com / .co.id & Cloud Hosting SSD NVMe 1 Tahun",
                            "Integrasi Google Search Console & Peta Situs XML Otomatis",
                            "Garansi Pemeliharaan 2 Bulan Penuh"
                        ]
                    },
                    signature: {
                        name: "Signature — Web Application & Sistem Informasi",
                        price: "Rp 4.500.000",
                        turnaround: "14 - 21 Hari Kerja",
                        target: "Sistem Operasional Bisnis, Dashboard Manajemen, Web App",
                        features: [
                            "Arsitektur Web Kustom Lengkap dengan Database Cloud",
                            "Dashboard Admin Real-Time & Visualisasi Data",
                            "Otomasi Alur Kerja (Google Sheets Sync, Webhook, Notifikasi)",
                            "Sistem Autentikasi Pengguna Aman & Hak Akses Berjenjang",
                            "100% Kepemilikan Source Code Tanpa Biaya Lisensi Tersembunyi",
                            "Garansi Teknis & Pemeliharaan 3 Bulan Penuh"
                        ]
                    },
                    corporate: {
                        name: "Corporate — Solusi Perusahaan Skala Penuh",
                        price: "Mulai Rp 7.500.000 (Konsultasi Kustom)",
                        turnaround: "Sesuai Cakupan Kerja (Scope of Work)",
                        target: "Perusahaan Besar, Startup, Sistem Multi-Tenant",
                        features: [
                            "Arsitektur Mikro / Skalabilitas Tinggi",
                            "Integrasi Payment Gateway, Logistik API & CRM Eksternal",
                            "Audit Keamanan Menyeluruh & Uji Penetrasi",
                            "SLA Dukungan Prioritas 24/7",
                            "Pelatihan Tim Operasional & Dokumentasi API Lengkap"
                        ]
                    }
                };

                let responseData;
                if (pkgKey !== 'all' && packages[pkgKey]) {
                    responseData = { package: packages[pkgKey] };
                } else {
                    responseData = { packages: packages };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(responseData, null, 2)
                        }
                    ]
                };
            }
        }, { signal: abortController.signal }).catch(err => {
            console.debug('[WebMCP] Tool get_pricing_packages registration note:', err?.message || err);
        });
    } catch (e) {
        // Fallback for draft variance
    }

    // 3. Tool: get_contact_info
    try {
        mc.registerTool({
            name: "get_contact_info",
            title: "Kontak Resmi Dents Web",
            description: "Mengambil data kontak resmi dan saluran konsultasi terverifikasi studio Dents Web.",
            inputSchema: {
                type: "object",
                properties: {
                    purpose: {
                        type: "string",
                        description: "Tujuan konsultasi proyek website (contoh: 'tanya_harga', 'brief_proyek', 'support_teknis')"
                    }
                }
            },
            annotations: {
                readOnlyHint: true
            },
            async execute() {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                studio_name: "Dents Web Studio",
                                website: "https://www.dentsweb.my.id",
                                whatsapp_official: "+62 853 3892 2586",
                                whatsapp_link: "https://wa.me/6285338922586?text=Halo%20Dents%20Web,%20saya%20tertarik%20konsultasi%20proyek%20website",
                                email_official: "dentswebsitebuilder@gmail.com",
                                operational_hours: "Senin - Sabtu: 08:00 - 21:00 WITA (Minggu: Konsultasi Terjadwal)",
                                response_time_sla: "Maksimal 1x24 jam kerja (Umumnya respons dalam 15-30 menit)",
                                direct_consultation_url: "https://www.dentsweb.my.id/contact"
                            }, null, 2)
                        }
                    ]
                };
            }
        }, { signal: abortController.signal }).catch(err => {
            console.debug('[WebMCP] Tool get_contact_info registration note:', err?.message || err);
        });
    } catch (e) {
        // Fallback for draft variance
    }
})();
