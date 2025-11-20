// === YAPILANDIRMA VE AYARLAR ===
const CONFIG = {
    youtubeApiKey: 'AIzaSyAwC6sByfoq9n4G72tfFtwf2XETXaSdg04',
    channelId: 'UCTYeNjk3VZnXNfcC8ssvevQ',
    lofiVideoId: 'jfKfPfyJRdk'
};

// === YARDIMCI FONKSİYONLAR (STORAGE) ===
const Storage = {
    check: () => {
        try {
            localStorage.setItem('__test__', '__test__');
            localStorage.removeItem('__test__');
            return true;
        } catch (e) {
            console.warn('LocalStorage kullanılamıyor');
            return false;
        }
    },
    get: (key) => {
        if (!Storage.check()) return null;
        return localStorage.getItem(key);
    },
    set: (key, value) => {
        if (!Storage.check()) return;
        localStorage.setItem(key, value);
    },
    remove: (key) => {
        if (!Storage.check()) return;
        localStorage.removeItem(key);
    }
};

// === PARTICLE SİSTEMİ (ARKA PLAN EFEKTİ) ===
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.animate();
    }

    resize() { 
        this.canvas.width = window.innerWidth; 
        this.canvas.height = window.innerHeight; 
        this.init(); 
    }

    init() {
        this.particles = [];
        let numberOfParticles = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 20000), 100);
        for (let i = 0; i < numberOfParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width, 
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5, 
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1, 
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.x += p.vx; 
            p.y += p.vy;
            
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.fill();
        });
    }
}

// === YOUTUBE API İŞLEMLERİ ===
const YouTubeManager = {
    player: null,
    apiReady: false,

    initApi: () => {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            YouTubeManager.apiReady = true;
            console.log("✅ YouTube Player API Hazır");
        };
    },

    initPlayer: () => {
        if (YouTubeManager.player) return;
        YouTubeManager.player = new YT.Player('youtube-player', {
            height: '180', width: '320',
            videoId: CONFIG.lofiVideoId,
            playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 1 }
        });
    },

    toggleMusic: () => {
        const container = document.getElementById('music-player-container');
        if (!YouTubeManager.apiReady) {
            alert("Müzik çalar yükleniyor, lütfen bekleyin...");
            return;
        }
        
        YouTubeManager.initPlayer();
        container.classList.toggle('hidden');
        
        if (!container.classList.contains('hidden') && YouTubeManager.player.playVideo) {
            YouTubeManager.player.playVideo();
        }
    },

    stopMusic: () => {
        const container = document.getElementById('music-player-container');
        container.classList.add('hidden');
        if (YouTubeManager.player && YouTubeManager.player.stopVideo) {
            YouTubeManager.player.stopVideo();
        }
    },

    fetchStats: async () => {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CONFIG.channelId}&key=${CONFIG.youtubeApiKey}`);
            const data = await res.json();
            
            if (!data.items?.[0]) throw new Error('Kanal bulunamadı');
            
            const stats = data.items[0].statistics;
            const setText = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = parseInt(val).toLocaleString('tr-TR');
            };

            setText('live-subscribers', stats.subscriberCount);
            setText('live-views', stats.viewCount);
            setText('live-videos', stats.videoCount);
        } catch (e) {
            console.warn('YouTube İstatistik Hatası:', e);
        }
    },

    fetchVideos: async () => {
        const container = document.getElementById('video-gallery-container');
        if (!container) return;

        try {
            const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CONFIG.channelId}&key=${CONFIG.youtubeApiKey}`);
            const chData = await chRes.json();
            const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (!uploadsId) throw new Error('Playlist bulunamadı');

            const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=9&key=${CONFIG.youtubeApiKey}`);
            const vidData = await vidRes.json();

            container.innerHTML = '';
            vidData.items.forEach(item => {
                const { title, resourceId, thumbnails } = item.snippet;
                const link = document.createElement('a');
                link.href = `https://www.youtube.com/watch?v=${resourceId.videoId}`;
                link.target = '_blank';
                link.className = 'video-gallery-card';
                link.innerHTML = `
                    <div class="video-thumbnail-container">
                        <img src="${thumbnails.high.url}" alt="${title}">
                        <div class="video-play-button">▶</div>
                    </div>
                    <div class="video-info"><h3>${title}</h3></div>
                `;
                container.appendChild(link);
            });
        } catch (e) {
            console.error('Video çekme hatası:', e);
            container.innerHTML = `<div class="card" style="text-align: center;">Videolar yüklenemedi.</div>`;
        }
    }
};

