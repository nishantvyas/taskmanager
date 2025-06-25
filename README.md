# Goal Tracking Extension

A Chrome extension for tracking your goals with a countdown timer and task management system, featuring a GitHub-style activity matrix to visualize your daily progress.

## Features

- **Goal Countdown Timer**
  - Visual countdown showing days, hours, minutes, and seconds to your target date
  - Clean, modern interface with responsive design

- **Task Management**
  - To-Do and Done lists with drag-and-drop functionality
  - Task descriptions and timestamps
  - Mobile-friendly interface with swipe gestures
  - Automatic task sorting by last updated time

- **Activity Tracking**
  - GitHub-style activity matrix showing daily task completion
  - Different color intensities based on number of tasks completed
  - Interactive tooltips showing daily statistics
  - Current streak tracking

- **Data Persistence**
  - All data stored in Chrome's sync storage
  - Seamless synchronization across devices
  - Automatic state management

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
   git clone https://github.com/nishantvyas/goaltracking_extension.git
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

1. After installation, click the extension icon in your Chrome toolbar
2. Click the settings (⚙️) icon to set your goal and target date
3. Use the "+" button to add new tasks
4. Drag tasks between "To-Do" and "Done" lists (or swipe on mobile)
5. Click any task to edit its details
6. Watch your progress in the GitHub-style activity matrix!

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