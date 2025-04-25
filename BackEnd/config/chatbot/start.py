import subprocess
import os
import ollama
from typing import Optional


def pull_model(model_name: str = "llama3.2:3b") -> bool:
    """
    Pull a model using ollama client.
    
    Args:
        model_name: Name of the model to pull
        
    Returns:
        bool: True if successful, False otherwise
    """
    print(f"Pulling {model_name} model...")
    try:
        response = ollama.pull(model_name)
        print(f"Successfully pulled {model_name} model")
        print(f"Model details: {response}")
        return True
    except Exception as e:
        print(f"Error pulling {model_name} model: {str(e)}")
        return False


def create_custom_model(modelfile_path: str, custom_name: Optional[str] = None) -> bool:
    """
    Create a custom model using a Modelfile.
    
    Args:
        modelfile_path: Path to the Modelfile
        custom_name: Name for the custom model
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not os.path.exists(modelfile_path):
        print(f"Error: Modelfile not found at {modelfile_path}")
        return False
        
    default_model_name = "AMH_chatbot"
    if not custom_name:
        custom_name = default_model_name
        
    print(f"Using model name: {custom_name}")
        
    try:
        print(f"Creating custom model '{custom_name}' using Modelfile...")
        result = subprocess.run(
            ["ollama", "create", custom_name, "-f", modelfile_path],
            check=True, capture_output=True, text=True
        )
        print("Success! Output:", result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing ollama command: {e}\nError output: {e.stderr}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return False


def main():
    """Main function to orchestrate model pulling and custom model creation."""

    default_base_model = "llama3.2:3b"
    user_model = input(f"Enter base model name to pull (default: {default_base_model}): ").strip()
    base_model = user_model or default_base_model
    
    if not pull_model(base_model):
        print("Failed to pull the base model. Exiting.")
        return
    
    create_custom = input("Would you like to create a custom model? (y/n, default: y): ").strip().lower()
    if create_custom and create_custom[0] == 'n':
        print("Skipping custom model creation.")
    else:
        default_modelfile_path = "./Modelfile.txt"
        modelfile_path = input(f"Enter path to the Modelfile (default: {default_modelfile_path}): ").strip() or default_modelfile_path
        
        custom_name = input("Enter a name for your custom model (leave empty for default 'AMH_chatbot'): ").strip()
        
        if not create_custom_model(modelfile_path, custom_name if custom_name else None):
            print("Failed to create custom model.")
    
    print("\n======================================")
    print("Important: Please ensure Ollama is running!")
    print("If Ollama is not running, start it with 'ollama serve' in another terminal")
    print("======================================")


if __name__ == "__main__":
    main()
