// 🔥 GERÇEK ZAMANLI FİREBASE CHAT SİSTEMİ 🔥
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// === DEĞİŞKENLER VE YAPILANDIRMA ===

const firebaseConfig = {
    apiKey: "AIzaSyC_IgO_xCzkeNGkaoCh59vdIWBQgu51Fmk",
    authDomain: "benyaso-2d53b.firebaseapp.com",
    databaseURL: "https://benyaso-2d53b-default-rtdb.firebaseio.com",
    projectId: "benyaso-2d53b",
    storageBucket: "benyaso-2d53b.firebasestorage.app",
    messagingSenderId: "518556386840",
    appId: "1:518556386840:web:abaa02ae4b42bd0eb5256d",
    measurementId: "G-E3C6MDGXPN"
};

const YOUTUBE_API_KEY = 'AIzaSyAwC6sByfoq9n4G72tfFtwf2XETXaSdg04';
const CHANNEL_ID = 'UCTYeNjk3VZnXNfcC8ssvevQ';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("🔥 Firebase başlatıldı - Gerçek zamanlı chat aktif!");

let currentUser = sessionStorage.getItem('chatUsername');
if (!currentUser) {
    const adjectives = ['Hızlı', 'Güçlü', 'Akıllı', 'Cesur', 'Eğlenceli', 'Pro', 'Epic', 'Cool', 'Süper', 'Mega'];
    const nouns = ['Oyuncu', 'Gamer', 'Builder', 'Miner', 'Explorer', 'Warrior', 'Master', 'Hero', 'Legend', 'Champion'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    currentUser = `${adj}${noun}${num}`;
    sessionStorage.setItem('chatUsername', currentUser);
}
console.log(`👤 Kullanıcı adınız: ${currentUser}`);


// === MÜZİK ÇALAR İÇİN YOUTUBE API HAZIRLIĞI ===
let player;
let youtubeApiReady = false;
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
    youtubeApiReady = true;
    console.log("YouTube Müzik API'si hazır.");
}

function initializePlayer() {
    if (player) return;
    player = new YT.Player('youtube-player', {
        height: '180',
        width: '320',
        videoId: 'jfKfPfyJRdk', // Lofi Girl video ID'si
        playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 1 }
    });
}


// === GLOBAL FONKSİYONLAR ===

window.sendMessage = (() => {
    let isMessageSending = false;
    let lastMessageTime = 0;
    return function() {
        const now = Date.now();
        if (now - lastMessageTime < 500) { return; }
        if (isMessageSending) { return; }
        const input = document.getElementById('chat-input-main');
        if (!input) return;
        const text = input.value.trim();
        if (!text || text.length > 200) {
            if (text.length > 200) alert('Mesaj çok uzun! Maksimum 200 karakter.');
            return;
        }
        isMessageSending = true;
        lastMessageTime = now;
        const originalText = text;
        input.value = '';
        const message = {
            text: originalText,
            user: currentUser,
            timestamp: serverTimestamp(),
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
        };
        push(ref(db, 'chatMessages'), message)
            .finally(() => { setTimeout(() => { isMessageSending = false; }, 1000); });
    };
})();

window.scrollToSection = function(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = 80;
        const targetPosition = element.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
};


// === YARDIMCI FONKSİYONLAR VE SINIFLAR ===

