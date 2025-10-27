// 🔥 GERÇEK ZAMANLI FİREBASE CHAT SİSTEMİ 🔥
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// === GÜVENLI LOCALSTORAGE KONTROLÜ ===
function safeLocalStorage() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        console.warn('localStorage kullanılamıyor:', e);
        return false;
    }
}

const canUseStorage = safeLocalStorage();

function getStorage(key) {
    if (!canUseStorage) return null;
    try {
        return localStorage.getItem(key);
    } catch(e) {
        console.warn('localStorage okuma hatası:', e);
        return null;
    }
}

function setStorage(key, value) {
    if (!canUseStorage) return false;
    try {
        localStorage.setItem(key, value);
        return true;
    } catch(e) {
        console.warn('localStorage yazma hatası:', e);
        return false;
    }
}

function removeStorage(key) {
    if (!canUseStorage) return false;
    try {
        localStorage.removeItem(key);
        return true;
    } catch(e) {
        console.warn('localStorage silme hatası:', e);
        return false;
    }
}

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
    if (!messagesContainer) { 
        console.log("Chat container bulunamadı, tekrar denenecek...");
        setTimeout(startRealTimeChat, 1000); 
        return; 
    }
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

// Dil çevirileri - Tam liste
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
        'aboutTitle': 'My World',
        'aboutCard1Title': 'PLAYER', 
        'aboutCard1Text': 'I love spending my hours in Minecraft. Sometimes I mess around with massive structures and relax, sometimes I dive into the creepiest horror mods and have a good scare. For me, both are great stories.',
        'aboutCard2Title': 'CONTENT CREATOR', 
        'aboutCard2Text': 'I enjoy sharing those moments I experience in the game with others. I try to take a simple recording and turn it into a video that reflects the excitement or tension of that moment by thinking it through. This process is as much fun for me as playing.',
        'aboutCard3Title': 'DEVELOPER', 
        'aboutCard3Text': 'In my spare time, I also like to mess around with code. I write fun Discord bots that make life easier for our community. This is a hobby where I both learn new things and create a more enjoyable environment for all of us.',
        'statsTitle': 'Live Channel Stats', 
        'statsSubscribers': 'Subscribers', 
        'statsViews': 'Total Views', 
        'statsVideos': 'Video Count',
        'videosTitle': 'My Latest Videos', 
        'equipmentTitle': 'Equipment I Use', 
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
        'aboutTitle': 'Mənim Dünyam',
        'aboutCard1Title': 'OYUNÇU', 
        'aboutCard1Text': 'Minecraft-də saatlarımı keçirməyi sevirəm. Bəzən nəhəng tikililərlə məşğul olub dincəlirəm, bəzən də ən qorxunc qorxu modlarına girib yaxşıca gərginləşirəm. Mənim üçün hər ikisi də əla hekayələrdir.',
        'aboutCard2Title': 'MƏZMUN YARAdıCıSı', 
        'aboutCard2Text': 'Oyunda yaşadığım o anları başqaları ilə paylaşmaq xoşuma gəlir. Sadə bir qeydi götürüb, üzərinə bir az düşünərək o andakı həyəcanı və ya gərginliyi əks etdirən videoya çevirməyə çalışıram. Bu proses mənim üçün ən az oynamaq qədər əyləncəlidir.',
        'aboutCard3Title': 'TƏRTİBATÇı', 
        'aboutCard3Text': 'Boş vaxtlarımda kodlarla məşğul olmağı da sevirəm. İcmamız üçün həyatı asanlaşdıran, əyləncəli Discord botları yazıram. Bu, mənim üçün həm yeni şeylər öyrəndiyim, həm də hamımız üçün daha xoşagələn mühit yaratdığım bir hobbidir.',
        'statsTitle': 'Canlı Kanal Statistikası', 
        'statsSubscribers': 'Abunəçilər', 
        'statsViews': 'Ümumi Baxış', 
        'statsVideos': 'Video Sayı',
        'videosTitle': 'Ən Son Videolarım', 
        'equipmentTitle': 'İstifadə Etdiyim Avadanlıq', 
        'announcementsTitle': 'Elanlar', 
        'supportTitle': 'Dəstək Ol',
        'discordTitle': 'İcmaya Qoşul!', 
        'qaTitle': 'Sual-Cavab',
        'chatTitle': 'Canlı Söhbət',
        'chatPlaceholder': 'Mesajınızı yazın...',
        'chatSend': 'Göndər'
    }
};

