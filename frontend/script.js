document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('image-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('generate-error-message');

    // Make sure to put your actual remote server IP here!
    const API_URL = 'http://187.127.143.107:8372/generate';

    let currentImageUrl = ''; // To store the uploaded image URL for WhatsApp

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${e.target.files[0].name}`;
            fileNameDisplay.classList.remove('hidden');
            generateBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = 'No file selected';
            generateBtn.disabled = true;
        }
    });

    generateBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        
        if (!file) {
            showError(errorMsg, 'Please select an image file first.');
            return;
        }

        // Hide previous results and show loading
        resultContainer.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loading.classList.remove('hidden');
        generateBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData // Fetch automatically sets correct Content-Type for FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate QR code');
            }

            const data = await response.json();
            
            // Set the QR image source using base64
            qrImage.src = `data:image/png;base64,${data.qr_code_base64}`;
            downloadBtn.href = qrImage.src;
            
            // Save the URL for WhatsApp sharing
            currentImageUrl = data.image_url;
            
            loading.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            loading.classList.add('hidden');
            showError(errorMsg, error.message || 'Error connecting to the server. Make sure it is running!');
        } finally {
            generateBtn.disabled = false;
        }
    });

    whatsappBtn.addEventListener('click', () => {
        if (currentImageUrl) {
            const text = encodeURIComponent(`Check out my image: ${currentImageUrl}`);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
            window.open(whatsappUrl, '_blank');
        }
    });

    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
});