function startRealTimeChat() {
    const messagesContainer = document.getElementById('chat-messages-main');
    if (!messagesContainer) { setTimeout(startRealTimeChat, 1000); return; }
    console.log("🎯 Gerçek zamanlı chat başlatılıyor...");
    const messagesRef = ref(db, 'chatMessages');
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
    onValue(messagesQuery, (snapshot) => {
        if (!snapshot.exists()) return;
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-message';
            const userColor = msg.color || '#a5b4fc';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = `<strong style="color: ${userColor};">${msg.user}:</strong> ${msg.text}<small style="float: right; color: rgba(255,255,255,0.5);">${timeStr}</small>`;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Dil çevirileri - Eksik çeviriler eklendi
const translations = {
    'en': {
        'navHome': 'Home', 
        'navVideos': 'Videos', 
        'navEquipment': 'My Gear', 
        'navAnnouncements': 'Announcements',
        'navSupport': 'Support Me', 
        'navDiscord': 'Discord', 
        'navQA': 'Q&A', 
        'heroTitle': 'BenYasoMinecraft',
        'heroSubtitle': 'My YouTube Channel and Community Hub',
        'heroDescription': 'Follow my Minecraft adventures, chat with the community, and discover more!',
        'buttonChannel': 'Go to Channel', 
        'buttonAbout': 'About Me', 
        'buttonRandom': 'Random Video',
        'aboutTitle': 'About Me', 
        'aboutCard1Title': 'Who Am I?', 
        'aboutCard1Text': 'I am 15 years old, I spend my free time playing Minecraft, shooting videos and editing them in my own style.',
        'aboutCard2Title': 'Curious About Tech', 
        'aboutCard2Text': 'I am developing my own Discord bot with fun and useful features.',
        'aboutCard3Title': 'Devoted to YouTube', 
        'aboutCard3Text': 'I enjoy showing people what I experience. Every video is different, every moment is fun.',
        'statsTitle': 'Live Channel Stats', 
        'statsSubscribers': 'Subscribers', 
        'statsViews': 'Total Views', 
        'statsVideos': 'Video Count',
        'videosTitle': 'My Latest Videos', 
        'equipmentTitle': 'My Equipment', 
        'announcementsTitle': 'Announcements', 
        'supportTitle': 'Support Me',
        'discordTitle': 'Join the Community!', 
        'qaTitle': 'Q&A',
        'chatTitle': 'Live Chat',
        'chatPlaceholder': 'Type your message...',
        'chatSend': 'Send'
    },
    'az': {
        'navHome': 'Ana Səhifə', 
        'navVideos': 'Videolar', 
        'navEquipment': 'Avadanlığım', 
        'navAnnouncements': 'Elanlar',
        'navSupport': 'Dəstək Ol', 
        'navDiscord': 'Discord', 
        'navQA': 'Sual-Cavab', 
        'heroTitle': 'BenYasoMinecraft',
        'heroSubtitle': 'YouTube Kanalım və İcma Mərkəzi', 
        'heroDescription': 'Minecraft macəralarımı izlə, icma ilə söhbət et və daha çoxunu kəşf et!',
        'buttonChannel': 'Kanala Keç', 
        'buttonAbout': 'Haqqımda', 
        'buttonRandom': 'Təsadüfi Video',
        'aboutTitle': 'Haqqımda', 
        'aboutCard1Title': 'Mən Kiməm?', 
        'aboutCard1Text': '15 yaşım var, boş vaxtlarımda Minecraft oynayıram, videolar çəkib öz tərzimdə montaj edirəm.',
        'aboutCard2Title': 'Texnologiyaya Maraqlıyam', 
        'aboutCard2Text': 'Öz Discord botumu hazırlayıram, həm əyləncəli həm də faydalı funksiyaları var.',
        'aboutCard3Title': 'YouTube-a Könül Verdik', 
        'aboutCard3Text': 'Yaşadıqlarımı insanlara göstərmək xoşuma gəlir. Hər video fərqlidir, hər an əyləncəlidir.',
        'statsTitle': 'Canlı Kanal Statistikası', 
        'statsSubscribers': 'Abunəçilər', 
        'statsViews': 'Ümumi Baxış', 
        'statsVideos': 'Video Sayı',
        'videosTitle': 'Ən Son Videolarım', 
        'equipmentTitle': 'Avadanlığım', 
        'announcementsTitle': 'Elanlar', 
        'supportTitle': 'Dəstək Ol',
        'discordTitle': 'İcmaya Qoşul!', 
        'qaTitle': 'Sual-Cavab',
        'chatTitle': 'Canlı Söhbət',
        'chatPlaceholder': 'Mesajınızı yazın...',
        'chatSend': 'Göndər'
    }
};

// Türkçe için orijinal metinler (data-original-text olarak HTML'de saklanacak)
const originalTurkishTexts = {
    'navHome': 'Ana Sayfa',
    'navVideos': 'Videolar',
    'navEquipment': 'Ekipmanlarım',
    'navAnnouncements': 'Duyurular',
    'navSupport': 'Destek Ol',
    'navDiscord': 'Discord',
    'navQA': 'Soru & Cevap',
    'heroTitle': 'BenYasoMinecraft',
    'heroSubtitle': 'YouTube Kanalım ve Topluluk Merkezi',
    'heroDescription': 'Minecraft maceralarımı takip et, toplulukla sohbet et ve daha fazlasını keşfet!',
    'buttonChannel': 'Kanala Git',
    'buttonAbout': 'Hakkımda',
    'buttonRandom': 'Rastgele Video',
    'aboutTitle': 'Hakkımda',
    'aboutCard1Title': 'Ben Kimim?',
    'aboutCard1Text': '15 yaşındayım, boş zamanlarımda Minecraft oynayıp video çekiyor ve kendi tarzımda montajlıyorum.',
    'aboutCard2Title': 'Teknolojiye Meraklıyım',
    'aboutCard2Text': 'Kendi Discord botumu geliştiriyorum, hem eğlenceli hem de yararlı özellikleri var.',
    'aboutCard3Title': 'YouTube\'a Gönül Verdik',
    'aboutCard3Text': 'Yaşadıklarımı insanlara göstermekten hoşlanırım. Her video farklı, her an eğlenceli.',
    'statsTitle': 'Canlı Kanal İstatistikleri',
    'statsSubscribers': 'Abone',
    'statsViews': 'Toplam İzlenme',
    'statsVideos': 'Video Sayısı',
    'videosTitle': 'En Son Videolarım',
    'equipmentTitle': 'Ekipmanlarım',
    'announcementsTitle': 'Duyurular',
    'supportTitle': 'Destek Ol',
    'discordTitle': 'Topluluğa Katıl!',
    'qaTitle': 'Soru & Cevap',
    'chatTitle': 'Canlı Sohbet',
    'chatPlaceholder': 'Mesajınızı yazın...',
    'chatSend': 'Gönder'
};

// Geliştirilmiş dil değiştirme fonksiyonu
function setLanguage(lang) {
    console.log(`🌐 Dil değiştiriliyor: ${lang}`);
    
    // HTML lang attribute'u güncelle
    document.documentElement.lang = lang;
    
    // Bayrak güncelleme
    const flagImg = document.getElementById('current-lang-flag');
    if (flagImg) {
        if (lang === 'en') flagImg.src = 'https://flagsapi.com/GB/shiny/24.png';
        else if (lang === 'az') flagImg.src = 'https://flagsapi.com/AZ/shiny/24.png';
        else flagImg.src = 'https://flagsapi.com/TR/shiny/24.png';
    }

    // Tüm çevrilebilir elementleri bul ve güncelle
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.dataset.key;
        
        // İlk kez çeviri yapılıyorsa orijinal metni kaydet
        if (!elem.dataset.originalText) {
            elem.dataset.originalText = elem.textContent.trim();
        }
        
        let newText;
        if (lang === 'tr') {
            // Türkçe için orijinal metni kullan veya varsayılan Türkçe metni
            newText = elem.dataset.originalText || originalTurkishTexts[key] || elem.textContent;
        } else {
            // Diğer diller için çeviri objesinden al
            newText = translations[lang]?.[key] || elem.dataset.originalText || elem.textContent;
        }
        
        // Placeholder'lar için özel kontrol
        if (elem.hasAttribute('placeholder')) {
            elem.placeholder = newText;
        } else {
            elem.textContent = newText;
        }
        
        console.log(`Çeviri yapıldı: ${key} -> ${newText}`);
    });
    
    // Dil ayarını kaydet (çerez onayı verilmişse)
    if (localStorage.getItem('cookieConsent') === 'true') {
        localStorage.setItem('savedLanguage', lang);
    }
    
    console.log(`✅ Dil başarıyla ${lang} olarak değiştirildi`);
}

// Sayfa yüklenirken kaydedilmiş dili yükle
function loadSavedLanguage() {
    const savedLang = localStorage.getItem('savedLanguage');
    if (savedLang && (savedLang === 'en' || savedLang === 'az' || savedLang === 'tr')) {
        console.log(`💾 Kaydedilmiş dil yükleniyor: ${savedLang}`);
        setLanguage(savedLang);
    } else {
        console.log(`🏠 Varsayılan dil (Türkçe) kullanılıyor`);
        setLanguage('tr');
    }
}

function initializeChat() {
    console.log("🚀 Chat sistemi başlatılıyor...");
    startRealTimeChat();
}

async function updateYouTubeStats() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        const stats = data.items[0].statistics;
        document.getElementById('live-subscribers').textContent = parseInt(stats.subscriberCount).toLocaleString('tr-TR');
        document.getElementById('live-views').textContent = parseInt(stats.viewCount).toLocaleString('tr-TR');
        document.getElementById('live-videos').textContent = parseInt(stats.videoCount).toLocaleString('tr-TR');
    } catch (error) {
        console.error('YouTube API hatası:', error);
    }
}

