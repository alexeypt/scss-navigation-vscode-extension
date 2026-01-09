import * as vscode from 'vscode';
import { ScssDefinitionProvider } from './scssDefinitionProvider';
import { ScssLinkProvider } from './scssLinkProvider';
import { ScssSymbolDefinitionProvider } from './scssSymbolDefinitionProvider';
import { ScssHoverProvider } from './scssHoverProvider';
import { ScssCompletionProvider } from './scssCompletionProvider';

export function activate(context: vscode.ExtensionContext) {
	// Get workspace folder
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return;
	}

	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	const definitionProvider = new ScssDefinitionProvider(workspaceRoot);
	const linkProvider = new ScssLinkProvider(workspaceRoot);
	const symbolDefinitionProvider = new ScssSymbolDefinitionProvider(workspaceRoot);
	const hoverProvider = new ScssHoverProvider(workspaceRoot);
	const completionProvider = new ScssCompletionProvider(workspaceRoot);

	// Register definition provider for SCSS and Sass files
	const scssSelector: vscode.DocumentSelector = [
		{ scheme: 'file', language: 'scss' },
		{ scheme: 'file', language: 'sass' }
	];

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(scssSelector, definitionProvider)
	);

	// Register symbol definition provider for variables and mixins
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(scssSelector, symbolDefinitionProvider)
	);

	// Register hover provider for variables and mixins
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(scssSelector, hoverProvider)
	);

	// Register completion provider
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			scssSelector,
			completionProvider,
			'$', '@', '.'  // Trigger characters
		)
	);

	// Register document link provider for Ctrl+Click navigation
	context.subscriptions.push(
		vscode.languages.registerDocumentLinkProvider(scssSelector, linkProvider)
	);

	// Watch for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('scssNavigation')) {
				definitionProvider.reload();
				linkProvider.reload();
				symbolDefinitionProvider.reload();
				hoverProvider.reload();
				completionProvider.reload();
			}
		})
	);
}

export function deactivate() {}
