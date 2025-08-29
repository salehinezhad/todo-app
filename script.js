// ==== Variables & DOM Elements ====
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.querySelector(".todo-list");
const searchInput = document.getElementById('searchInput');
const darkModeBtn = document.getElementById('darkModeBtn');
const filterButtons = document.querySelectorAll('.filter-btn');

const toDoArray = [];
let currentFilter = 'all';
let draggedItem = null;

// ==== Local Storage Functions ====
function setLocalStorage(data) {
    localStorage.setItem('todo', JSON.stringify(data));
}

function getToLocalstorage() {
    let savedTodos = JSON.parse(localStorage.getItem('todo'));
    if (savedTodos) {
        toDoArray.push(...savedTodos);
        renderByFilter();
    }
    todoGenerator(toDoArray);
}

// ==== Todo Render & Generator ====
function todoGenerator(data) {
    taskList.innerHTML = '';
    if (data.length === 0) {
        taskList.innerHTML = `<li class="todo-empty">No tasks yet!</li>`;
        return;
    }

    data.forEach(todo => {
        taskList.insertAdjacentHTML('beforeend',
            `<li class="todo-item" draggable="true" data-id="${todo.id}">
                <div class="todo-item__left">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} />
                    <span class="todo-item__text ${todo.completed ? 'completed' : ''}">${todo.title}</span>
                    <span class="todo-item__date ${todo.completed ? 'completed' : ''}">${todo.date} ${todo.time}</span> 
                </div>
                <div class="todo-item__actions">
                    <button class="btn-edit" onclick="editeTaske(${todo.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTaske(${todo.id})">Delete</button>
                </div>
            </li>`
        );
    });
}

function renderByFilter() {
    todoGenerator(getFilteredArray());
    updateCounts();
}

function renderTodos() {
    todoGenerator(getFilteredAndSearchedArray());
    updateCounts();
}

// ==== Add / Edit / Delete ====
function addNewTodo() {
    let newTodoTitle = taskInput.value.trim();
    if (newTodoTitle === '') return;

    let newTodoObj = {
        id: Date.now(),
        title: newTodoTitle,
        date: taskDate.value,
        time: taskTime.value,
        completed: false
    }

    taskInput.value = '';
    taskDate.value = '';
    taskTime.value = '';
    toDoArray.push(newTodoObj);
    setLocalStorage(toDoArray);
    renderByFilter();
    todoGenerator(toDoArray);
    taskInput.focus();
}

addTaskBtn.addEventListener('click', addNewTodo);

function deleteTaske(id) {
    const index = toDoArray.findIndex(todo => todo.id === id);
    if (index !== -1) {
        toDoArray.splice(index, 1);
        setLocalStorage(toDoArray);
        renderByFilter();
        todoGenerator(toDoArray);
    }
}

function editeTaske(id) {
    const li = taskList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    const textSpan = li.querySelector('.todo-item__text');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = textSpan.textContent;
    input.style.width = '30%';
    input.style.padding = '.3rem';

    let parentElementSpanText = li.querySelector('.todo-item__left');
    parentElementSpanText.replaceChild(input, textSpan);
    input.focus();

    function saveEdit() {
        const newValue = input.value.trim();
        if (newValue === '') {
            input.value = textSpan.textContent;
        } else {
            textSpan.textContent = newValue;
            const todo = toDoArray.find(todo => todo.id === id);
            if (todo) {
                todo.title = newValue;
                setLocalStorage(toDoArray);
            }
        }
        parentElementSpanText.replaceChild(textSpan, input);
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
    });
}

taskList.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('todo-item__text')) {
        const li = e.target.closest('li');
        const id = Number(li.dataset.id);
        editeTaske(id);
    }
});

// ==== Checkbox / Complete ====
taskList.addEventListener("change", function (e) {
    if (e.target.classList.contains("todo-checkbox")) {
        const checkbox = e.target;
        const li = checkbox.closest("li");
        const text = li.querySelector(".todo-item__text");
        const date = li.querySelector(".todo-item__date");

        if (checkbox.checked) {
            text.classList.add("completed");
            date.classList.add("completed");
        } else {
            text.classList.remove("completed");
            date.classList.remove("completed");
        }

        const todoId = toDoArray.find((todo) => todo.id === Number(li.dataset.id));
        if (todoId) {
            todoId.completed = checkbox.checked;
            setLocalStorage(toDoArray);
            renderByFilter();
            updateCounts();
        }
    }
});

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addNewTodo();
    }
});

// ==== Filter Section ====
function updateCounts() {
    document.querySelector('.count-all').textContent = toDoArray.length;
    document.querySelector('.count-active').textContent = toDoArray.filter(todo => !todo.completed).length;
    document.querySelector('.count-completed').textContent = toDoArray.filter(todo => todo.completed).length;
}

function getFilteredArray() {
    if (currentFilter === 'active') return toDoArray.filter(t => !t.completed);
    if (currentFilter === 'completed') return toDoArray.filter(t => t.completed);
    return toDoArray;
}

function filterTasks(filter) {
    currentFilter = filter;
    renderByFilter();
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterTasks(btn.dataset.filter);
    });
});


// ==== Search Section ====
function getFilteredAndSearchedArray() {
    let filteredArray = getFilteredArray();
    const searchValue = searchInput.value.trim().toLowerCase();
    if (searchValue !== '') {
        filteredArray = filteredArray.filter((todo) => {
            return todo.title.toLowerCase().includes(searchValue);
        });
    }
    return filteredArray;
}

searchInput.addEventListener('keyup', renderTodos);


// ==== Drag & Drop Section ====
taskList.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('todo-item')) {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
    }
});

taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(taskList, e.clientY);
    const draggable = draggedItem;
    if (!draggable) return;

    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
});

taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    draggedItem = null;

    const newOrder = [];
    taskList.querySelectorAll('.todo-item').forEach(li => {
        const id = Number(li.dataset.id);
        const todo = toDoArray.find(t => t.id === id);
        if (todo) newOrder.push(todo);
    });
    toDoArray.length = 0;
    toDoArray.push(...newOrder);
    setLocalStorage(toDoArray);
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return {
                offset: offset,
                element: child
            };
        } else {
            return closest;
        }
    }, {
        offset: Number.NEGATIVE_INFINITY
    }).element;
}

// ==== Dark Mode Section ====
if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = 'Light Mode';
} else {
    darkModeBtn.textContent = 'Dark Mode';
}

darkModeBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        darkModeBtn.textContent = 'Dark Mode';
        localStorage.removeItem('darkMode');
    } else {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = 'Light Mode';
        localStorage.setItem('darkMode', '1');
    }
});


// ==== Notification / Reminder ====
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

setInterval(() => {
    const now = Date.now();
    toDoArray.forEach((task) => {
        if (task.date && task.time && !task.completed) {
            const reminderTime = new Date(`${task.date}T${task.time}`).getTime();
            if (reminderTime - now <= 60000 && reminderTime - now > 0) {
                new Notification("⏰Reminder", {
                    body: `The task "${task.title}" is coming up!`,
                });
                task.completed = false;
                setLocalStorage(toDoArray);
            }
        }
    });
}, 5000);


// ==== Window Load ====
window.addEventListener('load', getToLocalstorage);