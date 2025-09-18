// Native date difference functions
/**
 * Calculates the difference in whole days between two dates.
 * @param {Date} endDate - The end date.
 * @param {Date} startDate - The start date.
 * @returns {number} The total number of full days between the two dates.
 */
function differenceInDays(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the difference in whole hours between two dates.
 * @param {Date} endDate - The end date.
 * @param {Date} startDate - The start date.
 * @returns {number} The total number of full hours between the two dates.
 */
function differenceInHours(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60));
}

/**
 * Calculates the difference in whole minutes between two dates.
 * @param {Date} endDate - The end date.
 * @param {Date} startDate - The start date.
 * @returns {number} The total number of full minutes between the two dates.
 */
function differenceInMinutes(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60));
}

/**
 * Calculates the difference in whole seconds between two dates.
 * @param {Date} endDate - The end date.
 * @param {Date} startDate - The start date.
 * @returns {number} The total number of seconds between the two dates.
 */
function differenceInSeconds(endDate, startDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / 1000);
}

// Multi-project state management
let state = {
    // New multi-project structure
    projects: {},
    activeProjectId: null,
    projectOrder: [],
    globalSettings: {
        theme: 'dark',
        defaultProjectColor: '#4CAF50',
        showCompletedProjects: false,
        maxProjects: 10
    },
    migrationVersion: 2,
    
    // Legacy single-project data (for migration compatibility)
    goal: '',
    targetDate: null,
    goalCreatedAt: null,
    tasks: [],
    doneTasks: []
};

/**
 * @class ProjectManager
 * @description Manages all operations related to projects, including creation, deletion, and state management.
 */
class ProjectManager {
    /**
     * Creates an instance of ProjectManager.
     * @memberof ProjectManager
     */
    constructor() {
        this.state = state;
    }
    
