import asyncio
import os
import dotenv
dotenv.load_dotenv()
from google import genai
from google.genai import types

async def test():
    client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
    config = types.LiveConnectConfig(response_modalities=[types.Modality.AUDIO])
    models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-flash']
    
    for m in models:
        try:
            async with client.aio.live.connect(model=m, config=config) as s:
                print(f'{m}: SUCCESS')
        except Exception as e:
            print(f'{m}: FAILED - {e}')

if __name__ == "__main__":
    asyncio.run(test())
