document.addEventListener('DOMContentLoaded', () => {
    // --- Tabs Logic ---
    let currentTab = 'url-section';
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            currentTab = btn.getAttribute('data-target');
            document.getElementById(currentTab).classList.remove('hidden');

            // Reset state on tab change
            resetState();
            
            // Turn off camera if we switch away from the camera tab
            if (currentTab !== 'camera-section') {
                stopCamera();
            }
        });
    });

    // --- State Variables ---
    const API_URL = 'http://187.127.143.107:8372/generate';
    let currentImageUrl = ''; // To store the uploaded image URL for WhatsApp
    
    // Elements
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('generate-error-message');

    // Tab 1: URL Elements
    const urlInput = document.getElementById('qr-input');
    
    // Tab 2: Upload Elements
    const fileInput = document.getElementById('image-upload');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Tab 3: Camera Elements
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('webcam-canvas');
    const startCamBtn = document.getElementById('start-cam-btn');
    const snapBtn = document.getElementById('snap-btn');
    const snapshotStatus = document.getElementById('snapshot-status');
    let stream = null;
    let cameraBlob = null; // Stores the captured photo

    function resetState() {
        resultContainer.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loading.classList.add('hidden');
        generateBtn.disabled = false;
        
        // Don't clear inputs, just the result UI
    }

    // --- Tab 2: Upload Logic ---
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${e.target.files[0].name}`;
            fileNameDisplay.classList.remove('hidden');
        } else {
            fileNameDisplay.textContent = 'No file selected';
        }
    });

    // --- Tab 3: Camera Logic ---
    startCamBtn.addEventListener('click', async () => {
        if (stream) {
            stopCamera();
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.classList.remove('hidden');
            canvas.classList.add('hidden');
            
            startCamBtn.textContent = 'Turn Camera Off';
            snapBtn.classList.remove('hidden');
            snapshotStatus.classList.add('hidden');
            cameraBlob = null;
        } catch (err) {
            showError(errorMsg, 'Camera access denied or not available.');
        }
    });

    snapBtn.addEventListener('click', () => {
        if (!stream) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Show canvas, hide live video
        video.classList.add('hidden');
        canvas.classList.remove('hidden');
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            cameraBlob = blob;
            snapshotStatus.classList.remove('hidden');
        }, 'image/jpeg', 0.9);
    });

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
            startCamBtn.textContent = 'Turn Camera On';
            snapBtn.classList.add('hidden');
        }
    }

    // --- Generate Logic (Unified) ---
    generateBtn.addEventListener('click', async () => {
        const formData = new FormData();
        
        if (currentTab === 'url-section') {
            const text = urlInput.value.trim();
            if (!text) {
                showError(errorMsg, 'Please enter a URL or text.');
                return;
            }
            formData.append('data', text);
            
        } else if (currentTab === 'upload-section') {
            const file = fileInput.files[0];
            if (!file) {
                showError(errorMsg, 'Please select an image file first.');
                return;
            }
            formData.append('image', file);
            
        } else if (currentTab === 'camera-section') {
            if (!cameraBlob) {
                showError(errorMsg, 'Please snap a photo first.');
                return;
            }
            formData.append('image', cameraBlob, 'webcam_photo.jpg');
        }

        resetState();
        loading.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate QR code');
            }

            const data = await response.json();
            
            // Set the QR image source using base64
            qrImage.src = `data:image/png;base64,${data.qr_code_base64}`;
            downloadBtn.href = qrImage.src;
            
            // Save the URL for WhatsApp sharing (only available if image uploaded)
            currentImageUrl = data.image_url;
            
            if (currentImageUrl) {
                whatsappBtn.classList.remove('hidden');
            } else {
                // If it was just text, there is no public URL to share on whatsapp
                whatsappBtn.classList.add('hidden');
            }
            
            loading.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            loading.classList.add('hidden');
            showError(errorMsg, error.message || 'Error connecting to the server. Make sure it is running!');
        } finally {
            generateBtn.disabled = false;
        }
    });

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
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
