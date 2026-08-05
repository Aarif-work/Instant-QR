document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');

    generateBtn.addEventListener('click', async () => {
        const text = input.value.trim();
        
        if (!text) {
            showError('Please enter some text or a URL.');
            return;
        }

        // Reset UI
        hideError();
        resultContainer.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            // Update this URL to match your remote backend server
            const response = await fetch('http://187.127.143.107:5000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: text })
            });

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            // Get the image blob
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            // Update UI
            qrImage.src = imageUrl;
            downloadBtn.href = imageUrl;
            
            loading.classList.add('hidden');
            resultContainer.classList.remove('hidden');

        } catch (error) {
            loading.classList.add('hidden');
            showError('An error occurred. Please try again.');
            console.error('Error:', error);
        }
    });

    // Handle Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});
