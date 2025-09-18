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

// === HTML'den Çağrılan GLOBAL FONKSİYONLAR ===

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
    
    const navToggle = document.getElementById('nav-toggle');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatInput = document.getElementById('chat-input-main');
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');
    const colorPickerToggle = document.getElementById('color-picker-toggle');
    const colorPickerMenu = document.getElementById('color-picker-menu');
    const randomVideoButton = document.getElementById('random-video-button');

    // Başlangıç Fonksiyonları
    new ParticleSystem();
    initializeChat();
    updateYouTubeStats();
    fetchLatestYouTubeVideos();
    setInterval(updateYouTubeStats, 60000);

    // DÜZELTME: Renk Seçici Mantığı
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
            const target = e.target;
            if (target.classList.contains('color-swatch')) {
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
            fetchLatestYouTubeVideos(); // Videoların güncel olduğundan emin ol
            const videoLinks = document.querySelectorAll('#video-gallery-container .video-gallery-card');
            if (videoLinks.length > 0) {
                const randomIndex = Math.floor(Math.random() * videoLinks.length);
                const randomVideoUrl = videoLinks[randomIndex].href;
                window.open(randomVideoUrl, '_blank');
            } else {
                alert("Videolar henüz yüklenmedi, lütfen bir saniye sonra tekrar deneyin.");
            }
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
// İnteraktif Hakkımda Panelleri
const panels = document.querySelectorAll('.panel');

panels.forEach(panel => {
    panel.addEventListener('click', () => {
        // Önce hepsinden 'active' sınıfını kaldır
        panels.forEach(p => {
            p.classList.remove('active');
        });
        // Sadece tıklanana 'active' sınıfını ekle
        panel.classList.add('active');
    });
});
