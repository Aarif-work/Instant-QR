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
swagger_config['favicon'] = 'https://petstore.swagger.io/favicon-32x32.png'
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
        "description": "API for generating QR codes from text, or by uploading an image.",
        "version": "1.0.0"
    }
})

@app.route('/generate', methods=['POST'])
def generate_qr():
    """
    Generate a QR Code from text or an uploaded image.
    ---
    tags:
      - QR Code Generation
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: data
        type: string
        required: false
        description: Text or URL to encode (if not uploading an image).
      - in: formData
        name: image
        type: file
        required: false
        description: The image file to upload (if not sending text).
    responses:
      200:
        description: JSON containing the base64 QR code and optionally the uploaded image URL.
      400:
        description: Bad request, missing data or file.
    """
    
    qr_data = None
    file_url = None
    
    # 1. Check if they sent text
    if 'data' in request.form and request.form['data'].strip():
        qr_data = request.form['data'].strip()
        file_url = qr_data # For sharing purposes, the URL is just the text
        
    # 2. Check if they sent an image file
    elif 'image' in request.files and request.files['image'].filename != '':
        file = request.files['image']
        
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
        filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Hardcoded IP for remote server
        file_url = f"http://187.127.143.107:8372/static/uploads/{filename}"
        qr_data = file_url
        
    else:
        return jsonify({'error': 'No text or image provided'}), 400

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
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
