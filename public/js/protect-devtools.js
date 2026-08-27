/**
 * ==========================================================================
 * DENTS WEB - DEVTOOLS PROTECTION (LIGHT DETERRENT)
 * Location: public/js/protect-devtools.js
 * ==========================================================================
 * 
 * PERINGATAN SECURITY (Sesuai Dents Web Architecture):
 * INI BUKAN SECURITY. 
 * Skrip ini hanya bertindak sebagai "deterrent ringan" untuk mencegah 
 * pengguna awam melihat source code secara langsung.
 * 
 * Jangan pernah menyimpan password, token, secret, Redis credential, 
 * atau admin credential di frontend/browser. Semua otorisasi tetap harus 
 * divalidasi di server.js (Server-Side).
 */

(function() {
    'use strict';

    // 1. Matikan Klik Kanan (Context Menu)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // 2. Intercept Basic Shortcuts (Mencegah shortcut umum DevTools)
    document.addEventListener('keydown', function(e) {
        // Blokir F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
        }

        // Blokir Ctrl+Shift+I (Windows/Linux) atau Cmd+Option+I (Mac) - Inspector
        if (
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) || 
            (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73))
        ) {
            e.preventDefault();
        }

        // Blokir Ctrl+Shift+J (Windows/Linux) atau Cmd+Option+J (Mac) - Console
        if (
            (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) || 
            (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74))
        ) {
            e.preventDefault();
        }

        // Blokir Ctrl+U (Windows/Linux) atau Cmd+U (Mac) - View Source
        if (
            (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) || 
            (e.metaKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85))
        ) {
            e.preventDefault();
        }

        // Blokir Ctrl+S (Windows/Linux) atau Cmd+S (Mac) - Save Page
        if (
            (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) || 
            (e.metaKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83))
        ) {
            e.preventDefault();
        }
    });

    // 3. Console Warning (Mencegah aksi Self-XSS)
    const warningTitle = "%c BERHENTI!";
    const warningMessage = "%cIni adalah fitur browser yang ditujukan untuk developer. Jangan menyalin atau menempelkan (paste) kode apa pun di sini karena dapat membahayakan keamanan data Anda dan memberikan akses kepada penyerang.";
    
    const titleStyle = "color: #ef4444; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 0 #000;";
    const messageStyle = "font-size: 16px; color: #f8fafc; background: #18181b; padding: 10px; border-radius: 8px; line-height: 1.5;";

    // Gunakan setTimeout agar pesan dicetak setelah halaman sepenuhnya dimuat
    setTimeout(function() {
        console.log(warningTitle, titleStyle);
        console.log(warningMessage, messageStyle);
    }, 1000);

    // 4. Basic DevTools Detection Trap (Deterrent Ringan)
    // Jika DevTools terbuka, debugger akan terus-menerus mem-pause eksekusi.
    const debuggerTrap = function() {
        const start = new Date().getTime();
        
        // Anti-deobfuscation simple trap
        eval('debugger');
        
        const end = new Date().getTime();
        
        // Jika jeda eksekusi memakan waktu lebih dari 100ms, berarti debugger sedang aktif
        if (end - start > 100) {
            // Optional: Mengosongkan halaman jika DevTools dibuka
            document.body.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#09090b; flex-direction:column; gap:16px;">
                    <h1 style="color:#ef4444; font-family:sans-serif; text-align:center;">Tindakan Tidak Diizinkan</h1>
                    <p style="color:#a1a1aa; font-family:sans-serif; text-align:center;">Silakan tutup DevTools dan muat ulang halaman.</p>
                </div>
            `;
        }
    };

    // Jalankan trap setiap 2 detik
    setInterval(debuggerTrap, 2000);

})();