// Türkçe için orijinal metinler
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
    'aboutTitle': 'Benim Dünyam',
    'aboutCard1Title': 'OYUNCU',
    'aboutCard1Text': 'Minecraft\'ta saatlerimi harcamayı seviyorum. Bazen devasa yapılarla uğraşıp kafa dağıtıyorum, bazen de en tekinsiz korku modlarına girip şöyle güzelce bir geriliyorum. Benim için her ikisi de harika birer hikaye',
    'aboutCard2Title': 'İÇERİK ÜRETİCİSİ',
    'aboutCard2Text': 'Oyunda yaşadığım o anları başkalarıyla paylaşmak hoşuma gidiyor. Basit bir kaydı alıp, üzerine biraz kafa yorarak o anki heyecanı veya gerilimi yansıtan bir videoya dönüştürmeye çalışıyorum. Bu süreç benim için en az oynamak kadar eğlenceli.',
    'aboutCard3Title': 'GELİŞTİRİCİ',
    'aboutCard3Text': 'Boş zamanlarımda kodlarla uğraşmayı da seviyorum. Topluluğumuz için hayatı kolaylaştıran, eğlenceli Discord botları yazıyorum. Bu, benim için hem yeni şeyler öğrendiğim hem de hepimiz için daha keyifli bir ortam yarattığım bir hobi.',
    'statsTitle': 'Canlı Kanal İstatistikleri',
    'statsSubscribers': 'Abone',
    'statsViews': 'Toplam İzlenme',
    'statsVideos': 'Video Sayısı',
    'videosTitle': 'Son Videolarım',
    'equipmentTitle': 'Kullandığım Ekipmanlar',
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
    if (getStorage('cookieConsent') === 'true') {
        setStorage('savedLanguage', lang);
    }
    
    console.log(`✅ Dil başarıyla ${lang} olarak değiştirildi`);
}

// Sayfa yüklenirken kaydedilmiş dili yükle
function loadSavedLanguage() {
    const savedLang = getStorage('savedLanguage');
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
        
        if (!data.items || data.items.length === 0) {
            console.error('YouTube API: Kanal bulunamadı');
            return;
        }
        
        const stats = data.items[0].statistics;
        const subsElement = document.getElementById('live-subscribers');
        const viewsElement = document.getElementById('live-views');
        const videosElement = document.getElementById('live-videos');
        
        if (subsElement) subsElement.textContent = parseInt(stats.subscriberCount).toLocaleString('tr-TR');
        if (viewsElement) viewsElement.textContent = parseInt(stats.viewCount).toLocaleString('tr-TR');
        if (videosElement) videosElement.textContent = parseInt(stats.videoCount).toLocaleString('tr-TR');
        
        console.log('✅ YouTube istatistikleri güncellendi');
    } catch (error) {
        console.error('❌ YouTube API hatası:', error);
        const subsElement = document.getElementById('live-subscribers');
        const viewsElement = document.getElementById('live-views');
        const videosElement = document.getElementById('live-videos');
        
        if (subsElement) subsElement.textContent = 'Yüklenemedi';
        if (viewsElement) viewsElement.textContent = 'Yüklenemedi';
        if (videosElement) videosElement.textContent = 'Yüklenemedi';
    }
}

