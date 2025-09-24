/**
 * Tkinter Preview Panel
 * 
 * Creates and manages the webview panel that displays the Tkinter preview
 */

import * as vscode from 'vscode';
import { TkinterParser, TkinterWidget } from '../parser/tkinterParser';
import { TkinterHtmlConverter } from '../converter/simpleHtmlConverter';

export class TkinterPreviewPanel {
    public static currentPanel: TkinterPreviewPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];
    private parser: TkinterParser;
    private converter: TkinterHtmlConverter;

    public static readonly viewType = 'tkinterPreview';

    public static createOrShow(extensionUri: vscode.Uri, pythonUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : undefined;

        // If we already have a panel, show it
        if (TkinterPreviewPanel.currentPanel) {
            TkinterPreviewPanel.currentPanel.panel.reveal(column);
            TkinterPreviewPanel.currentPanel.updateContent(pythonUri);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            TkinterPreviewPanel.viewType,
            'Tkinter Preview',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        TkinterPreviewPanel.currentPanel = new TkinterPreviewPanel(panel, extensionUri);
        TkinterPreviewPanel.currentPanel.updateContent(pythonUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        TkinterPreviewPanel.currentPanel = new TkinterPreviewPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.parser = new TkinterParser();
        this.converter = new TkinterHtmlConverter();

        // Set the webview's initial html content
        this.updateWebview();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'refresh':
                        if (message.uri) {
                            this.updateContent(vscode.Uri.parse(message.uri));
                        }
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    public updateContent(pythonUri: vscode.Uri) {
        // Read the Python file
        vscode.workspace.fs.readFile(pythonUri).then(
            (content) => {
                const pythonCode = Buffer.from(content).toString('utf8');
                
                // Parse the Python code
                const parseResult = this.parser.parse(pythonCode);
                
                // Convert to HTML
                const conversionResult = this.converter.convert(parseResult.widgets);
                
                // Update the webview
                this.updateWebview(conversionResult.html, conversionResult.css, parseResult, conversionResult);
                
                // Update panel title with filename
                const filename = pythonUri.path.split('/').pop() || 'Unknown';
                this.panel.title = `Tkinter Preview - ${filename}`;
                
                // Set context for showing/hiding commands
                vscode.commands.executeCommand('setContext', 'tkinter-preview.hastkinter', 
                    TkinterParser.hasTkinterImports(pythonCode));
            },
            (error) => {
                this.updateWebview(`<div class="error">Error reading file: ${error.message}</div>`);
                vscode.window.showErrorMessage(`Failed to read Python file: ${error.message}`);
            }
        );
    }

    public refresh() {
        this.updateWebview();
    }

    private updateWebview(htmlContent?: string, cssContent?: string, parseResult?: any, conversionResult?: any) {
        this.panel.webview.html = this.getWebviewContent(htmlContent, cssContent, parseResult, conversionResult);
    }

    private getWebviewContent(htmlContent?: string, cssContent?: string, parseResult?: any, conversionResult?: any) {
        // Use default content if none provided
        const html = htmlContent || '<div class="tkinter-app"><div class="welcome">Open a Python file with Tkinter code to see the preview</div></div>';
        const css = cssContent || this.converter.convert([]).css;
        
        // Get error information
        let errorHtml = '';
        if (parseResult?.hasErrors || conversionResult?.hasErrors) {
            const errors = [...(parseResult?.errors || []), ...(conversionResult?.errors || [])];
            errorHtml = `
                <div class="error-panel">
                    <h3>Errors found:</h3>
                    <ul>
                        ${errors.map(error => `<li>${this.escapeHtml(error)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Get debug information
        let debugHtml = '';
        if (parseResult) {
            debugHtml = `
                <div class="debug-panel" style="display: none;">
                    <h3>Debug Information</h3>
                    <div class="debug-section">
                        <h4>Imports found:</h4>
                        <ul>
                            ${parseResult.imports.map((imp: string) => `<li>${this.escapeHtml(imp)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="debug-section">
                        <h4>Widgets found:</h4>
                        <pre>${JSON.stringify(parseResult.widgets, null, 2)}</pre>
                    </div>
                </div>
            `;
        }

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tkinter Preview</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .preview-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                
                .toolbar {
                    background: #f3f3f3;
                    border-bottom: 1px solid #ddd;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: black;
                }
                
                .toolbar button {
                    background: #fff;
                    border: 1px solid #ccc;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .toolbar button:hover {
                    background: #f0f0f0;
                }
                
                .content {
                    flex: 1;
                    overflow: auto;
                    padding: 10px;
                }
                
                .welcome {
                    text-align: center;
                    color: #666;
                    padding: 40px 20px;
                    font-style: italic;
                }
                
                .error-panel {
                    background: #fff3f3;
                    border: 1px solid #ffcdd2;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                
                .error-panel h3 {
                    margin: 0 0 10px 0;
                    color: #d32f2f;
                }
                
                .error-panel ul {
                    margin: 0;
                    padding-left: 20px;
                }
                
                .error-panel li {
                    color: #c62828;
                    margin: 5px 0;
                }
                
                .debug-panel {
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin-top: 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: black;
                }
                
                .debug-panel h3, .debug-panel h4 {
                    margin: 0 0 10px 0;
                }
                
                .debug-section {
                    margin-bottom: 15px;
                }
                
                .debug-panel pre {
                    background: white;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    overflow: auto;
                    max-height: 200px;
                    font-size: 11px;
                }
                
                ${css}
            </style>
        </head>
        <body>
            <div class="preview-container">
                <div class="toolbar">
                    <button onclick="refresh()">🔄 Refresh</button>
                    <button onclick="toggleDebug()">🐛 Debug</button>
                    <span class="status">Preview active</span>
                </div>
                <div class="content">
                    ${errorHtml}
                    ${html}
                    ${debugHtml}
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refresh() {
                    vscode.postMessage({
                        command: 'refresh'
                    });
                }
                
                function toggleDebug() {
                    const debugPanel = document.querySelector('.debug-panel');
                    if (debugPanel) {
                        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
                    }
                }
                
                // Handle widget interactions (for future enhancements)
                document.addEventListener('click', function(event) {
                    const widget = event.target.closest('[data-widget-name]');
                    if (widget) {
                        const widgetName = widget.getAttribute('data-widget-name');
                        const line = widget.getAttribute('data-line');
                        console.log('Widget clicked:', widgetName, 'at line:', line);
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    public dispose() {
        TkinterPreviewPanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}