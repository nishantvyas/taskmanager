# Multi-Project Implementation Plan

This document outlines a comprehensive plan to add multi-project support to the Goal Countdown Chrome Extension, allowing users to track multiple goals/projects simultaneously.

## Current Architecture Analysis

### Current State Structure
```javascript
let state = {
    goal: '',              // Single goal title
    targetDate: null,      // Single target date
    goalCreatedAt: null,   // Single creation timestamp
    tasks: [],            // Single task list
    doneTasks: []         // Single done task list
};
```

### Current Storage Strategy
- **Primary**: Chrome local storage (unlimited quota)
- **Backup**: Chrome sync storage (goal settings only)
- Migration system from sync to local storage
- Automatic cleanup of old completed tasks

### Current UI Structure
- Single goal display with countdown timer
- Single pair of To-Do/Done lists
- Single activity matrix for one project
- Settings modal for one goal/date configuration

## Proposed Multi-Project Architecture

### 1. New Data Model

#### Projects Collection Structure
```javascript
let state = {
    // New multi-project structure
    projects: {
        [projectId]: {
            id: projectId,
            goal: '',
            targetDate: null,
            goalCreatedAt: null,
            tasks: [],
            doneTasks: [],
            color: '#4CAF50',      // Project color theme
            isActive: true,        // Active/archived status
            order: 0,              // Display order
            createdAt: timestamp,
            updatedAt: timestamp
        }
    },
    
    // Global settings
    activeProjectId: null,     // Currently selected project
    projectOrder: [],          // Ordered list of project IDs
    globalSettings: {
        theme: 'light',
        defaultProjectColor: '#4CAF50',
        showCompletedProjects: false,
        maxProjects: 10
    },
    
    // Migration flag
    migrationVersion: 2
};
```

#### Enhanced Task Structure
```javascript
{
    id: 'task_uuid',
    title: '',
    description: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: timestamp,  // null if not completed
    projectId: projectId,    // Link to parent project
    tags: [],               // Optional task tags
    priority: 'medium'      // low, medium, high
}
```

### 2. Storage Strategy Updates

#### Storage Keys Structure
```javascript
// Chrome local storage keys
{
    'projects_data': JSON.stringify(state.projects),
    'global_settings': JSON.stringify(state.globalSettings),
    'active_project': state.activeProjectId,
    'project_order': JSON.stringify(state.projectOrder),
    'migration_version': state.migrationVersion
}

// Chrome sync storage (backup - small data only)
{
    'projects_metadata': JSON.stringify({
        projectIds: Object.keys(state.projects),
        activeProjectId: state.activeProjectId,
        globalSettings: state.globalSettings
    })
}
```

#### Migration Strategy
1. **Phase 1**: Detect existing single-project data
2. **Phase 2**: Convert to first project in new structure
3. **Phase 3**: Add migration version tracking
4. **Phase 4**: Clean up old storage keys

### 3. UI/UX Design Changes

#### Navigation Structure
```
Header
├── Project Selector Dropdown
│   ├── Project 1 (Active)
│   ├── Project 2
│   ├── Project 3
│   ├── ──────────
│   ├── + New Project
│   └── Manage Projects
├── Settings Button
└── Project Actions Menu (•••)
    ├── Edit Project
    ├── Duplicate Project
    ├── Archive Project
    └── Delete Project
```

#### Project Selector Component
- Dropdown with project list
- Visual indicators: active project, progress bars
- Color-coded project identification
- Quick project switching
- Search/filter for many projects

#### Enhanced Settings Modal
```
Settings Modal
├── Tab: Current Project
│   ├── Goal Title
│   ├── Target Date
│   ├── Project Color
│   └── Archive/Delete Options
├── Tab: All Projects
│   ├── Project List (reorderable)
│   ├── Bulk Actions
│   └── Import/Export Options
└── Tab: Global Settings
    ├── Theme Selection
    ├── Default Project Settings
    └── Display Preferences
```

#### Activity Matrix Updates
- Show activity for currently selected project
- Option to view combined activity across all projects
- Project color coding in activity cells
- Tooltip shows project-specific stats

