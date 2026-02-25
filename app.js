let currentDisplayedTaskId = null;

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

function getSettings() {
    const saved = localStorage.getItem('myManagerSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}

function getManagerMessage(baseText) {
    const settings = getSettings();
    return baseText.replace(/\{name\}/g, settings.userName);
}

function openSettings() {
    const settings = getSettings();
    document.getElementById('user-name-input').value = settings.userName;
    document.getElementById('manager-img-upload').value = "";
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
    const newSettings = { userName: nameInput, managerImg: imgData };
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

function registerData() {
    // 登録時に今日の日付をデフォルトでセット
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('event-date').value = today;
    document.getElementById('deadline').value = today;
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
        date: document.getElementById('event-date').value, // 予定の日付
        start: document.getElementById('start-time').value,
        end: document.getElementById('end-time').value,
        duration: document.getElementById('duration').value,
        deadline: document.getElementById('deadline').value, // タスクの期限
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
    const todayStr = new Date().toISOString().split('T')[0];
    // 今日が期限の未完了タスクから逃避先を探す
    const tasks = savedData.filter(d => d.type === 'task' && !d.completed && d.deadline === todayStr);
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
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let savedData = JSON.parse(localStorage.getItem('myManagerData') || '[]');
    
    // 過去の予定を自動削除
    savedData = savedData.filter(item => {
        if (item.type === 'event') {
            if (item.date < todayStr) return false;
            if (item.date === todayStr && item.end <= currentTimeStr) return false;
        }
        return true;
    });
    localStorage.setItem('myManagerData', JSON.stringify(savedData));

    // 今日の予定を抽出
    const todayEvents = savedData.filter(d => d.type === 'event' && d.date === todayStr)
                                 .sort((a, b) => a.start.localeCompare(b.start));
    
    // 【アップデート】未完了タスクをすべて抽出（当日だけでなく未来のものも含む）
    const allRemainingTasks = savedData.filter(d => d.type === 'task' && !d.completed)
                                       .sort((a, b) => a.deadline.localeCompare(b.deadline));

    const nextEvent = todayEvents.find(e => e.start > currentTimeStr);
    let gapMinutes = 999; 
    if (nextEvent) {
        const [startH, startM] = nextEvent.start.split(':').map(Number);
        gapMinutes = (startH * 60 + startM) - (now.getHours() * 60 + now.getMinutes());
    }

    // 次の予定までに終わるタスクを探す（期限が近い順）
    let possibleTasks = allRemainingTasks.filter(t => parseInt(t.duration) <= gapMinutes);
    const taskTitleElement = document.getElementById('current-task');
    const messageElement = document.getElementById('message');

    if (possibleTasks.length > 0) {
        const nextTask = possibleTasks[0];
        currentDisplayedTaskId = nextTask.id; 
        
        // 当日期限か未来期限かでメッセージを少し変える
        const isFutureTask = nextTask.deadline > todayStr;
        const taskPrefix = isFutureTask ? "先回り！：" : "次はこれ：";
        taskTitleElement.innerText = `${taskPrefix}${nextTask.title}`;
        
        let msg = nextEvent 
            ? `${nextEvent.start}から「${nextEvent.title}」やろ？それまでこれ片付けよか！` 
            : "今は予定空いてるな。どんどん進めてこか！";
        if (isFutureTask && !nextEvent) msg = "今日の分は終わったけど、これもやっとく？{name}、意識高いな！";
        
        messageElement.innerText = getManagerMessage(msg);
    } else if (allRemainingTasks.length > 0) {
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

    // 「今日のノルマ」＝期限が今日までのすべてのタスク（完了・未完了含む）
    const todayQuotaTasks = savedData.filter(d => d.type === 'task' && d.deadline === todayStr);
    const quotaCount = todayQuotaTasks.length;

    // 「今日の成果」＝今日完了させたすべてのタスク（未来のものを今日やった場合も含む）
    const completedToday = savedData.filter(d => d.type === 'task' && d.completed && d.completedAt === todayStr).length;
    
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const messageElement = document.getElementById('message');

    progressText.innerText = `${completedToday} / ${quotaCount}`;

    // 進捗率の計算（分母が0なら0%）
    let percentage = quotaCount === 0 ? (completedToday > 0 ? 100 : 0) : (completedToday / quotaCount) * 100;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;

    // 【アップデート】完了数が予定数を上回った時のご褒美演出
    if (completedToday > quotaCount && quotaCount > 0) {
        progressFill.style.backgroundColor = "#ff69b4"; // ピンク色に！
        messageElement.innerText = getManagerMessage("予定より進んでるやん！{name}、ほんまに偉すぎるで！");
    } else {
        progressFill.style.backgroundColor = "#4caf50"; // 通常の緑（CSSに合わせる）
    }
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

    // 日付順 -> 時刻/期限順にソート
    displayData.sort((a, b) => {
        const dateA = a.type === 'event' ? a.date : a.deadline;
        const dateB = b.type === 'event' ? b.date : b.deadline;
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        
        if (a.type === 'event' && b.type === 'event') return a.start.localeCompare(b.start);
        return a.type === 'event' ? -1 : 1;
    });

    displayData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        const isEvent = item.type === 'event';
        const dateLabel = isEvent ? item.date : item.deadline;
        div.innerHTML = `
            <div class="item-info">
                <span class="item-type ${isEvent ? 'type-e' : 'type-t'}">${isEvent ? '予定' : 'タスク'}</span>
                <strong>${item.title}</strong> [${dateLabel}]<br>
                <small>${isEvent ? item.start + '〜' + item.end : item.duration + '分'}</small>
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