async function fetchLatestYouTubeVideos() {
    const videoContainer = document.getElementById('video-gallery-container');
    if (!videoContainer) {
        console.warn('Video container bulunamadı');
        return;
    }
    
    try {
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const channelData = await channelResponse.json();
        
        if (!channelData.items || channelData.items.length === 0) {
            throw new Error("Kanal bulunamadı veya API anahtarı hatalı.");
        }
        
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        
        const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=9&key=${YOUTUBE_API_KEY}`);
        const videoData = await videoResponse.json();
        
        if (!videoData.items) {
            throw new Error("Videolar çekilemedi.");
        }
        
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
        
        console.log('✅ YouTube videoları yüklendi');
    } catch (error) {
        console.error('❌ YouTube videoları çekilirken hata oluştu:', error);
        videoContainer.innerHTML = `<div class="card" style="text-align:center;">Videolar yüklenemedi. Lütfen daha sonra tekrar deneyin.</div>`;
    }
}

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) {
            console.warn('Particle canvas bulunamadı');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.init();
        this.animate();
        console.log('✨ Particle sistemi başlatıldı');
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

// ✅ TAB ID EŞLEŞTİRME SİSTEMİ - HTML'deki Türkçe ID'lerle uyumlu
function showTab(tabName, clickedElement) {
    console.log(`📑 Sekme değiştiriliyor: ${tabName}`);
    
    // data-tab değerlerini HTML'deki gerçek ID'lerle eşleştir
    const tabMapping = {
        'youtube': 'youtube',
        'videos': 'videolar',
        'equipment': 'ekipmanlar',
        'announcements': 'duyurular',
        'discord': 'discord',
        'qa': 'sohbet',
        'support': 'destek'
    };
    
    const actualTabId = tabMapping[tabName] || tabName;
    
    // Tüm sekmeleri gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Tüm nav linklerinden active'i kaldır
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Hedef sekmeyi göster
    const targetTab = document.getElementById(actualTabId);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log(`✅ Sekme gösterildi: ${actualTabId}`);
    } else {
        console.error(`❌ Sekme bulunamadı: ${actualTabId}`);
    }
    
    // Tıklanan linke active ekle
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // Mobil menüyü kapat
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        navLinks.classList.remove('active');
    }
    
    // Son aktif sekmeyi kaydet
    setStorage('lastActiveTab', tabName);
    
    // Sayfayı yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// === SAYFA YÜKLENDİĞİNDE ÇALIŞACAK ANA KOD ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sayfa yükleniyor...');
    
    // Dil sistemini başlat
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
            console.log('🎨 Renk seçici açıldı/kapandı');
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
                
                if (getStorage('cookieConsent') === 'true') {
                    setStorage('savedColorTheme', JSON.stringify(themeData));
                }
                
                colorPickerMenu.classList.add('hidden');
                console.log('✅ Tema rengi değiştirildi');
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
                    console.log('🎵 Müzik çalar başlatıldı');
                }
            } else {
                alert("Müzik çalar henüz hazır değil, lütfen birkaç saniye sonra tekrar deneyin.");
                console.warn('⚠️ YouTube API henüz hazır değil');
            }
        });
        
        closeMusicPlayerButton.addEventListener('click', () => {
            musicPlayerContainer.classList.add('hidden');
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
                console.log('⏹️ Müzik çalar durduruldu');
            }
        });
    }

    // Dil Seçici Mantığı
    if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
            console.log('🌐 Dil menüsü açıldı/kapandı');
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
        navToggle.addEventListener('click', () => {
            const navLinks = document.getElementById('nav-links');
            if (navLinks) {
                navLinks.classList.toggle('active');
                console.log('📱 Mobil menü açıldı/kapandı');
            }
        });
    }

    // Sekme Linkleri ve Sekme Hafızası
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            if (tabName) {
                showTab(tabName, link);
            }
        });
    });
    
    // Son aktif sekmeyi yükle
    const lastTab = getStorage('lastActiveTab');
    if (lastTab && document.querySelector(`a[data-tab="${lastTab}"]`)) {
        console.log(`💾 Son aktif sekme yükleniyor: ${lastTab}`);
        showTab(lastTab, document.querySelector(`a[data-tab="${lastTab}"]`));
    } else {
        console.log('🏠 Varsayılan sekme (youtube) yükleniyor');
        showTab('youtube', document.querySelector('a[data-tab="youtube"]'));
    }
    
    // Sohbet Butonları
    if (chatSendButton) {
        chatSendButton.addEventListener('click', window.sendMessage);
        console.log('💬 Chat gönder butonu hazır');
    }
    
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                window.sendMessage(); 
            }
        });
        console.log('💬 Chat input hazır');
    }

    // Çerez Onay Mantığı
    if (cookieBanner && acceptBtn && declineBtn) {
        const cookieConsent = getStorage('cookieConsent');
        
        if (!cookieConsent) {
            setTimeout(() => { 
                cookieBanner.classList.add('show'); 
                console.log('🍪 Çerez onay bandı gösteriliyor');
            }, 1500);
        }
        
        acceptBtn.addEventListener('click', () => {
            setStorage('cookieConsent', 'true');
            cookieBanner.classList.remove('show');
            
            const rootStyles = getComputedStyle(document.documentElement);
            const currentTheme = {
                primary: rootStyles.getPropertyValue('--primary-color').trim(),
                secondary: rootStyles.getPropertyValue('--secondary-color').trim(),
                bg: rootStyles.getPropertyValue('--bg-primary').trim()
            };
            setStorage('savedColorTheme', JSON.stringify(currentTheme));
            console.log('✅ Çerezler kabul edildi');
        });
        
        declineBtn.addEventListener('click', () => {
            setStorage('cookieConsent', 'false');
            cookieBanner.classList.remove('show');
            removeStorage('savedColorTheme');
            removeStorage('savedLanguage');
            removeStorage('lastActiveTab');
            console.log('❌ Çerezler reddedildi');
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
                console.log('🎲 Rastgele video açıldı');
            } else {
                alert("Videolar henüz yüklenmedi, lütfen bir saniye sonra tekrar deneyin.");
                console.warn('⚠️ Videolar henüz yüklenmedi');
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
                console.log('🎨 Panel değiştirildi');
            });
        });
        console.log('✅ İnteraktif paneller hazır');
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
                console.log('⚙️ Ekipman paneli değiştirildi');
            });
        });
        console.log('✅ Ekipman panelleri hazır');
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
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    });
    
    console.log('✅ Tüm event listener\'lar hazır');
    console.log('🎉 Sayfa tamamen yüklendi ve hazır!');
});
