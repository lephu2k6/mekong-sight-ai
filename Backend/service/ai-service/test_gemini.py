import google.generativeai as genai
import os

key = os.environ.get("GEMINI_API_KEY", "").strip()
if not key:
    raise RuntimeError("Missing GEMINI_API_KEY in environment.")

genai.configure(api_key=key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")

print("-" * 20)
print("Testing gemini-1.5-flash...")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Error with gemini-1.5-flash: {e}")
