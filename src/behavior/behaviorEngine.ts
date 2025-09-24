/**
 * Tkinter Behavior Engine
 * 
 * Implements Tkinter-specific behaviors and rules for widget sizing,
 * layout, and appearance to make the HTML preview more accurate.
 */

import { TkinterWidget } from '../parser/tkinterParser';

export interface BehaviorResult {
    modifiedWidgets: TkinterWidget[];
    appliedRules: string[];
    warnings: string[];
}

export class TkinterBehaviorEngine {
    private warnings: string[] = [];
    private appliedRules: string[] = [];

    /**
     * Apply Tkinter-specific behaviors to the widget hierarchy
     */
    public applyBehaviors(widgets: TkinterWidget[]): BehaviorResult {
        this.warnings = [];
        this.appliedRules = [];

        const modifiedWidgets = this.deepCopyWidgets(widgets);
        
        // Apply various behavior rules
        this.applyRootWindowBehaviors(modifiedWidgets);
        this.applyFrameBehaviors(modifiedWidgets);
        this.applyLayoutManagerBehaviors(modifiedWidgets);
        this.applySizingBehaviors(modifiedWidgets);
        this.applyDefaultProperties(modifiedWidgets);
        this.validateWidgetHierarchy(modifiedWidgets);

        return {
            modifiedWidgets,
            appliedRules: [...this.appliedRules],
            warnings: [...this.warnings]
        };
    }

