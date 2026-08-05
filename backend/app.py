import io
import qrcode
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes so the frontend can communicate with it
CORS(app)

@app.route('/generate', methods=['POST'])
def generate_qr():
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
