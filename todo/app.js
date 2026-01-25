// State
let state = {
    todos: [],
    filter: 'all',
    editingId: null
};

// DOM Elements
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const actionsBar = document.getElementById('actionsBar');
const totalTasks = document.getElementById('totalTasks');
const activeTasks = document.getElementById('activeTasks');
const completedTasks = document.getElementById('completedTasks');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    renderTodos();
    updateStats();

    // Enter key to add todo
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add new todo
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todo = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: Date.now()
    };

    state.todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateStats();

    todoInput.value = '';
    todoInput.focus();
}

// Toggle todo completion
function toggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

// Start editing todo
function startEdit(id) {
    state.editingId = id;
    renderTodos();
}

// Save edit
function saveEdit(id) {
    const input = document.getElementById('edit-' + id);
    const newText = input.value.trim();

    if (newText) {
        const todo = state.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            saveTodos();
        }
    }

    state.editingId = null;
    renderTodos();
}

// Cancel edit
function cancelEdit() {
    state.editingId = null;
    renderTodos();
}

// Delete todo
function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

// Set filter
function setFilter(filter) {
    state.filter = filter;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderTodos();
}

// Clear completed todos
function clearCompleted() {
    state.todos = state.todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
    updateStats();
}

// Get filtered todos
function getFilteredTodos() {
    switch (state.filter) {
        case 'active':
            return state.todos.filter(t => !t.completed);
        case 'completed':
            return state.todos.filter(t => t.completed);
        default:
            return state.todos;
    }
}

// Render todos
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    // Show/hide empty state
    if (filteredTodos.length === 0) {
        emptyState.classList.add('visible');
        todoList.innerHTML = '';

        // Update empty state message based on filter
        const emptyMessage = emptyState.querySelector('p');
        if (state.filter === 'active') {
            emptyMessage.textContent = 'No active todos. Great job!';
        } else if (state.filter === 'completed') {
            emptyMessage.textContent = 'No completed todos yet.';
        } else {
            emptyMessage.textContent = 'No todos yet! Add one above to get started.';
        }
    } else {
        emptyState.classList.remove('visible');

        todoList.innerHTML = filteredTodos.map(todo => {
            if (state.editingId === todo.id) {
                return renderEditItem(todo);
            }
            return renderTodoItem(todo);
        }).join('');
    }

    // Show/hide clear completed button
    const hasCompleted = state.todos.some(t => t.completed);
    actionsBar.classList.toggle('hidden', !hasCompleted);
}

// Render a single todo item
function renderTodoItem(todo) {
    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="checkbox" onclick="toggleTodo('${todo.id}')">
                <span class="checkbox-icon">✓</span>
            </div>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="action-btn edit-btn" onclick="startEdit('${todo.id}')" title="Edit">✎</button>
                <button class="action-btn delete-btn" onclick="deleteTodo('${todo.id}')" title="Delete">✕</button>
            </div>
        </div>
    `;
}

// Render edit mode for a todo item
function renderEditItem(todo) {
    return `
        <div class="todo-item" data-id="${todo.id}">
            <input type="text" id="edit-${todo.id}" class="edit-input" value="${escapeHtml(todo.text)}"
                   onkeypress="if(event.key === 'Enter') saveEdit('${todo.id}')"
                   onkeyup="if(event.key === 'Escape') cancelEdit()">
            <div class="todo-actions" style="opacity: 1;">
                <button class="action-btn save-btn" onclick="saveEdit('${todo.id}')" title="Save">✓</button>
                <button class="action-btn cancel-btn" onclick="cancelEdit()" title="Cancel">✕</button>
            </div>
        </div>
    `;
}

// Update statistics
function updateStats() {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.completed).length;
    const active = total - completed;

    totalTasks.textContent = total;
    activeTasks.textContent = active;
    completedTasks.textContent = completed;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todoAppTodos', JSON.stringify(state.todos));
}

// Load todos from localStorage
function loadTodos() {
    const saved = localStorage.getItem('todoAppTodos');
    if (saved) {
        try {
            state.todos = JSON.parse(saved);
        } catch (e) {
            state.todos = [];
        }
    }
}
