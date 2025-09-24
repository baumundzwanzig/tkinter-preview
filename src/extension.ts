/**
 * Tkinter Preview Extension
 * 
 * VS Code extension that provides live preview of Tkinter GUI applications
 * by parsing Python code and rendering widgets as HTML/CSS without execution.
 */

import * as vscode from 'vscode';
import { TkinterPreviewPanel } from './webview/previewPanel';
import { TkinterFileWatcher } from './watcher/fileWatcher';
import { TkinterParser } from './parser/tkinterParser';

let fileWatcher: TkinterFileWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Tkinter Preview extension is now active!');

    // Initialize file watcher
    fileWatcher = new TkinterFileWatcher(context.extensionUri);
    context.subscriptions.push(fileWatcher);

    // Register commands
    registerCommands(context);

    // Register webview serializer for persistence
    registerWebviewSerializer(context);
}

function registerCommands(context: vscode.ExtensionContext) {
    // Command to open Tkinter preview
    const openPreviewCommand = vscode.commands.registerCommand('tkinter-preview.openPreview', (uri?: vscode.Uri) => {
        try {
            const targetUri = uri || getActiveEditorUri();
            
            if (!targetUri) {
                vscode.window.showErrorMessage('No Python file is currently open or selected.');
                return;
            }

            if (!targetUri.fsPath.endsWith('.py')) {
                vscode.window.showErrorMessage('Please select a Python file (.py).');
                return;
            }

            // Check if file has Tkinter imports
            checkTkinterImports(targetUri).then((hasTkinter) => {
                if (!hasTkinter) {
                    vscode.window.showWarningMessage(
                        'The selected Python file does not appear to contain Tkinter imports. ' +
                        'Preview may be empty or incomplete.'
                    );
                }
                
                // Create or show preview panel
                TkinterPreviewPanel.createOrShow(context.extensionUri, targetUri);
                
                // Update file watcher
                if (fileWatcher) {
                    fileWatcher.setCurrentPythonFile(targetUri);
                }
            }).catch((error) => {
                vscode.window.showErrorMessage(`Error checking Tkinter imports: ${error.message}`);
                // Still try to show preview
                TkinterPreviewPanel.createOrShow(context.extensionUri, targetUri);
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to open Tkinter preview: ${errorMessage}`);
            console.error('Error opening Tkinter preview:', error);
        }
    });

    // Command to refresh preview
    const refreshPreviewCommand = vscode.commands.registerCommand('tkinter-preview.refreshPreview', () => {
        try {
            if (TkinterPreviewPanel.currentPanel) {
                if (fileWatcher) {
                    fileWatcher.forceRefresh();
                } else {
                    TkinterPreviewPanel.currentPanel.refresh();
                }
                vscode.window.showInformationMessage('Tkinter preview refreshed.');
            } else {
                vscode.window.showWarningMessage('No Tkinter preview is currently open.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to refresh preview: ${errorMessage}`);
            console.error('Error refreshing preview:', error);
        }
    });

    // Register commands
    context.subscriptions.push(openPreviewCommand, refreshPreviewCommand);
}

function registerWebviewSerializer(context: vscode.ExtensionContext) {
    const provider = vscode.window.registerWebviewPanelSerializer(
        TkinterPreviewPanel.viewType,
        {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                try {
                    // Restore the webview panel
                    TkinterPreviewPanel.revive(webviewPanel, context.extensionUri);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('Error deserializing webview panel:', error);
                    vscode.window.showErrorMessage(`Failed to restore Tkinter preview: ${errorMessage}`);
                }
            }
        }
    );

    context.subscriptions.push(provider);
}

/**
 * Get URI of currently active editor
 */
function getActiveEditorUri(): vscode.Uri | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        return activeEditor.document.uri;
    }
    return undefined;
}

/**
 * Check if a Python file contains Tkinter imports
 */
async function checkTkinterImports(uri: vscode.Uri): Promise<boolean> {
    try {
        const content = await vscode.workspace.fs.readFile(uri);
        const pythonCode = Buffer.from(content).toString('utf8');
        return TkinterParser.hasTkinterImports(pythonCode);
    } catch (error) {
        console.error('Error reading file for Tkinter check:', error);
        throw error;
    }
}

export function deactivate() {
    console.log('Tkinter Preview extension is being deactivated.');
    
    // Clean up file watcher
    if (fileWatcher) {
        fileWatcher.dispose();
        fileWatcher = undefined;
    }

    // Clean up current panel
    if (TkinterPreviewPanel.currentPanel) {
        TkinterPreviewPanel.currentPanel.dispose();
    }
}
