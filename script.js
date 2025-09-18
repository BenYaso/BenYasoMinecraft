// 🔥 GERÇEK ZAMANLI FİREBASE CHAT SİSTEMİ 🔥
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("🔥 Firebase başlatıldı - Gerçek zamanlı chat aktif!");

// Kullanıcı adı oluşturma
function generateUserName() {
    const adjectives = ['Hızlı', 'Güçlü', 'Akıllı', 'Cesur', 'Eğlenceli', 'Pro', 'Epic', 'Cool', 'Süper', 'Mega'];
    const nouns = ['Oyuncu', 'Gamer', 'Builder', 'Miner', 'Explorer', 'Warrior', 'Master', 'Hero', 'Legend', 'Champion'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    return `${adj}${noun}${num}`;
}

// Kullanıcı adını sessionStorage'da sakla
let currentUser = sessionStorage.getItem('chatUsername');
if (!currentUser) {
    currentUser = generateUserName();
    sessionStorage.setItem('chatUsername', currentUser);
}

// 🚀 GERÇEK ZAMANLI MESAJ GÖNDERME
let isMessageSending = false;
let lastMessageTime = 0; // Spam koruması için

window.sendMessage = function() {
    // Çok hızlı mesaj gönderimi engelle (500ms cooldown)
    const now = Date.now();
    if (now - lastMessageTime < 500) {
        console.log("🛡️ Çok hızlı mesaj gönderimi!");
        return;
    }

    if (isMessageSending) {
        console.log("🛡️ Mesaj zaten gönderiliyor...");
        return;
    }

    const input = document.getElementById('chat-input-main');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    if (text.length > 200) {
        alert('Mesaj çok uzun! Maksimum 200 karakter.');
        return;
    }

    // Koruma aktif
    isMessageSending = true;
    lastMessageTime = now;
    
    // Mesajı sakla ve input'u temizle
    const originalText = text;
    input.value = '';

    console.log("📤 Mesaj gönderiliyor:", originalText);

    const message = {
        text: originalText,
        user: currentUser,
        timestamp: serverTimestamp(),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };

    // Firebase'e gönder
    push(ref(db, 'chatMessages'), message)
        .then(() => {
            console.log("✅ Mesaj gönderildi!");
        })
        .catch((error) => {
            console.error("❌ Hata:", error);
            // Hata durumunda mesajı geri koy
            if (input.value === '') {
                input.value = originalText;
            }
        })
        .finally(() => {
            // 1 saniye sonra korumayı kaldır
            setTimeout(() => {
                isMessageSending = false;
            }, 1000);
        });
};

// 🔥 GERÇEK ZAMANLI MESAJ DİNLEME - TİTREME SORUNU ÇÖZÜLDİ
let messageListener = null;
let lastMessageIds = new Set();
let isUpdatingMessages = false; // DOM güncelleme koruması

function startRealTimeChat() {
    const messagesContainer = document.getElementById('chat-messages-main');
    if (!messagesContainer) {
        setTimeout(startRealTimeChat, 1000);
        return;
    }

    if (messageListener) {
        messageListener();
    }

    console.log("🎯 Gerçek zamanlı chat başlatılıyor...");

    const messagesRef = ref(db, 'chatMessages');
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));

    messageListener = onValue(messagesQuery, (snapshot) => {
        if (isUpdatingMessages) return; // Güncelleme devam ediyorsa bekle
        
        console.log("📨 Mesajlar güncellendi");
        
        const currentMessages = [];
        const newMessageIds = new Set();

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const msg = child.val();
                const msgId = child.key;
                
                if (msg.text && msg.user) {
                    // 2 saatten yeni mesajları al
                    const messageTime = msg.timestamp || 0;
                    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
                    
                    if (messageTime > twoHoursAgo) {
                        msg.firebaseId = msgId;
                        currentMessages.push(msg);
                        newMessageIds.add(msgId);
                    }
                }
            });

            // Sadece yeni mesaj varsa güncelle
            const hasNewMessages = currentMessages.some(msg => !lastMessageIds.has(msg.firebaseId));
            
            if (hasNewMessages || lastMessageIds.size === 0) {
                // Timestamp'e göre sırala
                currentMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                
                // SADECE YENİ MESAJLARI EKLE - TÜM DOM'U YENİDEN OLUŞTURMA
                updateMessagesIncrementally(messagesContainer, currentMessages);
                lastMessageIds = newMessageIds;
            }
        } else {
            // İlk mesajları ekle
            if (lastMessageIds.size === 0) {
                addWelcomeMessages();
            }
        }
    });
}

