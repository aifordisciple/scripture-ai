# scripts/tts.py
import sys
import asyncio
import edge_tts

# 接收命令行参数：1. 要朗读的文本 2. 输出文件路径
TEXT = sys.argv[1]
OUTPUT_FILE = sys.argv[2]

# 推荐的声音：
# zh-CN-XiaoxiaoNeural (女声，非常自然，适合朗读)
# zh-CN-YunxiNeural (男声，沉稳，适合新闻或叙述)
VOICE = "zh-CN-XiaoxiaoNeural"

async def amain():
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)

if __name__ == "__main__":
    loop = asyncio.get_event_loop_policy().get_event_loop()
    try:
        loop.run_until_complete(amain())
    finally:
        loop.close()