// === DİL SİSTEMİ ===
const LanguageManager = {
    translations: {
        'en': {
            'navHome': 'Home', 'navVideos': 'Videos', 'navEquipment': 'My Gear',
            'navAnnouncements': 'Announcements', 'navSupport': 'Support', 'navDiscord': 'Discord',
            'navQA': 'Q&A', 'heroTitle': 'BenYasoMinecraft',
            'heroSubtitle': 'My YouTube Channel and Community Hub',
            'heroDescription': 'Follow my Minecraft adventures!',
            'buttonChannel': 'Go to Channel', 'buttonAbout': 'About Me', 'buttonRandom': 'Random Video',
            'aboutTitle': 'My World', 'statsTitle': 'Live Channel Stats',
            'statsSubscribers': 'Subscribers', 'statsViews': 'Total Views', 'statsVideos': 'Video Count',
            'videosTitle': 'My Latest Videos', 'equipmentTitle': 'Equipment I Use',
            'announcementsTitle': 'Announcements', 'supportTitle': 'Support Me',
            'discordTitle': 'Join the Community!', 'qaTitle': 'Q&A'
        },
        'az': {
            'navHome': 'Ana Səhifə', 'navVideos': 'Videolar', 'navEquipment': 'Avadanlığım',
            'navAnnouncements': 'Elanlar', 'navSupport': 'Dəstək Ol', 'navDiscord': 'Discord',
            'navQA': 'Sual-Cavab', 'heroSubtitle': 'YouTube Kanalım və İcma Mərkəzi',
            'heroDescription': 'Minecraft macəralarımı izlə!',
            'buttonChannel': 'Kanala Keç', 'buttonAbout': 'Haqqımda', 'buttonRandom': 'Təsadüfi Video',
            'aboutTitle': 'Mənim Dünyam', 'statsTitle': 'Canlı Kanal Statistikası',
            'statsSubscribers': 'Abunəçilər', 'statsViews': 'Ümumi Baxış', 'statsVideos': 'Video Sayı',
            'videosTitle': 'Ən Son Videolarım', 'equipmentTitle': 'İstifadə Etdiyim Avadanlıq',
            'announcementsTitle': 'Elanlar', 'supportTitle': 'Dəstək Ol',
            'discordTitle': 'İcmaya Qoşul!', 'qaTitle': 'Sual-Cavab'
        }
    },

    set: (lang) => {
        document.documentElement.lang = lang;
        const flag = document.getElementById('current-lang-flag');
        if (flag) {
            const flags = { 'en': 'GB', 'az': 'AZ', 'tr': 'TR' };
            flag.src = `https://flagsapi.com/${flags[lang] || 'TR'}/shiny/24.png`;
        }

        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.dataset.key;
            if (!el.dataset.originalText) el.dataset.originalText = el.textContent.trim();
            
            let newText = el.dataset.originalText;
            if (lang !== 'tr' && LanguageManager.translations[lang]?.[key]) {
                newText = LanguageManager.translations[lang][key];
            } else if (lang === 'tr') {
                newText = el.dataset.originalText;
            }
            el.textContent = newText;
        });

        // Çerez onayı beklemeden hemen kaydet (F5 sorununu çözer)
        Storage.set('savedLanguage', lang);
    },

    init: () => {
        const saved = Storage.get('savedLanguage') || 'tr';
        LanguageManager.set(saved);
    }
};

// === SEKME (TAB) SİSTEMİ ===
const TabManager = {
    show: (tabName) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));

        const target = document.getElementById(tabName);
        const link = document.querySelector(`a[data-tab="${tabName}"]`);

        if (target) target.classList.add('active');
        if (link) link.classList.add('active');

        document.getElementById('nav-links')?.classList.remove('active');
        Storage.set('lastActiveTab', tabName);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    init: () => {
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                TabManager.show(link.dataset.tab);
            });
        });

        const lastTab = Storage.get('lastActiveTab') || 'youtube';
        TabManager.show(lastTab);
    }
};

