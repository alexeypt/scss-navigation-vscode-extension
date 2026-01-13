# SCSS Navigation Extension

A VSCode extension that provides better intellisense for SCSS files with configurable path mapping support.

## Features
- Go to Definition for @use and @import statements
- Configurable path mappings or load paths via VS Code settings
- Supports SCSS partials (files starting with _)
- Auto-detects multiple file extensions

## Configuration

Choose one of the following configuration methods:

### Option A: Path Mappings (Alias-based)

Add to your `.vscode/settings.json`:

```json
{
  "scssNavigation.pathMappings": {
    "styles/*": "./src/styles/*"
  }
}
```

### Option B: Load Paths (Search directories)

Add to your `.vscode/settings.json`:

```json
{
  "scssNavigation.loadPaths": [
    "./src/styles",
    "./src/components"
  ]
}
```

**Note:** Only one of `pathMappings` or `loadPaths` should be specified.

## Testing the Extension

1. Press **F5** to launch the extension in a new Extension Development Host window
2. Configure path mappings in settings
3. Test with an SCSS file containing:
```scss
@use 'styles/variables';
@use 'styles/mixins/anchored-content';
```
4. Ctrl+Click on the import paths to navigate to the files

## File Structure
- `src/extension.ts` - Main extension activation
- `src/scssDefinitionProvider.ts` - Definition provider implementation
- `src/pathResolver.ts` - Path mapping resolver from VS Code settings
