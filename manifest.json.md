# Manifest File Documentation (`manifest.json`)

This document explains the purpose of each key in the `manifest.json` file, which is the central configuration file for this Chrome extension.

-   `"manifest_version"`: Specifies the version of the manifest file format being used. Version 3 is the latest and is required for new extensions.

-   `"name"`: The official name of the extension, as it will appear in the Chrome Web Store and the browser's extension management page.

-   `"version"`: The version number of this extension. This is used for updates in the Chrome Web Store.

-   `"description"`: A brief description of the extension's purpose.

-   `"permissions"`: An array of permissions the extension requires to function. In this case, `"storage"` is requested to use the `chrome.storage` API for saving user data (tasks, goals, etc.).

-   `"chrome_url_overrides"`: This key allows the extension to replace a default Chrome page. Here, `"newtab": "index.html"` means that whenever the user opens a new tab, it will display the `index.html` file from this extension instead of the default Chrome new tab page.

-   `"icons"`: An object specifying the paths to the extension's icons at different sizes. These are used in various places, such as the extensions management page and the favicon of the new tab page.
    -   `"16"`: 16x16 pixels, used as the favicon.
    -   `"48"`: 48x48 pixels, used on the extensions management page.
    -   `"128"`: 128x128 pixels, used during installation and by the Chrome Web Store.

-   `"action"`: Defines the extension's icon in the Chrome toolbar (the "action" button).
    -   `"default_icon"`: Specifies the icons to be used for the toolbar button at different resolutions.
