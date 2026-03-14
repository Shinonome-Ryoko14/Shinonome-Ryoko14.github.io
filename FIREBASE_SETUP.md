# Firebase 配置教程

## 1. 创建 Firebase 项目

1. 访问 https://console.firebase.google.com
2. 点击「Add project」→ 输入项目名 → 创建
3. 进入项目控制台

## 2. 启用 Authentication

1. 左侧菜单 → Build → Authentication
2. 点击「Get started」
3. Sign-in method → Email/Password → 启用 → 保存

## 3. 启用 Firestore Database

1. 左侧菜单 → Build → Firestore Database
2. 点击「Create database」
3. 选择「Start in production mode」
4. 选择数据中心（推荐 asia-east1）

## 4. 配置安全规则

进入 Firestore → Rules，粘贴以下规则：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户资料
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    // 社区文章
    match /community_posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.authorId
                    || request.auth.token.email == 'YOUR_ADMIN_EMAIL';
      allow delete: if request.auth.uid == resource.data.authorId
                    || request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }
    // 评论
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.authorId;
      allow delete: if request.auth.uid == resource.data.authorId
                    || request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }
    // 公告
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }
  }
}
```

将 `YOUR_ADMIN_EMAIL` 替换为你的管理员邮箱。

## 5. 获取 Firebase 配置

1. 项目设置（齿轮图标）→ General → Your apps
2. 点击 Web 图标（</>）→ Register app
3. 复制 `firebaseConfig` 对象的值

## 6. 填入 config.json

打开 `config.json`，找到 `"firebase"` 部分，替换对应的值：

```json
"firebase": {
  "apiKey":            "你的 apiKey",
  "authDomain":        "你的项目.firebaseapp.com",
  "projectId":         "你的 projectId",
  "storageBucket":     "你的项目.appspot.com",
  "messagingSenderId": "你的 messagingSenderId",
  "appId":             "你的 appId"
}
```

然后将 `config.json` 提交到 GitHub，等 1~2 分钟即可。

## 完成！

配置完成后刷新页面，将看到：
- 导航栏出现「登录 / 注册」按钮
- 文章区出现「官方博客」和「社区广场」两个标签
- 公告栏（如有公告）
- 文章底部出现实时评论区