// ARTAN GÜNCELEME - DOM'U TAMAMEN YENİDEN OLUŞTURMAZ
function updateMessagesIncrementally(container, newMessages) {
    isUpdatingMessages = true;
    
    // Mevcut mesajları kontrol et
    const existingMessages = container.querySelectorAll('.chat-message');
    const existingIds = new Set();
    
    existingMessages.forEach(msg => {
        const id = msg.getAttribute('data-message-id');
        if (id) existingIds.add(id);
    });

    // Sadece yeni mesajları ekle
    newMessages.forEach(msg => {
        if (!existingIds.has(msg.firebaseId)) {
            const div = document.createElement('div');
            div.className = 'chat-message';
            div.setAttribute('data-message-id', msg.firebaseId);
            
            const userColor = msg.color || (msg.user === 'BenYaso' ? '#4facfe' : 
                                            msg.user === 'Sistem' ? '#00f2fe' : '#a5b4fc');
            
            const timeStr = msg.timestamp ? 
                new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'}) : 
                'Şimdi';

            div.innerHTML = `
                <strong style="color: ${userColor};">${msg.user}:</strong> ${msg.text}
                <small style="float: right; color: rgba(255,255,255,0.5);">
                    ${timeStr}
                </small>
            `;
            
            // Yeni mesajı ekle (animate ile)
            div.style.opacity = '0';
            div.style.transform = 'translateY(10px)';
            container.appendChild(div);
            
            // Animasyon
            requestAnimationFrame(() => {
                div.style.transition = 'all 0.3s ease';
                div.style.opacity = '1';
                div.style.transform = 'translateY(0)';
            });
        }
    });

    // Eski mesajları temizle (100'den fazlaysa)
    while (container.children.length > 100) {
        container.removeChild(container.firstChild);
    }

    // Scroll'u en alta kaydır
    container.scrollTop = container.scrollHeight;
    
    setTimeout(() => {
        isUpdatingMessages = false;
    }, 100);
}

// 2 saatten eski mesajları sil
function cleanOldMessages() {
    const messagesRef = ref(db, 'chatMessages');
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    
    // Eski mesajları bul ve sil
    onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const msg = child.val();
                if (msg.timestamp && msg.timestamp < twoHoursAgo) {
                    // Eski mesajı sil
                    const msgRef = ref(db, `chatMessages/${child.key}`);
                    msgRef.remove().catch(err => console.log("Silme hatası:", err));
                }
            });
        }
    }, { onlyOnce: true }); // Sadece bir kez çalışsın
}

// Hoş geldin mesajları - SADECE BİR KEZ
let welcomeMessagesAdded = false;
function addWelcomeMessages() {
    if (welcomeMessagesAdded) return;
    welcomeMessagesAdded = true;
    
    const welcomeMessages = [
        { text: "Gerçek zamanlı sohbet sistemine hoş geldiniz! 🔥", user: "BenYaso" },
        { text: "Mesajlar 2 saatte bir otomatik temizlenir 🧹", user: "Sistem" },
        { text: "İlk mesajı siz atın! 🎮", user: "BenYaso" }
    ];

    welcomeMessages.forEach((msg, index) => {
        setTimeout(() => {
            push(ref(db, 'chatMessages'), {
                ...msg,
                timestamp: serverTimestamp(),
                color: msg.user === 'BenYaso' ? '#4facfe' : '#00f2fe'
            });
        }, index * 500); // 500ms arayla ekle
    });
}

