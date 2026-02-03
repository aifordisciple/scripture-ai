// app/api/card-image/route.tsx
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// 字体文件名
const FONT_FILENAME = 'NotoSansSC-Bold.ttf'; 
const FONT_PATH = path.join(process.cwd(), 'public/fonts', FONT_FILENAME);

// 加载字体 (包含详细的 Buffer 处理)
function loadFontSafe() {
  try {
    if (!fs.existsSync(FONT_PATH)) {
      console.error(`[Font Error] File not found: ${FONT_PATH}`);
      return null;
    }
    
    const fileBuffer = fs.readFileSync(FONT_PATH);
    
    // 关键：安全地转换为 ArrayBuffer
    // 直接使用 fileBuffer.buffer 有时会因为 byteOffset 问题导致 Satori 读取错误
    const arrayBuffer = new Uint8Array(fileBuffer).buffer;
    
    console.log(`[Font Loaded] Size: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (e) {
    console.error("[Font Error] Read failed:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. 数据防御性处理 (防止 undefined/null 进入 JSX)
    const verseContent = Array.isArray(body.verseContent) 
        ? body.verseContent.map((v: any) => String(v || '')) // 强制转字符串
        : [];
        
    const { 
      bookName = 'Unknown', 
      chapter = '', 
      verseRange = '', 
      bgImage = '', 
      bgGradient = 'linear-gradient(to bottom, #fff, #eee)', 
      layoutMode = 'classic',
      textColor = '#000000',
      infoColor = '#666666',
      fontSize = 24,
      textAlign = 'center',
      lineHeight = 1.5
    } = body;

    // 2. 加载字体
    const fontData = loadFontSafe();
    
    // 如果字体加载失败，我们就不传 fonts 配置给 ImageResponse
    // 这样 Satori 会使用默认的 sans-serif 字体，虽然不好看，但至少不会报错 crash
    const fontsConfig = fontData ? [
      {
        name: 'MyFont', // 使用一个简单的名字，避免空格引用问题
        data: fontData,
        style: 'normal' as const,
        weight: 700 as const,
      }
    ] : undefined;

    const fontFamilyStyle = fontData ? 'MyFont' : 'sans-serif';

    // 3. 样式构建
    const containerStyle: any = {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      fontFamily: fontFamilyStyle,
      backgroundColor: 'white', // 默认底色
      backgroundImage: bgImage && bgImage.startsWith('data:') ? `url(${bgImage})` : undefined, // 只接受 base64
      background: !bgImage || !bgImage.startsWith('data:') ? bgGradient : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };

    // 遮罩
    const overlayStyle: any = {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
    };

    // 内部卡片
    const innerCardStyle: any = {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '40px',
      height: '100%',
      width: '100%',
      boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
    };

    // 内容对齐
    let contentContainerStyle: any = {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      justifyContent: 'center',
    };

    if (layoutMode === 'poster' || layoutMode === 'film') {
      contentContainerStyle.justifyContent = 'flex-end';
      contentContainerStyle.paddingBottom = '60px';
    } else if (layoutMode === 'modern') {
      contentContainerStyle.justifyContent = 'center';
      contentContainerStyle.alignItems = 'flex-start';
    }

    // Split 模式特殊处理
    const isSplit = layoutMode === 'split';
    if (isSplit) {
      containerStyle.padding = 0;
      containerStyle.background = 'white';
      containerStyle.backgroundImage = undefined;
    }

    return new ImageResponse(
      (
        <div style={containerStyle}>
          {/* Split 模式的上半图 */}
          {isSplit && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
              backgroundImage: bgImage && bgImage.startsWith('data:') ? `url(${bgImage})` : undefined,
              background: !bgImage || !bgImage.startsWith('data:') ? bgGradient : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          )}

          {/* Film 模式遮幅 */}
          {layoutMode === 'film' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10%', background: 'black' }} />}
          {layoutMode === 'film' && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'black' }} />}
          
          {/* Poster 遮罩 */}
          {(layoutMode === 'poster') && <div style={overlayStyle} />}

          {/* 核心内容区 */}
          <div style={layoutMode === 'card' ? innerCardStyle : { 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            width: '100%',
            padding: isSplit ? '0 40px' : '0', 
            marginTop: isSplit ? '60%' : '0', 
            position: 'relative', 
            zIndex: 10
          }}>
            
            {/* 经文列表 */}
            <div style={contentContainerStyle}>
              {layoutMode === 'modern' && <div style={{ width: 60, height: 4, backgroundColor: textColor, marginBottom: 30, opacity: 0.8 }} />}
              {layoutMode === 'minimal' && <div style={{ width: 40, height: 1, backgroundColor: textColor, margin: '0 auto 30px auto', opacity: 0.6 }} />}
              
              {verseContent.length > 0 ? (
                  verseContent.map((v: string, i: number) => (
                    <div key={i} style={{
                      fontSize: fontSize * 1.8, 
                      color: textColor,
                      lineHeight: lineHeight,
                      textAlign: textAlign as any,
                      marginBottom: 24,
                      whiteSpace: 'pre-wrap', 
                    }}>
                      {v}
                    </div>
                  ))
              ) : (
                  <div style={{ fontSize: fontSize * 1.8, color: textColor }}>Loading...</div>
              )}

              {layoutMode === 'minimal' && <div style={{ width: 40, height: 1, backgroundColor: textColor, margin: '10px auto 0 auto', opacity: 0.6 }} />}
            </div>

            {/* 底部信息 */}
            <div style={{
              display: 'flex',
              flexDirection: layoutMode === 'modern' ? 'column' : 'row',
              justifyContent: (layoutMode === 'minimal' || textAlign === 'center') ? 'center' : 'space-between',
              alignItems: (layoutMode === 'minimal' || textAlign === 'center') ? 'center' : 'flex-end',
              marginTop: 40,
              paddingTop: 20,
              borderTop: layoutMode === 'minimal' ? 'none' : `1px solid ${infoColor}40`, 
              color: infoColor,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>
                  {bookName} {chapter}:{verseRange}
                </div>
                {layoutMode === 'modern' && (
                  <div style={{ fontSize: 18, opacity: 0.7, marginTop: 8 }}>Scripture AI Daily Verse</div>
                )}
              </div>

              {layoutMode !== 'modern' && layoutMode !== 'minimal' && (
                <div style={{ fontSize: 16, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Scripture AI
                </div>
              )}
            </div>

          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1440, 
        fonts: fontsConfig, // 如果字体加载失败，这里是 undefined，Satori 会自动降级
      }
    );
  } catch (e: any) {
    console.error("API Error:", e);
    // 返回 JSON 错误信息
    return new Response(JSON.stringify({ error: `Server Image Error: ${e.message}` }), { 
        status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}