// Windows 98 style window dragging functionality
export class WindowManager {
    constructor() {
        this.isDragging = false;
        this.isResizing = false;
        this.currentWindow = null;
        this.resizeDirection = null;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        
        this.initializeWindows();
    }
    
    initializeWindows() {
        // Find all windows and make them draggable and resizable
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            this.makeWindowDraggable(window);
            this.makeWindowResizable(window);
        });
    }
    
    makeWindowDraggable(windowElement) {
        const titleBar = windowElement.querySelector('.title-bar');
        if (!titleBar) return;
        
        // Add event listeners for mouse dragging
        titleBar.addEventListener('mousedown', (e) => this.startDrag(e, windowElement));
        
        // Add event listeners for touch dragging
        titleBar.addEventListener('touchstart', (e) => this.startDrag(e, windowElement), { passive: false });
        
        // Prevent text selection during drag
        titleBar.addEventListener('selectstart', (e) => e.preventDefault());
        
        // Bring window to front on click/touch
        windowElement.addEventListener('mousedown', () => this.bringToFront(windowElement));
        windowElement.addEventListener('touchstart', () => this.bringToFront(windowElement));
    }
    
    makeWindowResizable(windowElement) {
        // Create resize handles
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${direction}`;
            handle.dataset.direction = direction;
            
            // Add event listeners for mouse resize
            handle.addEventListener('mousedown', (e) => this.startResize(e, windowElement, direction));
            
            // Add event listeners for touch resize
            handle.addEventListener('touchstart', (e) => this.startResize(e, windowElement, direction), { passive: false });
            
            windowElement.appendChild(handle);
        });
        
        // Add global event listeners for resize operations
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.stopOperation());
        document.addEventListener('touchmove', (e) => this.handleMouseMove(e), { passive: false });
        document.addEventListener('touchend', () => this.stopOperation());
    }
    
    startDrag(e, windowElement) {
        // Only start drag if clicking on title bar (not buttons)
        if (e.target.tagName === 'BUTTON') {
            console.log('WindowManager: Drag cancelled - clicked on button');
            return;
        }
        
        console.log('WindowManager: Starting drag on window');
        this.isDragging = true;
        this.currentWindow = windowElement;
        
        // Get initial positions (handle both mouse and touch events)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // For fixed positioning, use viewport coordinates directly
        this.startX = clientX;
        this.startY = clientY;
        
        // Get current window position from getBoundingClientRect (viewport relative)
        const windowRect = windowElement.getBoundingClientRect();
        this.startLeft = windowRect.left;
        this.startTop = windowRect.top;
        
        console.log('WindowManager: Starting drag - mouse position:', clientX, clientY);
        console.log('WindowManager: Starting drag - window position:', this.startLeft, this.startTop);
        
        // Add dragging classes
        windowElement.classList.add('dragging');
        const titleBar = windowElement.querySelector('.title-bar');
        titleBar.classList.add('dragging');
        
        // Bring to front
        this.bringToFront(windowElement);
        
        // Prevent default to avoid text selection and scrolling
        e.preventDefault();
    }
    
    startResize(e, windowElement, direction) {
        this.isResizing = true;
        this.currentWindow = windowElement;
        this.resizeDirection = direction;
        
        // Get initial positions (handle both mouse and touch events)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        this.startX = clientX;
        this.startY = clientY;
        
        // Get current window dimensions and position
        const rect = windowElement.getBoundingClientRect();
        this.startLeft = rect.left;
        this.startTop = rect.top;
        this.startWidth = rect.width;
        this.startHeight = rect.height;
        
        // Add resizing class
        windowElement.classList.add('resizing');
        
        // Bring to front
        this.bringToFront(windowElement);
        
        // Prevent default to avoid text selection and scrolling
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            console.log('WindowManager: Mouse move during drag');
            this.drag(e);
        } else if (this.isResizing) {
            this.resize(e);
        }
    }
    
    drag(e) {
        if (!this.isDragging || !this.currentWindow) return;
        
        // Check if window still exists in DOM
        if (!document.contains(this.currentWindow)) {
            console.log('WindowManager: Window no longer in DOM, stopping drag');
            this.stopDrag();
            return;
        }
        
        // Handle both mouse and touch events
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (!clientX || !clientY) return;
        
        // For fixed positioning, use viewport coordinates directly
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        
        let newLeft = this.startLeft + deltaX;
        let newTop = this.startTop + deltaY;
        
        console.log('WindowManager: Drag calculation - delta:', deltaX, deltaY, 'new position:', newLeft, newTop);
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Constrain to viewport bounds (allow partial off-screen but keep title bar visible)
        const minLeft = -500; // Allow most of window off-screen but keep some visible
        const maxLeft = viewportWidth - 100;
        const minTop = 0; // Don't allow title bar above viewport
        const maxTop = viewportHeight - 50; // Keep at least title bar height visible
        
        newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        newTop = Math.max(minTop, Math.min(maxTop, newTop));
        
        // Apply new position
        this.currentWindow.style.left = newLeft + 'px';
        this.currentWindow.style.top = newTop + 'px';
        
        // Prevent default for touch events to avoid scrolling
        if (e.touches) {
            e.preventDefault();
        }
    }
    
    resize(e) {
        if (!this.isResizing || !this.currentWindow) return;
        
        // Handle both mouse and touch events
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (!clientX || !clientY) return;
        
        // Calculate deltas
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        
        // Get minimum window size
        const minWidth = 200;
        const minHeight = 100;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let newLeft = this.startLeft;
        let newTop = this.startTop;
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        
        // Apply resize based on direction
        switch (this.resizeDirection) {
            case 'n':
                newTop = this.startTop + deltaY;
                newHeight = this.startHeight - deltaY;
                break;
            case 'ne':
                newTop = this.startTop + deltaY;
                newWidth = this.startWidth + deltaX;
                newHeight = this.startHeight - deltaY;
                break;
            case 'e':
                newWidth = this.startWidth + deltaX;
                break;
            case 'se':
                newWidth = this.startWidth + deltaX;
                newHeight = this.startHeight + deltaY;
                break;
            case 's':
                newHeight = this.startHeight + deltaY;
                break;
            case 'sw':
                newLeft = this.startLeft + deltaX;
                newWidth = this.startWidth - deltaX;
                newHeight = this.startHeight + deltaY;
                break;
            case 'w':
                newLeft = this.startLeft + deltaX;
                newWidth = this.startWidth - deltaX;
                break;
            case 'nw':
                newLeft = this.startLeft + deltaX;
                newTop = this.startTop + deltaY;
                newWidth = this.startWidth - deltaX;
                newHeight = this.startHeight - deltaY;
                break;
        }
        
        // Enforce minimum size constraints
        if (newWidth < minWidth) {
            if (this.resizeDirection.includes('w')) {
                newLeft = this.startLeft + (this.startWidth - minWidth);
            }
            newWidth = minWidth;
        }
        
        if (newHeight < minHeight) {
            if (this.resizeDirection.includes('n')) {
                newTop = this.startTop + (this.startHeight - minHeight);
            }
            newHeight = minHeight;
        }
        
        // Constrain to viewport bounds
        newLeft = Math.max(0, Math.min(viewportWidth - 100, newLeft));
        newTop = Math.max(0, Math.min(viewportHeight - 50, newTop));
        newWidth = Math.min(viewportWidth - newLeft, newWidth);
        newHeight = Math.min(viewportHeight - newTop, newHeight);
        
        // Apply new dimensions and position
        this.currentWindow.style.left = newLeft + 'px';
        this.currentWindow.style.top = newTop + 'px';
        this.currentWindow.style.width = newWidth + 'px';
        this.currentWindow.style.height = newHeight + 'px';
        
        // Remove percentage-based positioning
        this.currentWindow.style.transform = 'none';
        
        // Prevent default for touch events to avoid scrolling
        if (e.touches) {
            e.preventDefault();
        }
    }
    
    stopOperation() {
        if (this.isDragging) {
            this.stopDrag();
        } else if (this.isResizing) {
            this.stopResize();
        }
    }
    
    stopDrag() {
        if (!this.isDragging || !this.currentWindow) return;
        
        console.log('WindowManager: Stopping drag');
        this.isDragging = false;
        
        // Remove dragging classes
        this.currentWindow.classList.remove('dragging');
        const titleBar = this.currentWindow.querySelector('.title-bar');
        if (titleBar) {
            titleBar.classList.remove('dragging');
        }
        
        this.currentWindow = null;
    }
    
    stopResize() {
        if (!this.isResizing || !this.currentWindow) return;
        
        this.isResizing = false;
        
        // Remove resizing class
        this.currentWindow.classList.remove('resizing');
        
        this.currentWindow = null;
        this.resizeDirection = null;
    }
    
    bringToFront(windowElement) {
        // Get all windows and reset their z-index
        const windows = document.querySelectorAll('.window');
        windows.forEach((win, index) => {
            win.style.zIndex = index + 1;
        });
        
        // Bring clicked window to front
        windowElement.style.zIndex = windows.length + 10;
    }
    
    // Utility method to center a window
    centerWindow(windowElement) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const windowRect = windowElement.getBoundingClientRect();
        
        const centerX = (viewportWidth - windowRect.width) / 2;
        const centerY = (viewportHeight - windowRect.height) / 2;
        
        windowElement.style.left = Math.max(0, centerX) + 'px';
        windowElement.style.top = Math.max(0, centerY) + 'px';
        windowElement.style.transform = 'none';
    }
    
    // Method to create new draggable windows dynamically
    createWindow(options = {}) {
        console.log('WindowManager: createWindow() called with options:', options);
        
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        console.log('WindowManager: Window element created');
        
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        
        const titleText = document.createElement('div');
        titleText.className = 'title-bar-text';
        titleText.textContent = options.title || 'New Window';
        
        const titleControls = document.createElement('div');
        titleControls.className = 'title-bar-controls';
        titleControls.innerHTML = `
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
        `;
        
        titleBar.appendChild(titleText);
        titleBar.appendChild(titleControls);
        
        const windowBody = document.createElement('div');
        windowBody.className = 'window-body';
        windowBody.innerHTML = options.content || '<p>Window content</p>';
        
        windowElement.appendChild(titleBar);
        windowElement.appendChild(windowBody);
        
        // Set initial position and size
        windowElement.style.width = options.width || '400px';
        windowElement.style.height = options.height || '300px';
        windowElement.style.left = options.left || '100px';
        windowElement.style.top = options.top || '100px';
        windowElement.style.zIndex = '1000'; // Ensure it's visible
        windowElement.style.position = 'fixed'; // Use fixed positioning relative to viewport
        
        console.log('WindowManager: Window styles set - width:', windowElement.style.width, 'height:', windowElement.style.height, 'left:', windowElement.style.left, 'top:', windowElement.style.top);
        
        // Add to desktop container or document body as fallback
        const desktop = document.querySelector('.desktop');
        if (desktop) {
            console.log('WindowManager: Adding window to desktop container');
            desktop.appendChild(windowElement);
        } else {
            console.log('WindowManager: Desktop not found, adding to document body');
            document.body.appendChild(windowElement);
        }
        
        console.log('WindowManager: Window added to DOM');
        
        // Make draggable and resizable
        this.makeWindowDraggable(windowElement);
        this.makeWindowResizable(windowElement);
        
        // Add close functionality
        const closeBtn = titleControls.querySelector('button:last-child');
        closeBtn.addEventListener('click', (e) => {
            console.log('WindowManager: Window close button clicked');
            e.stopPropagation(); // Prevent event bubbling
            windowElement.remove();
        });
        
        console.log('WindowManager: Window setup complete, returning window element');
        return windowElement;
    }
}

// Create and export a global instance
const globalWindowManager = new WindowManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.windowManager = globalWindowManager;
});

// Also make it available immediately for modules
if (typeof window !== 'undefined') {
    window.windowManager = globalWindowManager;
}

export { globalWindowManager as windowManager };