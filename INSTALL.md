# Scripture AI 安装部署指南

本文档详细介绍如何将 Scripture AI 部署到安卓手机。

---

## 方式一：本地构建 APK (推荐)

### 1. 环境准备

确保已安装：
- Node.js >= 18
- Java JDK 17+
- Android Studio (包含 SDK)

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd scripture-ai
```

### 3. 安装依赖

```bash
# 安装 Web 端依赖
npm install

# 安装移动端依赖
cd app-mobile
npm install
```

### 4. 生成 Android 项目

```bash
cd app-mobile
npm run prebuild
```

这会创建 `android` 目录。

### 5. 构建 APK

```bash
# Debug 版 (无需签名，可直接安装)
cd android
./gradlew assembleDebug

# Release 版 (需要签名)
./gradlew assembleRelease
```

### 6. APK 位置

```
app-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 方式二：EAS 云端构建 (无需本地 Android SDK)

### 1. 安装 EAS CLI

```bash
npm install -g eas-cli
```

### 2. 登录 Expo

```bash
eas login
```

### 3. 配置项目

```bash
cd app-mobile
eas build:configure
```

### 4. 构建 APK

```bash
# 构建 Android (预览版)
eas build -p android --profile preview

# 构建 Android (发布版)
eas build -p android --profile production
```

### 5. 下载 APK

构建完成后，EAS 会提供下载链接。

---

## 方式三：仅导出 JS Bundle

如果你已有 Android 项目，只需 JS Bundle：

```bash
cd app-mobile

# 导出 JS Bundle
npx expo export --platform android
```

然后将 `dist/index.android.bundle` 复制到 Android 项目的 `assets` 目录。

---

## 安装 APK 到手机

### 方法 1: USB 安装

```bash
# 连接手机，开启 USB 调试
adb devices  # 确认设备连接

adb install app-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法 2: 文件传输

1. 将 APK 传到手机存储
2. 打开文件管理器
3. 点击 APK 文件安装
4. 允许"安装未知来源应用"

### 方法 3: 扫码安装

1. 确保手机和电脑在同一 WiFi
2. 运行 `npm start`
3. 手机打开 Expo Go，扫码

---

## 配置 API 服务器

默认连接 `http://localhost:3000/api`

### 修改 API 地址

编辑 `app-mobile/app/_layout.tsx`:

```typescript
// 在文件顶部添加
const API_BASE_URL = 'https://your-server.com/api';

// 或者通过环境变量
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
```

### 配置环境变量

创建 `app-mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://your-server.com
```

---

## 常见问题

### 1. APK 无法安装

**问题**: "应用未安装"或签名错误

**解决**:
- Debug APK 无需签名，可直接安装
- Release APK 需要签名密钥

### 2. 无法连接服务器

**问题**: 手机无法访问 API

**解决**:
- 确保手机和服务器在同一网络，或服务器已公网部署
- 检查 API 地址是否正确
- 检查服务器防火墙是否开放 3000 端口

### 3. 构建失败

**问题**: Gradle 构建失败

**解决**:
```bash
cd android
./gradlew clean
cd ..
npm run prebuild -- --clean
```
### 4. Android SDK 未找到

**问题**: `ANDROID_HOME` 未设置

**解决**:
```bash
# macOS
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Linux
export ANDROID_HOME=/usr/local/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 5. Gradle 下载超时

**问题**: `./gradlew` 下载 Gradle 超时

**解决**: 使用 EAS 云端构建
```bash
cd app-mobile
eas login  # 登录 Expo 账号
eas build -p android --profile preview
```
### 4. Android SDK 未找到

**问题**: `ANDROID_HOME` 未设置

**解决**:
```bash
# macOS
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Linux
export ANDROID_HOME=/usr/local/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

---

## 发布到应用商店

### Google Play

1. 构建 Release APK 并签名
2. 创建 Google Play 开发者账号
3. 在 Play Console 上传 APK
4. 填写应用信息并提交审核

### 直接分发

1. 签名 Release APK
2. 分发 APK 文件或通过第三方应用商店

---

## 技术支持

如有问题，请提交 Issue：https://github.com/your-repo/issues