### 4. Core Implementation Steps

#### Step 1: Data Layer Migration (Priority: Critical)
```javascript
// New state management functions
async function migrateToMultiProject()
async function loadProjectsState()
async function saveProjectsState()
async function createProject(projectData)
async function updateProject(projectId, updates)
async function deleteProject(projectId)
async function setActiveProject(projectId)
```

#### Step 2: Project Management Service
```javascript
class ProjectManager {
    constructor()
    async createProject(projectData)
    async getProject(projectId)
    async updateProject(projectId, updates)
    async deleteProject(projectId)
    async duplicateProject(projectId)
    async archiveProject(projectId)
    getActiveProject()
    setActiveProject(projectId)
    getAllProjects()
    getProjectOrder()
    reorderProjects(newOrder)
}
```

#### Step 3: UI Component Updates

##### Project Selector Component
```javascript
class ProjectSelector {
    constructor(container, projectManager)
    render()
    handleProjectChange(projectId)
    showProjectCreationModal()
    updateProjectList()
}
```

##### Enhanced Task Management
```javascript
// Update existing task functions to be project-aware
function addTask(projectId, taskData)
function moveTask(taskId, fromProject, toProject)
function deleteTask(taskId, projectId)
function getProjectTasks(projectId)
```

#### Step 4: Activity Matrix Enhancement
```javascript
// Update activity matrix to be project-specific
function generateActivityMatrix(projectId)
function generateCombinedActivityMatrix()
function updateActivityDisplay(projectId)
```

### 5. Storage Optimization Strategy

#### Storage Efficiency
- **Local Storage**: Full project data (unlimited quota)
- **Sync Storage**: Metadata only (small backup for sync across devices)
- **Compression**: JSON compression for large datasets
- **Cleanup**: Automatic archival of old completed projects

#### Performance Considerations
- **Lazy Loading**: Load only active project data initially
- **Caching**: Cache frequently accessed project data
- **Indexing**: Maintain project lookup indices
- **Batch Operations**: Group storage operations to reduce I/O

### 6. Backward Compatibility

#### Migration Process
1. **Detection**: Check for existing single-project data
2. **Conversion**: Transform existing data to first project
3. **Validation**: Ensure data integrity after migration
4. **Cleanup**: Remove old storage keys after successful migration
5. **Fallback**: Revert mechanism if migration fails

#### Data Migration Example
```javascript
async function migrateExistingData() {
    const oldData = await chrome.storage.local.get(['goalState', 'tasks', 'doneTasks']);
    
    if (oldData.goalState) {
        const oldState = JSON.parse(oldData.goalState);
        const firstProject = {
            id: generateProjectId(),
            goal: oldState.goal || 'My First Project',
            targetDate: oldState.targetDate,
            goalCreatedAt: oldState.goalCreatedAt,
            tasks: JSON.parse(oldData.tasks || '[]'),
            doneTasks: JSON.parse(oldData.doneTasks || '[]'),
            color: '#4CAF50',
            isActive: true,
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const newState = {
            projects: { [firstProject.id]: firstProject },
            activeProjectId: firstProject.id,
            projectOrder: [firstProject.id],
            globalSettings: { /* defaults */ },
            migrationVersion: 2
        };
        
        await saveProjectsState(newState);
        await cleanupOldStorage();
    }
}
```

### 7. User Experience Enhancements

#### Project Creation Workflow
1. **Quick Create**: "+" button creates project with minimal input
2. **Template Selection**: Choose from predefined project templates
3. **Import Project**: Import from exported JSON file
4. **Duplicate Existing**: Copy structure from existing project

#### Project Management Features
- **Drag & Drop Reordering**: Reorder projects in selector
- **Color Themes**: 8-10 predefined color themes per project
- **Progress Indicators**: Visual progress bars in project selector
- **Search/Filter**: Find projects quickly when list grows large
- **Archive System**: Hide completed projects without deletion