    /**
     * Generates a unique ID for a new project.
     * @returns {string} A unique project identifier.
     * @memberof ProjectManager
     */
    generateProjectId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Creates a new project and adds it to the state.
     * @param {object} projectData - The data for the new project.
     * @param {string} [projectData.goal] - The name or goal of the project.
     * @param {Date} [projectData.targetDate] - The target completion date for the project.
     * @param {Date} [projectData.goalCreatedAt] - The creation date of the project goal.
     * @param {Array} [projectData.tasks] - The list of to-do tasks.
     * @param {Array} [projectData.doneTasks] - The list of completed tasks.
     * @param {string} [projectData.color] - The hex color code for the project theme.
     * @returns {Promise<object>} The newly created project object.
     * @memberof ProjectManager
     */
    async createProject(projectData) {
        const projectId = this.generateProjectId();
        const newProject = {
            id: projectId,
            goal: projectData.goal || 'New Project',
            targetDate: projectData.targetDate || null,
            goalCreatedAt: projectData.goalCreatedAt || new Date(),
            tasks: projectData.tasks || [],
            doneTasks: projectData.doneTasks || [],
            color: projectData.color || this.state.globalSettings.defaultProjectColor,
            isActive: true,
            order: this.state.projectOrder.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.state.projects[projectId] = newProject;
        this.state.projectOrder.push(projectId);
        
        // If this is the first project, make it active
        if (!this.state.activeProjectId) {
            this.state.activeProjectId = projectId;
        }
        
        await saveState();
        return newProject;
    }
    
    /**
     * Retrieves a project by its ID.
     * @param {string} projectId - The ID of the project to retrieve.
     * @returns {object|null} The project object, or null if not found.
     * @memberof ProjectManager
     */
    getProject(projectId) {
        return this.state.projects[projectId] || null;
    }
    
    /**
     * Updates an existing project with new data.
     * @param {string} projectId - The ID of the project to update.
     * @param {object} updates - An object containing the properties to update.
     * @returns {Promise<object|null>} The updated project object, or null if not found.
     * @memberof ProjectManager
     */
    async updateProject(projectId, updates) {
        if (!this.state.projects[projectId]) return null;
        
        this.state.projects[projectId] = {
            ...this.state.projects[projectId],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await saveState();
        return this.state.projects[projectId];
    }
    
    /**
     * Deletes a project from the state.
     * @param {string} projectId - The ID of the project to delete.
     * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
     * @memberof ProjectManager
     */
    async deleteProject(projectId) {
        if (!this.state.projects[projectId]) return false;
        
        delete this.state.projects[projectId];
        this.state.projectOrder = this.state.projectOrder.filter(id => id !== projectId);
        
        // If deleted project was active, switch to first available project
        if (this.state.activeProjectId === projectId) {
            this.state.activeProjectId = this.state.projectOrder.length > 0 ? this.state.projectOrder[0] : null;
        }
        
        await saveState();
        return true;
    }
    
    /**
     * Retrieves the currently active project.
     * @returns {object|null} The active project object, or null if no project is active.
     * @memberof ProjectManager
     */
    getActiveProject() {
        return this.state.activeProjectId ? this.state.projects[this.state.activeProjectId] : null;
    }
    
    /**
     * Sets a project as the active project.
     * @param {string} projectId - The ID of the project to set as active.
     * @returns {Promise<boolean>} True if the project was successfully set as active, false otherwise.
     * @memberof ProjectManager
     */
    async setActiveProject(projectId) {
        if (!this.state.projects[projectId]) return false;
        
        this.state.activeProjectId = projectId;
        await saveState();
        return true;
    }
    
    /**
     * Retrieves all projects in their specified order.
     * @returns {Array<object>} An array of all project objects.
     * @memberof ProjectManager
     */
    getAllProjects() {
        return this.state.projectOrder.map(id => this.state.projects[id]).filter(Boolean);
    }
    
    /**
     * Retrieves all projects that are marked as active.
     * @returns {Array<object>} An array of active project objects.
     * @memberof ProjectManager
     */
    getActiveProjects() {
        return this.getAllProjects().filter(project => project.isActive);
    }
}

// Initialize ProjectManager
const projectManager = new ProjectManager();

/**
 * A collection of cached DOM elements for easy access and improved performance.
 * @type {Object<string, HTMLElement>}
 */
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
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
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
    activityTooltip: document.getElementById('activityTooltip'),
    // Project selector elements
    projectDropdownBtn: document.getElementById('projectDropdownBtn'),
    projectDropdownMenu: document.getElementById('projectDropdownMenu'),
    currentProjectName: document.getElementById('currentProjectName'),
    addProjectBtn: document.getElementById('addProjectBtn'),
    projectList: document.getElementById('projectList'),
    projectDropdown: document.querySelector('.project-dropdown'),
    // Settings tab elements
    settingsTabs: document.querySelectorAll('.settings-tab'),
    settingsTabContents: document.querySelectorAll('.settings-tab-content'),
    projectColorInput: document.getElementById('projectColorInput'),

    allProjectsList: document.getElementById('allProjectsList'),
    // Custom modal elements
    createProjectModal: document.getElementById('createProjectModal'),
    newProjectName: document.getElementById('newProjectName'),
    newProjectDate: document.getElementById('newProjectDate'),
    newProjectColor: document.getElementById('newProjectColor'),
    createProjectBtn: document.getElementById('createProjectBtn'),
    cancelCreateProjectBtn: document.getElementById('cancelCreateProjectBtn'),
    confirmationModal: document.getElementById('confirmationModal'),
    confirmationTitle: document.getElementById('confirmationTitle'),
    confirmationMessage: document.getElementById('confirmationMessage'),
    confirmBtn: document.getElementById('confirmBtn'),
    cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
    notificationModal: document.getElementById('notificationModal'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotificationBtn: document.getElementById('closeNotificationBtn'),
    // Character counter elements
    projectNameCounter: document.getElementById('projectNameCounter'),
    goalCounter: document.getElementById('goalCounter')
};

let currentTaskIndex = null;
let currentTaskList = null;

/**
 * Initializes the extension by loading state, updating the UI, and setting up event listeners.
 * @async
 */
async function init() {
    await loadState();
    migrateTaskTimestamps(); // Fix existing task timestamps
    updateUI();
    setupEventListeners();
    startCountdownTimer();
}

/**
 * Migrates task timestamps to handle timezone changes correctly.
 * This function marks tasks as migrated without changing their timestamps,
 * as the new `formatDateToString` function handles timezone conversions.
 */
function migrateTaskTimestamps() {
    let migrationNeeded = false;
    
    // Check if any done tasks need migration (they have old UTC-based completedAt timestamps)
    state.doneTasks.forEach(task => {
        if (task.completedAt && !task.timestampMigrated) {
            // Mark as migrated without changing the timestamp
            // The key is that our new formatDateToString function now handles timezone correctly
            task.timestampMigrated = true;
            migrationNeeded = true;
        }
    });
    
    // Also migrate regular task timestamps
    state.tasks.forEach(task => {
        if ((task.createdAt || task.updatedAt) && !task.timestampMigrated) {
            task.timestampMigrated = true;
            migrationNeeded = true;
        }
    });
    
    // Save migrated data if any changes were made
    if (migrationNeeded) {
        console.log('Marked tasks as migrated to new timezone handling');
        saveState();
    }
}

/**
 * @deprecated This function is for single-project state and is no longer actively used.
 * Cleans up old completed tasks from the `doneTasks` array to prevent storage bloat.
 * It keeps the 1000 most recent tasks and any tasks completed within the last 90 days.
 */
function cleanupOldTasks() {
    if (!Array.isArray(state.doneTasks) || state.doneTasks.length <= 1000) {
        return; // No cleanup needed
    }
    
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    // Keep tasks that are either:
    // 1. From the last 90 days, OR
    // 2. Among the 1000 most recent tasks
    const sortedByDate = [...state.doneTasks].sort((a, b) => 
        new Date(b.completedAt || b.updatedAt || b.createdAt) - new Date(a.completedAt || a.updatedAt || a.createdAt)
    );
    
    // Keep the most recent 1000 tasks
    const recentTasks = sortedByDate.slice(0, 1000);
    
    // Also keep any tasks from the last 90 days that weren't in the top 1000
    const recentTaskIds = new Set(recentTasks.map(t => t.id));
    const additionalRecentTasks = state.doneTasks.filter(task => {
        if (recentTaskIds.has(task.id)) return false;
        const taskDate = new Date(task.completedAt || task.updatedAt || task.createdAt);
        return taskDate >= ninetyDaysAgo;
    });
    
    const newDoneTasks = [...recentTasks, ...additionalRecentTasks];
    
    if (newDoneTasks.length < state.doneTasks.length) {
        const removed = state.doneTasks.length - newDoneTasks.length;
        console.log(`Cleaned up ${removed} old completed tasks`);
        state.doneTasks = newDoneTasks;
        saveState();
    }
}

/**
 * Cleans up old completed tasks across all projects to prevent storage bloat.
 * For each project, it keeps the 1000 most recent tasks and any tasks completed within the last 90 days.
 */
function cleanupOldTasksAllProjects() {
    if (!state.projects) return;
    
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    let totalCleaned = 0;
    
    Object.keys(state.projects).forEach(projectId => {
        const project = state.projects[projectId];
        if (!Array.isArray(project.doneTasks) || project.doneTasks.length <= 1000) {
            return; // No cleanup needed for this project
        }
        
        // Keep tasks that are either:
        // 1. From the last 90 days, OR
        // 2. Among the 1000 most recent tasks
        const sortedByDate = [...project.doneTasks].sort((a, b) => 
            new Date(b.completedAt || b.updatedAt || b.createdAt) - new Date(a.completedAt || a.updatedAt || a.createdAt)
        );
        
        // Keep the most recent 1000 tasks
        const recentTasks = sortedByDate.slice(0, 1000);
        
        // Also keep any tasks from the last 90 days that weren't in the top 1000
        const recentTaskIds = new Set(recentTasks.map(t => t.id));
        const additionalRecentTasks = project.doneTasks.filter(task => {
            if (recentTaskIds.has(task.id)) return false;
            const taskDate = new Date(task.completedAt || task.updatedAt || task.createdAt);
            return taskDate >= ninetyDaysAgo;
        });
        
        const newDoneTasks = [...recentTasks, ...additionalRecentTasks];
        
        if (newDoneTasks.length < project.doneTasks.length) {
            const removed = project.doneTasks.length - newDoneTasks.length;
            totalCleaned += removed;
            project.doneTasks = newDoneTasks;
        }
    });
    
    if (totalCleaned > 0) {
        console.log(`Cleaned up ${totalCleaned} old completed tasks across all projects`);
        saveState();
    }
}

/**
 * Loads the application state from Chrome's local storage.
 * It first attempts to load the multi-project data structure. If that fails or is not present,
 * it triggers the migration process from the legacy single-project format.
 * @async
 */
async function loadState() {
    try {
        // First, try to load new multi-project structure
        const multiProjectData = await chrome.storage.local.get([
            'projects_data', 'global_settings', 'active_project', 'project_order', 'migration_version'
        ]);
        
        if (multiProjectData.migration_version === 2 && multiProjectData.projects_data) {
            // Load existing multi-project data
            console.log('Loading multi-project data');
            console.log('Raw projects_data:', multiProjectData.projects_data);
            
            try {
                const parsedProjects = JSON.parse(multiProjectData.projects_data);
                console.log('Parsed projects:', parsedProjects);
                console.log('Number of projects:', Object.keys(parsedProjects).length);
                
                state = {
                    projects: parsedProjects,
                    activeProjectId: multiProjectData.active_project,
                    projectOrder: JSON.parse(multiProjectData.project_order || '[]'),
                    globalSettings: JSON.parse(multiProjectData.global_settings || '{}'),
                    migrationVersion: 2,
                    // Keep legacy fields for backward compatibility
                    goal: '',
                    targetDate: null,
                    goalCreatedAt: null,
                    tasks: [],
                    doneTasks: []
                };
                
                console.log('Loaded state:', {
                    projectCount: Object.keys(state.projects).length,
                    activeProjectId: state.activeProjectId,
                    projectOrder: state.projectOrder
                });
            } catch (parseError) {
                console.error('Error parsing projects data:', parseError);
                console.log('Corrupted projects_data:', multiProjectData.projects_data);
                throw parseError;
            }
            
            // Merge default global settings
            state.globalSettings = {
                theme: 'dark',
                defaultProjectColor: '#4CAF50',
                showCompletedProjects: false,
                maxProjects: 10,
                ...state.globalSettings
            };
            
            // CRITICAL: Update ProjectManager state after loading
            projectManager.state = state;
            console.log('ProjectManager state updated after loading');
            
        } else {
            // Migration needed - check for old single-project data
            console.log('Checking for single-project data to migrate');
            await migrateToMultiProject();
        }
        
        // Clean up old completed tasks across all projects
        cleanupOldTasksAllProjects();
        
        // CRITICAL: Ensure ProjectManager state is synchronized
        projectManager.state = state;
        console.log('Final ProjectManager state sync after loadState');
        
    } catch (error) {
        console.error('Error loading state:', error);
        // Initialize with default multi-project state
        await initializeDefaultState();
    }
}

/**
 * Migrates data from the old single-project format to the new multi-project structure.
 * It checks both local and sync storage for legacy data and creates the first project from it.
 * @async
 */
async function migrateToMultiProject() {
    console.log('Starting migration to multi-project structure');
    
    try {
        // Check for existing single-project data
        const oldData = await chrome.storage.local.get(['goalState', 'tasks', 'doneTasks']);
        
        let shouldCreateFirstProject = false;
        let firstProjectData = {
            goal: 'My First Project',
            targetDate: null,
            goalCreatedAt: new Date(),
            tasks: [],
            doneTasks: []
        };
        
        if (oldData.goalState) {
            console.log('Found old single-project data, migrating...');
            const oldState = JSON.parse(oldData.goalState);
            firstProjectData = {
                goal: oldState.goal || 'My First Project',
                targetDate: oldState.targetDate ? new Date(oldState.targetDate) : null,
                goalCreatedAt: oldState.goalCreatedAt ? new Date(oldState.goalCreatedAt) : new Date(),
                tasks: oldData.tasks ? JSON.parse(oldData.tasks) : (oldState.tasks || []),
                doneTasks: oldData.doneTasks ? JSON.parse(oldData.doneTasks) : (oldState.doneTasks || [])
            };
            shouldCreateFirstProject = true;
        } else {
            // Check sync storage as fallback
            const syncData = await chrome.storage.sync.get(['goalState', 'tasks', 'doneTasks']);
                         if (syncData.goalState) {
                console.log('Found old sync storage data, migrating...');
                const oldState = JSON.parse(syncData.goalState);
                firstProjectData = {
                    goal: oldState.goal || 'My First Project',
                    targetDate: oldState.targetDate ? new Date(oldState.targetDate) : null,
                    goalCreatedAt: oldState.goalCreatedAt ? new Date(oldState.goalCreatedAt) : new Date(),
                    tasks: syncData.tasks ? JSON.parse(syncData.tasks) : (oldState.tasks || []),
                    doneTasks: syncData.doneTasks ? JSON.parse(syncData.doneTasks) : (oldState.doneTasks || [])
                };
                shouldCreateFirstProject = true;
            }
        }
        
        // Initialize new multi-project structure
                 state = {
            projects: {},
            activeProjectId: null,
            projectOrder: [],
            globalSettings: {
                theme: 'dark',
                defaultProjectColor: '#4CAF50',
                showCompletedProjects: false,
                maxProjects: 10
            },
            migrationVersion: 2,
            // Legacy fields
            goal: '',
            targetDate: null,
            goalCreatedAt: null,
            tasks: [],
            doneTasks: []
        };
        
        // Create first project if we have data to migrate
        if (shouldCreateFirstProject) {
            console.log('Creating first project from migrated data');
            await projectManager.createProject(firstProjectData);
        }
        
        // Save new structure
        await saveState();
        
        // Clean up old storage keys
        await cleanupOldStorage();
        
        console.log('Migration completed successfully');
        
    } catch (error) {
        console.error('Migration failed:', error);
        await initializeDefaultState();
    }
}

/**
 * Initializes a default, empty state for the application when no existing data is found.
 * This sets up the multi-project structure.
 * @async
 */
async function initializeDefaultState() {
    console.log('Initializing default multi-project state');
        state = {
        projects: {},
        activeProjectId: null,
        projectOrder: [],
        globalSettings: {
            theme: 'dark',
            defaultProjectColor: '#4CAF50',
            showCompletedProjects: false,
            maxProjects: 10
        },
        migrationVersion: 2,
        // Legacy fields
            goal: '',
            targetDate: null,
            goalCreatedAt: null,
            tasks: [],
            doneTasks: []
        };
    
    await saveState();
}

/**
 * Removes old, legacy storage keys from Chrome storage after a successful migration.
 * @async
 */
async function cleanupOldStorage() {
    try {
        await chrome.storage.local.remove(['goalState', 'tasks', 'doneTasks']);
        await chrome.storage.sync.remove(['goalState', 'tasks', 'doneTasks', 'goalSettings']);
        console.log('Cleaned up old storage keys');
    } catch (error) {
        console.log('Could not clean up old storage:', error);
    }
}

/**
 * Saves the current application state to Chrome's storage.
 * It primarily uses local storage for the full data and sync storage for a lightweight metadata backup.
 * @async
 */
async function saveState() {
    try {
        // Primary: Save to local storage (unlimited quota)
        await chrome.storage.local.set({
            projects_data: JSON.stringify(state.projects),
            global_settings: JSON.stringify(state.globalSettings),
            active_project: state.activeProjectId,
            project_order: JSON.stringify(state.projectOrder),
            migration_version: state.migrationVersion
        });
        
        // Backup: Save only metadata to sync storage (small data)
        try {
            const metadata = {
                projectIds: Object.keys(state.projects),
                activeProjectId: state.activeProjectId,
                globalSettings: state.globalSettings,
                migrationVersion: state.migrationVersion
            };
            await chrome.storage.sync.set({ 
                projects_metadata: JSON.stringify(metadata)
            });
        } catch (syncError) {
            // Sync storage quota exceeded - this is fine, local storage is primary
            console.log('Sync storage backup skipped (quota limit)');
        }
    } catch (error) {
        console.error('Error saving to local storage:', error);
        throw error; // Re-throw since local storage should not fail
    }
}

/**
 * Updates all UI components to reflect the current state of the active project.
 * This function serves as the main rendering hub.
 */
function updateUI() {
    console.log('updateUI called');
    const activeProject = projectManager.getActiveProject();
    console.log('Active project in updateUI:', activeProject);
    
    if (activeProject && activeProject.goal) {
        elements.goalTitle.textContent = `${activeProject.goal}`;
        updateCountdown();
        console.log('UI updated with project goal:', activeProject.goal);
    } else {
        elements.goalTitle.textContent = 'Click to set your goal...';
        resetCountdown();
        console.log('No active project or goal, showing default message');
    }

    updateTaskLists();
    updateActivityMatrix();
    updateProjectSelector();
    updateProjectTheme();
    
    console.log('updateUI completed');
}

/**
 * Updates the theme colors of the UI based on the active project's color.
 * It sets the color for the goal title and a CSS custom property for broader use.
 */
function updateProjectTheme() {
    const activeProject = projectManager.getActiveProject();
    const projectColor = activeProject ? activeProject.color : '#ffffff';
    
    // Apply project color ONLY to the main goal/project title
    const goalElement = document.querySelector('.goal-header h1');
    if (goalElement) {
        goalElement.style.color = projectColor;
    }
    
    // Keep everything else white - countdown and list headers stay white
    const countdownNumbers = document.querySelectorAll('.countdown-number');
    countdownNumbers.forEach(number => {
        number.style.color = '#ffffff';
    });
    
    const listHeaders = document.querySelectorAll('.list-header h2');
    listHeaders.forEach(header => {
        header.style.color = '#ffffff';
    });
    
    // Update CSS custom property for consistent theming
    document.documentElement.style.setProperty('--project-color', projectColor);
}

/**
 * Updates the project selector dropdown with the list of all active projects.
 * It highlights the currently active project and updates the document title.
 */
function updateProjectSelector() {
    const activeProject = projectManager.getActiveProject();
    const allProjects = projectManager.getActiveProjects();
    
    // Update current project name
    if (activeProject) {
        elements.currentProjectName.textContent = activeProject.goal || 'Untitled Project';
        document.title = `Launch Extension - ${activeProject.goal}`;
    } else {
        elements.currentProjectName.textContent = 'No Project Selected';
        document.title = 'Launch Extension';
    }
    
    // Update project list
    if (elements.projectList) {
        elements.projectList.innerHTML = '';
        
        allProjects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = `project-item ${project.id === state.activeProjectId ? 'active' : ''}`;
            projectItem.dataset.projectId = project.id;
            
            projectItem.innerHTML = `
                <div class="project-color" style="background-color: ${project.color}"></div>
                <div class="project-info">
                    <div class="project-name">${project.goal || 'Untitled Project'}</div>
                    <div class="project-meta">
                        ${project.tasks.length} tasks • ${project.doneTasks.length} done
                    </div>
                </div>
            `;
            
            projectItem.addEventListener('click', () => switchToProject(project.id));
            elements.projectList.appendChild(projectItem);
        });
        
        // Add empty state if no projects
        if (allProjects.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'project-empty-state';
            emptyState.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: rgba(255, 255, 255, 0.6);">
                    No projects yet. Click + to create one!
                </div>
            `;
            elements.projectList.appendChild(emptyState);
        }
    }
}

/**
 * Switches the active project to the one with the specified ID.
 * @param {string} projectId - The ID of the project to switch to.
 * @async
 */
async function switchToProject(projectId) {
    await projectManager.setActiveProject(projectId);
    updateUI(); // This will apply the switched project's color theme
    closeProjectDropdown();
}

/**
 * Toggles the visibility of the project selector dropdown menu.
 */
function toggleProjectDropdown() {
    elements.projectDropdown.classList.toggle('open');
}

/**
 * Closes the project selector dropdown menu.
 */
function closeProjectDropdown() {
    elements.projectDropdown.classList.remove('open');
}

/**
 * Opens and initializes the "Create New Project" modal.
 * It pre-fills the date input and resets the form fields.
 */
function createNewProject() {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    elements.newProjectDate.value = tomorrow.toISOString().slice(0, 16);
    
    // Reset form
    elements.newProjectName.value = '';
    elements.newProjectColor.value = '#4CAF50';
    
    // Reset character counter
    updateProjectNameCounter();
    
    // Show modal
    showModal('createProjectModal');
    setTimeout(() => elements.newProjectName.focus(), 100);
}

/**
 * Handles the submission of the "Create New Project" form.
 * It validates the input, creates a new project, and switches to it.
 * @async
 */
async function handleCreateProject() {
    const projectName = elements.newProjectName.value.trim();
    const targetDate = elements.newProjectDate.value;
    const projectColor = elements.newProjectColor.value;
    
    if (!projectName) {
        showNotification('Error', 'Please enter a project name.');
        return;
    }
    
    if (projectName.length > 50) {
        showNotification('Error', 'Project name must be 50 characters or less.');
        return;
    }
    
    if (!targetDate) {
        showNotification('Error', 'Please select a target date.');
        return;
    }
    
    try {
        const newProject = await projectManager.createProject({
            goal: projectName,
            targetDate: new Date(targetDate),
            goalCreatedAt: new Date(),
            color: projectColor
        });
        
        // Switch to the new project
        await projectManager.setActiveProject(newProject.id);
        updateUI(); // This will apply the new project's color theme
        closeProjectDropdown();
        hideModal('createProjectModal');
        
        showNotification('Success', `Project "${projectName}" created successfully!`);
    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error', 'Failed to create project. Please try again.');
    }
}

/**
 * Switches the visible tab in the settings modal.
 * @param {string} tabName - The name of the tab to switch to (e.g., 'current', 'projects').
 */
function switchSettingsTab(tabName) {
    // Remove active class from all tabs and contents
    elements.settingsTabs.forEach(tab => tab.classList.remove('active'));
    elements.settingsTabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

/**
 * Populates the "All Projects" list in the settings modal with project details and action buttons.
 */
function updateAllProjectsList() {
    if (!elements.allProjectsList) return;
    
    const allProjects = projectManager.getAllProjects();
    elements.allProjectsList.innerHTML = '';
    
    allProjects.forEach(project => {
        const isActive = project.id === state.activeProjectId;
        const projectItem = document.createElement('div');
        projectItem.className = `all-project-item ${isActive ? 'active' : ''}`;
        
        const completionRate = project.doneTasks.length > 0 ? 
            Math.round((project.doneTasks.length / (project.tasks.length + project.doneTasks.length)) * 100) : 0;
        
        projectItem.innerHTML = `
            <div class="all-project-color" style="background-color: ${project.color}"></div>
            <div class="all-project-info">
                <div class="all-project-name">${project.goal || 'Untitled Project'}</div>
                <div class="all-project-details">
                    ${project.tasks.length} todo, ${project.doneTasks.length} done (${completionRate}%)
                </div>
            </div>
            <div class="all-project-actions">
                <button class="project-action-btn switch-project-btn" data-project-id="${project.id}">
                    ${isActive ? 'Active' : 'Switch'}
                </button>
                <button class="project-action-btn delete-project-btn" data-project-id="${project.id}">
                    Delete
                </button>
            </div>
        `;
        
        elements.allProjectsList.appendChild(projectItem);
    });
    
    if (allProjects.length === 0) {
        elements.allProjectsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.6);">
                No projects yet. Create your first project!
            </div>
        `;
    }
    
    // Add event listeners for project action buttons
    const switchButtons = elements.allProjectsList.querySelectorAll('.switch-project-btn');
    const deleteButtons = elements.allProjectsList.querySelectorAll('.delete-project-btn');
    
    switchButtons.forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-project-id');
            switchToProject(projectId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-project-id');
            deleteProjectById(projectId);
        });
    });
}



