import os
import io
import uuid
import base64
import qrcode
from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flasgger import Swagger
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Swagger config to keep the clean look
swagger_config = Swagger.DEFAULT_CONFIG.copy()
swagger_config['title'] = 'Swagger'
swagger_config['favicon'] = 'https://petstore.swagger.io/favicon-32x32.png' # Uses official Swagger icon
swagger_config['head_text'] = '''
<style>
    .swagger-ui .topbar { display: none !important; }
    body { background-color: #f8fafc; }
    .swagger-ui .info .title { color: #3b82f6 !important; font-weight: 800; }
    .swagger-ui .btn.execute { background-color: #8b5cf6 !important; border-color: #8b5cf6 !important; color: white !important; font-weight: bold; }
    .swagger-ui .btn.execute:hover { background-color: #7c3aed !important; }
    .swagger-ui .opblock.opblock-post { border-color: #3b82f6 !important; background: rgba(59, 130, 246, 0.05) !important; border-radius: 8px; }
    .swagger-ui .opblock.opblock-post .opblock-summary { background-color: rgba(59, 130, 246, 0.1) !important; border-bottom: none; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3b82f6 !important; border-radius: 4px; }
</style>
'''
swagger = Swagger(app, config=swagger_config, template={
    "info": {
        "title": "Instant QR Code API",
        "description": "API for uploading an image and generating a QR code that links to it.",
        "version": "1.0.0"
    }
})

@app.route('/generate', methods=['POST'])
def generate_qr():
    """
    Upload an image to generate a QR Code linking to it.
    ---
    tags:
      - QR Code Generation
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: image
        type: file
        required: true
        description: The image file to upload.
    responses:
      200:
        description: JSON containing the base64 QR code and the URL to the uploaded image.
      400:
        description: Bad request, missing file.
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # Save the uploaded file safely with a unique name
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
        filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Generate the public URL for the uploaded image
        # Using the hardcoded IP for the remote server as requested
        file_url = f"http://187.127.143.107:8372/static/uploads/{filename}"
        
        # Create QR code for the file URL
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(file_url)
        qr.make(fit=True)

        # Create an image from the QR Code instance
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save image to a bytes buffer and encode to base64
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        qr_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
        
        return jsonify({
            'image_url': file_url,
            'qr_code_base64': qr_base64
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8372)
