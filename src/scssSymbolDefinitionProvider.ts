import * as vscode from 'vscode';
import { PathResolver } from './pathResolver';
import { parseUseStatements, parseSymbolReference, findSymbolInFile } from './scssHelpers';

export class ScssSymbolDefinitionProvider implements vscode.DefinitionProvider {
    private pathResolver: PathResolver;

    constructor(workspaceRoot: string) {
        this.pathResolver = new PathResolver(workspaceRoot);
    }

    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const range = document.getWordRangeAtPosition(position, /[\w-]+\.\$[\w-]+|\$[\w-]+|@include\s+[\w-]+\.[\w-]+|@include\s+[\w-]+/);
        
        if (!range) {
            return null;
        }

        const text = document.getText(range);
        const symbolRef = parseSymbolReference(text);
        
        if (!symbolRef) {
            return null;
        }

        const { moduleName, symbolName } = symbolRef;

        // Get all @use statements in the document
        const useStatements = parseUseStatements(document, this.pathResolver);
        
        let targetFile: string | null = null;
        
        if (moduleName) {
            // Find the file for the specified module
            const useStatement = useStatements.find(u => u.moduleName === moduleName);
            if (useStatement) {
                targetFile = useStatement.filePath;
            }
        } else {
            // No module prefix, search current file first, then all imported files
            const currentFileLocation = findSymbolInFile(document.uri.fsPath, symbolName);
            if (currentFileLocation) {
                return currentFileLocation;
            }
            
            // Search in all imported files
            for (const useStatement of useStatements) {
                const location = findSymbolInFile(useStatement.filePath, symbolName);
                if (location) {
                    return location;
                }
            }
            
            return null;
        }
        
        if (!targetFile) {
            return null;
        }
        
        return findSymbolInFile(targetFile, symbolName);
    }

    /**
     * Reload path mappings
     */
    public reload(): void {
        this.pathResolver.reload();
    }
}
