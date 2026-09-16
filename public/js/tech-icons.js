/**
 * DentsWeb Universal Tech Stack Registry (116 Tools)
 * Authentic SVG Brand Vectors, Hex Colors, Categories & Indonesian Functional Descriptions.
 */
(function (global) {
  'use strict';

  const TECH_CATALOG = [
    // ==========================================
    // FRONTEND (33 Tools)
    // ==========================================
    {
      id: 'html5',
      name: 'HTML5',
      category: 'frontend',
      color: '#E34F26',
      desc: 'Standar markah struktural web modern untuk kerangka konten semantik dan aksesibilitas tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.56l4.07-1.13.55-6.19H7.38l.2 2.26h6.86l-.23 2.59-2.21.6-2.21-.6-.14-1.6H7.44l.27 3.34L12 17.56zm9-14.86l-1.91 21.43L12 26.27 4.91 24.13 3 2.7h18zM19.1 4.7H4.9l1.6 17.7 5.5 1.6 5.5-1.6 1.6-17.7z"/></svg>'
    },
    {
      id: 'css3',
      name: 'CSS3',
      category: 'frontend',
      color: '#1572B6',
      desc: 'Bahasa lembar gaya modern untuk tata letak visual dinamis, animasi halus, dan responsivitas layar.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0h21l-1.9 21.2L12 24l-8.6-2.8L1.5 0zm17.9 4.3H4.6l.4 4.5h13.9l-.4 4.5H5.4l.4 4.5 6.2 1.7 6.2-1.7.9-9h-10l-.2-2.3h10.9l.2-2.2z"/></svg>'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      category: 'frontend',
      color: '#F7DF1E',
      desc: 'Bahasa pemrograman inti web interaktif untuk memanipulasi DOM, state reaktif, dan logika klien.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.221.24 1.064-.645 1.47-1.741 1.395-.915-.12-1.454-.645-1.935-1.44l-1.845 1.066c.33.69.75 1.23 1.29 1.635.81.63 1.876.855 2.971.765 1.155-.105 2.22-.616 2.76-1.546.541-.855.586-1.876.15-2.731l.004.045zm-7.98-7.981H11.75v6.526c0 1.5-.15 2.371-.72 2.895-.496.42-1.141.556-1.936.42-.72-.12-1.245-.48-1.575-.975-.195-.3-.315-.69-.375-1.11l-2.01.255c.105.99.45 1.77 1.02 2.37.855.9 2.055 1.14 3.42 1.02 1.365-.12 2.355-.72 2.895-1.635.48-.825.57-1.935.57-3.48V10.295z"/></svg>'
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      category: 'frontend',
      color: '#3178C6',
      desc: 'Superset JavaScript berbasis tipe statis untuk kode berskala enterprise yang aman dari bug runtime.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0h21A1.5 1.5 0 0 1 24 1.5v21a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 22.5v-21A1.5 1.5 0 0 1 1.5 0zm9.467 12.87h2.247v-1.94H6.262v1.94h2.247v7.659h2.458V12.87zm4.72 5.064c.594.333 1.34.542 2.115.542 1.303 0 2.083-.635 2.083-1.615 0-.917-.552-1.427-1.948-1.958-1.782-.678-2.657-1.543-2.657-2.928 0-1.781 1.406-3.083 3.667-3.083 1.042 0 1.958.26 2.604.667l-.688 1.833c-.562-.312-1.229-.49-1.958-.49-1.146 0-1.771.583-1.771 1.375 0 .844.573 1.302 2.021 1.865 1.875.719 2.625 1.635 2.625 3.062 0 1.896-1.479 3.198-3.927 3.198-1.208 0-2.313-.333-3.031-.812l.865-1.756z"/></svg>'
    },
    {
      id: 'react',
      name: 'React',
      category: 'frontend',
      color: '#61DAFB',
      desc: 'Library UI berbasis komponen deklaratif dari Meta untuk Single Page Application performa tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2.2"/><g fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="12" cy="12" rx="11" ry="4.2"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/></g></svg>'
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      category: 'frontend',
      color: '#000000',
      desc: 'Framework React fullstack standar industri dengan Server-Side Rendering (SSR), SSG, dan SEO maksimal.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.632 17.657l-6.195-7.975v7.975H9.55V6.343h1.887l6.195 7.975V6.343h1.887v11.314h-1.887z"/></svg>'
    },
    {
      id: 'vuejs',
      name: 'Vue.js',
      category: 'frontend',
      color: '#4FC08D',
      desc: 'Framework frontend progresif yang elegan, ringan, dan memiliki sistem reaktivitas dua arah intuitif.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.197 1.6H24L12 22.4 0 1.6h4.803L12 14.07 19.197 1.6zM12 10.457L6.87 1.6H10.4l1.6 2.773 1.6-2.773h3.53z"/></svg>'
    },
    {
      id: 'nuxtjs',
      name: 'Nuxt.js',
      category: 'frontend',
      color: '#00DC82',
      desc: 'Framework intuisi bertenaga Vue.js untuk SSR, auto-routing, dan performa web optimal.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.835 15.657L12 10.171l5.526 9.572H1.64l4.248-7.357 2.947 3.271zm6.33-10.971L22.36 19.743H18.11L12.583 10.17 15.165 4.686z"/></svg>'
    },
    {
      id: 'angular',
      name: 'Angular',
      category: 'frontend',
      color: '#DD0031',
      desc: 'Platform arsitektur frontend berkekuatan Google untuk aplikasi enterprise berskala raksasa.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.75 3.65l1.58 13.68L12 24l8.67-6.67 1.58-13.68L12 0zm0 3.73l5.08 11.37h-2.15l-1.04-2.58H10.1l-1.04 2.58H6.92L12 3.73zm1.18 6.94L12 7.82l-1.18 2.85h2.36z"/></svg>'
    },
    {
      id: 'svelte',
      name: 'Svelte',
      category: 'frontend',
      color: '#FF3E00',
      desc: 'Framework kompilasi tanpa virtual DOM untuk kecepatan kilat dan bundle file super mini.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.94 4.3a6.83 6.83 0 0 0-9.61-.95L6.68 7.3a6.78 6.78 0 0 0-2.38 5.75 6.79 6.79 0 0 0 3.86 5.86 6.83 6.83 0 0 0 7.8-.57l1.71-1.46a.82.82 0 0 0-.53-1.43.85.85 0 0 0-.54.2l-1.7 1.46a5.18 5.18 0 0 1-5.91.43 5.15 5.15 0 0 1-2.93-4.44 5.16 5.16 0 0 1 1.8-4.37l4.65-3.95a5.19 5.19 0 0 1 7.3.72 5.14 5.14 0 0 1 .42 5.92l-2.09 3.52a.82.82 0 1 0 1.42.84l2.09-3.52a6.8 6.8 0 0 0-.54-7.85z"/></svg>'
    },
    {
      id: 'sveltekit',
      name: 'SvelteKit',
      category: 'frontend',
      color: '#FF3E00',
      desc: 'Framework aplikasi web modern bertenaga Svelte dengan SSR, edge functions, dan navigasi instan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
    },
    {
      id: 'astro',
      name: 'Astro',
      category: 'frontend',
      color: '#BC52EE',
      desc: 'Web framework berarsitektur Islands untuk situs berorientasi konten dengan zero-JS default.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.358 20.162c-.186-.44-.316-.94-.374-1.462-.057-.52-.03-.996.082-1.428.113-.432.32-.803.62-1.112.3-.31.68-.537 1.137-.682.457-.145.986-.184 1.587-.117.6.066 1.233.255 1.899.567.666.31 1.353.743 2.06 1.298l-7.011 2.936zm7.284-16.324c-1.14 1.83-2.6 4.398-4.382 7.702-1.782 3.305-3.484 6.702-5.105 10.19l3.327-1.393c.373-.787.77-1.614 1.192-2.482l6.818-2.855c.61 1.011 1.127 1.95 1.55 2.818l2.95-1.235c-1.892-3.83-3.957-7.792-6.195-11.886-.052-.095-.102-.19-.155-.284z"/></svg>'
    },
    {
      id: 'solidjs',
      name: 'SolidJS',
      category: 'frontend',
      color: '#2C4F7C',
      desc: 'Library UI ultra reaktif tanpa Virtual DOM dengan sintaks JSX dan benchmark kecepatan teratas.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.23 16.5l4.87-8.43h10.9L14.13 16.5H3.23zM8.1 3.97l4.87 8.43H2.07L6.94 3.97H8.1zm7.8 0l4.87 8.43H9.87L14.74 3.97h1.16z"/></svg>'
    },
    {
      id: 'remix',
      name: 'Remix',
      category: 'frontend',
      color: '#E82B6A',
      desc: 'Framework fullstack React yang fokus pada standar web HTTP, navigasi cepat, dan data caching elegan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.4 3h7.2c3.5 0 6.4 2.9 6.4 6.4 0 2.2-1.1 4.1-2.8 5.2l3.4 6.4H15l-3-6h-3.6v6H5.4V3zm3 3v6h4.2c1.9 0 3.4-1.5 3.4-3.4 0-1.9-1.5-3.4-3.4-3.4H8.4z"/></svg>'
    },
    {
      id: 'vite',
      name: 'Vite',
      category: 'frontend',
      color: '#646CFF',
      desc: 'Build tool generasi baru berbasis native ESM untuk Hot Module Replacement (HMR) secepat kilat.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.08 4.29L12.7 21.84a.8.8 0 0 1-1.42 0L1.92 4.29a.8.8 0 0 1 .92-1.15l9.16 2.45 9.16-2.45a.8.8 0 0 1 .92 1.15zM12 6.47l-6.84-1.83 6.84 12.8 6.84-12.8L12 6.47z"/></svg>'
    },
    {
      id: 'webpack',
      name: 'Webpack',
      category: 'frontend',
      color: '#8DD6F9',
      desc: 'Module bundler fleksibel dan tangguh untuk memaketkan aset JavaScript, CSS, dan file statis.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.002 0l10.39 6.002v11.996L12.002 24 1.61 17.998V6.002L12.002 0zm.82 2.016v4.303l5.882 3.396 3.66-2.115-9.542-5.584zm-1.64 0L1.64 7.6l3.66 2.115 5.882-3.396V2.016zm9.54 8.784l-3.66 2.115v6.792l3.66-2.115V10.8zm-19.08 0v6.792l3.66 2.115V12.915l-3.66-2.115zm10.36 4.887l-4.717-2.724-4.717 2.724 4.717 2.723 4.717-2.723z"/></svg>'
    },
    {
      id: 'tailwindcss',
      name: 'Tailwind CSS',
      category: 'frontend',
      color: '#06B6D4',
      desc: 'Framework CSS utility-first terpopuler untuk perancangan antarmuka cepat tanpa menulis custom CSS.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6c-3.8 0-6 1.8-6.6 5.4 1.4-1.8 3.1-2.4 5.1-1.8 1.1.3 2 1.2 2.9 2.1C14.8 13.2 16.6 15 20.4 15c3.8 0 6-1.8 6.6-5.4-1.4 1.8-3.1 2.4-5.1 1.8-1.1-.3-2-1.2-2.9-2.1C17.6 7.8 15.8 6 12 6zM3.6 15C-.2 15-2.4 16.8-3 20.4c1.4-1.8 3.1-2.4 5.1-1.8 1.1.3 2 1.2 2.9 2.1C6.4 22.2 8.2 24 12 24c3.8 0 6-1.8 6.6-5.4-1.4 1.8-3.1 2.4-5.1 1.8-1.1-.3-2-1.2-2.9-2.1C9.2 16.8 7.4 15 3.6 15z"/></svg>'
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap',
      category: 'frontend',
      color: '#7952B3',
      desc: 'Framework toolkit komponen responsif klasik berbasis sistem grid 12 kolom yang stabil dan teruji.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.75 0C1.68 0 0 1.68 0 3.75v16.5C0 22.32 1.68 24 3.75 24h16.5c2.07 0 3.75-1.68 3.75-3.75V3.75C24 1.68 22.32 0 20.25 0H3.75zm5.72 4.93h5.27c2.44 0 3.86 1.26 3.86 3.23 0 1.43-.84 2.45-2.09 2.87v.08c1.55.33 2.59 1.5 2.59 3.2 0 2.24-1.74 3.76-4.36 3.76H9.47V4.93zm3.17 2.65v3.42h1.8c1.07 0 1.77-.55 1.77-1.71 0-1.13-.7-1.71-1.77-1.71h-1.8zm0 5.86v3.74h2.15c1.23 0 1.98-.6 1.98-1.87 0-1.25-.75-1.87-1.98-1.87h-2.15z"/></svg>'
    },
    {
      id: 'sass',
      name: 'Sass / SCSS',
      category: 'frontend',
      color: '#CC6699',
      desc: 'Ekstensi pra-pemroses CSS dengan variabel, mixin terstruktur, dan nesting hierarki rapi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.66 16.58c-.73.47-1.78.75-2.85.75-2.91 0-4.6-1.79-4.6-4.35 0-2.85 2.03-4.62 4.88-4.62 1.02 0 1.86.27 2.47.67l-.64 1.43c-.5-.33-1.13-.53-1.83-.53-1.91 0-3.14 1.18-3.14 3.05 0 1.79 1.13 2.92 2.99 2.92.74 0 1.43-.18 1.95-.49l.77 1.17z"/></svg>'
    },
    {
      id: 'shadcn',
      name: 'Shadcn UI',
      category: 'frontend',
      color: '#000000',
      desc: 'Koleksi komponen UI modern berbasis Radix UI dan Tailwind dengan kepemilikan kode 100% penuh.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 4.5l-17 17M16 3.5l-13 13M21.5 8.5l-13 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
    },
    {
      id: 'mui',
      name: 'Material UI (MUI)',
      category: 'frontend',
      color: '#007FFF',
      desc: 'Pustaka komponen React terlengkap yang mengimplementasikan spesifikasi Google Material Design.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 2.475v10.39l3 1.733V7.67l6 3.464 6-3.464v6.928l-3 1.733v3.464l6 3.464 6-3.464V2.475L12 9.403 0 2.475zm12 10.975l-3-1.732v-3.465l3 1.732 3-1.732v3.465l-3 1.732z"/></svg>'
    },
    {
      id: 'chakraui',
      name: 'Chakra UI',
      category: 'frontend',
      color: '#319795',
      desc: 'Pustaka komponen modular sederhana yang mengutamakan kemudahan aksesibilitas (a11y) dan tema.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-8.485 20.485L12 12V0zm0 24a12 12 0 0 0 8.485-20.485L12 12v12z"/></svg>'
    },
    {
      id: 'antdesign',
      name: 'Ant Design',
      category: 'frontend',
      color: '#0170FE',
      desc: 'Sistem desain enterprise komprehensif dari Alibaba dengan komponen formulir dan tabel tingkat tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 2.3l8.4 4.85v9.7L12 21.7 3.6 16.85V7.15L12 2.3z"/></svg>'
    },
    {
      id: 'daisyui',
      name: 'DaisyUI',
      category: 'frontend',
      color: '#1AD1A5',
      desc: 'Plugin komponen kelas semantik paling populer untuk Tailwind CSS tanpa bloat JavaScript.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4"/></svg>'
    },
    {
      id: 'mantine',
      name: 'Mantine',
      category: 'frontend',
      color: '#339AF0',
      desc: 'Library komponen React modern kaya fitur dengan 100+ hook berguna dan dark mode bawaan mulus.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19.5h20L12 2zm0 4.8l6.3 11H5.7L12 6.8z"/></svg>'
    },
    {
      id: 'threejs',
      name: 'Three.js',
      category: 'frontend',
      color: '#000000',
      desc: 'Pustaka JavaScript 3D bertenaga WebGL untuk merender grafik interaktif, shader, dan model 3D.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.75 17.25L12 22.5l-9.75-5.25V6.75L12 1.5l9.75 5.25v10.5zM12 3.2L4.5 7.2v7.6l7.5 4 7.5-4V7.2L12 3.2z"/></svg>'
    },
    {
      id: 'redux',
      name: 'Redux / Toolkit',
      category: 'frontend',
      color: '#764ABC',
      desc: 'Manajemen state terpusat yang dapat diprediksi dengan time-travel debugging untuk app berskala luas.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 15.3c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm-7.2 0c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm3.6-6.2c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/></svg>'
    },
    {
      id: 'zustand',
      name: 'Zustand',
      category: 'frontend',
      color: '#4338CA',
      desc: 'Solusi manajemen state React minimalis, cepat, tanpa boilerplate, dan berbasis hooks modern.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7.003 7.003 0 0 1 5 10a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7.003 7.003 0 0 1-6 6.93z"/></svg>'
    },
    {
      id: 'pinia',
      name: 'Pinia',
      category: 'frontend',
      color: '#FFE566',
      desc: 'Store state management resmi untuk Vue 3 yang ramah TypeScript dan sangat intuitif.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>'
    },
    {
      id: 'jquery',
      name: 'jQuery',
      category: 'frontend',
      color: '#0769AD',
      desc: 'Library legendaris untuk kemudahan seleksi DOM, event handler, dan AJAX kompatibilitas lintas peramban.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.66 8.5c0 3.2-2.13 5.46-5.46 5.46h-2.1v4.8H7.9V5.24h4.3c3.23 0 5.46 1.96 5.46 3.26zm-2.2 0c0-1.74-1.07-2.16-3.26-2.16h-2.1v4.32h2.1c2.19 0 3.26-.42 3.26-2.16z"/></svg>'
    },
    {
      id: 'alpinejs',
      name: 'Alpine.js',
      category: 'frontend',
      color: '#77C1D2',
      desc: 'Framework mikro deklaratif untuk menambahkan interaktivitas langsung pada tag HTML tanpa kompilasi rumit.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12l-6-6-6 6 6 6 6-6zM6 12l6-6-6-6-6 6 6 6zm6 6l-6-6-6 6 6 6 6-6z"/></svg>'
    },
    {
      id: 'webgl',
      name: 'WebGL',
      category: 'frontend',
      color: '#990000',
      desc: 'API grafis standar web untuk akselerasi perangkat keras 2D dan 3D di browser tanpa plugin.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5L1.5 6.75v10.5L12 22.5l10.5-5.25V6.75L12 1.5zm0 3.2l7.5 3.75v7.6L12 19.8 4.5 16.1V8.45L12 4.7z"/></svg>'
    },
    {
      id: 'canvas',
      name: 'Canvas API',
      category: 'frontend',
      color: '#E34F26',
      desc: 'Antarmuka grafis bitmap dinamis untuk manipulasi pixel, pembuatan game web, dan kompresi gambar klien.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/></svg>'
    },

    // ==========================================
    // BACKEND (30 Tools)
    // ==========================================
    {
      id: 'nodejs',
      name: 'Node.js',
      category: 'backend',
      color: '#339933',
      desc: 'Runtime JavaScript berbasis mesin Google V8 untuk arsitektur backend asinkron non-blocking.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.8a1.2 1.2 0 0 0-.6.16l-8.4 4.85a1.2 1.2 0 0 0-.6 1.04v9.7c0 .43.23.82.6 1.04l8.4 4.85c.37.21.83.21 1.2 0l8.4-4.85a1.2 1.2 0 0 0 .6-1.04v-9.7a1.2 1.2 0 0 0-.6-1.04l-8.4-4.85a1.2 1.2 0 0 0-.6-.16zm0 2.42l6.93 4-6.93 4-6.93-4 6.93-4zm-8 6.18l7 4.04v7.76l-7-4.04v-7.76zm16 0v7.76l-7 4.04v-7.76l7-4.04z"/></svg>'
    },
    {
      id: 'express',
      name: 'Express.js',
      category: 'backend',
      color: '#000000',
      desc: 'Framework web minimalis dan fleksibel untuk Node.js dengan sistem routing dan middleware tangguh.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.3 8.3L9 12 4.3 15.7l1.4 1.4L11.8 12 5.7 6.9 4.3 8.3zm8.7 7.7h7v2h-7v-2z"/></svg>'
    },
    {
      id: 'nestjs',
      name: 'NestJS',
      category: 'backend',
      color: '#E0234E',
      desc: 'Framework backend TypeScript progresif dengan arsitektur modular terinspirasi pola Angular.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm8.3 16.8L12 21.6l-8.3-4.8V7.2L12 2.4l8.3 4.8v9.6z"/></svg>'
    },
    {
      id: 'fastify',
      name: 'Fastify',
      category: 'backend',
      color: '#000000',
      desc: 'Framework web tercepat untuk Node.js dengan overhead minimal dan validasi skema JSON otomatis.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 0L1 6.5v11L11.5 24l11.5-6.5v-11L11.5 0zm0 3.2l8.5 4.8v8l-8.5 4.8-8.5-4.8v-8l8.5-4.8z"/></svg>'
    },
    {
      id: 'php',
      name: 'PHP',
      category: 'backend',
      color: '#777BB4',
      desc: 'Bahasa skrip server-side paling banyak digunakan di web modern untuk rendering cepat dan ekosistem matang.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-5.4 7.2h3.6c2.4 0 3.6 1.2 3.6 3 0 1.8-1.2 3-3.6 3h-1.8v3.6H6.6V7.2zm3.6 4.2c1.2 0 1.8-.6 1.8-1.2 0-.6-.6-1.2-1.8-1.2H8.4v2.4h1.8z"/></svg>'
    },
    {
      id: 'laravel',
      name: 'Laravel',
      category: 'backend',
      color: '#FF2D20',
      desc: 'Framework PHP paling elegan untuk pengrajin web dengan Eloquent ORM, Blade templating, dan artisan CLI.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.7 5.7L13.2.8a2.5 2.5 0 0 0-2.4 0L2.3 5.7A2.4 2.4 0 0 0 1.1 7.8v9.8a2.4 2.4 0 0 0 1.2 2.1l8.5 4.9a2.5 2.5 0 0 0 2.4 0l8.5-4.9a2.4 2.4 0 0 0 1.2-2.1V7.8a2.4 2.4 0 0 0-1.2-2.1zm-9.7-2.7l7.2 4.2-3.1 1.8-7.2-4.2 3.1-1.8z"/></svg>'
    },
    {
      id: 'symfony',
      name: 'Symfony',
      category: 'backend',
      color: '#000000',
      desc: 'Kumpulan komponen PHP standar industri yang menjadi fondasi banyak CMS dan framework enterprise.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.5 17.5c-2.8 0-4.5-1.5-4.5-3.8 0-2 1.4-3.4 3.7-3.4 1.2 0 2.2.4 2.7.9l-1 1.4c-.4-.3-1-.6-1.7-.6-1.3 0-2 .8-2 1.9 0 1.3.9 2 2.3 2 .8 0 1.5-.2 2-.6v-1.6h-2.1v-1.5h3.8v4c-.9.8-2.1 1.3-3.2 1.3z"/></svg>'
    },
    {
      id: 'codeigniter',
      name: 'CodeIgniter',
      category: 'backend',
      color: '#EF4223',
      desc: 'Framework PHP ringan dengan footprint kecil, performa kencang, dan konfigurasi hampir nol.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C7.2 4.8 4 9.6 4 14.4c0 4.4 3.6 8 8 8s8-3.6 8-8C20 9.6 16.8 4.8 12 0zm0 19.2c-2.6 0-4.8-2.2-4.8-4.8 0-2.4 2.4-5.6 4.8-8.8 2.4 3.2 4.8 6.4 4.8 8.8 0 2.6-2.2 4.8-4.8 4.8z"/></svg>'
    },
    {
      id: 'python',
      name: 'Python',
      category: 'backend',
      color: '#3776AB',
      desc: 'Bahasa serbaguna dengan sintaks bersih untuk pengembangan API backend, AI, otomasi, dan data science.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9 0C5.3 0 5.7 2.9 5.7 2.9l.01 3h6.3v.9H3.9S0 6.3 0 12.8s3.4 6.2 3.4 6.2h2v-2.8c0-3.3 2.8-3.3 2.8-3.3h5.6s2.7.05 2.7-2.6V2.9S16.9 0 11.9 0zm-1.8 1.8c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1zm1.9 22.2c6.6 0 6.2-2.9 6.2-2.9l-.01-3h-6.3v-.9h8.1s3.9.5 3.9-6-3.4-6.2-3.4-6.2h-2v2.8c0 3.3-2.8 3.3-2.8 3.3H9.7s-2.7-.05-2.7 2.6v7.4s-.4 2.9 4.9 2.9zm1.8-1.8c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1z"/></svg>'
    },
    {
      id: 'django',
      name: 'Django',
      category: 'backend',
      color: '#092E20',
      desc: 'Framework web Python tingkat tinggi berprinsip batteries-included dengan admin panel siap pakai bawaan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.15 0h3.62v16.18c-1.04.19-1.92.29-2.65.29-3.31 0-4.88-1.52-4.88-4.7 0-3.13 1.76-4.97 4.54-4.97.64 0 1.14.07 1.37.19V0zm0 9.27c-.24-.04-.56-.07-.9-.07-1.4 0-2.22.86-2.22 2.5 0 1.57.77 2.45 2.15 2.45.31 0 .64-.04.97-.13V9.27zM20.38 7.07h3.62v16.93h-3.62V7.07z"/></svg>'
    },
    {
      id: 'fastapi',
      name: 'FastAPI',
      category: 'backend',
      color: '#009688',
      desc: 'Framework modern Python dengan performa tinggi setara NodeJS/Go berbasis Starlette dan Pydantic.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.7 18.5V13H8.5L13.5 5.5v5.5h2.8L11.3 18.5z"/></svg>'
    },
    {
      id: 'flask',
      name: 'Flask',
      category: 'backend',
      color: '#000000',
      desc: 'Microframework Python yang ringan dan mudah dikustomisasi untuk API modular dan prototipe cepat.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.8 19.3L15 13.5V5h1V3H8v2h1v8.5l-3.8 5.8c-.8 1.2.1 2.7 1.6 2.7h10.4c1.5 0 2.4-1.5 1.6-2.7zM10.8 5h2.4v7.4l2.7 4.1H8.1l2.7-4.1V5z"/></svg>'
    },
    {
      id: 'golang',
      name: 'Go (Golang)',
      category: 'backend',
      color: '#00ADD8',
      desc: 'Bahasa kompilasi Google dengan efisiensi memori luar biasa dan konkurensi goroutine bawaan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.8 10.7c.3-1.4 1.3-2.5 2.7-2.8 1.5-.4 3.1.2 3.9 1.5.4.7.5 1.5.3 2.3-.3 1.4-1.3 2.5-2.7 2.8-1.5.4-3.1-.2-3.9-1.5-.4-.7-.5-1.5-.3-2.3zm12.6-2.5c2.4 0 4.3 1.8 4.3 4.3s-1.9 4.3-4.3 4.3-4.3-1.9-4.3-4.3 1.9-4.3 4.3-4.3zm9.6 4.3c0 2.4-1.9 4.3-4.3 4.3h-2.1v-2.1h2.1c1.2 0 2.1-.9 2.1-2.1s-.9-2.1-2.1-2.1h-4.3V6.4h4.3c2.4 0 4.3 1.9 4.3 4.3z"/></svg>'
    },
    {
      id: 'gin',
      name: 'Gin Web Framework',
      category: 'backend',
      color: '#008ECF',
      desc: 'Framework HTTP tercepat untuk Go dengan router trie radiks dan alokasi memori mendekati nol.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.9V12h-2v4.9a6 6 0 1 1 2 0z"/></svg>'
    },
    {
      id: 'java',
      name: 'Java',
      category: 'backend',
      color: '#007396',
      desc: 'Bahasa pemrograman teruji berorientasi objek kelas enterprise untuk sistem stabilitas tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.1 19.9s-.9.1-1.3.3c-1.4.6.8 1.5 2.8 1.5 2.2 0 4.2-.8 3.4-1.7-.6-.6-3.2-.2-4.9-.1zm-1.8-3.1s-.8.2-1.1.4c-1.3.7.8 1.7 3.3 1.6 3.1-.1 5.3-1.1 4.3-2-.7-.7-4.4-.2-6.5 0zm10.6-2.7c-.5-.7-2.3-.3-4.4.1 1.7-.9 3.2-1.3 4.5-.8 1.4.6.6 1.8-.1.7zm-6.2-1.8c-2.4.2-4.4.7-4.4.7s-.6.1-.9.3c-1.1.6.7 1.4 2.8 1.4 2.5 0 4.8-.6 6.3-1.4-1.2-.5-2.6-.9-3.8-1zm7.1 5.4c-1.3 1.2-5.4 1.8-9.4 1.8-4.2 0-7.3-1.2-5.5-2.6 1-.7 3.5-.8 3.5-.8s-.6-.4-1.2-.4C3 18.2 1 19.8 4.2 21c4.5 1.7 14.1 1.3 16.7-.7.6-.5.1-.9-.1-1.2z"/></svg>'
    },
    {
      id: 'springboot',
      name: 'Spring Boot',
      category: 'backend',
      color: '#6DB33F',
      desc: 'Framework microservices enterprise bertenaga Java dengan konfigurasi otomatis dan produksi mandiri.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-8.5 20.5l1.4-1.4A10 10 0 1 1 22 12h2A12 12 0 0 0 12 0zm-1.5 6.5v6.2l5.4-3.1-5.4-3.1z"/></svg>'
    },
    {
      id: 'csharp',
      name: 'C#',
      category: 'backend',
      color: '#239120',
      desc: 'Bahasa serbaguna modern dari Microsoft untuk aplikasi cloud terdistribusi, game Unity, dan desktop.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.8 15.6c-1 .8-2.3 1.2-3.8 1.2-3.3 0-5.6-2.2-5.6-5.4s2.3-5.4 5.6-5.4c1.5 0 2.8.4 3.8 1.2l-1.3 2.1c-.7-.5-1.5-.8-2.5-.8-1.9 0-3.1 1.3-3.1 3s1.2 3 3.1 3c1 0 1.8-.3 2.5-.8l1.3 2.1zm2.7-3h1.2v1.2h-1.2v1.2h-1.2v-1.2h-1.2v-1.2h1.2v-1.2h1.2v1.2z"/></svg>'
    },
    {
      id: 'dotnetcore',
      name: '.NET Core',
      category: 'backend',
      color: '#512BD4',
      desc: 'Platform open source lintas sistem operasi dengan throughput tinggi untuk backend skala masif.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.8 16.8H7.5V7.2h2.7v9.6zm6.3 0h-2.7V7.2h2.7v9.6z"/></svg>'
    },
    {
      id: 'aspnet',
      name: 'ASP.NET',
      category: 'backend',
      color: '#512BD4',
      desc: 'Framework web Microsoft untuk membangun API RESTful, GraphQL, dan aplikasi real-time enterprise.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.5 19.5 7 12 10.5zM2 17l10 5 10-5v-3l-10 5-10-5v3z"/></svg>'
    },
    {
      id: 'ruby',
      name: 'Ruby',
      category: 'backend',
      color: '#CC342D',
      desc: 'Bahasa dinamis yang memprioritaskan produktivitas dan kenyamanan programmer dalam sintaks indah.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.8 10.2L12 1.4 5.2 10.2 12 22.6l6.8-12.4zm-6.8-6.4l4.5 5.8H7.5l4.5-5.8zM7 11.2h10l-5 9.1-5-9.1z"/></svg>'
    },
    {
      id: 'rails',
      name: 'Ruby on Rails',
      category: 'backend',
      color: '#CC0000',
      desc: 'Framework model Convention over Configuration yang memelopori kecepatan rilis produk startup dunia.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.1 16.5h-2.4l-2.4-4.5h-1.8v4.5H8.1V7.5h4.5c2.4 0 3.9 1.3 3.9 3.3 0 1.4-.8 2.4-2.1 2.9l2.7 4.3v-1.5zm-4.2-6.3c0-.9-.7-1.5-1.8-1.5h-1.8v3h1.8c1.1 0 1.8-.6 1.8-1.5z"/></svg>'
    },
    {
      id: 'rust',
      name: 'Rust',
      category: 'backend',
      color: '#000000',
      desc: 'Bahasa sistem ultra cepat tanpa garbage collector yang menjamin keamanan memori tingkat tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm0 3.6a8.4 8.4 0 0 1 6.8 3.5l-1.8 1.4A6.1 6.1 0 0 0 12 6a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6.1 6.1 0 0 0 5-2.5l1.8 1.4A8.4 8.4 0 0 1 12 20.4 8.4 8.4 0 1 1 12 3.6z"/></svg>'
    },
    {
      id: 'actix',
      name: 'Actix Web',
      category: 'backend',
      color: '#000000',
      desc: 'Framework web berbasis Rust dengan model aktor yang rutin menduduki peringkat teratas Techempower benchmark.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4.8l7.5 13H4.5L12 6.8z"/></svg>'
    },
    {
      id: 'axum',
      name: 'Axum',
      category: 'backend',
      color: '#000000',
      desc: 'Framework web ergonomis dan modular untuk ekosistem Rust yang dibangun oleh tim Tokio.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2 12l10 12 10-12L12 0zm0 3.8l8.2 8.2-8.2 8.2-8.2-8.2 8.2-8.2z"/></svg>'
    },
    {
      id: 'bun',
      name: 'Bun',
      category: 'backend',
      color: '#FBF0DF',
      desc: 'All-in-one JavaScript runtime, bundler, dan package manager baru dengan kecepatan pemrosesan luar biasa.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>'
    },
    {
      id: 'deno',
      name: 'Deno',
      category: 'backend',
      color: '#000000',
      desc: 'Runtime aman untuk JavaScript dan TypeScript dengan default izin ketat dan modul berbasis URL.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 5h2v7h-2V5zm1 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>'
    },
    {
      id: 'graphql',
      name: 'GraphQL',
      category: 'backend',
      color: '#E10098',
      desc: 'Bahasa kueri fleksibel untuk API yang memungkinkan klien meminta data persis sesuai kebutuhan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a2.5 2.5 0 0 0-2.3 3.5L4.4 7.2A2.5 2.5 0 1 0 4.1 11l-2.6 4.6a2.5 2.5 0 1 0 1.7 1l2.6-4.6a2.5 2.5 0 0 0 2.3-.9l5.3 3.1a2.5 2.5 0 1 0 2.4-.1l5.3-3.1a2.5 2.5 0 0 0 2.3.9l2.6 4.6a2.5 2.5 0 1 0 1.7-1L21.9 11a2.5 2.5 0 1 0-.3-3.8l-5.3-3.7A2.5 2.5 0 0 0 14.3 0H12z"/></svg>'
    },
    {
      id: 'apollo',
      name: 'Apollo Server',
      category: 'backend',
      color: '#311C87',
      desc: 'Server GraphQL spesialis untuk menghubungkan berbagai microservices ke dalam satu schema terpadu.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 3.6a8.4 8.4 0 1 1-8.4 8.4 8.4 8.4 0 0 1 8.4-8.4z"/></svg>'
    },
    {
      id: 'socketio',
      name: 'Socket.io',
      category: 'backend',
      color: '#010101',
      desc: 'Library komunikasi dua arah real-time berbasis WebSocket dengan fallback otomatis berkoneksi stabil.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.1 7.8L12 12.9V8.7L6.9 13.8l-1.5-1.5L12 5.7v4.2l5.1-5.1 1.5 1.5-1.5 1.5z"/></svg>'
    },
    {
      id: 'grpc',
      name: 'gRPC',
      category: 'backend',
      color: '#244C5A',
      desc: 'Framework Remote Procedure Call performa tinggi dari Google berbasis Protocol Buffers dan HTTP/2.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2 6v12l10 6 10-6V6L12 0zm0 3.3L19.5 8 12 12.7 4.5 8 12 3.3zM4 10.3l7 4.4v7.4l-7-4.2V10.3zm16 0v7.6l-7 4.2v-7.4l7-4.4z"/></svg>'
    },

    // ==========================================
    // DATABASE (24 Tools)
    // ==========================================
    {
      id: 'mysql',
      name: 'MySQL',
      category: 'database',
      color: '#4479A1',
      desc: 'Sistem manajemen basis data relasional (RDBMS) standar dunia yang andal, cepat, dan kompatibel luas.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/></svg>'
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      category: 'database',
      color: '#4169E1',
      desc: 'Database objek-relasional paling canggih di dunia dengan dukungan transaksi ACID kuat dan tipe data JSONB.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.2 4.8c1.5 0 2.8.9 3.4 2.3.9-.3 1.8-.2 2.6.2.7.4 1.2 1.1 1.4 1.9.9.5 1.5 1.4 1.5 2.5 0 1.6-1.3 2.9-2.9 2.9H7.6c-2 0-3.6-1.6-3.6-3.6 0-1.8 1.3-3.3 3.1-3.6.5-1.5 1.9-2.6 3.7-2.6z"/></svg>'
    },
    {
      id: 'mariadb',
      name: 'MariaDB',
      category: 'database',
      color: '#003545',
      desc: 'Fork open-source MySQL berkinerja tinggi yang dikembangkan oleh pembuat asli MySQL.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 4.8a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4z"/></svg>'
    },
    {
      id: 'sqlite',
      name: 'SQLite',
      category: 'database',
      color: '#003B57',
      desc: 'Mesin database SQL mandiri tanpa server yang tersimpan dalam satu file lokal ringan dan efisien.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.8 6.5h3.6c2.2 0 3.8 1.5 3.8 3.5 0 1.3-.7 2.4-1.8 3 1.3.6 2.1 1.8 2.1 3.2 0 2.2-1.7 3.8-4.1 3.8h-3.6V6.5zm2.4 2.1v3.2h1.2c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6h-1.2zm0 5.3v3.4h1.4c1.1 0 1.8-.7 1.8-1.7s-.7-1.7-1.8-1.7h-1.4z"/></svg>'
    },
    {
      id: 'mssql',
      name: 'Microsoft SQL Server',
      category: 'database',
      color: '#CC292B',
      desc: 'Sistem database relasional tangguh untuk korporasi dengan keamanan tingkat enterprise dan analitik bisnis.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h11.4v11.4H0V0zm12.6 0H24v11.4H12.6V0zM0 12.6h11.4V24H0V12.6zm12.6 0H24V24H12.6V12.6z"/></svg>'
    },
    {
      id: 'oracle',
      name: 'Oracle DB',
      category: 'database',
      color: '#F80000',
      desc: 'Database multi-model terkemuka di industri perbankan dan transaksi skala multi-terabyte.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm6.8 14.8H5.2V9.2h13.6v5.6z"/></svg>'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      category: 'database',
      color: '#47A248',
      desc: 'Database NoSQL berbasis dokumen skema fleksibel BSON untuk iterasi fitur cepat dan skalabilitas horizontal.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C11.5 0 11 .3 10.7.8L5.3 11.2c-.7 1.5-.7 3.2 0 4.7l5.4 10.4c.3.5.8.8 1.3.8s1-.3 1.3-.8l5.4-10.4c.7-1.5.7-3.2 0-4.7L13.3.8c-.3-.5-.8-.8-1.3-.8zm0 3.5l4.3 8.3c.3.6.3 1.4 0 2L12 22.1l-4.3-8.3c-.3-.6-.3-1.4 0-2L12 3.5z"/></svg>'
    },
    {
      id: 'redis',
      name: 'Redis',
      category: 'database',
      color: '#DC382D',
      desc: 'In-memory data store secepat kilat untuk caching latensi sub-milidetik, antrean pesan, dan sesi pengguna.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.5 5.5v13L12 24l10.5-5.5v-13L12 0zm0 3.3l7.5 3.9-7.5 3.9-7.5-3.9 7.5-3.9zM4 9.8l7 3.7v6.8l-7-3.7V9.8zm16 0v6.8l-7 3.7v-6.8l7-3.7z"/></svg>'
    },
    {
      id: 'upstash',
      name: 'Upstash Redis',
      category: 'database',
      color: '#00E9A3',
      desc: 'Serverless Redis berbasis HTTP REST API yang didesain khusus untuk arsitektur cloud Edge dan Next.js.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    },
    {
      id: 'supabase',
      name: 'Supabase',
      category: 'database',
      color: '#3ECF8E',
      desc: 'Alternatif open source Firebase berbasis PostgreSQL lengkap dengan autentikasi instan, storage, dan realtime.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.4 0l-9.6 14.4h8l-1.6 9.6 9.6-14.4h-8l1.6-9.6z"/></svg>'
    },
    {
      id: 'firebase',
      name: 'Firebase Firestore',
      category: 'database',
      color: '#FFCA28',
      desc: 'Database dokumen realtime tanpa server dari Google dengan sinkronisasi offline mulus untuk web dan mobile.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 14.8L6.4 1.2a.8.8 0 0 1 1.5-.2l2.6 4.9L3.9 14.8zm15.8-.4L17.4 3.7a.8.8 0 0 0-1.5 0l-3.3 6.3 7.1 4.4zm-16 1.8l7.5 4.3a1.6 1.6 0 0 0 1.6 0l7.5-4.3-8.3-5.2-8.3 5.2z"/></svg>'
    },
    {
      id: 'couchdb',
      name: 'CouchDB',
      category: 'database',
      color: '#E42528',
      desc: 'Database dokumen NoSQL yang unggul dalam replikasi data multi-master dan akses via protokol HTTP.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 11.5H7v-3h10v3z"/></svg>'
    },
    {
      id: 'cassandra',
      name: 'Apache Cassandra',
      category: 'database',
      color: '#1287B1',
      desc: 'Database NoSQL terdistribusi terdesentralisasi tanpa single point of failure untuk big data masif.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2.5 5.5v13L12 24l9.5-5.5v-13L12 0zm0 4.2l6 3.5-6 3.5-6-3.5 6-3.5zm-7 5.6l6 3.5v7l-6-3.5v-7zm14 0v7l-6 3.5v-7l6-3.5z"/></svg>'
    },
    {
      id: 'dynamodb',
      name: 'Amazon DynamoDB',
      category: 'database',
      color: '#4053D6',
      desc: 'Database NoSQL key-value dikelola penuh oleh AWS dengan latensi satu digit milidetik pada skala apa pun.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.5 19.5 7 12 10.5zM2 17l10 5 10-5v-3l-10 5-10-5v3z"/></svg>'
    },
    {
      id: 'neo4j',
      name: 'Neo4j',
      category: 'database',
      color: '#008CC1',
      desc: 'Database grafik nomor satu untuk memodelkan hubungan relasi kompleks seperti jejaring sosial dan deteksi fraud.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><circle cx="4" cy="6" r="2.5"/><circle cx="20" cy="6" r="2.5"/><circle cx="12" cy="20" r="2.5"/><path d="M6 7.5l4.5 3M18 7.5l-4.5 3M12 16v2" stroke="currentColor" stroke-width="1.5"/></svg>'
    },
    {
      id: 'cockroachdb',
      name: 'CockroachDB',
      category: 'database',
      color: '#6933FF',
      desc: 'Database SQL terdistribusi tahan banting yang menjamin konsistensi ACID global dan ketersediaan tinggi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3.6l6 3.3v6.8l-6 3.3-6-3.3V8.9l6-3.3z"/></svg>'
    },
    {
      id: 'planetscale',
      name: 'PlanetScale',
      category: 'database',
      color: '#000000',
      desc: 'Platform database MySQL serverless bertenaga Vitess dengan fitur branching skema mirip alur kerja Git.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm0 3.6a8.4 8.4 0 1 1-8.4 8.4 8.4 8.4 0 0 1 8.4-8.4z"/></svg>'
    },
    {
      id: 'prisma',
      name: 'Prisma ORM',
      category: 'database',
      color: '#2D3748',
      desc: 'ORM generasi baru untuk Node.js dan TypeScript dengan kueri aman tipe otomatis dan migrasi deklaratif.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 1.4a1.2 1.2 0 0 0-1.7.3L2.3 16.5a1.2 1.2 0 0 0 .5 1.7l8.2 4.4a1.2 1.2 0 0 0 1.5-.4l8.6-13.8a1.2 1.2 0 0 0-.4-1.7L12.6 1.4zm-1 3.5l5.8 4.2-5.7 9.2-5.5-2.9 5.4-10.5z"/></svg>'
    },
    {
      id: 'drizzle',
      name: 'Drizzle ORM',
      category: 'database',
      color: '#C5F74F',
      desc: 'TypeScript ORM super ringan tanpa overhead runtime dengan sintaks kueri yang sangat mirip SQL murni.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 14h6v8l8-12h-6V2z"/></svg>'
    },
    {
      id: 'typeorm',
      name: 'TypeORM',
      category: 'database',
      color: '#FE0800',
      desc: 'ORM tradisional yang matang untuk TypeScript/JavaScript dengan dukungan pola Active Record dan Data Mapper.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5 17h-3v-5h-4v5H7V7h3v5h4V7h3v10z"/></svg>'
    },
    {
      id: 'mongoose',
      name: 'Mongoose',
      category: 'database',
      color: '#880000',
      desc: 'Pustaka pemodelan objek (ODM) elegan untuk MongoDB di lingkungan Node.js dengan validasi skema ketat.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    },
    {
      id: 'elasticsearch',
      name: 'Elasticsearch',
      category: 'database',
      color: '#005571',
      desc: 'Mesin pencarian teks lengkap (full-text search) terdistribusi dan analitik data berbasis Apache Lucene.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm-2 17H8V7h2v10zm6 0h-2V7h2v10z"/></svg>'
    },
    {
      id: 'meilisearch',
      name: 'Meilisearch',
      category: 'database',
      color: '#FF4E89',
      desc: 'Mesin pencarian kilat open-source yang toleran terhadap salah ketik (typo-tolerant) dengan setup instan.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9L4 7.5 12 4l8 3.5-8 3.5zm-8 4l8 4 8-4v3l-8 4-8-4v-3z"/></svg>'
    },
    {
      id: 'clickhouse',
      name: 'ClickHouse',
      category: 'database',
      color: '#FFCC01',
      desc: 'Database manajemen kolom (OLAP) super kencang untuk pemrosesan kueri analitik dan pelaporan real-time.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 4h3v16H2V4zm5 3h3v10H7V7zm5-5h3v20h-3V2zm5 5h3v10h-3V7zm5 3h3v4h-3v-4z"/></svg>'
    },

    // ==========================================
    // DEVOPS & CLOUD (29 Tools)
    // ==========================================
    {
      id: 'docker',
      name: 'Docker',
      category: 'devops',
      color: '#2496ED',
      desc: 'Platform kontainerisasi untuk mengemas aplikasi dan seluruh dependensinya agar berjalan konsisten di mana saja.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3h2.5v2.5H13V3zm3.5 0H19v2.5h-2.5V3zm-7 3.5H12V9H9.5V6.5zm3.5 0H15.5V9H13V6.5zm3.5 0H19V9h-2.5V6.5zM6 10h2.5v2.5H6V10zm3.5 0H12v2.5H9.5V10zm3.5 0H15.5v2.5H13V10zm3.5 0H19v2.5h-2.5V10zM2.5 13.5C2.5 18 6.5 21.5 12 21.5c6.5 0 10.5-4 10.5-8.5 0-.5 0-1-.2-1.5H1.5c0 .5 1 1.5 1 2z"/></svg>'
    },
    {
      id: 'kubernetes',
      name: 'Kubernetes (K8s)',
      category: 'devops',
      color: '#326CE5',
      desc: 'Sistem orkestrasi kontainer open-source untuk otomatisasi deployment, penskalaan, dan manajemen kluster.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2 6v12l10 6 10-6V6L12 0zm0 3.3L19.5 8 12 12.7 4.5 8 12 3.3zM4 10.3l7 4.4v7.4l-7-4.2V10.3zm16 0v7.6l-7 4.2v-7.4l7-4.4z"/></svg>'
    },
    {
      id: 'git',
      name: 'Git',
      category: 'devops',
      color: '#F05032',
      desc: 'Sistem kontrol versi terdistribusi standar global untuk melacak perubahan kode sumber dan kolaborasi tim.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 11.5L12.5.5a1.5 1.5 0 0 0-2.1 0L8.3 2.6l3.1 3.1a1.8 1.8 0 0 1 2.3 2.3l3 3a1.8 1.8 0 1 1-1.1 1l-2.8-2.8v4.5a1.8 1.8 0 1 1-1.5 0V9.1a1.8 1.8 0 0 1-1-2.3L7.2 3.7.5 10.4a1.5 1.5 0 0 0 0 2.1l11 11a1.5 1.5 0 0 0 2.1 0l9.9-9.9a1.5 1.5 0 0 0 0-2.1z"/></svg>'
    },
    {
      id: 'github',
      name: 'GitHub',
      category: 'devops',
      color: '#181717',
      desc: 'Platform hosting kode dan kolaborasi pengembang terbesar di dunia dengan GitHub Actions dan PR terintegrasi.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.3c-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.2 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      category: 'devops',
      color: '#FC6D26',
      desc: 'Platform DevOps komprehensif tunggal yang mencakup repositori Git, CI/CD terintegrasi, dan keamanan kode.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.95 13.57l-1.36-4.18L20.3 2.45a.65.65 0 0 0-1.23 0l-2.28 6.94H7.21L4.93 2.45a.65.65 0 0 0-1.23 0L1.41 9.39.05 13.57a1.32 1.32 0 0 0 .48 1.48l11.47 8.33 11.47-8.33a1.32 1.32 0 0 0 .48-1.48z"/></svg>'
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      category: 'devops',
      color: '#0052CC',
      desc: 'Solusi Git berbasis cloud dari Atlassian dengan integrasi mendalam ke Jira dan Trello.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.75 2.5a.75.75 0 0 1 .75-.75h21a.75.75 0 0 1 .75.75l-2.4 17.5a.75.75 0 0 1-.74.65H4.14a.75.75 0 0 1-.74-.65L.75 2.5zm13.9 12.3l1.1-7.9H8.25l1.1 7.9h5.3z"/></svg>'
    },
    {
      id: 'linux',
      name: 'Linux',
      category: 'devops',
      color: '#FCC624',
      desc: 'Sistem operasi open-source yang mendasari mayoritas server web, cloud infrastructure, dan container di dunia.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 3 1 4.5C8 11 6 12.5 5 15c-1 2.5-.5 5 1 6 2 1.5 5 .5 6 .5s4 1 6-.5c1.5-1 2-3.5 1-6-1-2.5-3-4-4-4.5.5-1.5 1-3 1-4.5 0-2.5-1.5-4-4-4zm-1.5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1.5 3c1 0 1.5.5 1.5 1s-.5 1-1.5 1-1.5-.5-1.5-1 .5-1 1.5-1z"/></svg>'
    },
    {
      id: 'ubuntu',
      name: 'Ubuntu',
      category: 'devops',
      color: '#E95420',
      desc: 'Distro Linux paling populer dan stabil untuk server cloud dengan repositori paket APT lengkap.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="4" r="1.5"/><circle cx="5" cy="16" r="1.5"/><circle cx="19" cy="16" r="1.5"/></svg>'
    },
    {
      id: 'nginx',
      name: 'Nginx',
      category: 'devops',
      color: '#009639',
      desc: 'Web server dan reverse proxy berarsitektur asynchronous event-driven untuk menangani puluhan ribu koneksi konkuren.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm5.2 16.5h-2.4l-5.6-7.8v7.8H6.8V7.5h2.4l5.6 7.8V7.5h2.4v9z"/></svg>'
    },
    {
      id: 'apache',
      name: 'Apache HTTP Server',
      category: 'devops',
      color: '#D22128',
      desc: 'Web server legendaris dengan konfigurasi fleksibel berbasis file .htaccess dan modul dinamis kaya fitur.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2 6v12l10 6 10-6V6L12 0zm0 3.3L19.5 8 12 12.7 4.5 8 12 3.3zM4 10.3l7 4.4v7.4l-7-4.2V10.3zm16 0v7.6l-7 4.2v-7.4l7-4.4z"/></svg>'
    },
    {
      id: 'vercel',
      name: 'Vercel',
      category: 'devops',
      color: '#000000',
      desc: 'Platform cloud edge serverless untuk deployment frontend dan Next.js dengan CDN global ultra cepat.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L24 22H0L12 1z"/></svg>'
    },
    {
      id: 'netlify',
      name: 'Netlify',
      category: 'devops',
      color: '#00C7B7',
      desc: 'Platform cloud perintis arsitektur Jamstack dengan otomatisasi Git CI/CD dan edge computing tangguh.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z"/></svg>'
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      category: 'devops',
      color: '#F38020',
      desc: 'Jaringan CDN, proteksi keamanan DDoS global, DNS tercepat (1.1.1.1), dan runtime Cloudflare Workers.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.8 9.5c-.3-2.6-2.5-4.5-5.2-4.5-2.2 0-4.1 1.3-4.9 3.2-.5-.2-1.1-.3-1.7-.3-2.8 0-5 2.2-5 5s2.2 5 5 5h11.8c2.3 0 4.2-1.9 4.2-4.2 0-2.1-1.6-3.8-3.7-4.2h-.5z"/></svg>'
    },
    {
      id: 'aws',
      name: 'Amazon Web Services (AWS)',
      category: 'devops',
      color: '#232F3E',
      desc: 'Penyedia komputasi awan terbesar di dunia dengan 200+ layanan lengkap mulai dari EC2, S3, hingga Lambda.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.2 12.8c-.8.8-1.2 1.7-1.2 2.7 0 1.9 1.4 3.1 3.6 3.1 1.5 0 2.8-.7 3.6-1.8v1.5h2.4V10.2h-2.4v1.5c-.8-1-2.1-1.6-3.6-1.6-2.2 0-3.6 1.2-3.6 3.1 0 1 .4 1.9 1.2 2.7v-3.1zm3.4 3.6c-1.2 0-2-.7-2-1.9 0-1.1.8-1.9 2-1.9s2 .7 2 1.9c0 1.1-.8 1.9-2 1.9zM22.5 18c-5.5 3.3-13.5 3.5-19.1.5-.3-.2-.1-.5.2-.4 5.3 2.7 13 2.5 18.2-.5.4-.3.9.1.7.4z"/></svg>'
    },
    {
      id: 'gcp',
      name: 'Google Cloud Platform (GCP)',
      category: 'devops',
      color: '#4285F4',
      desc: 'Infrastruktur cloud berteknologi tinggi dari Google yang unggul dalam BigQuery, AI/ML, dan Kubernetes GKE.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l4.5 2.5L11 16.5z"/></svg>'
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      category: 'devops',
      color: '#0078D4',
      desc: 'Ekosistem cloud enterprise dari Microsoft yang terintegrasi sempurna dengan Active Directory dan Windows Server.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2.5l-6.2 8.3L1.5 18.2h5.8l4.4-6 4.7 9.3H22.5L13.5 2.5z"/></svg>'
    },
    {
      id: 'digitalocean',
      name: 'DigitalOcean',
      category: 'devops',
      color: '#0080FF',
      desc: 'Layanan cloud ramah pengembang untuk meluncurkan droplet VPS, managed database, dan aplikasi dengan harga bersahabat.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-8.5 20.5l3.2-3.2A7.5 7.5 0 1 1 19.5 12h4.5A12 12 0 0 0 12 0zm-4.5 16.5H3v4.5h4.5v-4.5zm-3-3H0v3h4.5v-3z"/></svg>'
    },
    {
      id: 'heroku',
      name: 'Heroku',
      category: 'devops',
      color: '#430098',
      desc: 'Platform as a Service (PaaS) perintis yang menyederhanakan proses rilis aplikasi web berbasis container Dyno.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 2h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm5 4v12h2.5v-4.5h3V18H16V6h-2.5v4.5h-3V6H8z"/></svg>'
    },
    {
      id: 'railway',
      name: 'Railway',
      category: 'devops',
      color: '#0B0D0E',
      desc: 'Platform infrastruktur modern untuk mendeploy aplikasi backend, database, dan cron job secara instan dari GitHub.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 4h20v4H2V4zm0 6h20v4H2v-4zm0 6h20v4H2v-4z"/></svg>'
    },
    {
      id: 'render',
      name: 'Render',
      category: 'devops',
      color: '#46E3B7',
      desc: 'PaaS serba ada generasi baru pengganti Heroku untuk hosting situs statis, web service, dan background workers.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z"/></svg>'
    },
    {
      id: 'flyio',
      name: 'Fly.io',
      category: 'devops',
      color: '#24185B',
      desc: 'Platform komputasi global untuk menjalankan Docker container dekat dengan pengguna di edge data center seluruh dunia.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 12l9.5-9.5L21.5 12 12 21.5 2.5 12zm9.5-5.5L6.5 12l5.5 5.5 5.5-5.5-5.5-5.5z"/></svg>'
    },
    {
      id: 'terraform',
      name: 'Terraform',
      category: 'devops',
      color: '#7B42BC',
      desc: 'Alat Infrastructure as Code (IaC) deklaratif dari HashiCorp untuk mengelola resource multi-cloud secara konsisten.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 1.5h6.6v6.6H1.5V1.5zm8.1 0h6.6v6.6H9.6V1.5zm8.1 7.2h6.3v6.6h-6.3V8.7zm-8.1 0h6.6v6.6H9.6V8.7zm-8.1 7.2h6.6v6.6H1.5v-6.6zm8.1 0h6.6v6.6H9.6v-6.6z"/></svg>'
    },
    {
      id: 'ansible',
      name: 'Ansible',
      category: 'devops',
      color: '#EE0000',
      desc: 'Mesin otomasi IT tanpa agen (agentless) via protokol SSH untuk konfigurasi sistem dan orkestrasi deployment.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm1.2 4.8l6.3 14.4h-2.7l-1.5-3.6H8.7l-1.5 3.6H4.5L10.8 4.8h2.4zm-1.2 4.2L9.6 13.2h4.8L12 9z"/></svg>'
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      category: 'devops',
      color: '#D24939',
      desc: 'Server otomasi open-source terkemuka dengan ribuan plugin untuk membangun pipeline CI/CD fleksibel.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 10h6v4H9v-4zm-1 6h8v2H8v-2z"/></svg>'
    },
    {
      id: 'githubactions',
      name: 'GitHub Actions',
      category: 'devops',
      color: '#2088FF',
      desc: 'Otomasi alur kerja CI/CD native di GitHub untuk build, test, dan deploy kode langsung dari event repository.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14.5l-4-4 1.4-1.4 2.6 2.6 6-6 1.4 1.4-7.4 7.4z"/></svg>'
    },
    {
      id: 'prometheus',
      name: 'Prometheus',
      category: 'devops',
      color: '#E6522C',
      desc: 'Sistem monitoring time-series dan alerting open-source yang menjadi standar de facto ekosistem cloud native.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm1 17.5h-2v-5h2v5zm0-7h-2V6h2v4.5z"/></svg>'
    },
    {
      id: 'grafana',
      name: 'Grafana',
      category: 'devops',
      color: '#F46800',
      desc: 'Platform visualisasi analitik dan dasbor metrik interaktif untuk memantau performa infrastruktur server.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5h-9v-2h9v2zm-2-4h-5v-2h5v2zm-2-4h-1V7h1v1.5z"/></svg>'
    },
    {
      id: 'postman',
      name: 'Postman',
      category: 'devops',
      color: '#FF6C37',
      desc: 'Platform terdepan untuk pengujian, perancangan, dokumentasi, dan automasi endpoint REST/GraphQL API.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm6.5 8.5l-8 8-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z"/></svg>'
    },
    {
      id: 'swagger',
      name: 'Swagger / OpenAPI',
      category: 'devops',
      color: '#85EA2D',
      desc: 'Standar spesifikasi antarmuka API yang dapat dibaca mesin untuk dokumentasi interaktif dan generator SDK klien.',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2"/></svg>'
    }
  ];

  // Helper Maps
  const TECH_MAP = new Map();
  TECH_CATALOG.forEach(function (tool) {
    TECH_MAP.set(tool.id.toLowerCase(), tool);
    TECH_MAP.set(tool.name.toLowerCase(), tool);
  });

  function getTechTool(identifier) {
    if (!identifier) return null;
    return TECH_MAP.get(String(identifier).trim().toLowerCase()) || null;
  }

  function renderTechBadge(identifier, options) {
    options = options || {};
    const tool = getTechTool(identifier);
    if (!tool) {
      // Fallback text badge if tool not in list
      const cleanName = String(identifier).trim();
      return `<span class="tech-badge tech-badge-custom" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#e2e8f0;">
        <span style="width:6px;height:6px;border-radius:50%;background:#38bdf8;"></span>
        ${cleanName}
      </span>`;
    }

    const showDesc = options.showDesc ? `<span class="tech-badge-desc" style="display:block;font-size:0.7rem;color:#94a3b8;margin-top:2px;">${tool.desc}</span>` : '';
    const size = options.size || 16;

    return `<span class="tech-badge tech-badge-${tool.id}" title="${tool.name}: ${tool.desc}" data-tech-id="${tool.id}" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#f1f5f9;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);">
      <span class="tech-badge-icon" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;color:${tool.color};flex-shrink:0;">${tool.svg}</span>
      <span class="tech-badge-label">${tool.name}</span>
      ${showDesc}
    </span>`;
  }

  function renderTechBadges(items, containerEl, options) {
    if (!items) return '';
    let arr = [];
    if (typeof items === 'string') {
      arr = items.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(items)) {
      arr = items;
    }

    const html = arr.map(id => renderTechBadge(id, options)).join(' ');
    if (containerEl && typeof containerEl.innerHTML !== 'undefined') {
      containerEl.innerHTML = html;
    }
    return html;
  }

  // Export to global scope
  global.TECH_CATALOG = TECH_CATALOG;
  global.TECH_MAP = TECH_MAP;
  global.getTechTool = getTechTool;
  global.renderTechBadge = renderTechBadge;
  global.renderTechBadges = renderTechBadges;

})(typeof window !== 'undefined' ? window : global);
