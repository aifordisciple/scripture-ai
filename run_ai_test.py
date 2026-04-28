import asyncio
import argparse
import os
import base64
from browser_use import ChatOpenAI
from browser_use import Agent, BrowserSession, BrowserProfile

async def main():
    # 1. 设置命令行参数 (新增了默认值配置)
    parser = argparse.ArgumentParser(description="AI 自动化网页测试工具 (适配 Claude Code)")
    parser.add_argument("-t", "--task", required=True, help="打开 http://localhost:3000，验证用户登录及跳转逻辑")
    parser.add_argument("-m", "--model", default="qwen3.5-plus", help="模型名称 (默认: minimax)")
    parser.add_argument("-b", "--base-url", default="https://coding.dashscope.aliyuncs.com/v1", help="API Base URL")
    
    # --- API Key, Username, Password 从环境变量获取，不再硬编码 ---
    parser.add_argument("-k", "--api-key", default=os.environ.get("AI_TEST_API_KEY", ""), help="API Key (从环境变量 AI_TEST_API_KEY 获取)")
    parser.add_argument("-usr", "--username", default=os.environ.get("AI_TEST_USERNAME", ""), help="测试用登录账号 (从环境变量 AI_TEST_USERNAME 获取)")
    parser.add_argument("-pwd", "--password", default=os.environ.get("AI_TEST_PASSWORD", ""), help="测试用登录密码 (从环境变量 AI_TEST_PASSWORD 获取)")
    # ---------------------------------------------------------
    
    parser.add_argument("-o", "--output", default="test_report.md", help="测试报告输出路径")
    parser.add_argument("-img", "--screenshot", default="error_screenshot.png", help="最终状态截图保存路径 (默认: error_screenshot.png)")
    
    args = parser.parse_args()

    # 获取 API Key：优先使用环境变量，如果环境变量没有，则使用 argparse 的默认值
    api_key = os.getenv("OPENAI_API_KEY") or args.api_key
    if not api_key or api_key == "填写你的默认API_KEY":
        print("❌ 致命错误：未找到有效的 API Key。请在代码中设置默认参数，或设置 OPENAI_API_KEY 环境变量。")
        exit(1)

    # 2. 拼接增强版任务提示词 (注入账号密码)
    enhanced_task = args.task
    if args.username and args.password:
        enhanced_task += f"\n\n[系统指令] 如果测试过程中遇到登录环节，请使用以下测试凭证进行验证。账号: {args.username} ，密码: {args.password}。"

    print(f"🚀 [AI QA] 正在初始化测试任务...")
    print(f"📋 任务目标: {args.task}")
    if args.username:
        print(f"🔑 注入测试凭证: {args.username} / ******")

	# 3. 配置大语言模型
    llm = ChatOpenAI(
        model=args.model,
        api_key=api_key,
        base_url=args.base_url,
        temperature=0.1
    )

	# 4. 配置后台静默运行的浏览器 (使用新版 API)
    browser_session = BrowserSession(
        browser_profile=BrowserProfile(
            headless=True  # 开启无头模式，不弹出实体窗口
        )
    )

    # 5. 初始化 Agent 并绑定会话
    agent = Agent(
        task=enhanced_task,
        llm=llm,
        browser_session=browser_session,   # <--- 注意：参数名变成了 browser_session
        max_actions_per_step=3,
        use_vision=False
    )

    try:
        print("⏳ [AI QA] 浏览器接管中，正在执行操作，请稍候...")
        history = await agent.run()
        
        final_result = history.final_result()
        errors = history.errors()
        
        # 4. 提取并保存最后一步的截图
        screenshot_msg = ""
        try:
            if hasattr(history, 'history') and len(history.history) > 0:
                last_state = history.history[-1].state
                if hasattr(last_state, 'screenshot') and last_state.screenshot:
                    img_data = base64.b64decode(last_state.screenshot)
                    with open(args.screenshot, "wb") as f:
                        f.write(img_data)
                    screenshot_msg = f"📸 **现场截图已保存至**: `{args.screenshot}`\n*(如果在排查 UI 异常，可直接查看此图片)*\n\n"
                    print(f"📸 [AI QA] 截图已保存至: {os.path.abspath(args.screenshot)}")
        except Exception as img_e:
            screenshot_msg = f"⚠️ 截图抓取失败: {str(img_e)}\n\n"
            print(f"⚠️ [AI QA] 截图抓取失败: {str(img_e)}")

        # 5. 生成结构化 Markdown 报告
        report_content = f"# AI 自动化测试报告\n\n"
        report_content += f"## 测试需求\n> {args.task}\n\n"
        
        report_content += screenshot_msg

        if errors:
            report_content += f"## ❌ 发现错误 (Bug)\n"
            report_content += "测试过程中捕获到以下异常或阻断：\n"
            for err in errors:
                report_content += f"- `{err}`\n"
            report_content += "\n"
        else:
            report_content += f"## ✅ 执行状态\n未在执行流程中捕获到底层报错。\n\n"
            
        report_content += f"## 🤖 测试员反馈与总结\n{final_result}\n"

        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        print(f"✅ [AI QA] 测试结束！详细报告已生成至: {os.path.abspath(args.output)}")

    except Exception as e:
        print(f"❌ [AI QA] 测试框架运行崩溃: {str(e)}")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(f"# 测试脚本崩溃日志\n\n## 错误信息\n```python\n{str(e)}\n```\n请检查测试代码本身或网络连接。")

if __name__ == "__main__":
    asyncio.run(main())