    /**
     * Apply root window specific behaviors
     */
    private applyRootWindowBehaviors(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            if (widget.type === 'Tk' || widget.type === 'Toplevel') {
                // Root windows should have reasonable default size
                if (!widget.properties.width && !widget.properties.height) {
                    // Calculate size based on children
                    const estimatedSize = this.estimateWindowSize(widget);
                    widget.properties.width = estimatedSize.width;
                    widget.properties.height = estimatedSize.height;
                    this.appliedRules.push(`Applied estimated size ${estimatedSize.width}x${estimatedSize.height} to root window`);
                }
                
                // Set default title if not specified
                if (!widget.properties.title) {
                    widget.properties.title = widget.type === 'Tk' ? 'Tk' : 'Toplevel';
                    this.appliedRules.push('Applied default window title');
                }
                
                // Root windows are always visible and positioned
                widget.properties['_isRoot'] = true;
                
                this.applyBehaviorsRecursively(widget.children);
            }
        }
    }

    /**
     * Apply frame-specific behaviors
     */
    private applyFrameBehaviors(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            if (widget.type === 'Frame' || widget.type === 'LabelFrame') {
                // Frames without explicit size should size to content
                if (!widget.properties.width && !widget.properties.height) {
                    widget.properties['_autoSize'] = true;
                    this.appliedRules.push('Applied auto-sizing to frame');
                }
                
                // LabelFrame should have default border
                if (widget.type === 'LabelFrame' && !widget.properties.relief) {
                    widget.properties.relief = 'groove';
                    widget.properties.borderwidth = widget.properties.bd || 2;
                    this.appliedRules.push('Applied default LabelFrame relief');
                }
                
                // Frames should have default padding for children
                if (widget.children.length > 0 && !widget.properties.padx && !widget.properties.pady) {
                    widget.properties['_defaultPadding'] = 5;
                    this.appliedRules.push('Applied default frame padding');
                }
            }
            
            this.applyFrameBehaviors(widget.children);
        }
    }

    /**
     * Apply layout manager specific behaviors
     */
    private applyLayoutManagerBehaviors(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            // Apply default layout manager if none specified and widget has children
            if (widget.children.length > 0) {
                this.inferLayoutManager(widget);
            }
            
            // Apply layout-specific behaviors
            for (const child of widget.children) {
                if (child.layoutManager) {
                    this.applyLayoutManagerRules(child, widget);
                }
            }
            
            this.applyLayoutManagerBehaviors(widget.children);
        }
    }

    /**
     * Infer layout manager if not explicitly set
     */
    private inferLayoutManager(parent: TkinterWidget) {
        let hasExplicitLayout = false;
        
        for (const child of parent.children) {
            if (child.layoutManager) {
                hasExplicitLayout = true;
                break;
            }
        }
        
        // If no explicit layout manager, assume pack (most common default)
        if (!hasExplicitLayout) {
            for (const child of parent.children) {
                child.layoutManager = 'pack';
                child.layoutOptions = child.layoutOptions || {};
                if (!child.layoutOptions.side) {
                    child.layoutOptions.side = 'top'; // Default pack side
                }
            }
            this.appliedRules.push('Inferred pack layout manager for children');
        }
    }

    /**
     * Apply layout manager specific rules
     */
    private applyLayoutManagerRules(widget: TkinterWidget, parent: TkinterWidget) {
        const options = widget.layoutOptions || {};
        
        switch (widget.layoutManager) {
            case 'pack':
                this.applyPackRules(widget, options);
                break;
            case 'grid':
                this.applyGridRules(widget, options, parent);
                break;
            case 'place':
                this.applyPlaceRules(widget, options);
                break;
        }
    }

    /**
     * Apply pack layout rules
     */
    private applyPackRules(widget: TkinterWidget, options: any) {
        // Default side is top
        if (!options.side) {
            options.side = 'top';
            this.appliedRules.push('Applied default pack side (top)');
        }
        
        // Validate pack options
        const validSides = ['top', 'bottom', 'left', 'right'];
        if (options.side && !validSides.includes(options.side)) {
            this.warnings.push(`Invalid pack side: ${options.side}`);
            options.side = 'top';
        }
        
        const validFills = ['none', 'x', 'y', 'both'];
        if (options.fill && !validFills.includes(options.fill)) {
            this.warnings.push(`Invalid pack fill: ${options.fill}`);
            options.fill = 'none';
        }
    }

    /**
     * Apply grid layout rules
     */
    private applyGridRules(widget: TkinterWidget, options: any, parent: TkinterWidget) {
        // Default row and column to 0 if not specified
        if (options.row === undefined) {
            options.row = 0;
            this.appliedRules.push('Applied default grid row (0)');
        }
        if (options.column === undefined) {
            options.column = 0;
            this.appliedRules.push('Applied default grid column (0)');
        }
        
        // Set parent as grid container
        if (!parent.properties['_gridContainer']) {
            parent.properties['_gridContainer'] = true;
            parent.properties['_gridRows'] = 1;
            parent.properties['_gridColumns'] = 1;
        }
        
        // Update parent grid dimensions
        const maxRow = Math.max(parent.properties['_gridRows'] || 1, (options.row || 0) + (options.rowspan || 1));
        const maxCol = Math.max(parent.properties['_gridColumns'] || 1, (options.column || 0) + (options.columnspan || 1));
        parent.properties['_gridRows'] = maxRow;
        parent.properties['_gridColumns'] = maxCol;
    }

    /**
     * Apply place layout rules
     */
    private applyPlaceRules(widget: TkinterWidget, options: any) {
        // Default x and y to 0 if not specified
        if (options.x === undefined) {
            options.x = 0;
            this.appliedRules.push('Applied default place x (0)');
        }
        if (options.y === undefined) {
            options.y = 0;
            this.appliedRules.push('Applied default place y (0)');
        }
        
        // Place widgets need explicit positioning
        widget.properties['_positioned'] = true;
    }

    /**
     * Apply sizing behaviors
     */
    private applySizingBehaviors(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            this.calculateWidgetSize(widget);
            this.applySizingBehaviors(widget.children);
        }
    }

    /**
     * Calculate widget size based on content and properties
     */
    private calculateWidgetSize(widget: TkinterWidget) {
        // Text-based widgets size based on content
        if (['Label', 'Button'].includes(widget.type)) {
            if (!widget.properties.width && widget.properties.text) {
                const textLength = String(widget.properties.text).length;
                widget.properties['_calculatedWidth'] = Math.max(textLength * 8, 50); // Approximate character width
                this.appliedRules.push(`Calculated width for ${widget.type} based on text`);
            }
            
            if (!widget.properties.height) {
                widget.properties['_calculatedHeight'] = 25; // Default text height
                this.appliedRules.push(`Applied default height for ${widget.type}`);
            }
        }
        
        // Entry widgets have default sizes
        if (widget.type === 'Entry') {
            if (!widget.properties.width) {
                widget.properties['_calculatedWidth'] = 200;
                this.appliedRules.push('Applied default Entry width');
            }
            if (!widget.properties.height) {
                widget.properties['_calculatedHeight'] = 25;
                this.appliedRules.push('Applied default Entry height');
            }
        }
        
        // Text widgets have larger defaults
        if (widget.type === 'Text') {
            if (!widget.properties.width) {
                widget.properties['_calculatedWidth'] = 300;
                this.appliedRules.push('Applied default Text width');
            }
            if (!widget.properties.height) {
                widget.properties['_calculatedHeight'] = 200;
                this.appliedRules.push('Applied default Text height');
            }
        }
    }

    /**
     * Apply default properties for widgets
     */
    private applyDefaultProperties(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            this.setDefaultProperties(widget);
            this.applyDefaultProperties(widget.children);
        }
    }

    /**
     * Set default properties for a widget type
     */
    private setDefaultProperties(widget: TkinterWidget) {
        const defaults = this.getDefaultProperties(widget.type);
        
        for (const [key, value] of Object.entries(defaults)) {
            if (!(key in widget.properties)) {
                widget.properties[key] = value;
                this.appliedRules.push(`Applied default ${key} for ${widget.type}`);
            }
        }
    }

    /**
     * Get default properties for widget type
     */
    private getDefaultProperties(widgetType: string): { [key: string]: any } {
        const defaults: { [key: string]: { [key: string]: any } } = {
            'Button': {
                relief: 'raised',
                borderwidth: 1,
                background: '#f0f0f0'
            },
            'Entry': {
                relief: 'sunken',
                borderwidth: 1,
                background: 'white'
            },
            'Text': {
                relief: 'sunken',
                borderwidth: 1,
                background: 'white'
            },
            'Label': {
                relief: 'flat',
                background: '#f0f0f0'
            },
            'Frame': {
                relief: 'flat',
                borderwidth: 0,
                background: '#f0f0f0'
            },
            'LabelFrame': {
                relief: 'groove',
                borderwidth: 2,
                background: '#f0f0f0'
            },
            'Listbox': {
                relief: 'sunken',
                borderwidth: 1,
                background: 'white'
            },
            'Canvas': {
                relief: 'sunken',
                borderwidth: 1,
                background: 'white'
            }
        };
        
        return defaults[widgetType] || {};
    }

    /**
     * Validate widget hierarchy for common issues
     */
    private validateWidgetHierarchy(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            // Check for widgets without layout managers
            if (widget.children.length > 0) {
                const childrenWithoutLayout = widget.children.filter(child => !child.layoutManager);
                if (childrenWithoutLayout.length > 0) {
                    this.warnings.push(`${childrenWithoutLayout.length} children of ${widget.type} have no layout manager`);
                }
            }
            
            // Check for mixed layout managers in same parent
            if (widget.children.length > 1) {
                const layoutManagers = new Set(widget.children.map(child => child.layoutManager).filter(Boolean));
                if (layoutManagers.size > 1) {
                    this.warnings.push(`${widget.type} has children with mixed layout managers: ${Array.from(layoutManagers).join(', ')}`);
                }
            }
            
            this.validateWidgetHierarchy(widget.children);
        }
    }

    /**
     * Apply behaviors recursively
     */
    private applyBehaviorsRecursively(widgets: TkinterWidget[]) {
        for (const widget of widgets) {
            this.applyBehaviorsRecursively(widget.children);
        }
    }

    /**
     * Deep copy widgets to avoid modifying original data
     */
    private deepCopyWidgets(widgets: TkinterWidget[]): TkinterWidget[] {
        return JSON.parse(JSON.stringify(widgets));
    }

    /**
     * Estimate window size based on children
     */
    private estimateWindowSize(widget: TkinterWidget): { width: number, height: number } {
        if (widget.children.length === 0) {
            // Empty window gets minimum size
            return { width: 200, height: 100 };
        }

        let estimatedWidth = 0;
        let estimatedHeight = 0;

        // Simple estimation based on packed widgets
        for (const child of widget.children) {
            if (child.layoutManager === 'pack') {
                const side = child.layoutOptions?.side || 'top';
                
                if (side === 'top' || side === 'bottom') {
                    // Vertical packing - add to height, take max width
                    estimatedHeight += this.estimateWidgetHeight(child);
                    estimatedWidth = Math.max(estimatedWidth, this.estimateWidgetWidth(child));
                } else {
                    // Horizontal packing - add to width, take max height
                    estimatedWidth += this.estimateWidgetWidth(child);
                    estimatedHeight = Math.max(estimatedHeight, this.estimateWidgetHeight(child));
                }
            } else {
                // For other layout managers, just take max dimensions
                estimatedWidth = Math.max(estimatedWidth, this.estimateWidgetWidth(child));
                estimatedHeight = Math.max(estimatedHeight, this.estimateWidgetHeight(child));
            }
        }

        // Add padding and minimum size constraints
        estimatedWidth = Math.max(estimatedWidth + 40, 200); // 20px padding on each side, minimum 200
        estimatedHeight = Math.max(estimatedHeight + 60, 150); // 30px padding top/bottom, minimum 150

        return { width: estimatedWidth, height: estimatedHeight };
    }

    /**
     * Estimate widget width
     */
    private estimateWidgetWidth(widget: TkinterWidget): number {
        if (widget.properties.width) {
            return this.convertToPixels(widget.properties.width);
        }

        switch (widget.type) {
            case 'Label':
                const text = widget.properties.text || '';
                return Math.max(text.length * 8, 50);
            case 'Button':
                const buttonText = widget.properties.text || 'Button';
                return Math.max(buttonText.length * 8 + 24, 75); // Extra padding for button
            case 'Entry':
                return 150;
            case 'Text':
                return 200;
            default:
                return 100;
        }
    }

    /**
     * Estimate widget height
     */
    private estimateWidgetHeight(widget: TkinterWidget): number {
        if (widget.properties.height) {
            return this.convertToPixels(widget.properties.height);
        }

        switch (widget.type) {
            case 'Label':
            case 'Button':
            case 'Entry':
                return 30;
            case 'Text':
                return 100;
            case 'Listbox':
                return 80;
            default:
                return 25;
        }
    }

    /**
     * Convert size value to pixels
     */
    private convertToPixels(size: any): number {
        if (typeof size === 'number') {
            return size;
        }
        return parseInt(String(size)) || 0;
    }
}