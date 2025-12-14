# Tab Counter

A tab counter extension for both Chrome and Firefox.
- Chrome: manifest version 3
- Firefox: manifest version 2

<div align="center">
<img src="https://github.com/user-attachments/assets/f50058bf-80ba-4e68-9049-e1f18e97b7e5" alt="demo" style="height:25%; width:25%;" />
</div>

## Features

- Display the number of opened tabs in the current window and total across all windows
- Group tabs by domain with expandable lists
- Show tab creation time with relative timestamps (e.g., "5m ago", "2h 15m ago", "1d 3h ago")
- Click any tab to switch to it instantly
- Active tab indicator for tabs in the current window
- Dark/light mode support (follows system preference)
- Refined editorial design with elegant typography

## How to build from source

Install dependencies:
```bash
pnpm install
```

Build for Firefox:
```bash
pnpm build:firefox
```

Build for Chrome:
```bash
pnpm build:chrome
```

## Firefox installation

1. Download the `.zip` file from the `dist` folder
2. Go to `about:addons` in Firefox
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded `.zip` file

For development/unsigned extensions:
- Disable `xpinstall.signatures.required` in [about:config](about:config)

## Chrome installation

1. Build the extension with `pnpm build:chrome`
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist-chrome` folder
