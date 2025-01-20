let reverseOrder = false;
let draggedItem = null;
let editingTaskId = null;
let deletingTaskId = null; // 削除するタスクのIDを保存
let startY = 0;
let currentIndex = null;
let deletedTasks = []; // 削除されたタスクの保存用

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
window.addEventListener('load', setViewportHeight);

function addTask(event) {
    event.preventDefault();
    const taskInput = document.getElementById("new-task");
    const taskList = document.getElementById("task-list");
    const taskId = `task${Date.now()}`;

    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.addEventListener("dragstart", dragStart);
    li.addEventListener("dragover", allowDrop);
    li.addEventListener("drop", drop);

    // タッチイベントの追加
    li.addEventListener("touchstart", touchStart, { passive: false });
    li.addEventListener("touchmove", touchMove, { passive: false });
    li.addEventListener("touchend", touchEnd);

    li.innerHTML = `
        <label for="${taskId}">${taskInput.value}</label>
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask('${taskId}')" title="編集">
                <span class="material-icons">edit</span>
            </button>
            <button class="delete-btn" onclick="showDeleteModal('${taskId}')" title="削除">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;

    li.setAttribute("id", taskId);

    if (reverseOrder) {
        taskList.prepend(li);
    } else {
        taskList.appendChild(li);
    }
    taskInput.value = "";

    // テキストエリアの高さをリセット
    autoResizeTextarea(taskInput);
}

function touchStart(event) {
    // タッチがボタン上で始まった場合は何もしない
    if (event.target.closest('button')) {
        return;
    }
    event.preventDefault();
    draggedItem = event.currentTarget;
    startY = event.touches[0].clientY;
    currentIndex = Array.from(draggedItem.parentNode.children).indexOf(draggedItem);
    draggedItem.classList.add("dragging");
}

function touchMove(event) {
    if (!draggedItem) return;
    event.preventDefault();
    const touchY = event.touches[0].clientY;

    const items = Array.from(draggedItem.parentNode.children);
    const overElement = document.elementFromPoint(event.touches[0].clientX, touchY);
    const overLi = overElement ? overElement.closest('li') : null;

    if (overLi && overLi !== draggedItem && overLi.parentNode === draggedItem.parentNode) {
        const newIndex = items.indexOf(overLi);
        const parent = draggedItem.parentNode;
        parent.removeChild(draggedItem);
        if (newIndex > currentIndex) {
            parent.insertBefore(draggedItem, items[newIndex].nextSibling);
        } else {
            parent.insertBefore(draggedItem, items[newIndex]);
        }
        currentIndex = newIndex;
    }
}

function touchEnd(event) {
    if (!draggedItem) return;
    event.preventDefault();
    draggedItem.classList.remove("dragging");
    draggedItem = null;
    startY = 0;
    currentIndex = null;
}

function editTask(taskId) {
    editingTaskId = taskId;
    const taskLabel = document.querySelector(`label[for="${taskId}"]`);
    const editInput = document.getElementById("edit-task-input");
    editInput.value = taskLabel.textContent;
    document.getElementById("edit-modal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
    editingTaskId = null;
}

function saveTask() {
    if (editingTaskId) {
        const taskLabel = document.querySelector(`label[for="${editingTaskId}"]`);
        const editInput = document.getElementById("edit-task-input");
        taskLabel.textContent = editInput.value;
        closeEditModal();
    }
}

function showDeleteModal(taskId) {
    deletingTaskId = taskId;
    document.getElementById("delete-modal").style.display = "block";
}

function closeDeleteModal() {
    document.getElementById("delete-modal").style.display = "none";
    deletingTaskId = null;
}

function confirmDeleteTask() {
    if (!deletingTaskId) return;

    const taskItem = document.getElementById(deletingTaskId);
    const taskLabel = taskItem.querySelector('label').textContent;

    // 削除アニメーション
    taskItem.classList.add('fade-out');
    setTimeout(() => {
        // タスクを削除リストに移動
        const trashList = document.getElementById('trash-list');
        taskItem.classList.remove('fade-out');
        taskItem.querySelector('.task-actions').innerHTML = `
            <button class="restore-btn" onclick="restoreTask('${deletingTaskId}')" title="復元">
                <span class="material-icons">restore</span>
            </button>
            <button class="permanent-delete-btn" onclick="permanentDeleteTask('${deletingTaskId}')" title="完全に削除">
                <span class="material-icons">delete_forever</span>
            </button>
        `;
        trashList.appendChild(taskItem);
        // ゴミ箱に追加
        deletedTasks.push({ id: deletingTaskId, content: taskLabel });

        // モーダルを閉じる
        closeDeleteModal();
    }, 500); // アニメーション時間に合わせる
}

function restoreTask(taskId) {
    const taskItem = document.getElementById(taskId);
    const taskList = document.getElementById('task-list');

    // タスクを元のリストに復元
    taskItem.querySelector('.task-actions').innerHTML = `
        <button class="edit-btn" onclick="editTask('${taskId}')" title="編集">
            <span class="material-icons">edit</span>
        </button>
        <button class="delete-btn" onclick="showDeleteModal('${taskId}')" title="削除">
            <span class="material-icons">delete</span>
        </button>
    `;

    if (reverseOrder) {
        taskList.prepend(taskItem);
    } else {
        taskList.appendChild(taskItem);
    }

    // ゴミ箱から削除
    deletedTasks = deletedTasks.filter(task => task.id !== taskId);
}

function permanentDeleteTask(taskId) {
    const taskItem = document.getElementById(taskId);

    // 完全に削除アニメーション
    taskItem.classList.add('fade-out');
    setTimeout(() => {
        taskItem.remove();
        // ゴミ箱から削除
        deletedTasks = deletedTasks.filter(task => task.id !== taskId);
    }, 500);
}

function toggleOrder() {
    reverseOrder = !reverseOrder;
    const orderStatus = document.getElementById("order-status");
    orderStatus.textContent = reverseOrder ? "現在: 逆順" : "現在: 順序";
    // 既存のタスクの順序は変更しない
}

function dragStart(event) {
    draggedItem = event.target;
    event.target.classList.add("dragging");
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const taskList = document.getElementById("task-list");
    const target = event.target.closest("li");

    if (draggedItem && target && draggedItem !== target) {
        const children = Array.from(taskList.children);
        const draggedIndex = children.indexOf(draggedItem);
        const targetIndex = children.indexOf(target);

        taskList.removeChild(draggedItem);

        if (targetIndex > draggedIndex) {
            taskList.insertBefore(draggedItem, target.nextSibling);
        } else {
            taskList.insertBefore(draggedItem, target);
        }
    }

    draggedItem.classList.remove("dragging");
    draggedItem = null;
}

// モーダル外をクリックしたときに閉じる
window.onclick = function(event) {
    const editModal = document.getElementById("edit-modal");
    const deleteModal = document.getElementById("delete-modal");
    const trashModal = document.getElementById("trash-modal");

    if (event.target == editModal) {
        closeEditModal();
    }
    if (event.target == deleteModal) {
        closeDeleteModal();
    }
    if (event.target == trashModal) {
        closeTrashModal();
    }
}

// ゴミ箱モーダルを開く
function openTrashModal() {
    const trashModal = document.getElementById("trash-modal");
    trashModal.style.display = "block";
}

// ゴミ箱モーダルを閉じる
function closeTrashModal() {
    const trashModal = document.getElementById("trash-modal");
    trashModal.style.display = "none";
}

// ボタンのタッチイベントが親要素に伝播しないようにする
document.addEventListener('touchstart', function(event) {
    if (event.target.closest('button')) {
        event.stopPropagation();
    }
}, { passive: false });

// テキストエリアの自動リサイズ関数
function autoResizeTextarea(element) {
    element.style.height = 'auto';
    const computedStyles = window.getComputedStyle(element);
    const maxHeight = parseFloat(computedStyles.getPropertyValue('max-height'));
    const scrollHeight = element.scrollHeight;

    if (scrollHeight <= maxHeight) {
        element.style.height = scrollHeight + 'px';
    } else {
        element.style.height = maxHeight + 'px';
    }
}

// イベントリスナーの追加
const newTaskTextarea = document.getElementById('new-task');
newTaskTextarea.addEventListener('input', function() {
    autoResizeTextarea(this);
});

// ページ読み込み時に初期化
window.addEventListener('load', function() {
    autoResizeTextarea(newTaskTextarea);
});
