import asyncio
import dotenv
import os
import traceback
dotenv.load_dotenv('.env')

from google import genai
from google.genai import types

async def test():
    try:
        api_key = os.environ.get('GEMINI_API_KEY')
        client = genai.Client(api_key=api_key)
        
        config = types.LiveConnectConfig(response_modalities=[types.Modality.AUDIO])
        
        connect_cm = client.aio.live.connect(model="gemini-2.5-flash-native-audio-latest", config=config)
        session = await connect_cm.__aenter__()
        print("CONNECT SUCCESS!")
        
        print("TRYING TO SEND REALTIME INPUT...")
        
        chunk = b'\x00' * 1024
        
        try:
            await session.send_realtime_input(
                audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
            )
            print("SEND_REALTIME_INPUT KWARGS SUCCESS")
        except TypeError as e:
            print("TYPE_ERROR on Kwargs:", str(e))
            
        try:
            await session.send_realtime_input(
                [types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")]
            )
            print("SEND_REALTIME_INPUT LIST SUCCESS")
        except AttributeError as e:
            print("ATTR_ERROR on List:", str(e))

        await connect_cm.__aexit__(None, None, None)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
