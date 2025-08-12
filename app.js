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
                            Home
                        </button>
                        <button 
                            onClick={() => onNavigate('upload')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                                currentView === 'upload' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Upload
                        </button>
                    </nav>
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
                <h1 className="hero-title text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    Extract details from bank checks
                    <span className="block text-blue-600">easily and securely</span>
                </h1>
                
                <p className="hero-subtitle text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Upload your check image and let our AI-powered system extract all the important details 
                    in seconds. Fast, accurate, and completely secure.
                </p>
                
                <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button 
                        onClick={() => onNavigate('upload')}
                        className="btn-primary px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Upload Check Image
                        <span className="ml-2">→</span>
                    </button>
                    
                    <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">✓</span>
                        Supports JPG, PNG, PDF formats
                    </div>
                </div>
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="feature-card bg-white/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 text-sm">Get results in seconds with AI-powered analysis</p>
                    </div>
                    
                    <div className="feature-card bg-white/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
                        <p className="text-gray-600 text-sm">Your data is processed securely and never stored</p>
                    </div>
                    
                    <div className="feature-card bg-white/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">High Accuracy</h3>
                        <p className="text-gray-600 text-sm">Advanced AI ensures precise data extraction</p>
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
                            AI-powered bank check analysis tool that extracts details quickly and securely.
                            Process your checks with confidence using cutting-edge technology.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-4">Features</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>• AI-Powered Analysis</li>
                            <li>• Secure Processing</li>
                            <li>• Multiple Formats</li>
                            <li>• Instant Results</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
                            <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-400">Contact Us</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 CheckVision. All rights reserved. Built with React and Gemini AI.</p>
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
