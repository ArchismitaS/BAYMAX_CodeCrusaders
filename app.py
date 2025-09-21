from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

@app.route('/posture', methods=['POST'])
def posture():
    pose_landmarks = request.json

    if not pose_landmarks:
        return jsonify({'error':'No pose data received'}), 400

    # Simplified posture feedback logic
    feedback = 'Good posture'

    return jsonify({'feedback': feedback})

if __name__ == '__main__':
    app.run(debug=True)
