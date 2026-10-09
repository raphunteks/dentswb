/**
 * DENTS WEB — GSAP 3 & ScrollTrigger Orchestrator
 * High-performance typography reveals, multi-stage narrative scroll,
 * interactive pricing tab transitions, and card micro-physics.
 */

(function () {
    'use strict';

    function initDentsWebAnimations() {
        // Check GSAP availability
        if (typeof gsap === 'undefined') {
            console.warn('[DentsWeb GSAP] GSAP not loaded, falling back to CSS animations.');
            return;
        }

        // Register ScrollTrigger if available
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 1. Hero Brand Character Reveal ("D E N T S W E B")
        const heroChars = document.querySelectorAll('.hero-char-stagger');
        if (heroChars.length > 0) {
            if (prefersReducedMotion) {
                gsap.set(heroChars, { opacity: 1, y: 0, scale: 1, rotateX: 0 });
            } else {
                gsap.from(heroChars, {
                    y: 25,
                    scale: 0.94,
                    duration: 0.8,
                    stagger: 0.05,
                    ease: 'power3.out'
                });
            }
        }

        // 2. Multi-Stage Hero Narrative Scroll (Inspired by solvdberanda.html)
        const scrollContainer = document.querySelector('.hero-narrative-container');
        const heroFrame = document.querySelector('.hero-sticky-frame');
        const stage1 = document.getElementById('hero-stage-1');
        const stage2 = document.getElementById('hero-stage-2');
        const stage3 = document.getElementById('hero-stage-3');
        const progressBar = document.getElementById('hero-scroll-progress-bar');
        const stageNum = document.getElementById('hero-scroll-stage-num');
        const bridgeCue = document.getElementById('hero-bridge-cue');

        if (scrollContainer && heroFrame && stage1 && stage2 && stage3 && typeof ScrollTrigger !== 'undefined') {
            const mm = gsap.matchMedia();

            // DESKTOP & TABLET: Smooth Pinned Multi-Stage Narrative (min-width: 768px)
            mm.add("(min-width: 768px)", () => {
                // Ensure initial stage states
                gsap.set(stage1, { opacity: 1, y: 0, pointerEvents: 'auto' });
                gsap.set(stage2, { opacity: 0, y: 40, pointerEvents: 'none' });
                gsap.set(stage3, { opacity: 0, y: 40, pointerEvents: 'none' });
                if (bridgeCue) gsap.set(bridgeCue, { opacity: 0, y: 15 });

                const updateHUD = (p) => {
                    if (progressBar) {
                        progressBar.style.width = Math.min(100, Math.max(10, p * 100)) + '%';
                    }
                    if (stageNum) {
                        if (p < 0.36) {
                            stageNum.textContent = '01 / 03';
                        } else if (p < 0.72) {
                            stageNum.textContent = '02 / 03';
                        } else {
                            stageNum.textContent = '03 / 03';
                        }
                    }
                };

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: scrollContainer,
                        pin: true,
                        start: 'top top',
                        end: '+=240%',
                        scrub: 0.8,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => updateHUD(self.progress)
                    }
                });

                // Phase 1: Stage 1 out, Stage 2 in
                tl.to(stage1, {
                    opacity: 0,
                    y: -35,
                    duration: 0.9,
                    ease: 'power2.inOut',
                    pointerEvents: 'none'
                }, 0.2)
                .fromTo(stage2, {
                    opacity: 0,
                    y: 40,
                    pointerEvents: 'none'
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power2.out',
                    pointerEvents: 'auto'
                }, 0.5);

                if (bridgeCue) {
                    tl.to(bridgeCue, {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out'
                    }, 0.9);
                }

                // Phase 2: Stage 2 out, Stage 3 in
                tl.to(stage2, {
                    opacity: 0,
                    y: -35,
                    duration: 0.9,
                    ease: 'power2.inOut',
                    pointerEvents: 'none'
                }, 1.7);

                if (bridgeCue) {
                    tl.to(bridgeCue, {
                        opacity: 0,
                        y: -15,
                        duration: 0.5,
                        ease: 'power2.in'
                    }, 1.6);
                }

                tl.fromTo(stage3, {
                    opacity: 0,
                    y: 40,
                    pointerEvents: 'none'
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 1.1,
                    ease: 'power2.out',
                    pointerEvents: 'auto'
                }, 2.0);

                // Tactile Cards Stagger landing inside Stage 3
                const proofCards = stage3.querySelectorAll('.tactile-card');
                if (proofCards.length > 0) {
                    tl.fromTo(proofCards, {
                        opacity: 0,
                        y: 25,
                        scale: 0.96
                    }, {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.1,
                        ease: 'back.out(1.2)'
                    }, 2.3);
                }

                // Phase 3: Reading Hold Buffer for Stage 3 ("Bukti lebih keras dari sekadar janji.")
                // Keeps stage 3 locked and readable while indicator shows full 03 / 03
                tl.to({}, { duration: 1.0 }, 3.0);
            });

            // Ensure ScrollTrigger accurately calculates layout
            ScrollTrigger.refresh();
        }

        // 3. Stagger Reveal for Content Cards across Sections
        if (typeof ScrollTrigger !== 'undefined') {
            const cardGrids = document.querySelectorAll('.pricing-grid-4, .service-grid-solvd, .tactile-grid-anim');
            cardGrids.forEach(grid => {
                const cards = grid.children;
                if (cards.length > 0) {
                    gsap.fromTo(cards,
                        {
                            opacity: 0,
                            y: 30
                        },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            stagger: 0.12,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: grid,
                                start: 'top 85%',
                                once: true
                            }
                        }
                    );
                }
            });
        }
    }

    // Interactive Tab Switcher for Pricing Categories
    window.switchPricingCategory = function (categoryKey, btnElement) {
        // 1. Update buttons state
        const tabBtns = document.querySelectorAll('.pricing-tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        if (btnElement) {
            btnElement.classList.add('active');
        }

        // 2. Hide all category panels
        const panels = document.querySelectorAll('.pricing-category-panel');
        panels.forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });

        // 3. Show target panel with GSAP fade-in
        const targetPanel = document.getElementById(`panel-${categoryKey}`);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');

            if (typeof gsap !== 'undefined') {
                const cards = targetPanel.querySelectorAll('.pricing-card-kalana, .addon-card-solvd');
                gsap.fromTo(cards,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
                );
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDentsWebAnimations);
    } else {
        initDentsWebAnimations();
    }
})();
