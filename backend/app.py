import io
import qrcode
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from flasgger import Swagger

app = Flask(__name__)
# Enable CORS for all routes so the frontend can communicate with it
CORS(app)

swagger_config = Swagger.DEFAULT_CONFIG.copy()
swagger_config['head_text'] = '''
<style>
    /* Hide the top bar entirely */
    .swagger-ui .topbar { display: none !important; }
    
    /* Clean custom color theme */
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
        "description": "API for generating QR codes instantly.",
        "version": "1.0.0"
    }
})

@app.route('/generate', methods=['POST'])
def generate_qr():
    """
    Generate a QR Code from text or URL.
    ---
    tags:
      - QR Code Generation
    parameters:
      - in: body
        name: body
        required: true
        description: The data to be encoded in the QR code.
        schema:
          type: object
          properties:
            data:
              type: string
              example: "https://example.com"
    responses:
      200:
        description: A PNG image of the generated QR code.
        content:
          image/png:
            schema:
              type: string
              format: binary
      400:
        description: Bad request, missing data.
    """
    data = request.json.get('data')
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create an image from the QR Code instance
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save image to a bytes buffer
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    # Run on all interfaces so it can be accessed externally on the remote server
    app.run(host='0.0.0.0', port=8372)
