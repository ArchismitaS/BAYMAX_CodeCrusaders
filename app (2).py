from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests


@app.route('/', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok'}), 200


@app.route('/posture', methods=['POST'])
def posture():
    """Accepts JSON representing pose landmarks and returns simple feedback.

    The endpoint is tolerant of a few input shapes (list, dict under 'landmarks',
    or raw JSON). If no usable data is present, returns 400.
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({'error': 'No JSON received'}), 400

    # Try to extract landmarks from a few common keys/shapes
    landmarks = None
    if isinstance(data, dict):
        if 'landmarks' in data:
            landmarks = data['landmarks']
        else:
            landmarks = data
    else:
        landmarks = data

    # Basic validation: expect a non-empty list or dict-like structure
    if not landmarks:
        return jsonify({'error': 'No pose data found in JSON'}), 400

    # Simplified posture feedback logic (placeholder)
    feedback = 'Good posture'

    return jsonify({'feedback': feedback, 'received': True}), 200


if __name__ == '__main__':
    # Bind explicitly to 127.0.0.1 and a known port for tests
    app.run(host='127.0.0.1', port=5000, debug=True)
