// YouTube IFrame Player API
let player;
const CTA_TIME = 120; // 2分後にCTA表示（デモ用）

const UTAGE_LABELS = {
    beginner: "9uGPu8gvz1M6",
    intermediate: "pgsvScWntrPM",
    advanced: "Vt5ttgFWzWOJ"
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbzov6Wc1dXvPLof-6IrnuMUMHPIn8p_QXiI8gUrVok-2q8_qK8zNK-G-8lYGbRPq4h1/exec";

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: 'dQw4w9WgXcQ', // 必要に応じて実際の動画IDに変更
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0,
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// ---------------------------------------------------------
// ライブ演出・カウントダウン機能
// ---------------------------------------------------------

function initCountdown() {
    const startTime = new Date().getTime() + (10 * 60 * 1000); // 10分後開始
    const timerEl = document.getElementById('timer');
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = startTime - now;
        
        if (distance < 0) {
            clearInterval(interval);
            document.getElementById('countdown-overlay').classList.add('fade-out');
            setTimeout(() => {
                document.getElementById('countdown-overlay').style.display = 'none';
                showDiagnosticModal();
            }, 1000);
            return;
        }

        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        const countEl = document.getElementById('waiting-count');
        const currentCount = parseInt(countEl.innerText);
        countEl.innerText = currentCount + Math.floor(Math.random() * 3);
    }, 1000);
}

function sendReaction(emoji) {
    createFloatingEmoji(emoji);
    for(let i=0; i<2; i++) {
        setTimeout(() => createFloatingEmoji(emoji), 300 + Math.random() * 1000);
    }
}

function createFloatingEmoji(emoji) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.innerText = emoji;
    const startX = window.innerWidth - 60;
    el.style.left = (startX + (Math.random() * 40 - 20)) + 'px';
    document.getElementById('floating-reactions').appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// ---------------------------------------------------------
// 診断 & UTAGE連携ロジック
// ---------------------------------------------------------

function showDiagnosticModal() {
    document.getElementById('diagnostic-modal').style.display = 'flex';
}

async function handleDiagnostic(segment) {
    const labelId = UTAGE_LABELS[segment];
    console.log(`診断完了: ${segment} -> LabelID: ${labelId}`);
    
    // UTAGEへ送信（非同期）
    syncToUtage(labelId);
    
    // モーダルを閉じて動画再生
    document.getElementById('diagnostic-modal').classList.add('fade-out');
    setTimeout(() => {
        document.getElementById('diagnostic-modal').style.display = 'none';
        player.playVideo();
    }, 500);
}

async function syncToUtage(labelId) {
    try {
        if (!liff.isLoggedIn()) return;
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors", // GASへのPOST用
            body: JSON.stringify({
                lineUserId: lineUserId,
                labelId: labelId
            })
        });
        console.log("UTAGE連携リクエスト送信完了");
    } catch (error) {
        console.error("UTAGE連携エラー:", error);
    }
}

// ---------------------------------------------------------
// YouTube 制御
// ---------------------------------------------------------

function onPlayerReady(event) {
    console.log("Player Ready");
    setInterval(trackPlayback, 1000);
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        showLoadingOverlay("素晴らしい学びでしたね！\n次のステップへ案内します...");
        setTimeout(() => {
            window.location.href = "https://api.utage-system.com/p/9KxqqSxakN5e"; 
        }, 3000);
    }
}

function trackPlayback() {
    if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        if (currentTime >= CTA_TIME) {
            const ctaArea = document.getElementById('ctaArea');
            if (ctaArea.style.display !== 'block') {
                ctaArea.style.display = 'block';
                ctaArea.classList.add('visible');
            }
        }
    }
}

function showLoadingOverlay(text) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.background = 'rgba(15, 15, 26, 0.95)';
    overlay.innerHTML = `<div class="glass-card"><h3>${text}</h3><div class="loader"></div></div>`;
    document.body.appendChild(overlay);
}

// ---------------------------------------------------------
// 初期化 & チャット
// ---------------------------------------------------------

const mockMessages = [
    { name: "Yuki S.", text: "楽しみです！", color: "#38BDF8" },
    { name: "Ben C.", text: "これ無料なんですか？凄い", color: "#FACC15" },
    { name: "Aimi L.", text: "AIエージェント、革命ですね", color: "#10B981" },
    { name: "Satoshi N.", text: "まさに今求めていた内容です。", color: "#8B5CF6" }
];

function addChatMessage() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    const msgData = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `
        <div class="avatar" style="background: ${msgData.color}"></div>
        <div class="msg-content">
            <span class="msg-name">${msgData.name}</span>
            ${msgData.text}
        </div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function initAll() {
    // YouTube API Load
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // LIFF
    try {
        await liff.init({ liffId: "2008778548-Ja5OX0el" });
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    } catch (e) { console.log("LIFF Init failed", e); }

    // Start UI
    initCountdown();
    setInterval(addChatMessage, 4000);
}

window.addEventListener('load', initAll);

// UI Event Listeners
document.getElementById('btnCTA').addEventListener('click', () => {
    window.location.href = "https://api.utage-system.com/p/9KxqqSxakN5e";
});

document.getElementById('btnShare').addEventListener('click', () => {
    if (liff.isApiAvailable('shareTargetPicker')) {
        liff.shareTargetPicker([{
            type: "text",
            text: "Join the AI Agent Construction Challenge! 🚀"
        }]);
    }
});
