import asyncio
import edge_tts

async def generate_audio_with_timestamps_async(text: str, voice: str):
    communicate = edge_tts.Communicate(text, voice)
    audio_data = b""
    timestamps = []
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
        elif chunk["type"] in ["WordBoundary", "SentenceBoundary"]:
            # edge-tts returns offset and duration in 100-nanosecond units.
            # Convert to seconds: 1 second = 10,000,000 * 100-ns
            offset_sec = chunk["offset"] / 10000000.0
            duration_sec = chunk["duration"] / 10000000.0
            timestamps.append({
                "text": chunk["text"],
                "start": offset_sec,
                "end": offset_sec + duration_sec
            })
            
    return audio_data, timestamps

def generate_audiobook(text: str, voice: str):
    """
    Roda a geração e retorna os bytes de áudio e a lista de timestamps.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    audio_data, timestamps = loop.run_until_complete(
        generate_audio_with_timestamps_async(text, voice)
    )
    loop.close()
    return audio_data, timestamps
