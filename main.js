// Native date difference functions
function differenceInDays(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function differenceInHours(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60));
}

function differenceInMinutes(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60));
}

function differenceInSeconds(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / 1000);
}

// State management
let state = {
    goal: '',
    targetDate: null,
    goalCreatedAt: null,
    tasks: [],
    doneTasks: []
};

// DOM Elements
const elements = {
    countdown: document.getElementById('countdown'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    goalTitle: document.getElementById('goalTitle'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    todoList: document.getElementById('todoList'),
    doneList: document.getElementById('doneList'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    taskModal: document.getElementById('taskModal'),
    taskInput: document.getElementById('taskInput'),
    taskDescription: document.getElementById('taskDescription'),
    saveTaskBtn: document.getElementById('saveTaskBtn'),
    closeTaskBtn: document.getElementById('closeTaskBtn'),
    goalInput: document.getElementById('goalInput'),
    dateInput: document.getElementById('dateInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    listsContainer: document.querySelector('.lists-container'),
    prevList: document.getElementById('prevList'),
    nextList: document.getElementById('nextList'),
    activityMatrix: document.getElementById('activityMatrix'),
    activityStats: document.getElementById('activityStats'),
    activityTooltip: document.getElementById('activityTooltip')
};

let currentTaskIndex = null;
let currentTaskList = null;

// Initialize the extension
async function init() {
    await loadState();
    updateUI();
    setupEventListeners();
    startCountdownTimer();
}

// Load state from Chrome storage
async function loadState() {
    try {
        const data = await chrome.storage.sync.get(['goalState']);
        if (data.goalState) {
            const loadedState = JSON.parse(data.goalState);
            state = {
                goal: loadedState.goal || '',
                targetDate: loadedState.targetDate ? new Date(loadedState.targetDate) : null,
                goalCreatedAt: loadedState.goalCreatedAt ? new Date(loadedState.goalCreatedAt) : null,
                tasks: Array.isArray(loadedState.tasks) ? loadedState.tasks : [],
                doneTasks: Array.isArray(loadedState.doneTasks) ? loadedState.doneTasks : []
            };
        }
    } catch (error) {
        console.error('Error loading state:', error);
        // Initialize with default state if loading fails
        state = {
            goal: '',
            targetDate: null,
            goalCreatedAt: null,
            tasks: [],
            doneTasks: []
        };
    }
}

// Save state to Chrome storage
async function saveState() {
    try {
        const saveData = {
            ...state,
            targetDate: state.targetDate ? state.targetDate.toISOString() : null,
            goalCreatedAt: state.goalCreatedAt ? state.goalCreatedAt.toISOString() : null
        };
        await chrome.storage.sync.set({ goalState: JSON.stringify(saveData) });
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

// Update UI elements
function updateUI() {
    if (state.goal && state.targetDate) {
        const daysLeft = getDaysLeft();
        elements.goalTitle.textContent = `${state.goal}`;
        updateCountdown();
    } else {
        elements.goalTitle.textContent = 'Click to set your goal...';
        resetCountdown();
    }

    updateTaskLists();
    updateActivityMatrix();
}

// Get days left
function getDaysLeft() {
    if (!state.targetDate) return '--';
    const now = new Date();
    const targetDate = new Date(state.targetDate);
    return Math.max(0, differenceInDays(targetDate, now));
}

// Reset countdown display
function resetCountdown() {
    elements.days.textContent = '--';
    elements.hours.textContent = '--';
    elements.minutes.textContent = '--';
    elements.seconds.textContent = '--';
}

// Update countdown timer
function updateCountdown() {
    if (!state.targetDate) return;

    const now = new Date();
    const targetDate = new Date(state.targetDate);

    if (now >= targetDate) {
        resetCountdown();
        return;
    }

    const days = differenceInDays(targetDate, now);
    const hours = differenceInHours(targetDate, now) % 24;
    const minutes = differenceInMinutes(targetDate, now) % 60;
    const seconds = differenceInSeconds(targetDate, now) % 60;

    elements.days.textContent = String(days).padStart(2, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
}

// Start countdown timer
function startCountdownTimer() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Task management
function createTask(title, description = '') {
    return {
        title,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

function updateTask(task, updates) {
    return {
        ...task,
        ...updates,
        updatedAt: Date.now()
    };
}

function sortTasksByUpdated(tasks) {
    return [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);
}

function createTaskElement(task, index, isDone) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.list = isDone ? 'done' : 'todo';
    
    const title = document.createElement('h3');
    title.textContent = task.title;
    div.appendChild(title);

    if (task.description) {
        const desc = document.createElement('p');
        desc.textContent = task.description;
        div.appendChild(desc);
    }

    // Add timestamp
    const timeInfo = document.createElement('div');
    timeInfo.className = 'task-time';
    const timeAgo = getTimeAgo(task.updatedAt);
    timeInfo.textContent = `Updated ${timeAgo}`;
    div.appendChild(timeInfo);

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('click', () => openTaskDetails(task, index, isDone));

    return div;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Format the date and time
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });

    // If it's today, show just the time
    if (days === 0 && date.getDate() === new Date().getDate()) {
        return `Today at ${timeStr}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (days === 1 || (days === 0 && date.getDate() === new Date().getDate() - 1)) {
        return `Yesterday at ${timeStr}`;
    }

    // Otherwise show the full date and time
    return `${dateStr} at ${timeStr}`;
}

function updateTaskLists() {
    if (!elements.todoList || !elements.doneList) return;

    elements.todoList.innerHTML = '';
    elements.doneList.innerHTML = '';

    // Sort tasks by last updated time
    const sortedTasks = sortTasksByUpdated(state.tasks);
    const sortedDoneTasks = sortTasksByUpdated(state.doneTasks);

    sortedTasks.forEach((task) => {
        // Find original index in unsorted array
        const originalIndex = state.tasks.findIndex(t => t === task);
        const taskElement = createTaskElement(task, originalIndex, false);
        elements.todoList.appendChild(taskElement);
    });

    sortedDoneTasks.forEach((task) => {
        // Find original index in unsorted array
        const originalIndex = state.doneTasks.findIndex(t => t === task);
        const taskElement = createTaskElement(task, originalIndex, true);
        elements.doneList.appendChild(taskElement);
    });
}

function openTaskDetails(task = null, index = null, isDone = false) {
    currentTaskIndex = index;
    currentTaskList = isDone ? 'done' : 'todo';
    
    if (task) {
        elements.taskInput.value = task.title;
        elements.taskDescription.value = task.description || '';
    } else {
        elements.taskInput.value = '';
        elements.taskDescription.value = '';
    }
    
    elements.taskModal.classList.add('show');
    setTimeout(() => elements.taskInput.focus(), 100);
}

function handleTaskKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveTask();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        closeTaskModal();
    }
}

function saveTask() {
    const title = elements.taskInput.value.trim();
    const description = elements.taskDescription.value.trim();
    
    if (!title) return;

    if (currentTaskIndex !== null) {
        const taskList = currentTaskList === 'done' ? state.doneTasks : state.tasks;
        const existingTask = taskList[currentTaskIndex];
        taskList[currentTaskIndex] = updateTask(existingTask, { title, description });
    } else {
        state.tasks.push(createTask(title, description));
    }

    saveState();
    updateTaskLists();
    closeTaskModal();
}

function deleteTask() {
    if (currentTaskIndex === null) return;
    
    const taskList = currentTaskList === 'done' ? state.doneTasks : state.tasks;
    if (Array.isArray(taskList)) {
        taskList.splice(currentTaskIndex, 1);
    }
    
    saveState();
    updateUI();
    closeTaskModal();
}

function closeTaskModal() {
    elements.taskModal.classList.remove('show');
    currentTaskIndex = null;
    currentTaskList = null;
}

// Drag and Drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({
        index: e.target.dataset.index,
        list: e.target.dataset.list
    }));
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const taskList = e.target.closest('.task-list');
    if (taskList && !taskList.contains(e.relatedTarget)) {
        taskList.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (!taskList) return;

    taskList.classList.remove('drag-over');
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const sourceList = data.list === 'todo' ? state.tasks : state.doneTasks;
    const targetList = taskList.id === 'todoList' ? state.tasks : state.doneTasks;
    
    if (sourceList === targetList) return;

    const task = sourceList[data.index];
    if (task) {
        // Add completion timestamp when moving to done list
        if (taskList.id === 'doneList') {
            task.completedAt = Date.now();
            task.updatedAt = Date.now();
        } else if (taskList.id === 'todoList') {
            // Remove completion timestamp when moving back to todo
            delete task.completedAt;
            task.updatedAt = Date.now();
        }
        
        sourceList.splice(data.index, 1);
        targetList.push(task);
        saveState();
        updateTaskLists();
        updateActivityMatrix();
    }
}

function toggleListView() {
    elements.listsContainer.classList.toggle('show-done');
}

// Settings management
function openSettings() {
    if (state.goal) elements.goalInput.value = state.goal;
    if (state.targetDate) elements.dateInput.value = new Date(state.targetDate).toISOString().slice(0, 16);
    elements.settingsModal.classList.add('show');
}

function closeSettings() {
    elements.settingsModal.classList.remove('show');
}

function saveSettings() {
    const newGoal = elements.goalInput.value.trim();
    const newDate = elements.dateInput.value;

    if (newGoal && newDate) {
        // Set goal creation date if this is a new goal
        if (!state.goal || state.goal !== newGoal) {
            state.goalCreatedAt = new Date();
        }
        
        state.goal = newGoal;
        state.targetDate = new Date(newDate);
        saveState();
        updateUI();
        closeSettings();
    }
}

function moveTask(taskElement, fromList, toList) {
    const index = parseInt(taskElement.dataset.index);
    const sourceList = fromList === 'todo' ? state.tasks : state.doneTasks;
    const targetList = toList === 'todo' ? state.tasks : state.doneTasks;
    
    const task = sourceList[index];
    if (task) {
        // Update the task's timestamp when moved
        const updatedTask = updateTask(task, {});
        
        // Add completion timestamp when moving to done list
        if (toList === 'done') {
            updatedTask.completedAt = Date.now();
        } else if (toList === 'todo') {
            // Remove completion timestamp when moving back to todo
            delete updatedTask.completedAt;
        }
        
        sourceList.splice(index, 1);
        targetList.push(updatedTask);
        saveState();
        updateTaskLists();
        updateActivityMatrix();
    }
}

function setupMobileTaskHandling() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'task-move-feedback';
    document.body.appendChild(feedback);

    let touchStartX = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50;
    const TAP_THRESHOLD = 500;

    function handleTouchStart(e, taskElement) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        taskElement.classList.add('being-moved');
    }

    function handleTouchEnd(e, taskElement) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        const swipeDistance = touchEndX - touchStartX;
        
        taskElement.classList.remove('being-moved');

        const isTap = Math.abs(swipeDistance) < SWIPE_THRESHOLD && touchDuration < TAP_THRESHOLD;
        const isSwipe = Math.abs(swipeDistance) > SWIPE_THRESHOLD;

        if (isTap || isSwipe) {
            const currentList = taskElement.closest('.task-list').id === 'todoList' ? 'todo' : 'done';
            const targetList = currentList === 'todo' ? 'done' : 'todo';
            
            // Show feedback
            feedback.textContent = `Moving to ${targetList === 'todo' ? 'To-Do' : 'Done'}`;
            feedback.classList.add('visible');
            
            // Switch view and move task
            elements.listsContainer.classList.toggle('show-done');
            setTimeout(() => {
                moveTask(taskElement, currentList, targetList);
                feedback.classList.remove('visible');
            }, 300);
        }
    }

    function handleTouchMove(e, taskElement) {
        const touchCurrentX = e.touches[0].clientX;
        const swipeDistance = touchCurrentX - touchStartX;
        
        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
            e.preventDefault(); // Prevent scrolling when swiping
        }
    }

    // Add touch event listeners to both lists
    [elements.todoList, elements.doneList].forEach(list => {
        list.addEventListener('touchstart', (e) => {
            const taskElement = e.target.closest('.task-item');
            if (taskElement) {
                handleTouchStart(e, taskElement);
            }
        }, { passive: false });

        list.addEventListener('touchend', (e) => {
            const taskElement = e.target.closest('.task-item');
            if (taskElement) {
                handleTouchEnd(e, taskElement);
            }
        });

        list.addEventListener('touchmove', (e) => {
            const taskElement = e.target.closest('.task-item');
            if (taskElement) {
                handleTouchMove(e, taskElement);
            }
        }, { passive: false });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Existing event listeners
    elements.addTaskBtn.addEventListener('click', () => openTaskDetails());
    elements.saveTaskBtn.addEventListener('click', saveTask);
    elements.closeTaskBtn.addEventListener('click', closeTaskModal);
    
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettingsBtn.addEventListener('click', closeSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Panel navigation
    elements.nextList.addEventListener('click', () => {
        elements.listsContainer.classList.add('show-done');
    });
    
    elements.prevList.addEventListener('click', () => {
        elements.listsContainer.classList.remove('show-done');
    });

    // Add keyboard event listeners for task input
    elements.taskInput.addEventListener('keydown', handleTaskKeyPress);
    elements.taskDescription.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeTaskModal();
        }
    });

    // Setup mobile task handling
    setupMobileTaskHandling();

    // Drag and drop listeners for desktop
    if (!window.matchMedia('(max-width: 768px)').matches) {
        elements.todoList.addEventListener('dragover', handleDragOver);
        elements.todoList.addEventListener('dragleave', handleDragLeave);
        elements.todoList.addEventListener('drop', handleDrop);
        
        elements.doneList.addEventListener('dragover', handleDragOver);
        elements.doneList.addEventListener('dragleave', handleDragLeave);
        elements.doneList.addEventListener('drop', handleDrop);
    }

    // Goal title click handler
    elements.goalTitle.addEventListener('click', openSettings);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) {
            closeTaskModal();
        }
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });

    // Export button click handler
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Import button click handler
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
            }
        });
    }
}

// Activity Matrix Functions
function updateActivityMatrix() {
    if (!elements.activityMatrix || !state.goalCreatedAt) return;
    
    const matrix = generateActivityMatrix();
    renderActivityMatrix(matrix);
    updateActivityStats(matrix);
}

function generateActivityMatrix() {
    const startDate = getActivityStartDate();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const matrix = [];
    
    // Generate all days from start to today (continuous timeline, no week alignment)
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDateToString(currentDate);
        const tasksCompleted = getTasksCompletedOnDate(dateStr);
        
        matrix.push({
            date: new Date(currentDate),
            dateStr: dateStr,
            count: tasksCompleted,
            level: getActivityLevel(tasksCompleted),
            dayOfWeek: currentDate.getDay()
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return matrix;
}

function getActivityStartDate() {
    // Start from the earliest task creation date or goal creation date
    let startDate = state.goalCreatedAt ? new Date(state.goalCreatedAt) : new Date();
    
    // Check for earliest task creation
    const allTasks = [...state.tasks, ...state.doneTasks];
    if (allTasks.length > 0) {
        const earliestTask = Math.min(...allTasks.map(task => task.createdAt || Date.now()));
        const earliestTaskDate = new Date(earliestTask);
        if (earliestTaskDate < startDate) {
            startDate = earliestTaskDate;
        }
    }
    
    // Start from beginning of that day
    startDate.setHours(0, 0, 0, 0);
    return startDate;
}

function formatDateToString(date) {
    return date.toISOString().split('T')[0];
}

function getTasksCompletedOnDate(dateStr) {
    return state.doneTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return formatDateToString(completedDate) === dateStr;
    }).length;
}

function getActivityLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
}

function renderActivityMatrix(matrix) {
    elements.activityMatrix.innerHTML = '';
    
    matrix.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = `matrix-day matrix-day-${day.level}`;
        dayElement.dataset.date = day.dateStr;
        dayElement.dataset.count = day.count;
        
        // Add hover event listeners for tooltip
        dayElement.addEventListener('mouseenter', showTooltip);
        dayElement.addEventListener('mouseleave', hideTooltip);
        dayElement.addEventListener('mousemove', moveTooltip);
        
        elements.activityMatrix.appendChild(dayElement);
    });
}

function showTooltip(e) {
    const dayElement = e.target;
    const date = new Date(dayElement.dataset.date);
    const count = parseInt(dayElement.dataset.count);
    
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    const taskText = count === 1 ? 'task' : 'tasks';
    const tooltipText = `${count} ${taskText} completed on ${dateStr}`;
    
    elements.activityTooltip.textContent = tooltipText;
    elements.activityTooltip.classList.add('visible');
    
    moveTooltip(e);
}

function hideTooltip() {
    elements.activityTooltip.classList.remove('visible');
}

function moveTooltip(e) {
    const tooltipRect = elements.activityTooltip.getBoundingClientRect();
    
    // Position tooltip below the cursor with a small offset
    let top = e.clientY + 20;
    let left = e.clientX + 10;
    
    // Adjust if tooltip would go off screen
    if (left + tooltipRect.width > window.innerWidth - 8) {
        left = e.clientX - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 8) {
        top = e.clientY - tooltipRect.height - 10;
    }
    
    elements.activityTooltip.style.position = 'fixed';
    elements.activityTooltip.style.top = `${top}px`;
    elements.activityTooltip.style.left = `${left}px`;
}

function updateActivityStats(matrix) {
    if (!elements.activityStats) return;
    
    const totalDays = matrix.length;
    const activeDays = matrix.filter(day => day.count > 0).length;
    const totalTasks = matrix.reduce((sum, day) => sum + day.count, 0);
    const streak = getCurrentStreak(matrix);
    
    elements.activityStats.textContent = `${totalTasks} tasks completed across ${activeDays} days (${streak} day streak)`;
}

function getCurrentStreak(matrix) {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateToString(today);
    
    // Find today's index in the matrix
    let todayIndex = -1;
    for (let i = matrix.length - 1; i >= 0; i--) {
        if (matrix[i].dateStr === todayStr) {
            todayIndex = i;
            break;
        }
    }
    
    // If today is not found, no current streak
    if (todayIndex === -1) return 0;
    
    // Count backwards from today to find current streak
    for (let i = todayIndex; i >= 0; i--) {
        if (matrix[i].count > 0) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Export data to JSON file
function exportData() {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
            goal: state.goal,
            targetDate: state.targetDate ? state.targetDate.toISOString() : null,
            goalCreatedAt: state.goalCreatedAt ? state.goalCreatedAt.toISOString() : null,
            tasks: state.tasks,
            doneTasks: state.doneTasks
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch-ext-backup-${formatDateToString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data from JSON file
async function importData(file) {
    try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data structure
        if (!importData.version || !importData.data) {
            throw new Error('Invalid backup file format');
        }

        // Update state with imported data
        state = {
            goal: importData.data.goal || '',
            targetDate: importData.data.targetDate ? new Date(importData.data.targetDate) : null,
            goalCreatedAt: importData.data.goalCreatedAt ? new Date(importData.data.goalCreatedAt) : null,
            tasks: Array.isArray(importData.data.tasks) ? importData.data.tasks : [],
            doneTasks: Array.isArray(importData.data.doneTasks) ? importData.data.doneTasks : []
        };

        // Save imported state
        await saveState();
        
        // Update UI
        updateUI();
        
        // Close settings modal
        closeSettings();
        
        // Show success message
        alert('Data imported successfully!');
    } catch (error) {
        console.error('Import error:', error);
        alert('Error importing data. Please make sure the file is a valid backup file.');
    }
}

// Initialize the extension
init(); 