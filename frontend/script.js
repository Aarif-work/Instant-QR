document.addEventListener('DOMContentLoaded', () => {
    // --- Tabs Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');

            // If navigating away from scan, stop camera
            if (targetId !== 'scan-section' && html5QrCode) {
                stopScanner();
            }
        });
    });

    // --- Generate QR Logic ---
    const input = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('generate-error-message');

    // Make sure to put your actual remote server IP here!
    const API_URL = 'http://187.127.143.107:8372/generate';

    generateBtn.addEventListener('click', async () => {
        const text = input.value.trim();
        
        if (!text) {
            showError(errorMsg, 'Please enter some text or a URL');
            return;
        }

        // Hide previous results and show loading
        resultContainer.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loading.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: text })
            });

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            qrImage.src = imageUrl;
            downloadBtn.href = imageUrl;
            
            loading.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            loading.classList.add('hidden');
            showError(errorMsg, 'Error connecting to the server. Make sure it is running!');
        } finally {
            generateBtn.disabled = false;
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    // --- Scan QR Logic ---
    let html5QrCode;
    const startCamBtn = document.getElementById('start-camera-btn');
    const stopCamBtn = document.getElementById('stop-camera-btn');
    const fileUpload = document.getElementById('qr-upload');
    const readerContainer = document.getElementById('reader-container');
    const scanControls = document.querySelector('.scan-controls');
    
    const scanResultContainer = document.getElementById('scan-result-container');
    const scanResultText = document.getElementById('scan-result-text');
    const scanErrorMsg = document.getElementById('scan-error-message');
    const copyBtn = document.getElementById('copy-btn');

    startCamBtn.addEventListener('click', startScanner);
    stopCamBtn.addEventListener('click', stopScanner);

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length == 0) return;
        const file = e.target.files[0];
        
        scanErrorMsg.classList.add('hidden');
        scanResultContainer.classList.add('hidden');

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                onScanSuccess(decodedText);
            })
            .catch(err => {
                showError(scanErrorMsg, "Could not find a valid QR Code in this image.");
            });
    });

    function startScanner() {
        scanErrorMsg.classList.add('hidden');
        scanResultContainer.classList.add('hidden');
        scanControls.classList.add('hidden');
        readerContainer.classList.remove('hidden');

        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(err => {
                readerContainer.classList.add('hidden');
                scanControls.classList.remove('hidden');
                showError(scanErrorMsg, "Error starting camera. Permissions denied?");
            });
    }

    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                readerContainer.classList.add('hidden');
                scanControls.classList.remove('hidden');
                html5QrCode.clear();
                html5QrCode = null;
            }).catch(err => {
                console.error("Failed to stop scanner.", err);
            });
        }
    }

    function onScanSuccess(decodedText) {
        if (html5QrCode && html5QrCode.isScanning) {
            stopScanner();
        }
        scanResultText.textContent = decodedText;
        scanResultContainer.classList.remove('hidden');
    }

    function onScanFailure(error) {
        // Handle scan failure silently to keep scanning
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(scanResultText.textContent)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = originalText, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text', err);
            });
    });

    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
});