async function fetchLatestYouTubeVideos() {
    const videoContainer = document.getElementById('video-gallery-container');
    if (!videoContainer) return;
    try {
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) throw new Error("Kanal bulunamadı veya API anahtarı hatalı.");
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        
        const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=9&key=${YOUTUBE_API_KEY}`);
        const videoData = await videoResponse.json();
        if (!videoData.items) throw new Error("Videolar çekilemedi.");
        
        videoContainer.innerHTML = '';
        videoData.items.forEach(item => {
            const { title, resourceId, thumbnails } = item.snippet;
            const videoLink = document.createElement('a');
            videoLink.href = `https://www.youtube.com/watch?v=${resourceId.videoId}`;
            videoLink.target = '_blank';
            videoLink.className = 'video-gallery-card';
            videoLink.innerHTML = `
                <div class="video-thumbnail-container">
                    <img src="${thumbnails.high.url}" alt="${title}">
                    <div class="video-play-button">▶</div>
                </div>
                <div class="video-info">
                    <h3>${title}</h3>
                </div>
            `;
            videoContainer.appendChild(videoLink);
        });
    } catch (error) {
        console.error('YouTube videoları çekilirken hata oluştu:', error);
        videoContainer.innerHTML = `<div class="card" style="text-align:center;">Videolar yüklenemedi. API anahtarını veya kanal ID'sini kontrol edin.</div>`;
    }
}

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.init();
        this.animate();
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; this.init(); }
    init() {
        this.particles = [];
        let numberOfParticles = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 20000), 100);
        for (let i = 0; i < numberOfParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1, opacity: Math.random() * 0.5 + 0.1
            });
        }
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.fill();
        });
    }
}

