import * as vscode from 'vscode';
import * as fs from 'fs';
import { PathResolver } from './pathResolver';

export class ScssLinkProvider implements vscode.DocumentLinkProvider {
    private pathResolver: PathResolver;

    constructor(workspaceRoot: string) {
        this.pathResolver = new PathResolver(workspaceRoot);
    }

    public provideDocumentLinks(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentLink[]> {
        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        
        // Regex to match @use and @import statements
        const importRegex = /@(?:use|import)\s+['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = importRegex.exec(text)) !== null) {
            const importPath = match[1];
            const startPos = document.positionAt(match.index + match[0].indexOf(importPath));
            const endPos = document.positionAt(match.index + match[0].indexOf(importPath) + importPath.length);
            const range = new vscode.Range(startPos, endPos);
            
            // Resolve the import path
            const resolvedPaths = this.pathResolver.resolve(importPath, document.uri.fsPath);
            
            if (resolvedPaths.length > 0 && fs.existsSync(resolvedPaths[0])) {
                const targetUri = vscode.Uri.file(resolvedPaths[0]);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Go to ${resolvedPaths[0]}`;
                links.push(link);
            }
        }
        
        return links;
    }

    /**
     * Reload path mappings
     */
    public reload(): void {
        this.pathResolver.reload();
    }
}
