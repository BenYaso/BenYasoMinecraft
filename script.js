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
const DISCORD_GUILD_ID = '1185317817888411729';

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

let isMessageSending = false;
let lastMessageTime = 0;
window.sendMessage = function() {
    const now = Date.now();
    if (now - lastMessageTime < 500) { console.log("🛡️ Çok hızlı mesaj gönderimi!"); return; }
    if (isMessageSending) { console.log("🛡️ Mesaj zaten gönderiliyor..."); return; }
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
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };
    push(ref(db, 'chatMessages'), message)
        .then(() => { console.log("✅ Mesaj gönderildi!"); })
        .catch((error) => {
            console.error("❌ Hata:", error);
            if (input.value === '') { input.value = originalText; }
        })
        .finally(() => { setTimeout(() => { isMessageSending = false; }, 1000); });
};

window.scrollToSection = function(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = 80;
        const targetPosition = element.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
};

// DÜZELTME: Tema Değiştirme ve Kaydetme Fonksiyonu
window.toggleTheme = function() {
    const doc = document.documentElement;
    const currentTheme = doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', newTheme);
    document.getElementById('theme-toggle-button').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    if (localStorage.getItem('cookieConsent') === 'true') {
        localStorage.setItem('siteTheme', newTheme);
        console.log(`Tema tercihi kaydedildi: ${newTheme}`);
    }
};

// === YARDIMCI FONKSİYONLAR VE SINIFLAR ===

let messageListener = null;
let lastMessageIds = new Set();
let isUpdatingMessages = false;
function startRealTimeChat() {
    const messagesContainer = document.getElementById('chat-messages-main');
    if (!messagesContainer) { setTimeout(startRealTimeChat, 1000); return; }
    if (messageListener) { messageListener(); }
    console.log("🎯 Gerçek zamanlı chat başlatılıyor...");
    const messagesRef = ref(db, 'chatMessages');
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
    messageListener = onValue(messagesQuery, (snapshot) => {
        if (isUpdatingMessages) return;
        const currentMessages = [];
        const newMessageIds = new Set();
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const msg = child.val();
                const msgId = child.key;
                if (msg.text && msg.user) {
                    const messageTime = msg.timestamp || 0;
                    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
                    if (messageTime > twoHoursAgo) {
                        msg.firebaseId = msgId;
                        currentMessages.push(msg);
                        newMessageIds.add(msgId);
                    }
                }
            });
            const hasNewMessages = currentMessages.some(msg => !lastMessageIds.has(msg.firebaseId));
            if (hasNewMessages || lastMessageIds.size === 0) {
                currentMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                updateMessagesIncrementally(messagesContainer, currentMessages);
                lastMessageIds = newMessageIds;
            }
        }
    });
}

function updateMessagesIncrementally(container, newMessages) {
    isUpdatingMessages = true;
    const existingMessages = container.querySelectorAll('.chat-message');
    const existingIds = new Set();
    existingMessages.forEach(msg => {
        const id = msg.getAttribute('data-message-id');
        if (id) existingIds.add(id);
    });
    newMessages.forEach(msg => {
        if (!existingIds.has(msg.firebaseId)) {
            const div = document.createElement('div');
            div.className = 'chat-message';
            div.setAttribute('data-message-id', msg.firebaseId);
            const userColor = msg.color || '#a5b4fc';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = `<strong style="color: ${userColor};">${msg.user}:</strong> ${msg.text}<small style="float: right; color: rgba(255,255,255,0.5);">${timeStr}</small>`;
            div.style.opacity = '0';
            div.style.transform = 'translateY(10px)';
            container.appendChild(div);
            requestAnimationFrame(() => {
                div.style.transition = 'all 0.3s ease';
                div.style.opacity = '1';
                div.style.transform = 'translateY(0)';
            });
        }
    });
    while (container.children.length > 100) {
        container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
    setTimeout(() => { isUpdatingMessages = false; }, 100);
}

function cleanOldMessages() {
    const messagesRef = ref(db, 'chatMessages');
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const msg = child.val();
                if (msg.timestamp && msg.timestamp < twoHoursAgo) {
                    const msgRef = ref(db, `chatMessages/${child.key}`);
                    remove(msgRef).catch(err => console.log("Silme hatası:", err));
                }
            });
        }
    }, { onlyOnce: true });
}

function initializeChat() {
    console.log("🚀 Chat sistemi başlatılıyor...");
    startRealTimeChat();
    setInterval(cleanOldMessages, 30 * 60 * 1000);
    console.log("🧹 Otomatik temizlik sistemi aktif - 2 saatte bir mesajlar silinecek");
}

async function getRealYouTubeData() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].statistics;
        }
        return null;
    } catch (error) {
        console.log('YouTube API hatası:', error);
        return null;
    }
}

async function updateYouTubeStats() {
    const stats = await getRealYouTubeData();
    if (stats) {
        document.getElementById('live-subscribers').textContent = parseInt(stats.subscriberCount).toLocaleString('tr-TR');
        document.getElementById('live-views').textContent = parseInt(stats.viewCount).toLocaleString('tr-TR');
        document.getElementById('live-videos').textContent = parseInt(stats.videoCount).toLocaleString('tr-TR');
    }
}

// DÜZELTME & YENİ: Otomatik Video Galerisi Fonksiyonu
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
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// === SAYFA YÜKLENDİĞİNDE ÇALIŞACAK ANA KOD (DOMContentLoaded) ===
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementleri seç
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const navToggle = document.getElementById('nav-toggle');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatInput = document.getElementById('chat-input-main');
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');

    // Başlangıç Fonksiyonları
    new ParticleSystem();
    initializeChat();
    updateYouTubeStats();
    fetchLatestYouTubeVideos();
    setInterval(updateYouTubeStats, 60000);

    // Event Listeners
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', window.toggleTheme);
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeToggleButton.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    if (navToggle) {
        navToggle.addEventListener('click', () => document.getElementById('nav-links').classList.toggle('active'));
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showTab(link.dataset.tab, link);
        });
    });
    
    if (chatSendButton) chatSendButton.addEventListener('click', window.sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendMessage(); }
        });
    }

    // YENİ: Çerez Yönetimi Mantığı
    if (cookieBanner && acceptBtn && declineBtn) {
        if (!localStorage.getItem('cookieConsent')) {
            setTimeout(() => { cookieBanner.classList.add('show'); }, 1500);
        }

        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            cookieBanner.classList.remove('show');
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            localStorage.setItem('siteTheme', currentTheme);
        });

        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'false');
            cookieBanner.classList.remove('show');
            localStorage.removeItem('siteTheme');
        });
    }

    // Scroll Listeners
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
        if(progressBar) progressBar.style.width = progress + '%';
    });
});
