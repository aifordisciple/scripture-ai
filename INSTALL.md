# Scripture AI 安装部署指南

本文档详细介绍如何将 Scripture AI 部署到安卓手机。

---

## 方式一：本地构建 APK (推荐)

### 1. 环境准备

确保已安装：

* Node.js >= 18
* Java JDK 17+
* Android Studio (包含 SDK) 或已在 Linux 环境下配置好 Android command-line tools

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

### 🚨 常见问题与避坑指南 (Troubleshooting)

在首次执行 `./gradlew assembleDebug` 时，受限于网络环境或依赖版本，可能会遇到以下常见问题：

#### 问题 1：下载 Gradle 压缩包超时 (`SocketTimeoutException`)

* **现象**：终端一直卡在 `Downloading https://services.gradle.org/distributions/gradle-8.10.2-all.zip`，最终报错超时。
* **解决办法**（手动下载并本地挂载）：
1. 使用浏览器或下载工具手动下载报错中的 URL（如 `gradle-8.10.2-all.zip`），**无需解压**。
2. 将下载的 `.zip` 文件放入 `app-mobile/android/gradle/wrapper/` 目录下。
3. 打开该目录下的 `gradle-wrapper.properties`，修改路径直接指向本地文件：
```properties
# 修改前：distributionUrl=https\://services.gradle.org/...
# 修改后如下：
distributionUrl=gradle-8.10.2-all.zip

```





#### 问题 2：SDK location not found 报错

* **现象**：报错提示 `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable...`
* **解决办法**：
在 `app-mobile/android/` 根目录下手动新建一个 `local.properties` 文件，配置 SDK 的绝对路径：
```properties
# Linux 示例：
sdk.dir=/usr/local/android-sdk
# macOS 示例：
# sdk.dir=/Users/你的用户名/Library/Android/sdk
# Windows 示例：
# sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk

```



#### 问题 3：依赖包下载缓慢或报错 (配置阿里云镜像)

* **现象**：构建过程中长时间卡顿，或者报 Maven 仓库拉取失败。
* **解决办法**：
打开 `app-mobile/android/build.gradle`，在 `buildscript` 和 `allprojects` 的 `repositories` 块中，注释掉默认的 `google()` 和 `mavenCentral()`，加入阿里云镜像：
```gradle
repositories {
    // 阿里云国内镜像源，加速依赖下载
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
}

```



#### 问题 4：Compose 与 Kotlin 版本不兼容报错

* **现象**：报错类似 `This version (1.5.15) of the Compose Compiler requires Kotlin version 1.9.25 but you appear to be using Kotlin version 1.9.24`。
* **解决办法**（强制跳过版本检查）：
打开 `app-mobile/android/build.gradle`，在文件**最底部**追加以下代码：
```gradle
// 强制跳过 Compose 编译器的严格版本检查
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += [
                "-P",
                "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=true"
            ]
        }
    }
}

```


修改后，由于 Gradle 可能存在缓存，**必须先杀掉守护进程并清理缓存**再重新编译：
```bash
# 彻底杀掉所有 Gradle 后台守护进程
./gradlew --stop

# 清理之前的失败产物和缓存
./gradlew clean

# 重新开始打包
./gradlew assembleDebug

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