// === 🚀 MAIN (SAYFA HAZIR OLDUĞUNDA) ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 BenYaso Web Başlatılıyor...');

    // Sistemleri Başlat
    new ParticleSystem();
    YouTubeManager.initApi();
    YouTubeManager.fetchStats();
    YouTubeManager.fetchVideos();
    LanguageManager.init();
    TabManager.init();

    // --- 1. INTERAKTİF PANELLER (Animasyonlar) ---
    const panels = document.querySelectorAll('.panel');
    if (panels.length > 0) {
        panels.forEach(panel => {
            panel.addEventListener('click', () => {
                panels.forEach(p => p.classList.remove('active'));
                panel.classList.add('active');
            });
        });
    }

    const equipmentPanels = document.querySelectorAll('.equipment-panel');
    if (equipmentPanels.length > 0) {
        equipmentPanels.forEach(panel => {
            panel.addEventListener('click', () => {
                equipmentPanels.forEach(p => p.classList.remove('active'));
                panel.classList.add('active');
            });
        });
    }

    // --- 2. EVENT LISTENER'LAR ---
    // Mobil Menü
    document.getElementById('nav-toggle')?.addEventListener('click', () => {
        document.getElementById('nav-links')?.classList.toggle('active');
    });

    // Müzik Çalar
    document.getElementById('music-toggle-button')?.addEventListener('click', YouTubeManager.toggleMusic);
    document.getElementById('close-music-player')?.addEventListener('click', YouTubeManager.stopMusic);

    // Renk Seçici
    const colorToggle = document.getElementById('color-picker-toggle');
    const colorMenu = document.getElementById('color-picker-menu');
    if (colorToggle && colorMenu) {
        colorToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            colorMenu.classList.toggle('hidden');
        });
        colorMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-swatch');
            if (btn) {
                const theme = JSON.parse(btn.dataset.theme);
                document.documentElement.style.setProperty('--primary-color', theme.primary);
                document.documentElement.style.setProperty('--secondary-color', theme.secondary);
                document.documentElement.style.setProperty('--bg-primary', theme.bg);
                // Çerez onayı beklemeden hemen kaydet
                Storage.set('savedColorTheme', JSON.stringify(theme));
                colorMenu.classList.add('hidden');
            }
        });
    }

    // Dil Seçici
    const langToggle = document.getElementById('language-selector-toggle');
    const langMenu = document.getElementById('language-selector-menu');
    if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
        });
        langMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('.language-option');
            if (btn) {
                LanguageManager.set(btn.dataset.lang);
                langMenu.classList.add('hidden');
            }
        });
    }

    // Rastgele Video Butonu
    document.getElementById('random-video-button')?.addEventListener('click', (e) => {
        e.preventDefault();
        const videos = document.querySelectorAll('.video-gallery-card');
        if (videos.length > 0) {
            const random = videos[Math.floor(Math.random() * videos.length)];
            window.open(random.href, '_blank');
        } else {
            alert("Videolar henüz yüklenmedi.");
        }
    });

    // Çerez Uyarısı
    const banner = document.getElementById('cookie-consent-banner');
    if (banner && !Storage.get('cookieConsent')) {
        setTimeout(() => banner.classList.add('show'), 2000);
        document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
            Storage.set('cookieConsent', 'true');
            banner.classList.remove('show');
        });
        document.getElementById('cookie-decline-btn')?.addEventListener('click', () => {
            Storage.set('cookieConsent', 'false');
            banner.classList.remove('show');
        });
    }

    // Genel Tıklama (Menüleri kapat)
    document.body.addEventListener('click', () => {
        if (colorMenu && !colorMenu.classList.contains('hidden')) colorMenu.classList.add('hidden');
        if (langMenu && !langMenu.classList.contains('hidden')) langMenu.classList.add('hidden');
    });

    // Scroll Progress Bar
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const bar = document.querySelector('.scroll-progress');
        if (bar) bar.style.width = scrolled + "%";
    });

    // === 🕹️ GİZLİ MİNECRAFT OYUNU (EASTER EGG) ===
    const gameModal = document.getElementById('secret-game-modal');
    const closeGameBtn = document.getElementById('close-game');
    const miningBlock = document.getElementById('mining-block');
    const diamondCountSpan = document.getElementById('diamond-count');
    const footerTrigger = document.querySelector('.footer-legal'); 
    
    let diamonds = parseInt(Storage.get('userDiamonds') || '0');
    let clicks = 0;
    let triggerClicks = 0;
    
    if(diamondCountSpan) diamondCountSpan.textContent = diamonds;

    // Oyunu Açma
    if(footerTrigger) {
        footerTrigger.addEventListener('click', (e) => {
            if(e.target.tagName === 'A') return;
            
            triggerClicks++;
            
            if(triggerClicks >= 5) {
                gameModal.classList.add('active');
                triggerClicks = 0;
                alert("⛏️ GİZLİ MADENİ BULDUN! KAZMAYA BAŞLA!");
            }
        });
    }

    // Oyunu Kapat
    if(closeGameBtn) {
        closeGameBtn.addEventListener('click', () => {
            gameModal.classList.remove('active');
        });
    }

    // Maden Kazma
    if(miningBlock) {
        miningBlock.addEventListener('click', (e) => {
            clicks++;
            
            // Görsel Sallanma
            miningBlock.classList.add('shake');
            setTimeout(() => miningBlock.classList.remove('shake'), 200);

            // +1 Efekti
            const particle = document.createElement('div');
            particle.className = 'click-particle';
            particle.textContent = '+1';
            const rect = miningBlock.getBoundingClientRect();
            
            const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
            const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            document.getElementById('click-effect-container').appendChild(particle);
            setTimeout(() => particle.remove(), 800);

            // Elmas Kazanma Şansı (%10)
            if (clicks % 10 === 0 || Math.random() < 0.1) {
                diamonds++;
                diamondCountSpan.textContent = diamonds;
                Storage.set('userDiamonds', diamonds);
                
                // Elmas görünümü
                miningBlock.classList.add('diamond-ore');
                setTimeout(() => miningBlock.classList.remove('diamond-ore'), 300);
            }
        });
    }
});
