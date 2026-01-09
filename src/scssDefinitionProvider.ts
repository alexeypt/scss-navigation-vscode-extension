import * as vscode from 'vscode';
import * as fs from 'fs';
import { PathResolver } from './pathResolver';

export class ScssDefinitionProvider implements vscode.DefinitionProvider {
    private pathResolver: PathResolver;

    constructor(workspaceRoot: string) {
        this.pathResolver = new PathResolver(workspaceRoot);
    }

    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const line = document.lineAt(position);
        const lineText = line.text;

        // Check if the line contains @use or @import
        const useMatch = lineText.match(/@use\s+['"]([^'"]+)['"]/);
        const importMatch = lineText.match(/@import\s+['"]([^'"]+)['"]/);
        
        const match = useMatch || importMatch;
        
        if (!match) {
            return null;
        }

        const importPath = match[1];

        // Resolve the import path
        const resolvedPaths = this.pathResolver.resolve(importPath, document.uri.fsPath);

        if (resolvedPaths.length === 0) {
            return null;
        }

        // Return the first resolved path as a location
        const resolvedPath = resolvedPaths[0];
        
        if (!fs.existsSync(resolvedPath)) {
            return null;
        }
        
        const targetUri = vscode.Uri.file(resolvedPath);
        return new vscode.Location(targetUri, new vscode.Position(0, 0));
    }

    /**
     * Reload path mappings (call when config files change)
     */
    public reload(): void {
        this.pathResolver.reload();
    }
}