// 💫 CANLI İSTATİSTİKLER
function startLiveStats() {
    const onlineUsersRef = ref(db, 'onlineUsers');
    
    onValue(onlineUsersRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 1;
        
        // Online kullanıcı sayısını güncelle
        const onlineElement = document.querySelector('#sohbet .hero-description');
        if (onlineElement && document.getElementById('sohbet').classList.contains('active')) {
            onlineElement.innerHTML = `Şu anda <strong style="color: #4facfe;">${count}</strong> kişi sohbet ediyor! 🔥`;
        }
    });
}

// Kullanıcıyı online olarak işaretle
function markUserOnline() {
    const userRef = ref(db, `onlineUsers/${currentUser}`);
    push(userRef, {
        timestamp: serverTimestamp(),
        user: currentUser
    });
}

// 🎯 BAŞLATMA FONKSİYONU
function initializeChat() {
    console.log("🚀 Chat sistemi başlatılıyor...");
    startRealTimeChat();
    startLiveStats();
    markUserOnline();
    
    // Her 30 saniyede bir online durumu güncelle
    setInterval(markUserOnline, 30000);
    
    // Her 30 dakikada bir eski mesajları temizle
    setInterval(cleanOldMessages, 30 * 60 * 1000);
    
    console.log("🧹 Otomatik temizlik sistemi aktif - 2 saatte bir mesajlar silinecek");
}

// Enter tuşu desteği - TAM İYİLEŞTİRİLMİŞ
let enterKeyBound = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!enterKeyBound) {
        const input = document.getElementById('chat-input-main');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey && !e.repeat) {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage();
                }
            });
            console.log("⌨️ Enter tuşu desteği eklendi");
            enterKeyBound = true;
        }
    }

    // Chat'i başlat
    initializeChat();
});

// Global erişim için
window.sendRealTimeMessage = window.sendMessage;
window.currentChatUser = currentUser;

console.log(`👤 Kullanıcı adınız: ${currentUser}`);

// --- DİĞER SCRİPT KODLARI ---

// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyAwC6sByfoq9n4G72tfFtwf2XETXaSdg04';
const CHANNEL_ID = 'UCTYeNjk3VZnXNfcC8ssvevQ';
const DISCORD_GUILD_ID = '1185317817888411729'; // Düzeltilmiş ID

// Real YouTube Data
async function getRealYouTubeData() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const stats = data.items[0].statistics;
            return {
                subscribers: parseInt(stats.subscriberCount),
                views: parseInt(stats.viewCount),
                videos: parseInt(stats.videoCount)
            };
        }
        return null;
    } catch (error) {
        console.log('YouTube API hatası:', error);
        return null;
    }
}

// Real Discord Data
async function getRealDiscordData() {
    try {
        const response = await fetch(
            `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`
        );
        
        if (response.ok) {
            const data = await response.json();
            return {
                onlineMembers: data.presence_count || 0,
                totalMembers: data.members ? data.members.length : 0
            };
        } else {
            console.log('Discord Widget etkin değil veya bulunamadı');
            return null;
        }
    } catch (error) {
        console.log('Discord API hatası:', error);
        return null;
    }
}

// Update YouTube Stats - CANLI VERİLER İÇİN İYİLEŞTİRİLDİ
async function updateYouTubeStats() {
    console.log('YouTube verileri güncelleniyor...');
    const data = await getRealYouTubeData();
    if (data) {
        console.log('YouTube verisi alındı:', data);
        
        // YouTube sekmesindeki canlı istatistikler
        const liveSubscribers = document.getElementById('live-subscribers');
        const liveViews = document.getElementById('live-views');
        const liveVideos = document.getElementById('live-videos');
        
        if (liveSubscribers) {
            liveSubscribers.textContent = data.subscribers.toLocaleString();
        }
        if (liveViews) {
            liveViews.textContent = data.views.toLocaleString();
        }
        if (liveVideos) {
            liveVideos.textContent = data.videos.toLocaleString();
        }
    } else {
        console.log('YouTube verisi alınamadı');
    }
}