/**
 * Initiates the deletion process for a project by its ID, showing a confirmation modal first.
 * @param {string} projectId - The ID of the project to delete.
 */
function deleteProjectById(projectId) {
    const project = projectManager.getProject(projectId);
    if (!project) return;
    
    showConfirmation(
        'Delete Project',
        `Are you sure you want to delete "${project.goal}"? This action cannot be undone and will delete all tasks.`,
        async () => {
            try {
                await projectManager.deleteProject(projectId);
                updateUI();
                updateAllProjectsList(); // Refresh the projects list
                
                // Reset import input to ensure it works after deletion
                const importInput = document.getElementById('importInput');
                if (importInput) {
                    importInput.value = '';
                }
                
                showNotification('Success', 'Project deleted successfully.');
            } catch (error) {
                console.error('Error deleting project:', error);
                showNotification('Error', 'Failed to delete project. Please try again.');
            }
        }
    );
}

/**
 * Updates the color of the currently active project.
 * @async
 */
async function updateProjectColor() {
    const activeProject = projectManager.getActiveProject();
    if (!activeProject || !elements.projectColorInput) return;
    
    const newColor = elements.projectColorInput.value;
    await projectManager.updateProject(activeProject.id, { color: newColor });
    updateUI(); // This will call updateProjectTheme() to apply the new color
}

