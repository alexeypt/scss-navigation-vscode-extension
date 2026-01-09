# SCSS Navigation Extension

A VSCode extension that provides better intellisense for SCSS files with configurable path mapping support.

## Features
- Go to Definition for @use and @import statements
- Configurable path mappings via VS Code settings
- Supports SCSS partials (files starting with _)
- Auto-detects multiple file extensions

## Configuration

Add to your `.vscode/settings.json`:

```json
{
  "scssNavigation.baseUrl": ".",
  "scssNavigation.pathMappings": {
    "styles/*": "./src/styles/*"
  }
}
```

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
