# CheckVision 🔍

**AI-Powered Check Analysis Application**

CheckVision is a modern web application that uses Google's Gemini AI to analyze bank check images and extract important details automatically. Built with React and powered by cutting-edge AI technology.

![CheckVision Demo](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18.x-blue)

## ✨ Features

- 🚀 **Lightning Fast Analysis** - Get results in seconds with AI-powered processing
- 🔒 **Secure & Private** - Your data is processed securely and never stored
- 🎯 **High Accuracy** - Advanced AI ensures precise data extraction
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🖼️ **Multiple Formats** - Supports JPG, PNG, WebP, and PDF files
- 📋 **Easy Copy** - Click any field to copy extracted data to clipboard

## 🎭 What CheckVision Extracts

- **Account Holder Name**
- **Account Number**
- **Routing Number**
- **Bank Name**
- **IFSC Code**
- **MICR Code**
- **Check Number**
- **Date**
- **Amount (Numbers & Words)**
- **Signature Status**
- **Memo/Purpose**
- **Address Information**

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- A Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nandhayogesh/CheckVision.git
   cd CheckVision
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - Open `app.js`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key
   ```javascript
   const GEMINI_API_KEY = "your-actual-api-key-here";
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Start analyzing your check images!

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the navigation
4. Create a new API key or use an existing one
5. Copy the API key and paste it in your configuration

## 📁 Project Structure

```
CheckVision/
├── app.js              # Main application logic
├── index.html          # HTML template
├── style.css           # Styling and animations
├── package.json        # Dependencies and scripts
├── README.md           # Project documentation
└── .gitignore         # Git ignore rules
```

## 🛠️ Built With

- **React 18** - User interface library
- **Google Gemini AI** - AI-powered image analysis
- **Tailwind CSS** - Utility-first CSS framework
- **Babel** - JavaScript compiler for JSX
- **HTML5 File API** - File upload and processing

## 🎨 Features in Detail

### Drag & Drop Upload
- Simply drag your check image onto the upload area
- Or click to browse and select files
- Instant preview of uploaded images

### Real-time Analysis
- Progress tracking during analysis
- Live updates and status messages
- Error handling with helpful feedback

### Professional Results Display
- Clean, organized results layout
- Copy-to-clipboard functionality
- Responsive grid layout for all devices

### Security & Privacy
- Client-side processing
- Secure API communication
- No data storage or retention

## 🚀 Deployment

### Using GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings
3. Navigate to Pages section
4. Select source branch (main/master)
5. Your app will be available at `https://yourusername.github.io/CheckVision`

### Using Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build` (if you add a build script)
3. Set publish directory: `./` or `dist`
4. Deploy automatically on every push

## 📝 Usage Tips

- **Use high-quality images** for best results
- **Ensure good lighting** when photographing checks
- **Keep text clear and readable** to improve accuracy
- **Supported formats**: JPG, PNG, WebP, PDF (max 10MB)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nandhayogesh**
- GitHub: [@nandhayogesh](https://github.com/nandhayogesh)

## 🙏 Acknowledgments

- Google for providing the Gemini AI API
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework

## 📞 Support

If you have any questions or need help, please open an issue in the GitHub repository.

---

**⭐ If you find this project helpful, please give it a star!**
