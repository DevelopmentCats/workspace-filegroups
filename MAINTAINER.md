# Workspace File Groups - Maintainer Guide

This guide covers the development, release, and maintenance processes for the Workspace File Groups plugin.

## 🚀 Release Process

### Prerequisites
- Ensure all changes are committed and pushed to the main branch
- All tests pass (run `npm run build` to verify)
- Plugin has been tested in Obsidian

### Version Release Steps

1. **Update Version Number**
   ```bash
   # Update package.json and manifest.json versions
   npm run version
   ```
   This script automatically updates both files and creates a `versions.json` entry.

2. **Commit Version Changes**
   ```bash
   git add manifest.json package.json versions.json
   git commit -m "chore: bump version to X.X.X"
   git push origin main
   ```

3. **Create Release Tag**
   ```bash
   # Replace X.X.X with your version number (e.g., 1.0.1)
   git tag -a "v1.0.1" -m "Release version 1.0.1"
   git push origin "v1.0.1"
   ```

4. **Automated Release**
   - GitHub Actions automatically triggers on version tags
   - Builds the plugin for production
   - Creates GitHub release with assets:
     - `workspace-filegroups-X.X.X.zip`
     - `workspace-filegroups-X.X.X.tar.gz`
     - Individual files (`main.js`, `manifest.json`, `styles.css`)

### Manual Release (if needed)
```bash
# Build and package manually
npm run release
```

## 🔄 Development Workflow

### Local Development
```bash
# Start development with file watching
npm run dev

# Single development build
npm run build

# Output: dist/workspace-filegroups-X.X.X/
```

### Installation for Testing
1. Build the plugin: `npm run build`
2. Copy `dist/workspace-filegroups-X.X.X/` to your vault's `.obsidian/plugins/` directory
3. Enable the plugin in Obsidian settings

## 📦 Build System

### Commands Overview
- `npm run dev` - Development build with file watching
- `npm run build` - Single development build  
- `npm run release` - Production build + packaging for distribution
- `npm run clean` - Remove all build artifacts
- `npm run version` - Bump version numbers

### Build Output
All builds output to `dist/workspace-filegroups-VERSION/` containing:
- `main.js` - Bundled plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles

## 🏷️ Version Management

### Semantic Versioning
We follow [semantic versioning](https://semver.org/):
- **MAJOR** (X.0.0) - Breaking changes
- **MINOR** (0.X.0) - New features, backward compatible
- **PATCH** (0.0.X) - Bug fixes, backward compatible

### Version Files
- `package.json` - NPM package version
- `manifest.json` - Obsidian plugin version
- `versions.json` - Version history for Obsidian plugin store

### Automatic Version Bumping
```bash
# The version-bump.mjs script handles:
npm run version
# 1. Prompts for version type (major/minor/patch)
# 2. Updates package.json
# 3. Updates manifest.json  
# 4. Creates versions.json entry
# 5. Stages files for commit
```

## 🔧 Code Quality

### TypeScript Compilation
```bash
# Type checking (automatically run before builds)
npx tsc -noEmit -skipLibCheck
```

### Code Formatting
```bash
# Format code with Prettier
npx prettier --write src/
```

### Linting
```bash
# ESLint checking
npx eslint src/
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Plugin loads without errors
- [ ] Status bar workspace switcher works
- [ ] Workspace switching hides/shows correct folders
- [ ] Settings interface loads and saves correctly
- [ ] Hierarchical folder selection works
- [ ] New folder auto-addition works
- [ ] Folder renaming updates paths correctly
- [ ] Plugin unloads cleanly

### Test Scenarios
1. **Basic Functionality**
   - Create workspaces with Obsidian's Workspaces plugin
   - Configure folder visibility in plugin settings
   - Switch between workspaces via status bar

2. **Dynamic Content**
   - Create new folders while in different workspaces
   - Rename folders and verify path updates
   - Create subfolders in visible/hidden parent folders

3. **Edge Cases**
   - Empty vaults (no folders)
   - No workspaces configured
   - Very deep folder hierarchies
   - Special characters in folder names

## 📋 Release Checklist

### Pre-Release
- [ ] All new features tested
- [ ] No console errors in Obsidian
- [ ] Documentation updated
- [ ] Version number appropriate
- [ ] Clean build passes

### Release
- [ ] Version bumped with `npm run version`
- [ ] Version changes committed and pushed
- [ ] Release tag created and pushed
- [ ] GitHub Actions workflow completes successfully
- [ ] Release assets generated correctly

### Post-Release
- [ ] Test installation from GitHub release
- [ ] Verify download links work
- [ ] Update any external documentation
- [ ] Monitor for user feedback/issues

## 🔍 Troubleshooting

### Build Issues
```bash
# Clean slate
npm run clean
npm install
npm run build
```

### Release Workflow Issues
- Check GitHub Actions logs for errors
- Verify tag format matches `v*.*.*` pattern
- Ensure all files are committed before tagging

### Plugin Issues
- Check browser console for JavaScript errors
- Verify plugin loads in Obsidian's community plugins
- Test with minimal Obsidian setup

## 📁 Project Structure

```
workspace-filegroups/
├── .github/workflows/release.yml  # GitHub Actions release workflow
├── src/                          # TypeScript source code
│   ├── main.ts                   # Main plugin class
│   ├── WorkspaceFileGroupsSettingTab.ts  # Settings interface
│   ├── interfaces.ts             # TypeScript interfaces
│   └── utils.ts                  # Utility functions
├── dist/                         # Build output (gitignored)
├── scripts/release.sh            # Manual release script
├── manifest.json                 # Obsidian plugin manifest
├── package.json                  # NPM configuration
├── versions.json                 # Version history
├── esbuild.config.mjs           # Build configuration
├── tsconfig.json                # TypeScript configuration
└── styles.css                   # Plugin styles
```

## 🆘 Support

### Common Issues
- **Plugin not loading**: Check console for errors, verify manifest.json
- **Folders not hiding**: Check workspace configuration in settings
- **Status bar not showing**: Verify plugin is enabled

### Getting Help
1. Check GitHub Issues for similar problems
2. Create detailed bug report with:
   - Obsidian version
   - Plugin version  
   - Steps to reproduce
   - Console errors (if any)

---

## Quick Reference

### Release a New Version
```bash
npm run version        # Bump version
git add . && git commit -m "chore: bump version to X.X.X"
git push origin main
git tag -a "vX.X.X" -m "Release version X.X.X"
git push origin "vX.X.X"
```

### Development Build
```bash
npm run build
# Install: Copy dist/workspace-filegroups-X.X.X/ to .obsidian/plugins/
``` 