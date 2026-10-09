/**
 * DENTS WEB — Interactive WebGL Hero Background (Three.js)
 * High-performance 3D particle constellation and undulating wave grid
 * Featuring Neon Lime (#bef264) & Sky/Royal Cyan (#38bdf8) accents
 */

(function () {
    'use strict';

    function initHeroScene() {
        const canvas = document.getElementById('hero-three-canvas');
        if (!canvas) return;

        // Check WebGL support
        if (typeof THREE === 'undefined') {
            console.warn('[DentsWeb 3D] Three.js not loaded, skipping 3D hero scene.');
            return;
        }

        const container = canvas.parentElement || document.body;
        let width = container.clientWidth || window.innerWidth;
        let height = container.clientHeight || window.innerHeight;

        // 1. Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
        camera.position.set(0, 80, 260);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
        } catch (e) {
            console.warn('[DentsWeb 3D] WebGL not supported:', e);
            return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 2. Interactive Particle Wave Grid
        const SEPARATION = 32;
        const AMOUNTX = 65;
        const AMOUNTY = 65;
        const numParticles = AMOUNTX * AMOUNTY;

        const positions = new Float32Array(numParticles * 3);
        const scales = new Float32Array(numParticles);
        const colors = new Float32Array(numParticles * 3);

        const colorLime = new THREE.Color(0xbef264); // #bef264 Dents Web Lime
        const colorCyan = new THREE.Color(0x38bdf8); // #38bdf8 Neon Cyan
        const colorDeep = new THREE.Color(0x1d4ed8); // #1d4ed8 Royal Blue

        let i = 0;
        let j = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                // Centered X and Z plane
                positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
                positions[i + 1] = 0; // Y will be animated by sine wave
                positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);

                // Varied particle scale
                scales[j] = 2.4;

                // Color interpolation: lime on center/wave crests, cyan on edges
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

        // Generate circular glowing particle sprite texture
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
            size: 4.2,
            map: createCircleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // 3. Ambient Floating Geometric Wireframe Polyhedra
        const icoGeometry = new THREE.IcosahedronGeometry(36, 1);
        const icoMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const icosahedron1 = new THREE.Mesh(icoGeometry, icoMaterial);
        icosahedron1.position.set(160, 60, -80);
        scene.add(icosahedron1);

        const icoMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xbef264,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const icosahedron2 = new THREE.Mesh(new THREE.IcosahedronGeometry(24, 1), icoMaterial2);
        icosahedron2.position.set(-180, 40, -100);
        scene.add(icosahedron2);

        // 4. Mouse Interactivity & Smoothing
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        function onMouseMove(event) {
            targetMouseX = (event.clientX - windowHalfX) * 0.18;
            targetMouseY = (event.clientY - windowHalfY) * 0.18;
        }

        window.addEventListener('mousemove', onMouseMove, { passive: true });

        // Touch support
        function onTouchMove(event) {
            if (event.touches.length > 0) {
                targetMouseX = (event.touches[0].clientX - windowHalfX) * 0.18;
                targetMouseY = (event.touches[0].clientY - windowHalfY) * 0.18;
            }
        }
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        // 5. Responsive Resize
        function onWindowResize() {
            width = container.clientWidth || window.innerWidth;
            height = container.clientHeight || window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        window.addEventListener('resize', onWindowResize);

        // 6. Animation Loop
        let count = 0;
        let isVisible = true;
        let animationFrameId = null;

        // Visibility observer to save battery/resources
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

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let isReducedMotion = motionQuery.matches;

        if (motionQuery.addEventListener) {
            motionQuery.addEventListener('change', (e) => {
                isReducedMotion = e.matches;
                if (!isReducedMotion && isVisible && !animationFrameId) {
                    animate();
                }
            });
        }

        function animate() {
            if (!isVisible) {
                animationFrameId = null;
                return;
            }

            if (isReducedMotion) {
                renderer.render(scene, camera);
                animationFrameId = null;
                return;
            }

            animationFrameId = requestAnimationFrame(animate);

            // Smooth mouse interpolation
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            // Camera subtle tilt
            camera.position.x = mouseX * 0.45;
            camera.position.y = 90 - (mouseY * 0.35);
            camera.lookAt(0, 10, 0);

            // Animate floating polyhedra
            icosahedron1.rotation.x += 0.003;
            icosahedron1.rotation.y += 0.005;
            icosahedron2.rotation.x -= 0.004;
            icosahedron2.rotation.y += 0.003;

            // Undulating particle wave math
            const posAttr = particles.geometry.attributes.position;
            const posArr = posAttr.array;

            let idx = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    const wave1 = Math.sin((ix + count) * 0.28) * 16;
                    const wave2 = Math.sin((iy + count) * 0.38) * 16;
                    const wave3 = Math.cos((ix + iy + count) * 0.2) * 10;
                    posArr[idx + 1] = wave1 + wave2 + wave3;
                    idx += 3;
                }
            }

            posAttr.needsUpdate = true;
            count += 0.045;

            renderer.render(scene, camera);
        }

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroScene);
    } else {
        initHeroScene();
    }
})();