function showTab(tabName, clickedElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.classList.add('active');
    if (clickedElement) clickedElement.classList.add('active');
    document.getElementById('nav-links')?.classList.remove('active');
    localStorage.setItem('lastActiveTab', tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// === SAYFA YÜKLENDİĞİNDE ÇALIŞACAK ANA KOD ===
document.addEventListener('DOMContentLoaded', function() {
    loadSavedLanguage();
    
    // Tüm elementleri seç
    const navToggle = document.getElementById('nav-toggle');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatInput = document.getElementById('chat-input-main');
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');
    const colorPickerToggle = document.getElementById('color-picker-toggle');
    const colorPickerMenu = document.getElementById('color-picker-menu');
    const musicToggleButton = document.getElementById('music-toggle-button');
    const musicPlayerContainer = document.getElementById('music-player-container');
    const closeMusicPlayerButton = document.getElementById('close-music-player');
    const langToggle = document.getElementById('language-selector-toggle');
    const langMenu = document.getElementById('language-selector-menu');
    const randomVideoButton = document.getElementById('random-video-button');
    const panels = document.querySelectorAll('.panel');
    const equipmentPanels = document.querySelectorAll('.equipment-panel');

    // Başlangıç Fonksiyonları
    new ParticleSystem();
    initializeChat();
    updateYouTubeStats();
    fetchLatestYouTubeVideos();
    setInterval(updateYouTubeStats, 60000);

    // Renk Seçici Mantığı
    if (colorPickerToggle && colorPickerMenu) {
        colorPickerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPickerMenu.classList.toggle('hidden');
        });
        document.body.addEventListener('click', () => {
            if (!colorPickerMenu.classList.contains('hidden')) {
                colorPickerMenu.classList.add('hidden');
            }
        });
        colorPickerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = e.target.closest('.color-swatch');
            if (target) {
                const themeData = JSON.parse(target.dataset.theme);
                const root = document.documentElement;
                root.style.setProperty('--primary-color', themeData.primary);
                root.style.setProperty('--secondary-color', themeData.secondary);
                root.style.setProperty('--bg-primary', themeData.bg);
                if (localStorage.getItem('cookieConsent') === 'true') {
                    localStorage.setItem('savedColorTheme', JSON.stringify(themeData));
                }
                colorPickerMenu.classList.add('hidden');
            }
        });
    }
    
    // Müzik Çalar Listener'ları
    if (musicToggleButton && musicPlayerContainer && closeMusicPlayerButton) {
        musicToggleButton.addEventListener('click', () => {
            if (youtubeApiReady) {
                initializePlayer();
                musicPlayerContainer.classList.toggle('hidden');
                if (!musicPlayerContainer.classList.contains('hidden') && player && typeof player.playVideo === 'function') {
                    player.playVideo();
                }
            } else {
                alert("Müzik çalar henüz hazır değil, lütfen birkaç saniye sonra tekrar deneyin.");
            }
        });
        closeMusicPlayerButton.addEventListener('click', () => {
            musicPlayerContainer.classList.add('hidden');
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        });
    }

        // Dil Seçici Mantığı
    if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
        });
        document.body.addEventListener('click', () => {
            if (!langMenu.classList.contains('hidden')) {
                langMenu.classList.add('hidden');
            }
        });
        langMenu.addEventListener('click', (e) => {
            const target = e.target.closest('.language-option');
            if (target) {
                setLanguage(target.dataset.lang);
                langMenu.classList.add('hidden');
            }
        });
    }
    
    // Mobil Navigasyon
    if (navToggle) {
        navToggle.addEventListener('click', () => document.getElementById('nav-links').classList.toggle('active'));
    }

    // Sekme Linkleri ve Sekme Hafızası
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showTab(link.dataset.tab, link);
        });
    });
    
    const lastTab = localStorage.getItem('lastActiveTab');
    if (lastTab && document.querySelector(`a[data-tab="${lastTab}"]`)) {
        showTab(lastTab, document.querySelector(`a[data-tab="${lastTab}"]`));
    } else {
        showTab('youtube', document.querySelector('a[data-tab="youtube"]'));
    }
    
    // Sohbet Butonları
    if (chatSendButton) chatSendButton.addEventListener('click', window.sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendMessage(); }
        });
    }

    // Çerez Onay Mantığı
    if (cookieBanner && acceptBtn && declineBtn) {
        if (!localStorage.getItem('cookieConsent')) {
            setTimeout(() => { cookieBanner.classList.add('show'); }, 1500);
        }
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            cookieBanner.classList.remove('show');
            const rootStyles = getComputedStyle(document.documentElement);
            const currentTheme = {
                primary: rootStyles.getPropertyValue('--primary-color').trim(),
                secondary: rootStyles.getPropertyValue('--secondary-color').trim(),
                bg: rootStyles.getPropertyValue('--bg-primary').trim()
            };
            localStorage.setItem('savedColorTheme', JSON.stringify(currentTheme));
        });
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'false');
            cookieBanner.classList.remove('show');
            localStorage.removeItem('savedColorTheme');
        });
    }

    // Rastgele Video Butonu
    if (randomVideoButton) {
        randomVideoButton.addEventListener('click', (e) => {
            e.preventDefault();
            const videoLinks = document.querySelectorAll('#video-gallery-container .video-gallery-card');
            if (videoLinks.length > 0 && videoLinks[0].href) {
                const randomIndex = Math.floor(Math.random() * videoLinks.length);
                const randomVideoUrl = videoLinks[randomIndex].href;
                window.open(randomVideoUrl, '_blank');
            } else {
                alert("Videolar henüz yüklenmedi, lütfen bir saniye sonra tekrar deneyin.");
            }
        });
    }

    // İnteraktif "Benim Dünyam" Panelleri
    if (panels.length > 0) {
        panels.forEach(panel => {
            panel.addEventListener('click', () => {
                if (panel.classList.contains('active')) return;
                panels.forEach(p => p.classList.remove('active'));
                panel.classList.add('active');
            });
        });
    }

    // İnteraktif Ekipman Panelleri
    if (equipmentPanels.length > 0) {
        equipmentPanels.forEach(panel => {
            panel.addEventListener('click', () => {
                if (panel.classList.contains('active')) {
                    panel.classList.remove('active');
                } else {
                    equipmentPanels.forEach(p => p.classList.remove('active'));
                    panel.classList.add('active');
                }
            });
        });
    }

    // Scroll Olayları
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            header.style.background = (window.scrollY > 50) ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)';
        }
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const progress = (scrollTop / (docHeight - winHeight)) * 100;
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) progressBar.style.width = progress + '%';
    });
});
