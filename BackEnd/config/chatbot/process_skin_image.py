import os
import sys
import json
import warnings

# MUST set environment variables BEFORE importing TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress all messages except errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations warnings
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU usage to avoid GPU warnings
os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices=false'  # Disable XLA warnings
os.environ['XLA_FLAGS'] = '--xla_hlo_profile=false'  # Disable XLA profiling
os.environ['MLIR_CRASH_REPRODUCER_DIRECTORY'] = ''  # Disable MLIR crash reproducer
os.environ['TF_DISABLE_XLA'] = '1'  # Completely disable XLA
os.environ['TF_DISABLE_SEGMENT_REDUCTION_OP_DETERMINISM_EXCEPTIONS'] = '1'
os.environ['ABSL_STDERRTHRESHOLD'] = '3'  # Suppress absl logging

# Suppress Python warnings
warnings.filterwarnings('ignore')

# Additional logging suppression before importing TensorFlow
import logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)
logging.getLogger('absl').setLevel(logging.ERROR)
logging.getLogger('tensorflow.python.platform').setLevel(logging.ERROR)

# Suppress all console output during import
import contextlib
import io

# Capture and suppress all output during TensorFlow import
with contextlib.redirect_stderr(io.StringIO()):
    import tensorflow as tf
    import numpy as np

# Suppress TensorFlow logging
tf.get_logger().setLevel('ERROR')
tf.autograph.set_verbosity(0)

# Disable TensorFlow GPU growth warnings and info
try:
    tf.config.experimental.set_memory_growth(tf.config.list_physical_devices('GPU')[0], True)
except:
    pass  # Ignore if no GPU available

# Get the directory containing the script
current_dir = os.path.dirname(os.path.abspath(__file__))

def load_model():
    """Load the saved Keras model."""
    model_path = os.path.join(current_dir, "skin_disease_detect_model.keras")
    return tf.keras.models.load_model(model_path)

def process_image(image_path):
    """Process the uploaded image and return the classification results."""
    try:
        # Check if image file exists
        if not os.path.exists(image_path):
            return {
                "success": False,
                "error": f"Image file not found: {image_path}"
            }
        
        # Define image size based on model requirements
        img_size = (450, 450)
        
        # Load and preprocess the image
        try:
            img = tf.keras.utils.load_img(
                image_path, 
                target_size=(img_size[0], img_size[1]),
                color_mode='rgb'
            )
            img_array = tf.keras.utils.img_to_array(img)
            img_array = img_array / 255.0
            img_array = np.expand_dims(img_array, axis=0)
        except Exception as img_error:
            return {
                "success": False,
                "error": f"Error loading image: {str(img_error)}"
            }
        
        # Load model
        try:
            model = load_model()
        except Exception as model_error:
            return {
                "success": False,
                "error": f"Error loading model: {str(model_error)}"
            }
          # Get class names from directory structure with Vietnamese translations
        class_names = ['Actinic keratosis', 'Atopic Dermatitis', 'Benign keratosis', 
                       'Dermatofibroma', 'Melanocytic nevus', 'Melanoma', 
                       'Squamous cell carcinoma', 'Tinea Ringworm Candidiasis', 'Vascular lesion']
        
        # Vietnamese translations for disease names
        vietnamese_names = {
            'Actinic keratosis': 'Sừng hóa quang tuyến',
            'Atopic Dermatitis': 'Viêm da cơ địa',
            'Benign keratosis': 'Sừng hóa lành tính',
            'Dermatofibroma': 'U xơ da',
            'Melanocytic nevus': 'Nốt ruồi hắc tố',
            'Melanoma': 'Ung thư hắc tố',
            'Squamous cell carcinoma': 'Ung thư tế bào vảy',
            'Tinea Ringworm Candidiasis': 'Nhiễm nấm da',
            'Vascular lesion': 'Tổn thương mạch máu'
        }
        
        # Make prediction
        try:
            predictions = model.predict(img_array, verbose=0)  # Suppress prediction output
        except Exception as pred_error:
            return {
                "success": False,
                "error": f"Error making prediction: {str(pred_error)}"
            }
        
        # Process results
        result_data = {}
        
        # Get top prediction and probability
        top_prob_index = np.argmax(predictions[0])
        top_class = class_names[top_prob_index]
        top_prob = float(predictions[0][top_prob_index]) * 100
          # Format all predictions with Vietnamese names
        all_predictions = []
        for i, prob in enumerate(predictions[0]):
            english_name = class_names[i]
            vietnamese_name = vietnamese_names.get(english_name, english_name)
            all_predictions.append({
                "disease": english_name,
                "vietnameseName": vietnamese_name,
                "probability": float(prob) * 100
            })
        
        # Sort predictions by probability (highest first)
        all_predictions.sort(key=lambda x: x["probability"], reverse=True)
        
        # Get top prediction with Vietnamese name
        top_class_english = class_names[top_prob_index]
        top_class_vietnamese = vietnamese_names.get(top_class_english, top_class_english)
        
        # Create result object
        result_data = {
            "success": True,
            "topDisease": top_class_english,
            "topDiseaseVietnamese": top_class_vietnamese,
            "topProbability": top_prob,
            "allPredictions": all_predictions
        }
        
        return result_data
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Get image path from command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Process image
    result = process_image(image_path)
    
    # Output result as JSON
    print(json.dumps(result))