/**
 * Displays a modal by its ID.
 * @param {string} modalId - The ID of the modal element to show.
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Hides a modal by its ID.
 * @param {string} modalId - The ID of the modal element to hide.
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Displays a notification modal with a title and message.
 * @param {string} title - The title of the notification.
 * @param {string} message - The main message content of the notification.
 * @param {('info'|'success'|'error')} [type='info'] - The type of notification, for styling purposes.
 */
function showNotification(title, message, type = 'info') {
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    
    // Add type-specific styling
    const modal = elements.notificationModal;
    modal.className = 'modal'; // Reset classes
    if (type === 'error') {
        modal.classList.add('error');
    } else if (type === 'success') {
        modal.classList.add('success');
    }
    
    showModal('notificationModal');
}

/**
 * Displays a confirmation modal and executes a callback based on user's choice.
 * @param {string} title - The title of the confirmation dialog.
 * @param {string} message - The message asking for confirmation.
 * @param {Function} onConfirm - The callback function to execute if the user confirms.
 * @param {Function|null} [onCancel=null] - The callback function to execute if the user cancels.
 */
function showConfirmation(title, message, onConfirm, onCancel = null) {
    elements.confirmationTitle.textContent = title;
    elements.confirmationMessage.textContent = message;
    
    // Remove existing event listeners
    const newConfirmBtn = elements.confirmBtn.cloneNode(true);
    const newCancelBtn = elements.cancelConfirmBtn.cloneNode(true);
    elements.confirmBtn.parentNode.replaceChild(newConfirmBtn, elements.confirmBtn);
    elements.cancelConfirmBtn.parentNode.replaceChild(newCancelBtn, elements.cancelConfirmBtn);
    
    // Update references
    elements.confirmBtn = newConfirmBtn;
    elements.cancelConfirmBtn = newCancelBtn;
    
    // Add new event listeners
    elements.confirmBtn.addEventListener('click', () => {
        hideModal('confirmationModal');
        if (onConfirm) onConfirm();
    });
    
    elements.cancelConfirmBtn.addEventListener('click', () => {
        hideModal('confirmationModal');
        if (onCancel) onCancel();
    });
    
    showModal('confirmationModal');
}

