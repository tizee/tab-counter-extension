# Tab Counter

A tab counter extension for both Chrome and Firefox.
- Chrome: manifest version 3
- Firefox: manifest version 2

<div align="center">
<img src="https://github.com/user-attachments/assets/f50058bf-80ba-4e68-9049-e1f18e97b7e5" alt="demo" style="height:25%; width:25%;" />
</div>


## Feature

Display the number of opened tabs in the current window.

## How to build from source

- install `web-ext`
```
pnpm install --global web-ext
```

- build
```
make firefox
```

## Firefox installation

- Disable `xpinstall.signatures.required` in [about:config](about:config)
