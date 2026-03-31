import os, dotenv
dotenv.load_dotenv('.env')
import google.generativeai as genai
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
supported = [m.name for m in genai.list_models() if 'bidiGenerateContent' in m.supported_generation_methods]
print(f"BIDI SUPPORTED MODELS: {supported}")