// YENİ EKLENDİ: Görev 2.1 - Son Videoları Çeken Fonksiyon
async function fetchLatestYouTubeVideos() {
    const videoContainer = document.getElementById('video-gallery-container');
    if (!videoContainer) return;

    try {
        // 1. Kanal bilgisinden "uploads" playlist ID'sini al
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // 2. "uploads" playlist'inden son 9 videoyu çek
        const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=9&key=${YOUTUBE_API_KEY}`);
        const videoData = await videoResponse.json();

        // 3. Videoları HTML'e işle ve galeriyi temizle
        videoContainer.innerHTML = ''; 

        videoData.items.forEach(item => {
            const snippet = item.snippet;
            const videoId = snippet.resourceId.videoId;
            const title = snippet.title;
            const thumbnailUrl = snippet.thumbnails.high.url;

            const videoLink = document.createElement('a');
            videoLink.href = `https://www.youtube.com/watch?v=${videoId}`;
            videoLink.target = '_blank';
            videoLink.className = 'video-gallery-card';

            videoLink.innerHTML = `
                <div class="video-thumbnail-container">
                    <img src="${thumbnailUrl}" alt="${title}">
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
        videoContainer.innerHTML = '<div class="card" style="text-align:center;">Videolar yüklenemedi. Lütfen daha sonra tekrar deneyin.</div>';
    }
}

// Particles Animation
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return; // Canvas yoksa devam etme
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Theme Toggle
window.toggleTheme = function() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }
}

// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset;
    const progress = (scrollTop / (docHeight - winHeight)) * 100;
    const progressBar = document.querySelector('.scroll-progress');
    if(progressBar) progressBar.style.width = progress + '%';
});

// Easter Egg
let clickCount = 0;
document.addEventListener('click', function(e) {
    if (e.ctrlKey && e.altKey) {
        clickCount++;
        if (clickCount >= 3) {
            showEasterEgg();
            clickCount = 0;
        }
    }
});

function showEasterEgg() {
    const easterEgg = document.getElementById('easter-egg');
    easterEgg.style.left = Math.random() * (window.innerWidth - 50) + 'px';
    easterEgg.style.top = Math.random() * (window.innerHeight - 50) + 'px';
    easterEgg.classList.add('show');
    
    setTimeout(() => {
        easterEgg.classList.remove('show');
    }, 3000);
}

// Tab System
function showTab(tabName, clickedElement) {
    // Tüm tab'ları gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Tüm nav linklerini pasif yap
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Seçilen tab'ı göster
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Tıklanan linki aktif yap
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // Mobil menüyü kapat
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        navLinks.classList.remove('active');
    }
    
    // Üste scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sohbet tab'ı seçildiyse online durumu güncelle
    if (tabName === 'sohbet') {
        if (window.markUserOnline) {
            window.markUserOnline();
            startLiveStats(); // Re-trigger stat update
        }
    }
}

// Scroll to section function
window.scrollToSection = function(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = 80;
        const targetPosition = element.offsetTop - headerHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    new ParticleSystem(); // Particle'ları her zaman başlat

    // Tab event listeners
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            showTab(tabName, this);
        });
    });

    // İlk tab'ı göster
    showTab('youtube', document.querySelector('a[data-tab="youtube"]'));
    
    // İlk veri yüklemesi
    updateYouTubeStats();
    
    // YENİ EKLENDİ: Sayfa yüklendiğinde videoları çek
    fetchLatestYouTubeVideos();
    
    // Periyodik güncellemeler
    setInterval(updateYouTubeStats, 60000); 
    
    console.log('YouTube canlı verileri aktif!');

    // Mobile Navigation
    const navToggle = document.getElementById('nav-toggle');
    if(navToggle){
        navToggle.addEventListener('click', function() {
            const navLinks = document.getElementById('nav-links');
            if(navLinks) navLinks.classList.toggle('active');
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if(header) {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(0, 0, 0, 0.4)';
            } else {
                header.style.background = 'rgba(0, 0, 0, 0.2)';
            }
        }
    });
});
