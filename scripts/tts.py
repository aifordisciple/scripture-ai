# scripts/tts.py
import sys
import asyncio
import edge_tts

# 接收命令行参数：1. 要朗读的文本 2. 输出文件路径 3. 声音名称（可选，默认晓晓）
TEXT = sys.argv[1]
OUTPUT_FILE = sys.argv[2]
VOICE = sys.argv[3] if len(sys.argv) > 3 else "zh-CN-XiaoxiaoNeural"

async def amain():
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)

if __name__ == "__main__":
    asyncio.run(amain())
