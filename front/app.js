const API_URL = window.API_URL || 'http://localhost:8081/api';

let categories = [];
let tasks = [];
let activeCategoryId = 'all';
let currentUser = null;

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function setUser(username) {
  localStorage.setItem('username', username);
  currentUser = username;
}

function getUser() {
  return localStorage.getItem('username');
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  currentUser = null;
}

function isAuthenticated() {
  return !!getToken();
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    logout();
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  return res;
}

async function login(username, password) {
  const res = await apiFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Credenciales inválidas');
  }

  const data = await res.json();
  setToken(data.token);
  setUser(data.username);
  return data;
}

async function register(username, email, password) {
  const res = await apiFetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Error al registrar');
  }

  const data = await res.json();
  setToken(data.token);
  setUser(data.username);
  return data;
}

function logout() {
  clearAuth();
  showAuthSection();
}

// --- Auth UI ---
function showAuthSection() {
  document.getElementById('auth-section').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('user-info').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('sidebar').style.display = 'flex';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('user-info').style.display = 'flex';
  document.getElementById('username-display').textContent = getUser();
}

// --- API calls ---
async function fetchCategories() {
  const res = await apiFetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error('Error al cargar categorías');
  return res.json();
}

async function fetchTasks(categoryId = null) {
  const url = categoryId && categoryId !== 'all'
    ? `${API_URL}/tasks?categoryId=${categoryId}`
    : `${API_URL}/tasks`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Error al cargar tareas');
  return res.json();
}

