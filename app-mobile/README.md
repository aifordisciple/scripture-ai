# Scripture AI Mobile App

基于 Expo 的跨平台移动应用。

---

## 什么是 Expo？

**Expo** 是一个基于 React Native 的开发框架，让你可以用 JavaScript/TypeScript 开发原生 iOS 和 Android 应用。

### Expo 的优势
- **一套代码**：用 React Native 编写，同时运行在 iOS 和 Android
- **无需 Mac**：可以在 Windows/Linux 上开发 iOS 应用
- **快速预览**：扫码即可在真机上预览
- **原生功能**：轻松访问相机、推送、文件系统等

### 我们的移动应用
- 使用 **Expo SDK 52** + **React Native 0.76**
- 使用 **Expo Router** 实现文件路由
- 代码与 Web 端共享 (packages/core)

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn
- Android Studio (Android 开发)
- Xcode (iOS 开发，仅 macOS)

### 安装

```bash
# 进入移动应用目录
cd app-mobile

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 运行

```bash
# Android (需要 Android Studio 模拟器或真机)
npm run android

# iOS (仅 macOS)
npm run ios

# Web
npm run web
```

---

## 生成 APK 安装到安卓手机

### 方法一：本地构建 (推荐)

```bash
cd app-mobile

# 1. 生成本地原生 Android 项目
npm run prebuild

# 2. 进入 Android 目录
cd android

# 3. 构建 Debug APK (可直接安装测试)
./gradlew assembleDebug

# 4. APK 生成在: android/app/build/outputs/apk/debug/
```

### 方法二：EAS Build (云端构建)

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录 Expo 账号
eas login

# 3. 配置项目
eas build:configure

# 4. 构建 APK (无需 Xcode)
eas build -p android --profile preview
```

### 方法三：导出 JS Bundle (结合现有 Android 项目)

```bash
cd app-mobile

# 1. 导出 JS Bundle
npx expo export --platform android

# 2. 将 bundle 放入现有 Android 项目
# 复制 dist/index.android.bundle 到 android/app/src/main/assets/
```

---

## APK 安装到手机

### Debug APK
构建完成后，APK 文件位于：
```
app-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装方式

1. **USB 连接**：通过 ADB 安装
   ```bash
   adb install app-mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **文件传输**：将 APK 传到手机，通过文件管理器安装

3. **扫码安装**：启动 Metro 后，在手机 Expo Go 中扫码

---

## 配置 API 地址

默认连接 `http://localhost:3000/api`

修改为你的服务器地址：

1. 在 `app-mobile/app/_layout.tsx` 中修改
2. 或设置环境变量

```typescript
// app-mobile/app/_layout.tsx
const API_BASE_URL = 'https://your-server.com/api';
```

---

## 项目结构

```
app-mobile/
├── app/                    # Expo Router 页面
│   ├── _layout.tsx        # 根布局
│   ├── (tabs)/            # Tab 导航页面
│   │   ├── index.tsx     # 阅读首页
│   │   ├── search.tsx    # 搜索
│   │   ├── plans.tsx    # 读经计划
│   │   ├── highlights.tsx # 收藏
│   │   ├── community.tsx  # 社区
│   │   ├── offline.tsx   # 离线
│   │   └── profile.tsx  # 我的
│   └── chapter/          # 章节阅读
│       └── [bookId]/
│           └── [chapter].tsx
├── assets/                 # 静态资源
│   ├── icon.png          # 应用图标 (1024x1024)
│   ├── splash.png        # 启动画面
│   └── notification-icon.png
├── package.json           # 依赖
└── tsconfig.json         # TypeScript 配置
```

---

## 应用图标

需要准备以下尺寸的应用图标：

| 平台 | 尺寸 | 文件名 |
|------|------|--------|
| iOS | 1024x1024 | icon.png |
| Android | 1024x1024 | adaptive-icon.png |
| Android | 48x48 | launcher_icon.png |
| 通知 | 96x96 | notification_icon.png |

可以使用以下工具生成：
- [App Icon Generator](https://appiconmaker.co/)
- [Expo Icon](https://expo.dev/resources/sharing)

---

## 功能清单

### ✅ Phase 0 (MVP)
- [x] 圣经目录浏览
- [x] 章节阅读
- [x] 搜索功能
- [x] 读经计划列表
- [x] 高亮收藏
- [x] 用户设置
- [x] 社区/好友
- [x] 离线下载

### ⚙️ Phase 1
- [ ] AI 对话
- [ ] 语音朗读
- [ ] 推送通知

---

## 注意事项

1. **API 配置**: 默认连接 `http://localhost:3000/api`
2. **离线功能**: 需要配置后端服务支持离线 API 响应缓存
3. **推送通知**: 需要配置 Firebase (Android) / APNs (iOS)

---

## 故障排除

### Metro 缓存问题
```bash
npx expo start --clear
```

### Android 构建问题
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### iOS 构建问题
```bash
cd ios
rm -rf Pods Podfile.lock
cd ..
npx expo run:ios
```

---

## 部署到应用商店

### Google Play
1. 构建 Release APK
2. 签名 APK
3. 在 Google Play Console 上传

### App Store
1. 构建 iOS 项目
2. 在 Xcode 中Archive
3. 在 App Store Connect 上传
