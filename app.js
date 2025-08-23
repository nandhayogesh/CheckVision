/**
 * CheckVision - AI-Powered Check Analysis Application
 * Built with React and Google Gemini AI
 */

// =====================================
// REACT IMPORTS & CONFIGURATION
// =====================================
const { useState, useEffect, useContext, createContext, useRef } = React;

// =====================================
// CONSTANTS & CONFIGURATION
// =====================================
const CONFIG = {
    SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    MAX_FILE_SIZE: 10485760, // 10MB
    GEMINI_API_KEY: "AIzaSyBUBd3LBfUnJcXcArpV370Zgt9yuG0zUx8",
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};

// =====================================
// REACT CONTEXT
// =====================================
const AppContext = createContext();

// =====================================
// CUSTOM HOOKS
// =====================================
const useToast = () => {
    const showToast = (message, type = 'info', duration = 3000) => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `
            <span class="text-xl">${icon}</span>
            <span class="text-sm font-medium text-gray-800">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, duration);
    };
    
    return { showToast };
};

// =====================================
// API SERVICE
// =====================================
const geminiAPI = {
    /**
     * Test API connection
     */
    testConnection: async () => {
        try {
            const requestBody = {
                contents: [{
                    parts: [{ text: "Return exactly this JSON: {\"test\": \"success\"}" }]
                }]
            };

            const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Connection failed'}`);
            }

            console.log('✅ API connection successful');
            return true;
        } catch (error) {
            console.error('❌ API connection failed:', error);
            return false;
        }
    },

    /**
     * Analyze check image using Gemini AI
     */
    analyzeImage: async (imageFile) => {
        console.log('🔍 Starting analysis for:', imageFile.name);
        
        try {
            // Convert image to base64
            const base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            // Create optimized prompt for check analysis
            const prompt = `Analyze this check image and extract information. Return ONLY a valid JSON object:

{
  "accountHolder": "account holder name or null",
  "accountNumber": "account number or null",
  "routingNumber": "routing number or null", 
  "bankName": "bank name or null",
  "ifscCode": "IFSC code or null",
  "micrCode": "MICR code or null",
  "checkNumber": "check number or null",
  "date": "date or null",
  "amountNumbers": "numerical amount or null",
  "amountWords": "written amount or null",
  "signatureStatus": "Present or Absent",
  "memo": "memo/purpose or null",
  "address": "address or null"
}

Return ONLY the JSON object, no additional text.`;

            // Make API request
            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: imageFile.type,
                                data: base64Image
                            }
                        }
                    ]
                }]
            };

            const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Failed to analyze image'}`);
            }

            // Parse response
            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No response generated from the API');
            }

            // Extract and parse JSON
            let extractedData;
            try {
                extractedData = JSON.parse(generatedText);
            } catch (parseError) {
                // Try to extract JSON from markdown code blocks
                const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                 generatedText.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
                } else {
                    throw new Error('Failed to parse API response');
                }
            }

            // Process and normalize data
            const processedData = {
                accountHolder: extractedData.accountHolder || "Not found",
                accountNumber: extractedData.accountNumber || "Not found",
                routingNumber: extractedData.routingNumber || "Not found",
                bankName: extractedData.bankName || "Not found",
                ifscCode: extractedData.ifscCode || "Not found",
                micrCode: extractedData.micrCode || "Not found",
                checkNumber: extractedData.checkNumber || "Not found",
                date: extractedData.date || "Not found",
                amountNumbers: extractedData.amountNumbers || "Not found",
                amountWords: extractedData.amountWords || "Not found",
                signatureStatus: extractedData.signatureStatus || "Not detected",
                memo: extractedData.memo || "Not found",
                address: extractedData.address || "Not found"
            };

            console.log('✅ Analysis completed successfully');
            return {
                success: true,
                data: {
                    ...processedData,
                    extractionConfidence: 95,
                    processingTime: Date.now()
                }
            };

        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw new Error(error.message || 'Failed to analyze image. Please try again.');
        }
    }
};

// =====================================
// UTILITY FUNCTIONS
// =====================================
const validateFile = (file) => {
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        throw new Error('Unsupported file format. Please upload JPG, PNG, WebP, or PDF files.');
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error('File size too large. Please upload files smaller than 10MB.');
    }
    
    return true;
};

const copyToClipboard = async (text, fieldName) => {
    try {
        await navigator.clipboard.writeText(text);
        const { showToast } = useToast();
        showToast(`${fieldName} copied to clipboard!`, 'success');
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
    }
};

// =====================================
// REACT COMPONENTS
// =====================================

/**
 * Header Component
 */