/**
 * Updates the character counter for the new project name input field.
 * The color of the counter changes as the text length approaches the maximum limit.
 */
function updateProjectNameCounter() {
    if (!elements.newProjectName || !elements.projectNameCounter) return;
    
    const currentLength = elements.newProjectName.value.length;
    const maxLength = 50;
    
    elements.projectNameCounter.textContent = currentLength;
    
    // Change color based on usage
    const counterElement = elements.projectNameCounter.parentElement;
    if (currentLength >= maxLength) {
        counterElement.style.color = '#f44336'; // Red when at limit
    } else if (currentLength >= maxLength * 0.8) {
        counterElement.style.color = '#ff9800'; // Orange when close to limit
    } else {
        counterElement.style.color = 'rgba(255, 255, 255, 0.6)'; // Default gray
    }
}

/**
 * Updates the character counter for the goal input field in the settings.
 * The color of the counter changes as the text length approaches the maximum limit.
 */
function updateGoalCounter() {
    if (!elements.goalInput || !elements.goalCounter) return;
    
    const currentLength = elements.goalInput.value.length;
    const maxLength = 50;
    
    elements.goalCounter.textContent = currentLength;
    
    // Change color based on usage
    const counterElement = elements.goalCounter.parentElement;
    if (currentLength >= maxLength) {
        counterElement.style.color = '#f44336'; // Red when at limit
    } else if (currentLength >= maxLength * 0.8) {
        counterElement.style.color = '#ff9800'; // Orange when close to limit
    } else {
        counterElement.style.color = 'rgba(255, 255, 255, 0.6)'; // Default gray
    }
}

/**
 * Calculates the number of days left until the active project's target date.
 * @returns {number|string} The number of days remaining, or '--' if not applicable.
 */
function getDaysLeft() {
    const activeProject = projectManager.getActiveProject();
    if (!activeProject || !activeProject.targetDate) return '--';
    const now = new Date();
    const targetDate = new Date(activeProject.targetDate);
    return Math.max(0, differenceInDays(targetDate, now));
}

/**
 * Resets the countdown display to its default placeholder state.
 */
function resetCountdown() {
    elements.days.textContent = '--';
    elements.hours.textContent = '--';
    elements.minutes.textContent = '--';
    elements.seconds.textContent = '--';
}

/**
 * Updates the countdown timer display with the time remaining for the active project.
 * If the target date is reached, it resets the countdown.
 */
