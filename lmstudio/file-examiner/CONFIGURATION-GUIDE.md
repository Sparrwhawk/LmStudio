# Where to Look for Plugin Configuration in LM Studio

## UI Locations to Check:

### Main Interface:
1. **Top Menu Bar** → Settings → Plugins/Extensions
2. **Sidebar** → Look for a plugins/tools icon
3. **Settings Panel** → Developer → Extensions
4. **Chat Interface** → Tools panel → Configure

### Model-Specific Settings:
1. **Model Settings** → When loading a model, check for plugin options
2. **Chat Configuration** → Look for tools/plugins section
3. **Preset Settings** → Check if plugin config is part of presets

### Advanced Locations:
1. **Right-click on plugin name** (if visible anywhere)
2. **Long-press or context menu** on plugin entries
3. **Developer Console** → F12 → Look for plugin configuration options

## Screenshot Request:
If possible, take a screenshot of your LM Studio interface showing:
- The main settings panel
- Any plugins/extensions sections
- The chat interface with tools enabled

This will help me identify where the configuration should appear in your specific LM Studio version.

## Current Workarounds:
1. Edit `plugin-config.json` manually (created above)
2. Use environment variables (`config-env-vars.ps1`)
3. Modify plugin source code defaults directly

## Fallback: Edit Plugin Defaults
If no UI is available, you can edit the default values in:
`src/config.ts` → Change the default values and recompile