/**
 * DENTS WEB — Adaptive High-Performance Hero Background
 * Universal Engine (Mobile, Tablet, Desktop):
 * - Three.js WebGL Particle Wave with adaptive density (36x36 mobile, 60x60 desktop).
 * - Ultra-smooth 60fps undulation, soft mouse & touch tilt parallax.
 * - Auto-pauses on visibility change / off-screen to guarantee 0% CPU & battery conservation.
 * - Graceful fallback to 2D ambient canvas if WebGL is unavailable.
 * Accents: Neon Lime (#bef264) & Sky/Royal Cyan (#38bdf8).
 */

(function () {
    'use strict';

    function initHeroScene() {
        const canvas = document.getElementById('hero-three-canvas');
        if (!canvas) return;

        const container = canvas.parentElement || document.body;

        // Start via requestIdleCallback to guarantee 0ms TBT during critical FCP/LCP
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => initAdaptiveThreeScene(canvas, container), { timeout: 800 });
        } else {
            setTimeout(() => initAdaptiveThreeScene(canvas, container), 100);
        }
    }

    // =========================================================================
    // UNIVERSAL ADAPTIVE THREE.JS ENGINE
    // =========================================================================
    function initAdaptiveThreeScene(canvas, container) {
        if (typeof THREE === 'undefined') {
            initFallbackCanvas(canvas, container);
            return;
        }

        let width = container.clientWidth || window.innerWidth;
        let height = container.clientHeight || window.innerHeight;
        const isMobile = window.innerWidth < 768;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
        camera.position.set(0, isMobile ? 70 : 80, isMobile ? 240 : 260);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: !isMobile,
                powerPreference: 'high-performance'
            });
        } catch (e) {
            console.warn('[DentsWeb 3D] WebGL not supported, falling back to 2D canvas:', e);
            initFallbackCanvas(canvas, container);
            return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));

        // Adaptive Particle Wave Grid
        const SEPARATION = isMobile ? 36 : 32;
        const AMOUNTX = isMobile ? 36 : 60;
        const AMOUNTY = isMobile ? 36 : 60;
        const numParticles = AMOUNTX * AMOUNTY;

        const positions = new Float32Array(numParticles * 3);
        const scales = new Float32Array(numParticles);
        const colors = new Float32Array(numParticles * 3);

        const colorLime = new THREE.Color(0xbef264);
        const colorCyan = new THREE.Color(0x38bdf8);
        const colorDeep = new THREE.Color(0x1d4ed8);

        let i = 0;
        let j = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
                positions[i + 1] = 0;
                positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);

                scales[j] = isMobile ? 2.0 : 2.4;

                const distRatio = Math.sqrt(
                    Math.pow((ix - AMOUNTX / 2) / (AMOUNTX / 2), 2) +
                    Math.pow((iy - AMOUNTY / 2) / (AMOUNTY / 2), 2)
                );

                const mixedColor = distRatio < 0.45
                    ? colorLime.clone().lerp(colorCyan, distRatio * 1.5)
                    : colorCyan.clone().lerp(colorDeep, Math.min(1, (distRatio - 0.45) * 1.2));

                colors[i] = mixedColor.r;
                colors[i + 1] = mixedColor.g;
                colors[i + 2] = mixedColor.b;

                i += 3;
                j++;
            }
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const createCircleTexture = () => {
            const canvas2d = document.createElement('canvas');
            canvas2d.width = 64;
            canvas2d.height = 64;
            const ctx = canvas2d.getContext('2d');
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
            gradient.addColorStop(0.7, 'rgba(190, 242, 100, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(32, 32, 32, 0, Math.PI * 2);
            ctx.fill();
            return new THREE.CanvasTexture(canvas2d);
        };

        const particleMaterial = new THREE.PointsMaterial({
            size: isMobile ? 3.8 : 4.4,
            map: createCircleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Ambient Floating Polyhedra
        const icoGeometry = new THREE.IcosahedronGeometry(isMobile ? 26 : 36, 1);
        const icoMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.16
        });
        const icosahedron1 = new THREE.Mesh(icoGeometry, icoMaterial);
        icosahedron1.position.set(isMobile ? 110 : 160, 50, -80);
        scene.add(icosahedron1);

        const icoMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xbef264,
            wireframe: true,
            transparent: true,
            opacity: 0.14
        });
        const icosahedron2 = new THREE.Mesh(new THREE.IcosahedronGeometry(isMobile ? 18 : 24, 1), icoMaterial2);
        icosahedron2.position.set(isMobile ? -110 : -180, 35, -100);
        scene.add(icosahedron2);

        // Mouse & Touch Interactivity
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;

        function onMouseMove(event) {
            targetMouseX = (event.clientX - windowHalfX) * 0.18;
            targetMouseY = (event.clientY - windowHalfY) * 0.18;
        }
        window.addEventListener('mousemove', onMouseMove, { passive: true });

        function onTouchMove(event) {
            if (event.touches.length > 0) {
                targetMouseX = (event.touches[0].clientX - windowHalfX) * 0.14;
                targetMouseY = (event.touches[0].clientY - windowHalfY) * 0.14;
            }
        }
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        // Responsive Resize
        function onWindowResize() {
            width = container.clientWidth || window.innerWidth;
            height = container.clientHeight || window.innerHeight;
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        window.addEventListener('resize', onWindowResize, { passive: true });

        // Animation Loop with Visibility Auto-Pause
        let count = 0;
        let isVisible = true;
        let animationFrameId = null;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isVisible = entry.isIntersecting;
                    if (isVisible && !animationFrameId) {
                        animate();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(container);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                isVisible = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            } else {
                isVisible = true;
                if (!animationFrameId) animate();
            }
        });

        function animate() {
            if (!isVisible) {
                animationFrameId = null;
                return;
            }

            animationFrameId = requestAnimationFrame(animate);

            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            camera.position.x = mouseX * 0.42;
            camera.position.y = (isMobile ? 70 : 90) - (mouseY * 0.35);
            camera.lookAt(0, 10, 0);

            icosahedron1.rotation.x += 0.003;
            icosahedron1.rotation.y += 0.005;
            icosahedron2.rotation.x -= 0.004;
            icosahedron2.rotation.y += 0.003;

            const posAttr = particles.geometry.attributes.position;
            const posArr = posAttr.array;

            let idx = 0;
            const waveScale = isMobile ? 12 : 16;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    const wave1 = Math.sin((ix + count) * 0.28) * waveScale;
                    const wave2 = Math.sin((iy + count) * 0.38) * waveScale;
                    const wave3 = Math.cos((ix + iy + count) * 0.2) * (waveScale * 0.6);
                    posArr[idx + 1] = wave1 + wave2 + wave3;
                    idx += 3;
                }
            }

            posAttr.needsUpdate = true;
            count += isMobile ? 0.038 : 0.045;

            renderer.render(scene, camera);
        }

        animate();
    }

    // =========================================================================
    // FALLBACK 2D CANVAS (If WebGL is unavailable on legacy hardware)
    // =========================================================================
    function initFallbackCanvas(canvas, container) {
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = (canvas.width = container.clientWidth || window.innerWidth);
        let height = (canvas.height = container.clientHeight || window.innerHeight);

        const particleCount = 28;
        const particles = [];
        const colors = ['rgba(190, 242, 100, 0.75)', 'rgba(56, 189, 248, 0.75)', 'rgba(29, 78, 216, 0.5)'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.2 + 1.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                alpha: Math.random() * 0.5 + 0.3
            });
        }

        let isVisible = true;
        let animId = null;

        function render2DFallback() {
            if (!isVisible) {
                animId = null;
                return;
            }

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
            }

            animId = requestAnimationFrame(render2DFallback);
        }

        render2DFallback();

        window.addEventListener('resize', () => {
            width = canvas.width = container.clientWidth || window.innerWidth;
            height = canvas.height = container.clientHeight || window.innerHeight;
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroScene);
    } else {
        initHeroScene();
    }
})();
