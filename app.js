let currentDisplayedTaskId = null;

// デフォルト設定：名前は「なまえ」、画像は透明ドット
const DEFAULT_SETTINGS = {
    userName: "なまえ",
    managerImg: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
};

const escapePresets = [
    { title: "深呼吸を3回する", duration: "1" },
    { title: "コップ一杯の水を飲む", duration: "2" },
    { title: "肩を回してストレッチ", duration: "3" },
    { title: "一旦PCを閉じて立ち上がる", duration: "5" }
];

let escapeCount = 0;
let currentType = 'event';

// --- 設定関連 ---

function getSettings() {
    const saved = localStorage.getItem('myManagerSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}

// 文中の {name} を設定された名前に置換する
function getManagerMessage(baseText) {
    const settings = getSettings();
    return baseText.replace(/\{name\}/g, settings.userName);
}

function openSettings() {
    const settings = getSettings();
    // ここでエラーが出てた場所を修正！
    document.getElementById('user-name-input').value = settings.userName;
    document.getElementById('manager-img-upload').value = ""; // ファイル選択は毎回リセット
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettings() {
    const nameInput = document.getElementById('user-name-input').value || DEFAULT_SETTINGS.userName;
    const fileInput = document.getElementById('manager-img-upload');
    const currentSettings = getSettings();
    
    let imgData = currentSettings.managerImg;

    if (fileInput.files && fileInput.files[0]) {
        imgData = await convertFileToBase64(fileInput.files[0]);
    }

    const newSettings = {
        userName: nameInput,
        managerImg: imgData
    };

    localStorage.setItem('myManagerSettings', JSON.stringify(newSettings));
    closeSettings();
    solvePuzzle(); 
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- メインロジック ---

function registerData() {
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function switchType(type) {
    currentType = type;
    if (type === 'event') {
        document.getElementById('event-inputs').classList.remove('hidden');
        document.getElementById('task-inputs').classList.add('hidden');
    } else {
        document.getElementById('event-inputs').classList.add('hidden');
        document.getElementById('task-inputs').classList.remove('hidden');
    }
}

document.getElementById('data-form').onsubmit = function(e) {
    e.preventDefault();
    const data = {
        type: currentType,
        title: document.getElementById('title').value,
        start: document.getElementById('start-time').value,
        end: document.getElementById('end-time').value,
        duration: document.getElementById('duration').value,
        deadline: document.getElementById('deadline').value,
        id: Date.now(),
        completed: false
    };
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    savedData.push(data);
    localStorage.setItem('myManagerData', JSON.stringify(savedData));
    closeModal();
    this.reset();
    solvePuzzle();
};

function completeTask() {
    if (!currentDisplayedTaskId) {
        alert("今はやるべきタスクがないみたいやで。");
        return;
    }
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    savedData = savedData.map(item => {
        if (item.id === currentDisplayedTaskId) {
            return { ...item, completed: true, completedAt: todayStr };
        }
        return item;
    });
    localStorage.setItem('myManagerData', JSON.stringify(savedData));
    document.getElementById('message').innerText = getManagerMessage("終わったん？！天才やん！次もこの調子でいこか、{name}！");
    setTimeout(() => { solvePuzzle(); }, 1500);
}

function cancelTask() {
    if (!currentDisplayedTaskId) return;
    if (!confirm("このタスク、ほんまにやらんでええの？")) return;
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    localStorage.setItem('myManagerData', JSON.stringify(savedData.filter(d => d.id !== currentDisplayedTaskId)));
    document.getElementById('message').innerText = getManagerMessage("了解！これはキャンセルやな。気にせんと次いこ、{name}！");
    setTimeout(() => { solvePuzzle(); }, 1500);
}

function refuseTask() {
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    const tasks = savedData.filter(d => d.type === 'task' && !d.completed);
    let smallTasks = tasks.filter(t => parseInt(t.duration) <= 15 && t.id !== currentDisplayedTaskId);
    const taskTitleElement = document.getElementById('current-task');
    const messageElement = document.getElementById('message');

    if (smallTasks.length > 0) {
        const escapeTask = smallTasks[Math.floor(Math.random() * smallTasks.length)];
        currentDisplayedTaskId = escapeTask.id;
        taskTitleElement.innerText = `逃避：${escapeTask.title}`;
        messageElement.innerText = getManagerMessage("今は無理か！ほな、こっちのすぐ終わるやつ先に片付けちゃお？");
        escapeCount = 0;
    } else {
        escapeCount++;
        if (escapeCount > 3) {
            taskTitleElement.innerText = "休憩：散歩でもしてきな";
            messageElement.innerText = getManagerMessage("{name}、根詰めすぎや。一回外の空気吸ってき？");
        } else {
            const preset = escapePresets[Math.floor(Math.random() * escapePresets.length)];
            currentDisplayedTaskId = null;
            taskTitleElement.innerText = `休憩：${preset.title}`;
            messageElement.innerText = getManagerMessage("やる気迷子やな？リフレッシュしよか、{name}。");
        }
    }
}

function solvePuzzle() {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    
    savedData = savedData.filter(item => !(item.type === 'event' && item.start <= currentTimeStr));
    localStorage.setItem('myManagerData', JSON.stringify(savedData));

    const events = savedData.filter(d => d.type === 'event').sort((a, b) => a.start.localeCompare(b.start));
    const tasks = savedData.filter(d => d.type === 'task' && !d.completed).sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
    });

    const nextEvent = events.find(e => e.start > currentTimeStr);
    let gapMinutes = 999; 
    if (nextEvent) {
        const [startH, startM] = nextEvent.start.split(':').map(Number);
        gapMinutes = (startH * 60 + startM) - (now.getHours() * 60 + now.getMinutes());
    }

    let possibleTasks = tasks.filter(t => parseInt(t.duration) <= gapMinutes);
    const taskTitleElement = document.getElementById('current-task');
    const messageElement = document.getElementById('message');

    if (possibleTasks.length > 0) {
        const nextTask = possibleTasks[0];
        currentDisplayedTaskId = nextTask.id; 
        taskTitleElement.innerText = `次はこれ：${nextTask.title}`;
        messageElement.innerText = getManagerMessage(nextEvent 
            ? `${nextEvent.start}から「${nextEvent.title}」やろ？それまでこれ片付けよか！` 
            : "今は予定空いてるな。期限近い順に終わらせてこか！");
    } else if (tasks.length > 0) {
        currentDisplayedTaskId = null;
        taskTitleElement.innerText = "次はこれ：(合うタスクがないわ)";
        messageElement.innerText = getManagerMessage("隙間時間にできる小粒なタスク、登録してみる？");
    } else {
        currentDisplayedTaskId = null;
        taskTitleElement.innerText = "次はこれ：タスクなし";
        messageElement.innerText = getManagerMessage("やるべきことは全部終わったん？やるやん、{name}！");
    }
    updateProgress();
    updateUI();
}

function updateProgress() {
    const savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = savedData.filter(d => d.type === 'task' && d.deadline === todayStr);
    const completedToday = todayTasks.filter(d => d.completed).length;
    document.getElementById('progress-text').innerText = `${completedToday} / ${todayTasks.length}`;
    const percentage = todayTasks.length === 0 ? 0 : (completedToday / todayTasks.length) * 100;
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}

function updateUI() {
    const settings = getSettings();
    const imgElement = document.querySelector('.manager-img');
    if (imgElement) {
        imgElement.src = settings.managerImg;
    }
}

function showSchedule() {
    const listArea = document.getElementById('schedule-list');
    listArea.innerHTML = "";
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    const displayData = savedData.filter(item => !(item.type === 'task' && item.completed));
    displayData.sort((a, b) => {
        if (a.type === 'event' && b.type === 'event') return a.start.localeCompare(b.start);
        if (a.type === 'task' && b.type === 'task') {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return a.deadline.localeCompare(b.deadline);
        }
        return a.type === 'event' ? -1 : 1;
    });
    displayData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        const isEvent = item.type === 'event';
        div.innerHTML = `
            <div class="item-info">
                <span class="item-type ${isEvent ? 'type-e' : 'type-t'}">${isEvent ? '予定' : 'タスク'}</span>
                <strong>${item.title}</strong><br>
                <small>${isEvent ? item.start + '〜' + item.end : item.duration + '分 (締切:' + (item.deadline || 'なし') + ')'}</small>
            </div>
            <button class="btn-delete" onclick="deleteItem(${item.id})">消す</button>
        `;
        listArea.appendChild(div);
    });
    document.getElementById('schedule-modal').classList.remove('hidden');
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
}

function deleteItem(id) {
    if (!confirm("これ消してええの？")) return;
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    localStorage.setItem('myManagerData', JSON.stringify(savedData.filter(d => d.id !== id)));
    showSchedule();
    solvePuzzle();
}

window.onload = solvePuzzle;
setInterval(solvePuzzle, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") solvePuzzle(); });