# Task Manager Chrome Extension

A Chrome extension for managing your tasks and tracking goals with a countdown timer, featuring a GitHub-style activity matrix to visualize your daily progress.

## Features

- **Goal Countdown Timer**
  - Visual countdown showing days, hours, minutes, and seconds to your target date
  - Clean, modern interface with responsive design

- **Multi-Project Management**
  - Create and manage multiple projects, each with its own goal, tasks, and color theme.
  - Easily switch between projects via a dropdown menu.

- **Task Management**
  - To-Do and Done lists with drag-and-drop functionality.
  - Add detailed descriptions to your tasks.
  - Mobile-friendly interface with swipe gestures to move tasks.
  - Automatic task sorting by last updated time.

- **Activity Tracking**
  - GitHub-style activity matrix showing daily task completion.
  - Color-coded cells to reflect daily productivity.
  - Interactive tooltips showing daily statistics.
  - Current activity streak tracking.

- **Data Persistence & Backup**
  - All data is stored securely in Chrome's local storage, with a metadata backup to sync storage for cross-device consistency.
  - Import and Export your data as a JSON file for easy backups and migration.

## Installation

### Quick Installation (Non-technical Users)
1. Download this repository by clicking the green "Code" button above and selecting "Download ZIP"
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the `dist` folder from the extracted files
6. The extension is now installed! You'll see its icon in your Chrome toolbar

### Developer Installation (Technical Users)
1. Clone the repository:
   ```bash
   git clone https://github.com/nishantvyas/taskmanager.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Usage Guide

1.  **Set Your Goal**: After installation, click the extension icon. Click the main title or the settings (⚙️) icon to set your first project's goal and target date.
2.  **Manage Projects**: Use the project name dropdown to switch between projects or to create new ones using the "+" button.
3.  **Add Tasks**: Use the "+" button in the "To-Do" list header to add new tasks. Click any task to edit its title and add a description.
4.  **Complete Tasks**: Drag tasks from "To-Do" to "Done". On mobile, simply swipe a task to move it.
5.  **Track Progress**: Watch your daily progress fill up the activity matrix at the top. Hover over any day to see your stats.
6.  **Backup Your Data**: In the settings (⚙️) menu, go to the "Global Settings" tab to export all your project data to a JSON file for backup. You can import this file later to restore your data.

## Development

- Built with Vite for modern development experience
- Uses vanilla JavaScript for lightweight performance
- Implements modern CSS features for styling
- Mobile-first responsive design

To start development server:
```bash
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 