# SCSS Navigation

A comprehensive VS Code extension for enhanced SCSS/Sass development with intelligent navigation, autocomplete, and path mapping support.

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/alexeypt.scss-navigation-intellisense?style=flat&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=alexeypt.scss-navigation-intellisense)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/alexeypt.scss-navigation-intellisense?style=flat)](https://marketplace.visualstudio.com/items?itemName=alexeypt.scss-navigation-intellisense)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/alexeypt.scss-navigation-intellisense?style=flat)](https://marketplace.visualstudio.com/items?itemName=alexeypt.scss-navigation-intellisense)

**[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=alexeypt.scss-navigation-intellisense)**

## Features

### Navigation

- **Import Navigation** - Jump to files from `@use` and `@import` statements (F12 or Ctrl+Click)
- **Variable Navigation** - Jump to variable declarations (`$variable` or `module.$variable`)
- **Mixin Navigation** - Jump to mixin definitions (`@include mixin` or `@include module.mixin`)
- **Path Mapping** - Configure custom path aliases for cleaner imports

### IntelliSense

- **Hover Tooltips** - View variable values and mixin code on hover
- **Autocomplete** - Smart suggestions for:
  - Variables (type `$`)
  - Mixins (type `@include`)
  - Functions (type function name)
- **Module Support** - Autocomplete understands module namespaces

### File Resolution

- Automatic SCSS partial detection (files starting with `_`)
- Multiple file extension support (.scss, .sass, .css)
- Index file detection (/index.scss, /_index.scss)

## Usage

### 1. Configure Path Resolution

Choose **one** of the following configuration methods:

#### Option A: Path Mappings (Alias-based)

Use path mappings when you want to define custom aliases for your imports. Paths are always resolved from the workspace root.

Add to `.vscode/settings.json`:

```json
{
  "scssNavigation.pathMappings": {
    "styles/*": "./src/styles/*",
    "components/*": "./src/components/*"
  }
}
```

Then use in your SCSS:
```scss
@use 'styles/variables';          // → ./src/styles/variables.scss
@use 'components/button/styles';  // → ./src/components/button/styles.scss
```

#### Option B: Load Paths (Search directories)

Use load paths when you want to search multiple directories for imports. Files are first resolved relative to the current file, then searched in each load path directory.

Add to `.vscode/settings.json`:

```json
{
  "scssNavigation.loadPaths": [
    "./src/styles",
    "./src/components",
    "./shared/styles"
  ]
}
```

Then use in your SCSS:
```scss
@use 'variables';        // Searches in loadPaths if not found relative to current file
@use 'mixins/flexbox';   // Searches in loadPaths/mixins/
```

### 2. Use in Your SCSS Files
**Navigate to declarations:**
```scss
.container {
    // Press F12 on $screen-sm to jump to declaration
    width: variables.$screen-sm;
    
    // Press F12 on flex-center to jump to mixin
    @include mixins.flex-center();
}
```

**Get autocomplete:**
- Type `$` to see all available variables
- Type `@include` to see all available mixins
- Hover over symbols to see their values/definitions

## Configuration

### `scssNavigation.pathMappings`

Define path aliases for your SCSS imports. Each key is a pattern (use `*` as wildcard) and value is the target path relative to workspace root.

**Note:** Only one of `pathMappings` or `loadPaths` should be specified.

**Example:**
```json
{
  "scssNavigation.pathMappings": {
    "styles/*": "./src/styles/*",
    "components/*": "./src/components/*",
    "@shared/*": "./shared/styles/*"
  }
}
```

### `scssNavigation.loadPaths`

Define directories to search for stylesheets referenced in `@use` and `@import` rules. Files are first resolved relative to the current file, then searched in each directory specified in loadPaths.

**Note:** Only one of `loadPaths` or `pathMappings` should be specified.

**Example:**
```json
{
  "scssNavigation.loadPaths": [
    "./src/styles",
    "./src/components",
    "./node_modules"
  ]
}
```

## Path Resolution

The extension resolves imports in the following order:

### When using pathMappings:
1. **Path mappings** from extension configuration (resolved from workspace root)
2. **Relative paths** from the current file
3. **SCSS partials** (tries with underscore prefix)
4. **Index files** (/index.scss, /_index.scss)

### When using loadPaths:
1. **Relative paths** from the current file
2. **Load paths** (searches each directory in order)
3. **SCSS partials** (tries with underscore prefix)
4. **Index files** (/index.scss, /_index.scss)

## Requirements

- VS Code 1.107.0 or higher

## Known Issues

- Only supports file system paths (no node_modules resolution yet)
- Requires the workspace to be opened for path mapping resolution

## Release Notes

### 1.0.0

Initial release featuring:
- **Navigation**: Go to Definition for imports, variables, and mixins
- **IntelliSense**: Autocomplete for variables, mixins, and functions
- **Hover**: Display variable values and mixin code
- **Path Mapping**: Configurable path aliases via VS Code settings
- **Module Support**: Full support for SCSS module system with namespaces
- **File Detection**: SCSS partials, index files, multiple extensions

---

**Enjoy!**

