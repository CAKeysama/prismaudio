import asyncio
import edge_tts

async def main():
    communicate = edge_tts.Communicate("Olá mundo! Testando o sistema.", "pt-BR-AntonioNeural")
    async for chunk in communicate.stream():
        if chunk["type"] != "audio":
            print(chunk)

if __name__ == "__main__":
    asyncio.run(main())