#### Bulk Operations
- **Export All Projects**: Single JSON export with all data
- **Import Multiple**: Import projects from external backup
- **Bulk Archive**: Archive multiple completed projects
- **Bulk Delete**: Mass deletion with confirmation

### 8. Implementation Timeline

#### Phase 1 (Week 1-2): Foundation
- [ ] Design new data model
- [ ] Implement migration system
- [ ] Create ProjectManager service
- [ ] Update storage functions

#### Phase 2 (Week 3-4): Core UI
- [ ] Build project selector component
- [ ] Update task management for multi-project
- [ ] Modify activity matrix for project-specific data
- [ ] Enhanced settings modal

#### Phase 3 (Week 5-6): Advanced Features
- [ ] Project templates system
- [ ] Bulk operations
- [ ] Import/export enhancements
- [ ] Search and filtering

#### Phase 4 (Week 7-8): Polish & Testing
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Error handling and edge cases
- [ ] Documentation updates

### 9. Technical Considerations

#### Performance Impact
- **Memory Usage**: Multiple projects increase memory footprint
- **Storage I/O**: More complex storage operations
- **UI Rendering**: Additional DOM manipulation for project switching
- **Activity Matrix**: Potentially larger datasets to process

#### Mitigation Strategies
- **Lazy Loading**: Load projects on demand
- **Virtual Scrolling**: For large project lists
- **Data Pagination**: Split large task lists
- **Background Processing**: Heavy operations in separate threads

#### Error Handling
- **Storage Failures**: Graceful degradation and retry logic
- **Migration Failures**: Rollback mechanism
- **Data Corruption**: Validation and repair functions
- **Sync Conflicts**: Resolution strategies for multi-device usage

### 10. Testing Strategy

#### Unit Tests
- ProjectManager class methods
- Data migration functions
- Storage operations
- Utility functions

#### Integration Tests
- Complete project creation workflow
- Project switching functionality
- Data persistence across sessions
- Migration from single to multi-project

#### User Acceptance Tests
- Project management workflows
- Task management across projects
- Import/export functionality
- Performance with many projects

### 11. Deployment Strategy

#### Rollout Plan
1. **Internal Testing**: Thorough testing with migration scenarios
2. **Beta Release**: Limited rollout to test migration safety
3. **Staged Deployment**: Gradual rollout with monitoring
4. **Full Release**: Complete deployment with rollback capability

#### Risk Mitigation
- **Data Backup**: Automatic backup before migration
- **Rollback Plan**: Ability to revert to single-project mode
- **Monitoring**: Track migration success rates
- **Support**: Clear communication about new features

### 12. Future Enhancements

#### Advanced Features (Future Versions)
- **Project Sharing**: Share projects between users
- **Team Collaboration**: Multiple users on same project
- **Project Templates**: Community-shared templates
- **Analytics Dashboard**: Cross-project analytics
- **Calendar Integration**: Sync with external calendars
- **Notification System**: Project-specific reminders

#### Scalability Considerations
- **Cloud Sync**: Beyond Chrome sync storage
- **Mobile App**: Companion mobile application
- **Web Version**: Full web application version
- **API Integration**: Connect with external project management tools

---

## Implementation Checklist

### Data Layer
- [ ] Design new state structure
- [ ] Implement ProjectManager class
- [ ] Create migration functions
- [ ] Update storage functions
- [ ] Add data validation

### UI Components
- [ ] Project selector dropdown
- [ ] Enhanced settings modal
- [ ] Project management interface
- [ ] Updated activity matrix
- [ ] Responsive design updates

### Core Features
- [ ] Project CRUD operations
- [ ] Project switching
- [ ] Task assignment to projects
- [ ] Multi-project activity tracking
- [ ] Import/export functionality

### Testing & Deployment
- [ ] Unit test suite
- [ ] Integration tests
- [ ] Migration testing
- [ ] Performance testing
- [ ] User acceptance testing

This comprehensive plan provides a roadmap for transforming the single-project Goal Countdown extension into a robust multi-project management tool while maintaining backward compatibility and ensuring a smooth user experience.