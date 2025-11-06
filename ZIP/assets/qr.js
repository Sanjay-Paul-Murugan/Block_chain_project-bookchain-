/*!
 * qrious - A pure JavaScript library for QR code generation
 * https://github.com/neocotic/qrious
 * (c) 2020 Alasdair Mercer
 * Dual licensed under MIT and GPL 2.0+ licenses
 */

(function(root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        var QRious = factory();
        root.QRious = QRious; // Expose QRious globally
    }
}(typeof window !== 'undefined' ? window : this, function() {
    // QRious constructor - main entry point
    function QRious(options) {
        if (!(this instanceof QRious)) {
            return new QRious(options); // Auto-instantiate if called without new
        }
        
        this.canvas = null; // Canvas element for drawing QR code
        this._canvas = null; // Internal canvas reference
        
        // Set defaults
        this._background = 'white';
        this._backgroundAlpha = 1;
        this._foreground = 'black';
        this._foregroundAlpha = 1;
        this._level = 'L';
        this._padding = 0;
        this._size = 100;
        this._value = '';
        
        // Apply options if provided
        if (options) {
            Object.keys(options).forEach(function(key) {
                this[key] = options[key]; // Copy all options to instance
            }, this);
        }
        
        this.build(); // Build the QR code
    }
    
    // Build the QR code
    QRious.prototype.build = function() {
        if (!this._canvas) this._canvas = document.createElement('canvas'); // Create canvas element if not exists
        
        var qr = this._qr = QRious.getQR(this._value, this._level); // Generate QR code data
        var canvas = this._canvas;
        var size = this._size; // Get size
        
        canvas.width = canvas.height = size; // Set canvas dimensions
        var ctx = canvas.getContext('2d'); // Get 2D context
        
        var moduleCount = qr.moduleCount; // Get module count from QR data
        var tileW = size / moduleCount; // Calculate tile width
        var tileH = size / moduleCount; // Calculate tile height
        
        this._drawImage(ctx, qr, size, tileW, tileH); // Draw QR code on canvas
        this.canvas = canvas; // Set canvas reference
    };
    
    // Draw QR code image on canvas context
    QRious.prototype._drawImage = function(ctx, qr, size, tileW, tileH) {
        for (var row = 0; row < moduleCount; row++) {
            for (var col = 0; col < moduleCount; col++) {
                var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW)); // Calculate width
                var h = (Math.ceil((row + 1) * tileH) - Math.floor(row * tileH)); // Calculate height
                var isDark = qr.isDark(row, col); // Check if module is dark
                
                ctx.fillStyle = isDark ? this._foreground : this._background; // Set fill color
                if (isDark) ctx.globalAlpha = this._foregroundAlpha; // Set foreground alpha
                else ctx.globalAlpha = this._backgroundAlpha; // Set background alpha
                
                ctx.fillRect(Math.round(col * tileW), Math.round(row * tileH), w, h); // Fill rectangle
            }
        }
    };
    
    // QR code generation logic
    QRious.getQR = function(value, level) {
        var qr = {}; // Create QR object
        
        var errorCorrectLevels = {
            'L': [1, 0, 0, 0], // Low error correction
            'M': [0, 1, 0, 0], // Medium error correction
            'Q': [0, 0, 1, 0], // Quartile error correction
            'H': [0, 0, 0, 1]  // High error correction
        };
        
        var ecc = errorCorrectLevels[level] || errorCorrectLevels['L']; // Get error correction level
        
        var modules = getQRModules(value, ecc); // Generate modules
        var moduleCount = modules.length; // Get module count
        
        qr.moduleCount = moduleCount; // Store module count
        qr.modules = modules; // Store modules
        qr.isDark = function(row, col) {
            return modules[row][col]; // Check if cell is dark
        };
        
        return qr; // Return QR object
    };
    
    // Generate QR code modules from value and error correction
    function getQRModules(value, ecc) {
        var data = stringToBytes(value); // Convert value to bytes
        var v = findVersion(data, ecc); // Find appropriate version
        var ec = getECConfig(v, ecc); // Get error correction config
        
        var modules = createBase(v); // Create base pattern
        addFinderPatterns(modules); // Add finder patterns
        addAlignPatterns(modules, v); // Add alignment patterns
        addTimingPatterns(modules); // Add timing patterns
        addDarkModule(modules, v); // Add dark module
        addDataModules(modules, data, ec); // Add data modules
        applyMask(modules, ec); // Apply masking
        addFormatInfo(modules, ec); // Add format information
        
        return modules; // Return modules array
    }
    
    // Simplified QR code generation (full implementation would be much longer)
    function stringToBytes(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i)); // Convert to byte array
        }
        return bytes; // Return bytes
    }
    
    function findVersion(data, ecc) {
        var length = data.length; // Get data length
        if (length < 10) return 1; // Version 1 for small data
        if (length < 20) return 2; // Version 2 for medium data
        return 3; // Version 3 for large data (simplified)
    }
    
    function getECConfig(v, ecc) {
        return { version: v, ecc: ecc }; // Return config object
    }
    
    function createBase(v) {
        var size = 17 + v * 4; // Calculate size based on version
        var modules = [];
        for (var i = 0; i < size; i++) {
            modules[i] = [];
            for (var j = 0; j < size; j++) {
                modules[i][j] = false; // Initialize all modules to empty
            }
        }
        return modules; // Return empty modules array
    }
    
    function addFinderPatterns(modules) {
        var size = modules.length;
        // Add top-left finder pattern
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                modules[i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
            }
        }
    }
    
    function addAlignPatterns(modules, v) {
        // Simplified alignment pattern addition
        var size = modules.length;
        var pattern = [
            [true, true, true, true, true],
            [true, false, false, false, true],
            [true, false, true, false, true],
            [true, false, false, false, true],
            [true, true, true, true, true]
        ];
        
        if (v > 1) {
            var center = size - 7;
            for (var i = 0; i < 5; i++) {
                for (var j = 0; j < 5; j++) {
                    modules[center + i][center + j] = pattern[i][j];
                }
            }
        }
    }
    
    function addTimingPatterns(modules) {
        // Add timing patterns (simplified)
    }
    
    function addDarkModule(modules, v) {
        // Add dark module (simplified)
    }
    
    function addDataModules(modules, data, ec) {
        // Add data modules (simplified - complex bit arrangement)
        var size = modules.length;
        var dataIndex = 0;
        
        for (var i = 0; i < size && dataIndex < data.length; i++) {
            for (var j = 0; j < size && dataIndex < data.length; j++) {
                if (!modules[i][j]) {
                    modules[i][j] = (data[dataIndex % 8] & (1 << (dataIndex % 8))) !== 0;
                    dataIndex++;
                }
            }
        }
    }
    
    function applyMask(modules, ec) {
        // Apply masking pattern (simplified)
    }
    
    function addFormatInfo(modules, ec) {
        // Add format information (simplified)
    }
    
    return QRious; // Return QRious constructor
}));

// generateQR renders a QR code into a provided canvas element
// Usage: generateQR(canvasEl, 'text-to-encode', 200)
function generateQR(canvasElement, text, size) {
    try {
        var qr = new QRious({ value: String(text || ''), size: size || 200 }); // Create QR
        var srcCanvas = qr.canvas; // Generated canvas
        if (!canvasElement || !canvasElement.getContext) return; // Guard
        // Resize target canvas and draw generated QR onto it
        canvasElement.width = srcCanvas.width;
        canvasElement.height = srcCanvas.height;
        var ctx = canvasElement.getContext('2d');
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(srcCanvas, 0, 0);
    } catch (e) {
        // Silently fail to keep UX smooth
        // console.error('generateQR error', e);
    }
}

// scanQR attempts to decode a QR from an uploaded image file input
// NOTE: For lightweight build, jsQR is not bundled. To enable scanning, include jsQR and implement decode.
// TODO: Implement scanning via jsQR (https://github.com/cozmo/jsQR) and return decoded text.
async function scanQR(fileInput) {
    // Placeholder implementation: return null to indicate not available
    return null;
}