async function createCategory(dto) {
  const res = await apiFetch(`${API_URL}/categories`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function updateCategory(id, dto) {
  const res = await apiFetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function deleteCategoryApi(id) {
  const res = await apiFetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function createTask(dto) {
  const res = await apiFetch(`${API_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function updateTask(id, dto) {
  const res = await apiFetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function deleteTaskApi(id) {
  const res = await apiFetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function toggleTask(id, currentEstado) {
  const newEstado = currentEstado === 'done' ? 'pending' : 'done';
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;
  const res = await apiFetch(`${API_URL}/tasks/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: task.nombre,
      descripcion: task.descripcion,
      estado: newEstado,
      fechaLimite: task.fechaLimite,
      priority: task.priority,
      categoriaId: task.categoriaId,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

// --- State loading ---
async function loadCategories() {
  try {
    categories = await fetchCategories();
  } catch (err) {
    console.error(err);
    categories = [];
  }
}

async function loadTasks() {
  try {
    if (activeCategoryId === 'all') {
      tasks = await fetchTasks();
    } else {
      tasks = await fetchTasks(activeCategoryId);
    }
  } catch (err) {
    console.error(err);
    tasks = [];
  }
}

// --- Render ---
function renderCategories() {
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  const allItem = document.createElement('li');
  allItem.className = `category-item${activeCategoryId === 'all' ? ' active' : ''}`;
  allItem.innerHTML = `<span onclick="selectCategory('all')">Todas las tareas</span>`;
  list.appendChild(allItem);

  categories.forEach(cat => {
    const li = document.createElement('li');
    li.className = `category-item${String(cat.id) === String(activeCategoryId) ? ' active' : ''}`;
    li.innerHTML = `
      <span onclick="selectCategory('${cat.id}')">${escapeHtml(cat.nombre)}</span>
      <div class="category-actions">
        <button onclick="editCategory('${cat.id}')" title="Editar">✏️</button>
        <button onclick="handleDeleteCategory('${cat.id}')" title="Eliminar">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function renderTasks() {
  const container = document.getElementById('task-list');
  const title = document.getElementById('current-category-title');
  const addBtn = document.getElementById('btn-add-task');
  container.innerHTML = '';

  if (activeCategoryId === 'all') {
    title.textContent = 'Todas las tareas';
    addBtn.style.display = 'none';
  } else {
    const category = categories.find(c => String(c.id) === String(activeCategoryId));
    if (!category) {
      activeCategoryId = 'all';
      renderCategories();
      renderTasks();
      return;
    }
    title.textContent = category.nombre;
    addBtn.style.display = 'inline-block';
  }

  if (tasks.length === 0) {
    const msg = activeCategoryId === 'all'
      ? 'No hay tareas. ¡Crea una nueva!'
      : 'No hay tareas en esta categoría. ¡Crea una nueva!';
    container.innerHTML = `<div class="empty-state"><p>${msg}</p></div>`;
    return;
  }

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = `task-card${task.estado === 'done' ? ' done' : ''}`;

    const dueDate = task.fechaLimite ? formatDate(task.fechaLimite) : 'Sin fecha';
    const cat = categories.find(c => c.id === task.categoriaId);
    const catName = cat ? cat.nombre : 'Sin categoría';
    const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Baja' };
    const priorityClass = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    const priority = task.priority || 'medium';

    card.innerHTML = `
      <input type="checkbox" class="task-toggle" ${task.estado === 'done' ? 'checked' : ''} onchange="handleToggleTask('${task.id}')">
      <div class="task-info">
        <div class="task-name">${escapeHtml(task.nombre)}</div>
        ${task.descripcion ? `<div class="task-description">${escapeHtml(task.descripcion)}</div>` : ''}
        <div class="task-meta">
          <span class="priority-badge ${priorityClass[priority]}">${priorityLabels[priority]}</span>
          <span>📅 ${dueDate}</span>
          ${activeCategoryId === 'all' ? `<span>📁 ${escapeHtml(catName)}</span>` : ''}
          <span>${task.estado === 'done' ? '✅ Hecho' : '⏳ Sin hacer'}</span>
        </div>
      </div>
      <div class="task-actions">
        <button onclick="editTask('${task.id}')" title="Editar">✏️</button>
        <button class="delete" onclick="handleDeleteTask('${task.id}')" title="Eliminar">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Actions ---
async function selectCategory(id) {
  activeCategoryId = id === 'all' ? 'all' : Number(id);
  renderCategories();
  await loadTasks();
  renderTasks();
}

function openCategoryModal(id = null) {
  const modal = document.getElementById('category-modal');
  const form = document.getElementById('category-form');
  const title = document.getElementById('category-modal-title');
  const nameInput = document.getElementById('category-name');
  const idInput = document.getElementById('category-id');

  form.reset();
  idInput.value = '';

  if (id) {
    const cat = categories.find(c => c.id === Number(id));
    if (cat) {
      title.textContent = 'Editar Categoría';
      nameInput.value = cat.nombre;
      idInput.value = cat.id;
    }
  } else {
    title.textContent = 'Nueva Categoría';
  }

  modal.style.display = 'flex';
  nameInput.focus();
}

function closeCategoryModal() {
  document.getElementById('category-modal').style.display = 'none';
}

function openTaskModal(id = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const title = document.getElementById('task-modal-title');
  const nameInput = document.getElementById('task-name');
  const descInput = document.getElementById('task-description');
  const dateInput = document.getElementById('task-due-date');
  const priorityInput = document.getElementById('task-priority');
  const idInput = document.getElementById('task-id');

  form.reset();
  idInput.value = '';

  if (id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (task) {
      title.textContent = 'Editar Tarea';
      nameInput.value = task.nombre;
      descInput.value = task.descripcion || '';
      dateInput.value = task.fechaLimite || '';
      priorityInput.value = task.priority || 'medium';
      idInput.value = task.id;
    }
  } else {
    title.textContent = 'Nueva Tarea';
  }

  modal.style.display = 'flex';
  nameInput.focus();
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
}

async function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById('category-id').value;
  const nombre = document.getElementById('category-name').value.trim();
  if (!nombre) return;

  try {
    if (id) {
      await updateCategory(id, { nombre });
    } else {
      await createCategory({ nombre });
    }
    closeCategoryModal();
    await loadCategories();
    renderCategories();
  } catch (err) {
    alert(err.message);
  }
}

async function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const nombre = document.getElementById('task-name').value.trim();
  const descripcion = document.getElementById('task-description').value.trim();
  const fechaLimite = document.getElementById('task-due-date').value;
  const prioridad = document.getElementById('task-priority').value;

  if (!nombre || !fechaLimite) return;

  try {
    if (id) {
      const task = tasks.find(t => String(t.id) === String(id));
      await updateTask(task.id, {
        nombre,
        descripcion,
        estado: task.estado,
        fechaLimite,
        priority: prioridad,
        categoriaId: task.categoriaId,
      });
    } else {
      if (!activeCategoryId || activeCategoryId === 'all') {
        alert('Selecciona una categoría antes de crear una tarea.');
        return;
      }
      await createTask({
        nombre,
        descripcion,
        estado: 'pending',
        fechaLimite,
        priority: prioridad,
        categoriaId: activeCategoryId,
      });
    }
    closeTaskModal();
    await loadTasks();
    renderTasks();
  } catch (err) {
    alert(err.message);
  }
}

function editCategory(id) {
  openCategoryModal(id);
}

async function handleDeleteCategory(id) {
  const cat = categories.find(c => String(c.id) === String(id));
  if (!cat) return;
  if (!confirm(`¿Eliminar "${cat.nombre}"?`)) return;

  try {
    await deleteCategoryApi(id);
    categories = categories.filter(c => String(c.id) !== String(id));
    if (String(activeCategoryId) === String(id)) {
      activeCategoryId = 'all';
    }
    renderCategories();
    await loadTasks();
    renderTasks();
  } catch (err) {
    alert(err.message);
  }
}

async function handleToggleTask(id) {
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;

  try {
    await toggleTask(id, task.estado);
    await loadTasks();
    renderTasks();
  } catch (err) {
    alert(err.message);
  }
}

function editTask(id) {
  openTaskModal(id);
}

async function handleDeleteTask(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;

  try {
    await deleteTaskApi(id);
    await loadTasks();
    renderTasks();
  } catch (err) {
    alert(err.message);
  }
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁';
  }
}

// --- Event listeners ---
document.getElementById('btn-add-category').addEventListener('click', () => openCategoryModal());
document.getElementById('btn-add-task').addEventListener('click', () => openTaskModal());
document.getElementById('category-form').addEventListener('submit', saveCategory);
document.getElementById('task-form').addEventListener('submit', saveTask);

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

// --- Auth form handling ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    await login(username, password);
    await initApp();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    await register(username, email, password);
    await initApp();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').parentElement.style.display = 'none';
  document.getElementById('register-card').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-card').style.display = 'none';
  document.getElementById('login-form').parentElement.style.display = 'block';
});

document.getElementById('btn-logout').addEventListener('click', logout);

// --- Init ---
async function initApp() {
  if (isAuthenticated()) {
    showApp();
    await loadCategories();
    await loadTasks();
    renderCategories();
    renderTasks();
  } else {
    showAuthSection();
  }
}

initApp();