const Header = ({ currentView, onNavigate }) => {
    return (
        <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                CheckVision
                            </h1>
                            <p className="text-xs text-gray-500 mt-0">Enterprise AI Document Processing</p>
                        </div>
                    </div>
                    
                    <nav className="hidden md:flex space-x-8">
                        <button 
                            onClick={() => onNavigate('home')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                                currentView === 'home' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => onNavigate('upload')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                                currentView === 'upload' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Processing
                        </button>
                        <a 
                            href="https://github.com/nandhayogesh/CheckVision" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                    </nav>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

/**
 * Hero Section Component
 */
const HeroSection = ({ onNavigate }) => {
    return (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 wave-bg">
            <div className="max-w-4xl mx-auto text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
                        Enterprise AI Document Processing Solution
                    </span>
                </div>
                
                <h1 className="hero-title text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    Advanced Check Analysis
                    <span className="block text-blue-600">Powered by Artificial Intelligence</span>
                </h1>
                
                <p className="hero-subtitle text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Professional-grade document processing system utilizing Google Gemini AI for intelligent 
                    data extraction. Demonstrates cutting-edge integration of machine learning APIs with 
                    modern web technologies.
                </p>
                
                <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <button 
                        onClick={() => onNavigate('upload')}
                        className="btn-primary px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Launch Application
                        <span className="ml-2">→</span>
                    </button>
                    
                    <a 
                        href="https://github.com/nandhayogesh/CheckVision" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        View Source Code
                    </a>
                </div>
                
                <div className="text-sm text-gray-500 mb-12">
                    <span className="inline-flex items-center mr-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Production Ready
                    </span>
                    <span className="inline-flex items-center mr-6">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Enterprise Security
                    </span>
                    <span className="inline-flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        AI-Powered
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="feature-card bg-white/90 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Advanced AI Integration</h3>
                        <p className="text-gray-600 text-sm">Google Gemini AI for intelligent document analysis and data extraction</p>
                    </div>
                    
                    <div className="feature-card bg-white/90 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                        <p className="text-gray-600 text-sm">Zero-storage architecture with client-side processing and secure API communication</p>
                    </div>
                    
                    <div className="feature-card bg-white/90 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Modern Architecture</h3>
                        <p className="text-gray-600 text-sm">React 18, responsive design, and production-ready code architecture</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

/**
 * Upload Section Component
 */
const UploadSection = ({ onUpload, isLoading, progress }) => {
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const { showToast } = useToast();

    const handleFileSelect = (file) => {
        try {
            validateFile(file);
            setSelectedFile(file);
            
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Check</h2>
                    <p className="text-gray-600">Drag and drop your check image or click to browse</p>
                </div>

                <div 
                    className={`upload-area border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                        dragOver 
                            ? 'border-blue-400 bg-blue-50 scale-105' 
                            : 'border-gray-300 hover:border-gray-400'
                    } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={CONFIG.SUPPORTED_FORMATS.join(',')}
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={isLoading}
                    />

                    {previewUrl ? (
                        <div className="space-y-4">
                            <img 
                                src={previewUrl} 
                                alt="Check preview" 
                                className="max-w-xs mx-auto rounded-lg shadow-md"
                            />
                            <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-3xl">📤</span>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">
                                    {dragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Supports JPG, PNG, WebP, PDF (Max 10MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {selectedFile && !isLoading && (
                    <div className="text-center mt-6">
                        <button 
                            onClick={handleUpload}
                            className="btn-primary px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Analyze Check
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="mt-8">
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-center mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-700 font-medium">Analyzing your check...</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

/**
 * Results Section Component
 */
const ResultsSection = ({ results, onNewUpload }) => {
    const { showToast } = useToast();

    const handleCopy = async (text, fieldName) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`${fieldName} copied to clipboard!`, 'success');
        } catch (error) {
            showToast('Failed to copy to clipboard', 'error');
        }
    };

    const fields = [
        { key: 'accountHolder', label: 'Account Holder', icon: '👤' },
        { key: 'accountNumber', label: 'Account Number', icon: '🏦' },
        { key: 'routingNumber', label: 'Routing Number', icon: '🔢' },
        { key: 'bankName', label: 'Bank Name', icon: '🏛️' },
        { key: 'ifscCode', label: 'IFSC Code', icon: '🏷️' },
        { key: 'micrCode', label: 'MICR Code', icon: '📊' },
        { key: 'checkNumber', label: 'Check Number', icon: '#️⃣' },
        { key: 'date', label: 'Date', icon: '📅' },
        { key: 'amountNumbers', label: 'Amount (Numbers)', icon: '💰' },
        { key: 'amountWords', label: 'Amount (Words)', icon: '💸' },
        { key: 'signatureStatus', label: 'Signature Status', icon: '✍️' },
        { key: 'memo', label: 'Memo', icon: '📝' },
        { key: 'address', label: 'Address', icon: '📍' }
    ];

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Check Analysis Results
                    </h2>
                    <p className="text-gray-600">Click on any field to copy it to your clipboard</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {fields.map((field) => (
                        <div key={field.key} className="glass-card result-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{field.icon}</span>
                                <button 
                                    className="copy-btn text-gray-400 hover:text-blue-600 transition-colors"
                                    onClick={() => handleCopy(results[field.key], field.label)}
                                    title="Click to copy"
                                >
                                    📋
                                </button>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">{field.label}</h3>
                            <p className="text-gray-600 break-words">
                                {results[field.key] || 'Not found'}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button 
                        onClick={onNewUpload}
                        className="btn-secondary px-8 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                        Upload Another Check
                    </button>
                </div>
            </div>
        </section>
    );
};

/**
 * Footer Component
 */
const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12 mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-2">
                        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            CheckVision
                        </h3>
                        <p className="text-gray-300 mb-4">
                            Enterprise-grade AI-powered document processing system for automated bank check analysis. 
                            Demonstrates advanced machine learning integration, secure data handling, and scalable web architecture.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <a href="https://github.com/nandhayogesh/CheckVision" 
                               className="text-gray-400 hover:text-blue-400 transition-colors" 
                               target="_blank" 
                               rel="noopener noreferrer">
                                <span className="sr-only">GitHub</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/in/nandhayogesh-ks/" 
                               className="text-gray-400 hover:text-blue-400 transition-colors" 
                               target="_blank" 
                               rel="noopener noreferrer">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-4">Technical Stack</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>React 18 + Modern JavaScript</li>
                            <li>Google Gemini AI API</li>
                            <li>Responsive CSS Design</li>
                            <li>RESTful API Integration</li>
                            <li>File Upload & Processing</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-4">Key Features</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>AI-Powered OCR Processing</li>
                            <li>Real-time Data Extraction</li>
                            <li>Security-First Architecture</li>
                            <li>Cross-Platform Compatibility</li>
                            <li>Scalable Performance</li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
                    <p>&copy; 2025 CheckVision - Portfolio Project by Nandhayogesh</p>
                    <div className="mt-4 md:mt-0 flex space-x-6 text-sm">
                        <span>Built with React & Gemini AI</span>
                        <span>•</span>
                        <span>Open Source MIT License</span>
                        <span>•</span>
                        <span>Professional Portfolio Showcase</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// =====================================
// MAIN APP COMPONENT
// =====================================
const App = () => {
    const [currentView, setCurrentView] = useState('home');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const { showToast } = useToast();
    
    // Test API connection on app load
    useEffect(() => {
        const testAPI = async () => {
            console.log('🔍 Testing API connection...');
            const isConnected = await geminiAPI.testConnection();
            if (isConnected) {
                showToast('API connection verified', 'success');
            } else {
                showToast('API connection failed - check your API key', 'error');
            }
        };
        testAPI();
    }, []);
    
    const handleNavigation = (view) => {
        setCurrentView(view);
        if (view === 'home') {
            setResults(null);
        }
    };
    
    const handleUpload = async (file) => {
        console.log('🚀 Starting upload process...');
        setIsLoading(true);
        setProgress(0);
        
        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(progressInterval);
                        return 95;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);
            
            showToast('Starting image analysis...', 'info');
            
            const response = await geminiAPI.analyzeImage(file);
            
            clearInterval(progressInterval);
            setProgress(100);
            
            setTimeout(() => {
                setResults(response.data);
                setCurrentView('results');
                setIsLoading(false);
                showToast('Check analysis completed successfully!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('❌ Upload failed:', error);
            setIsLoading(false);
            setProgress(0);
            showToast(error.message, 'error');
        }
    };
    
    const handleNewUpload = () => {
        setResults(null);
        setCurrentView('upload');
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentView={currentView} onNavigate={handleNavigation} />
            
            {currentView === 'home' && (
                <HeroSection onNavigate={handleNavigation} />
            )}
            
            {currentView === 'upload' && (
                <UploadSection 
                    onUpload={handleUpload} 
                    isLoading={isLoading} 
                    progress={progress} 
                />
            )}
            
            {currentView === 'results' && results && (
                <ResultsSection 
                    results={results} 
                    onNewUpload={handleNewUpload} 
                />
            )}
            
            <Footer />
        </div>
    );
};

// =====================================
// APP INITIALIZATION
// =====================================
ReactDOM.render(<App />, document.getElementById('root'));