function updateCountdown() {
    const activeProject = projectManager.getActiveProject();
    if (!activeProject || !activeProject.targetDate) return;

    const now = new Date();
    const targetDate = new Date(activeProject.targetDate);

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

/**
 * Starts the countdown timer, updating it every second.
 */
function startCountdownTimer() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/**
 * Creates a new task object.
 * @param {string} title - The title of the task.
 * @param {string} [description=''] - The description of the task.
 * @returns {object} The new task object.
 */
function createTask(title, description = '') {
    return {
        title,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

/**
 * Updates an existing task object with new data.
 * @param {object} task - The original task object.
 * @param {object} updates - An object containing the properties to update.
 * @returns {object} The updated task object.
 */
function updateTask(task, updates) {
    return {
        ...task,
        ...updates,
        updatedAt: Date.now()
    };
}

/**
 * Sorts an array of tasks by their `updatedAt` timestamp in descending order.
 * @param {Array<object>} tasks - The array of tasks to sort.
 * @returns {Array<object>} A new array containing the sorted tasks.
 */
function sortTasksByUpdated(tasks) {
    return [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Creates a DOM element for a single task.
 * @param {object} task - The task object.
 * @param {number} index - The index of the task in its original list.
 * @param {boolean} isDone - Whether the task is in the "Done" list.
 * @returns {HTMLElement} The created task element.
 */
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

/**
 * Converts a timestamp into a human-readable "time ago" string (e.g., "Today at 5:00 PM", "Yesterday at 10:00 AM").
 * @param {number} timestamp - The timestamp to format.
 * @returns {string} The formatted time ago string.
 */
function getTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Format the date and time
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    // Get date strings for proper comparison (ignoring time)
    const todayStr = formatDateToString(now);
    const taskDateStr = formatDateToString(date);
    
    // Calculate yesterday's date string
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToString(yesterday);

    // If it's today, show just the time
    if (taskDateStr === todayStr) {
        return `Today at ${timeStr}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (taskDateStr === yesterdayStr) {
        return `Yesterday at ${timeStr}`;
    }

    // Otherwise show the full date and time
    return `${dateStr} at ${timeStr}`;
}

/**
 * Renders the To-Do and Done task lists based on the active project's tasks.
 * Tasks are sorted by their last updated time before rendering.
 */
function updateTaskLists() {
    if (!elements.todoList || !elements.doneList) return;

    elements.todoList.innerHTML = '';
    elements.doneList.innerHTML = '';

    const activeProject = projectManager.getActiveProject();
    if (!activeProject) return;

    // Sort tasks by last updated time
    const sortedTasks = sortTasksByUpdated(activeProject.tasks);
    const sortedDoneTasks = sortTasksByUpdated(activeProject.doneTasks);

    sortedTasks.forEach((task) => {
        // Find original index in unsorted array
        const originalIndex = activeProject.tasks.findIndex(t => t === task);
        const taskElement = createTaskElement(task, originalIndex, false);
        elements.todoList.appendChild(taskElement);
    });

    sortedDoneTasks.forEach((task) => {
        // Find original index in unsorted array
        const originalIndex = activeProject.doneTasks.findIndex(t => t === task);
        const taskElement = createTaskElement(task, originalIndex, true);
        elements.doneList.appendChild(taskElement);
    });
}

/**
 * Opens the task details modal to either create a new task or edit an existing one.
 * @param {object|null} [task=null] - The task object to edit. If null, the modal is for a new task.
 * @param {number|null} [index=null] - The index of the task in its list.
 * @param {boolean} [isDone=false] - Whether the task is from the "Done" list.
 */
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
    
    // Show/hide delete button - only show for existing todo items
    if (elements.deleteTaskBtn) {
        if (currentTaskIndex !== null && !isDone) {
            elements.deleteTaskBtn.style.display = 'inline-block';
        } else {
            elements.deleteTaskBtn.style.display = 'none';
        }
    }
    
    elements.taskModal.classList.add('show');
    setTimeout(() => elements.taskInput.focus(), 100);
}

/**
 * Handles key presses within the task modal for shortcuts.
 * Enter saves the task, Escape closes the modal.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function handleTaskKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveTask();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        closeTaskModal();
    }
}

/**
 * Saves a task's details from the task modal.
 * It either updates an existing task or creates a new one.
 */
function saveTask() {
    const title = elements.taskInput.value.trim();
    const description = elements.taskDescription.value.trim();
    
    if (!title) return;

    const activeProject = projectManager.getActiveProject();
    if (!activeProject) return;

    if (currentTaskIndex !== null) {
        const taskList = currentTaskList === 'done' ? activeProject.doneTasks : activeProject.tasks;
        const existingTask = taskList[currentTaskIndex];
        taskList[currentTaskIndex] = updateTask(existingTask, { title, description });
    } else {
        activeProject.tasks.push(createTask(title, description));
    }

    saveState();
    updateTaskLists();
    closeTaskModal();
}

/**
 * Deletes the currently selected task from the active project.
 */
function deleteTask() {
    if (currentTaskIndex === null) return;
    
    const activeProject = projectManager.getActiveProject();
    if (!activeProject) return;
    
    const taskList = currentTaskList === 'done' ? activeProject.doneTasks : activeProject.tasks;
    if (Array.isArray(taskList)) {
        taskList.splice(currentTaskIndex, 1);
    }
    
    saveState();
    updateUI();
    closeTaskModal();
}

/**
 * Closes the task details modal and resets its state.
 */
function closeTaskModal() {
    elements.taskModal.classList.remove('show');
    currentTaskIndex = null;
    currentTaskList = null;
}

/**
 * Handles the start of a drag event on a task item.
 * @param {DragEvent} e - The drag event object.
 */
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({
        index: e.target.dataset.index,
        list: e.target.dataset.list
    }));
}

/**
 * Handles the end of a drag event on a task item, cleaning up styles.
 * @param {DragEvent} e - The drag event object.
 */
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

/**
 * Handles the drag-over event, adding a visual indicator to the target list.
 * @param {DragEvent} e - The drag event object.
 */
function handleDragOver(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.add('drag-over');
    }
}

/**
 * Handles the drag-leave event, removing the visual indicator from the target list.
 * @param {DragEvent} e - The drag event object.
 */
function handleDragLeave(e) {
    const taskList = e.target.closest('.task-list');
    if (taskList && !taskList.contains(e.relatedTarget)) {
        taskList.classList.remove('drag-over');
    }
}

/**
 * Handles the drop event, moving the task from its source list to the target list.
 * @param {DragEvent} e - The drag event object.
 */
function handleDrop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (!taskList) return;

    const activeProject = projectManager.getActiveProject();
    if (!activeProject) return;

    taskList.classList.remove('drag-over');
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const sourceList = data.list === 'todo' ? activeProject.tasks : activeProject.doneTasks;
    const targetList = taskList.id === 'todoList' ? activeProject.tasks : activeProject.doneTasks;
    
    if (sourceList === targetList) return;

    const task = sourceList[data.index];
    if (task) {
        // Add completion timestamp when moving to done list
        if (taskList.id === 'doneList') {
            task.completedAt = Date.now();
            task.updatedAt = Date.now();
            // Trigger confetti when task is completed
            triggerConfetti();
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

/**
 * Toggles the view between the "To-Do" and "Done" lists on mobile.
 */
function toggleListView() {
    elements.listsContainer.classList.toggle('show-done');
}

/**
 * Opens the settings modal and populates it with the active project's data.
 */
function openSettings() {
    const activeProject = projectManager.getActiveProject();
    if (activeProject) {
        if (activeProject.goal) {
            elements.goalInput.value = activeProject.goal;
            updateGoalCounter(); // Update counter when setting value
        }
        if (activeProject.targetDate) elements.dateInput.value = new Date(activeProject.targetDate).toISOString().slice(0, 16);
        if (elements.projectColorInput) elements.projectColorInput.value = activeProject.color || '#4CAF50';
    }
    
    // Populate all projects tab
    updateAllProjectsList();
    
    // Make sure Current Project tab is active
    switchSettingsTab('current');
    
    elements.settingsModal.classList.add('show');
}

/**
 * Closes the settings modal.
 */
function closeSettings() {
    elements.settingsModal.classList.remove('show');
}

/**
 * Saves the settings from the settings modal.
 * It updates the active project's goal and target date, or creates a new project if none is active.
 * @async
 */
async function saveSettings() {
    const newGoal = elements.goalInput.value.trim();
    const newDate = elements.dateInput.value;

    if (newGoal && newDate) {
        // Validate goal length
        if (newGoal.length > 50) {
            showNotification('Error', 'Goal must be 50 characters or less.');
            return;
        }
        
        let activeProject = projectManager.getActiveProject();
        
        // If no active project exists, create one
        if (!activeProject) {
            activeProject = await projectManager.createProject({
                goal: newGoal,
                targetDate: new Date(newDate),
                goalCreatedAt: new Date()
            });
        } else {
            // Update existing project
            const updates = {
                goal: newGoal,
                targetDate: new Date(newDate)
            };
            
        // Set goal creation date if this is a new goal
            if (!activeProject.goal || activeProject.goal !== newGoal) {
                updates.goalCreatedAt = new Date();
            }
            
            await projectManager.updateProject(activeProject.id, updates);
        }
        
        updateUI();
        closeSettings();
    }
}

/**
 * Moves a task from one list to another (e.g., 'todo' to 'done').
 * @param {HTMLElement} taskElement - The DOM element of the task to move.
 * @param {('todo'|'done')} fromList - The name of the source list.
 * @param {('todo'|'done')} toList - The name of the destination list.
 */
function moveTask(taskElement, fromList, toList) {
    const index = parseInt(taskElement.dataset.index);
    const activeProject = projectManager.getActiveProject();
    if (!activeProject) return;
    
    const sourceList = fromList === 'todo' ? activeProject.tasks : activeProject.doneTasks;
    const targetList = toList === 'todo' ? activeProject.tasks : activeProject.doneTasks;
    
    const task = sourceList[index];
    if (task) {
        // Update the task's timestamp when moved
        const updatedTask = updateTask(task, {});
        
        // Add completion timestamp when moving to done list
        if (toList === 'done') {
            updatedTask.completedAt = Date.now();
            // Trigger confetti when task is completed
            triggerConfetti();
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

/**
 * Sets up touch event listeners for handling task swipes on mobile devices.
 * A swipe on a task moves it between the "To-Do" and "Done" lists.
 */
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

    /**
     * Handles the touchstart event on a task item.
     * @param {TouchEvent} e - The touch event.
     * @param {HTMLElement} taskElement - The task element being touched.
     */
    function handleTouchStart(e, taskElement) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        taskElement.classList.add('being-moved');
    }

    /**
     * Handles the touchend event on a task item, determining if a swipe occurred.
     * @param {TouchEvent} e - The touch event.
     * @param {HTMLElement} taskElement - The task element being touched.
     */
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

    /**
     * Handles the touchmove event to prevent scrolling while swiping.
     * @param {TouchEvent} e - The touch event.
     */
    function handleTouchMove(e) {
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

/**
 * Sets up all the initial event listeners for the application's interactive elements.
 */
function setupEventListeners() {
    // Project selector event listeners
    elements.projectDropdownBtn.addEventListener('click', toggleProjectDropdown);
    elements.addProjectBtn.addEventListener('click', createNewProject);
    
    // Settings tabs event listeners
    elements.settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => switchSettingsTab(tab.dataset.tab));
    });
    
    // Project management event listeners
    
    if (elements.projectColorInput) {
        elements.projectColorInput.addEventListener('change', updateProjectColor);
    }
    
    // Create project modal event listeners
    if (elements.createProjectBtn) {
        elements.createProjectBtn.addEventListener('click', handleCreateProject);
    }
    
    if (elements.cancelCreateProjectBtn) {
        elements.cancelCreateProjectBtn.addEventListener('click', () => hideModal('createProjectModal'));
    }
    
    // Notification modal event listener
    if (elements.closeNotificationBtn) {
        elements.closeNotificationBtn.addEventListener('click', () => hideModal('notificationModal'));
    }
    
    // Color preview update for new project modal
    if (elements.newProjectColor) {
        elements.newProjectColor.addEventListener('change', (e) => {
            const preview = elements.createProjectModal.querySelector('.color-preview');
            if (preview) {
                preview.style.backgroundColor = e.target.value;
            }
        });
    }
    
    // Enter key handling for create project modal
    if (elements.newProjectName) {
        elements.newProjectName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateProject();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideModal('createProjectModal');
            }
        });
        
        // Character counter for new project name
        elements.newProjectName.addEventListener('input', updateProjectNameCounter);
    }
    
    // Character counter for goal input
    if (elements.goalInput) {
        elements.goalInput.addEventListener('input', updateGoalCounter);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.projectDropdown.contains(e.target)) {
            closeProjectDropdown();
        }
    });
    
    // Existing event listeners
    elements.addTaskBtn.addEventListener('click', () => openTaskDetails());
    elements.saveTaskBtn.addEventListener('click', saveTask);
    elements.deleteTaskBtn.addEventListener('click', deleteTask);
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

/**
 * Main function to update the activity matrix display.
 * It generates, renders, and updates the stats for the matrix.
 */
function updateActivityMatrix() {
    const activeProject = projectManager.getActiveProject();
    if (!elements.activityMatrix || !activeProject || !activeProject.goalCreatedAt) return;
    
    const matrix = generateActivityMatrix(activeProject);
    renderActivityMatrix(matrix);
    updateActivityStats(matrix);
}

/**
 * Generates the data structure for the activity matrix.
 * @param {object} project - The project for which to generate the matrix.
 * @returns {Array<object>} An array of day objects, each containing date, count, and level info.
 */
function generateActivityMatrix(project) {
    const startDate = getActivityStartDate(project);
    const matrix = [];
    
    // If no goal is set, return empty matrix
    if (!project || !project.goalCreatedAt || !project.targetDate) {
        return matrix;
    }
    
    // End date should be the target date or today, whichever is later
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const targetDate = new Date(project.targetDate);
    targetDate.setHours(23, 59, 59, 999);
    const endDate = targetDate > today ? targetDate : today;
    
    // Generate all days from start to end date (covers entire goal period)
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDateToString(currentDate);
        const tasksCompleted = getTasksCompletedOnDate(dateStr, project);
        
        // Mark future dates (beyond today) with a special class
        const isToday = formatDateToString(new Date()) === dateStr;
        const isFuture = currentDate > new Date();
        
        matrix.push({
            date: new Date(currentDate),
            dateStr: dateStr,
            count: tasksCompleted,
            level: isFuture && !isToday ? -1 : getActivityLevel(tasksCompleted), // -1 for future dates
            dayOfWeek: currentDate.getDay(),
            isToday: isToday,
            isFuture: isFuture && !isToday
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return matrix;
}

/**
 * Determines the start date for the activity matrix, based on goal or task creation date.
 * @param {object} project - The project object.
 * @returns {Date} The calculated start date for the matrix.
 */
function getActivityStartDate(project) {
    // Start from the earliest task creation date or goal creation date
    let startDate = project.goalCreatedAt ? new Date(project.goalCreatedAt) : new Date();
    
    // Check for earliest task creation
    const allTasks = [...project.tasks, ...project.doneTasks];
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

/**
 * Formats a Date object into a "YYYY-MM-DD" string using local time.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatDateToString(date) {
    // Use local time instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Counts the number of tasks completed on a specific date for a given project.
 * @param {string} dateStr - The date string in "YYYY-MM-DD" format.
 * @param {object} project - The project to check tasks from.
 * @returns {number} The number of tasks completed on that date.
 */
function getTasksCompletedOnDate(dateStr, project) {
    return project.doneTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return formatDateToString(completedDate) === dateStr;
    }).length;
}

/**
 * Determines the activity level (0-4) based on the number of completed tasks.
 * This is used for color-coding the matrix cells.
 * @param {number} count - The number of completed tasks.
 * @returns {number} The activity level.
 */
function getActivityLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
}

/**
 * Renders the activity matrix in the DOM based on the generated matrix data.
 * @param {Array<object>} matrix - The matrix data generated by `generateActivityMatrix`.
 */
function renderActivityMatrix(matrix) {
    elements.activityMatrix.innerHTML = '';
    
    matrix.forEach(day => {
        const dayElement = document.createElement('div');
        
        // Base class and level class
        let className = 'matrix-day';
        if (day.level === -1) {
            className += ' matrix-day-future'; // Future dates
        } else {
            className += ` matrix-day-${day.level}`;
        }
        
        // Add special class for today
        if (day.isToday) {
            className += ' matrix-day-today';
        }
        
        dayElement.className = className;
        dayElement.dataset.date = day.dateStr;
        dayElement.dataset.count = day.count;
        
        // Add hover event listeners for tooltip
        dayElement.addEventListener('mouseenter', showTooltip);
        dayElement.addEventListener('mouseleave', hideTooltip);
        dayElement.addEventListener('mousemove', moveTooltip);
        
        elements.activityMatrix.appendChild(dayElement);
    });
}

/**
 * Shows the tooltip for a specific day in the activity matrix on mouse hover.
 * @param {MouseEvent} e - The mouse event.
 */
function showTooltip(e) {
    const dayElement = e.target;
    // Use the date string directly instead of converting to Date and back
    const dayDateStr = dayElement.dataset.date;
    const count = parseInt(dayElement.dataset.count);
    const today = new Date();
    const todayStr = formatDateToString(today);
    const isToday = dayDateStr === todayStr;
    
    // Create date object for display formatting only
    const date = new Date(dayDateStr + 'T00:00:00'); // Force local time interpretation
    const isFuture = dayDateStr > todayStr;
    
    const displayDateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    let tooltipText;
    if (isFuture && !isToday) {
        tooltipText = `No activity yet on ${displayDateStr}`;
    } else if (isToday) {
        const taskText = count === 1 ? 'task' : 'tasks';
        tooltipText = `${count} ${taskText} completed today`;
    } else {
        const taskText = count === 1 ? 'task' : 'tasks';
        tooltipText = `${count} ${taskText} completed on ${displayDateStr}`;
    }
    
    elements.activityTooltip.textContent = tooltipText;
    elements.activityTooltip.classList.add('visible');
    
    moveTooltip(e);
}

/**
 * Hides the activity matrix tooltip.
 */
function hideTooltip() {
    elements.activityTooltip.classList.remove('visible');
}

/**
 * Moves the tooltip to follow the mouse cursor's position.
 * @param {MouseEvent} e - The mouse event.
 */
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

/**
 * Updates the activity statistics summary text (total tasks, active days, streak).
 * @param {Array<object>} matrix - The activity matrix data.
 */
function updateActivityStats(matrix) {
    if (!elements.activityStats) return;
    
    // Only count past and present days, not future days
    const pastAndPresentDays = matrix.filter(day => !day.isFuture);
    const activeDays = pastAndPresentDays.filter(day => day.count > 0).length;
    const totalTasks = matrix.reduce((sum, day) => sum + day.count, 0);
    const streak = getCurrentStreak(matrix);
    
    elements.activityStats.textContent = `${totalTasks} tasks completed across ${activeDays} days (${streak} day streak)`;
}

/**
 * Calculates the current consecutive day streak of activity.
 * @param {Array<object>} matrix - The activity matrix data.
 * @returns {number} The number of days in the current streak.
 */
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
    
    // If today is not found, check if we're looking at past dates only
    if (todayIndex === -1) {
        // Count from the most recent past date
        for (let i = matrix.length - 1; i >= 0; i--) {
            if (!matrix[i].isFuture && matrix[i].count > 0) {
                streak++;
            } else if (!matrix[i].isFuture) {
                break;
            }
        }
        return streak;
    }
    
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

/**
 * Exports the entire application state to a JSON file and triggers a download.
 */
function exportData() {
    console.log('Exporting data...');
    console.log('Current state:', {
        projectCount: Object.keys(state.projects || {}).length,
        activeProjectId: state.activeProjectId,
        migrationVersion: state.migrationVersion
    });
    
    // Export in new multi-project format
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
            projects: state.projects,
            activeProjectId: state.activeProjectId,
            projectOrder: state.projectOrder,
            globalSettings: state.globalSettings,
            migrationVersion: state.migrationVersion
        }
    };

    console.log('Export data prepared:', {
        projectCount: Object.keys(exportData.data.projects || {}).length,
        dataSize: JSON.stringify(exportData).length
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch-ext-backup-${formatDateToString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Export completed');
}

/**
 * Imports application state from a user-selected JSON file.
 * It handles both the new multi-project format and the legacy single-project format.
 * @param {File} file - The JSON file to import.
 * @async
 */
async function importData(file) {
    try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        console.log('Import data structure:', importData);
        
        // Validate import data structure
        if (!importData.version || !importData.data) {
            throw new Error('Invalid backup file format');
        }

        // Check if this is old single-project format or new multi-project format
        if (importData.data.projects) {
            // New multi-project format
            console.log('Importing multi-project data');
            
            // Convert string dates to Date objects in all projects
            const projects = importData.data.projects;
            Object.keys(projects).forEach(projectId => {
                const project = projects[projectId];
                if (project.targetDate && typeof project.targetDate === 'string') {
                    project.targetDate = new Date(project.targetDate);
                }
                if (project.goalCreatedAt && typeof project.goalCreatedAt === 'string') {
                    project.goalCreatedAt = new Date(project.goalCreatedAt);
                }
                console.log(`Fixed dates for project ${projectId}:`, {
                    goal: project.goal,
                    targetDate: project.targetDate,
                    goalCreatedAt: project.goalCreatedAt
                });
            });
            
            state.projects = projects;
            state.activeProjectId = importData.data.activeProjectId;
            state.projectOrder = importData.data.projectOrder || Object.keys(importData.data.projects);
            state.globalSettings = {
                ...state.globalSettings,
                ...(importData.data.globalSettings || {})
            };
        } else {
            // Old single-project format - convert to multi-project
            console.log('Converting old single-project data to multi-project format');
            console.log('Import data details:', {
                goal: importData.data.goal,
                targetDate: importData.data.targetDate,
                tasksCount: importData.data.tasks?.length,
                doneTasksCount: importData.data.doneTasks?.length
            });
            
            const projectId = projectManager.generateProjectId();
            const newProject = {
                id: projectId,
                goal: importData.data.goal || 'Imported Project',
            targetDate: importData.data.targetDate ? new Date(importData.data.targetDate) : null,
                goalCreatedAt: importData.data.goalCreatedAt ? new Date(importData.data.goalCreatedAt) : new Date(),
            tasks: Array.isArray(importData.data.tasks) ? importData.data.tasks : [],
                doneTasks: Array.isArray(importData.data.doneTasks) ? importData.data.doneTasks : [],
                color: '#4CAF50',
                isActive: true,
                order: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log('Created new project:', newProject);
            
            // Clear existing projects and add the imported one
            state.projects = {};
            state.projects[projectId] = newProject;
            state.activeProjectId = projectId;
            state.projectOrder = [projectId];
            
            console.log('Created new project from old format:', newProject);
        }

        // Ensure migration version is set
        state.migrationVersion = 2;
        
        console.log('Final state after import:', {
            projectCount: Object.keys(state.projects).length,
            activeProjectId: state.activeProjectId,
            projects: Object.keys(state.projects).map(id => ({
                id,
                goal: state.projects[id].goal,
                tasksCount: state.projects[id].tasks.length,
                doneTasksCount: state.projects[id].doneTasks.length
            }))
        });

        // Save imported state
        console.log('Saving imported state to storage...');
        console.log('State before saving:', {
            projectCount: Object.keys(state.projects).length,
            activeProjectId: state.activeProjectId,
            migrationVersion: state.migrationVersion
        });
        
        await saveState();
        console.log('State saved successfully');
        
        // Update ProjectManager state reference
        projectManager.state = state;
        console.log('ProjectManager state updated');
        
        // Update UI
        updateUI();
        
        // Close settings modal
        closeSettings();
        
        // Reset the file input to allow importing the same file again
        const importInput = document.getElementById('importInput');
        if (importInput) {
            importInput.value = '';
        }
        
        // Show success message with details
        const projectCount = Object.keys(state.projects).length;
        const activeProject = projectManager.getActiveProject();
        const taskCounts = activeProject ? 
            `${activeProject.tasks.length} todo tasks, ${activeProject.doneTasks.length} completed tasks` : 
            'No active project';
        
        showNotification(
            'Import Successful', 
            `${projectCount} project(s) imported successfully!\n${taskCounts}`,
            'success'
        );
    } catch (error) {
        console.error('Import error:', error);
        
        // Reset the file input even on error
        const importInput = document.getElementById('importInput');
        if (importInput) {
            importInput.value = '';
        }
        
        showNotification(
            'Import Failed', 
            `Error importing data: ${error.message}\nPlease check the console for details.`,
            'error'
        );
    }
}

/**
 * Triggers a celebratory confetti and spark burst animation.
 * This is typically called when a user completes a task.
 */
function triggerConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    const colors = ['#ff6b6b', '#ff9500', '#ffdd00', '#4ecdc4', '#45b7d1', '#eb4d4b', '#6c5ce7', '#a29bfe'];
    const sparkColors = ['#ffff00', '#ffffff', '#ff8800', '#ff4444'];
    
    // Create main burst particles - BIGGER EXPLOSION!
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random angle for explosion
        const angle = (Math.PI * 2 * i) / 60;
        const velocity = 200 + Math.random() * 300; // Much bigger burst radius
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        confetti.style.backgroundColor = color;
        confetti.style.setProperty('--burst-x', Math.cos(angle) * velocity + 'px');
        confetti.style.setProperty('--burst-y', Math.sin(angle) * velocity + 'px');
        confetti.style.animationDelay = Math.random() * 0.15 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Create secondary burst ring for even bigger effect
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti secondary';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 150 + Math.random() * 200;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        confetti.style.backgroundColor = color;
        confetti.style.setProperty('--burst-x', Math.cos(angle) * velocity + 'px');
        confetti.style.setProperty('--burst-y', Math.sin(angle) * velocity + 'px');
        confetti.style.animationDelay = (0.1 + Math.random() * 0.2) + 's';
        confetti.style.animationDuration = (2.5 + Math.random() * 1) + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Create sparks for more firecracker effect - MORE SPARKS!
    for (let i = 0; i < 80; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 250; // Bigger spark range
        const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        
        spark.style.backgroundColor = color;
        spark.style.setProperty('--burst-x', Math.cos(angle) * velocity + 'px');
        spark.style.setProperty('--burst-y', Math.sin(angle) * velocity + 'px');
        spark.style.animationDelay = Math.random() * 0.3 + 's';
        spark.style.animationDuration = (1.2 + Math.random() * 1) + 's';
        
        confettiContainer.appendChild(spark);
    }
    
    // Remove confetti container after animation
    setTimeout(() => {
        if (document.body.contains(confettiContainer)) {
            document.body.removeChild(confettiContainer);
        }
    }, 3000);
}



// Initialize the extension
init(); 