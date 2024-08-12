from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import h2o
from h2o.estimators import H2OGenericEstimator

# Initialize H2O cluster
h2o.init()

# Load the H2O model
model_path = "./models/deeplearning.zip"
model = h2o.import_mojo(model_path)

app = Flask(__name__)
CORS(app)

@app.route('/status')
def health():
    return jsonify({"status": "UP"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    
    # Convert the input data to H2O Frame
    h2o_data = h2o.H2OFrame(data)
    
    # Make predictions
    predictions = model.predict(h2o_data)
    
    # Convert predictions to a list
    predictions_list = predictions.as_data_frame()
    
    return jsonify(predictions_list), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')
