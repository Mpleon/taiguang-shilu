# 胎光食录

酒馆助手脚本的远程加载版本。初始代码提取自用户提供的《酒馆助手脚本-胎光食录V1.1.json》，保留原脚本功能。本仓库添加通过 jsDelivr `@latest` 加载的导入入口。

## 安装

1. 安装并启用 SillyTavern 的酒馆助手（Tavern Helper）。
2. 从本仓库 Releases 下载 `taiguang-shilu.auto.json`。
3. 在酒馆助手的角色脚本库导入并启用。若已安装原版，请停用原版，避免重复运行。
4. 打开配套聊天，点击右下角“食录”悬浮球。

脚本依赖消息变量 `stat_data.事件.胎光食录`。仓库不包含配套角色卡、世界书或变量初始化脚本。编辑和快照恢复会写入聊天变量；快照保存于浏览器本地存储。

## 自动更新

导入版 JSON 的代码为：

```js
import 'https://cdn.jsdelivr.net/gh/Mpleon/taiguang-shilu@latest/index.js';
```

用户刷新酒馆后重新加载脚本。CDN 缓存可能延迟更新；加载失败时请检查网络及控制台。自动更新只涉及 JavaScript 代码，不更新角色卡或世界书。

## 发布新版本

1. 修改仓库根目录 `index.js`，提交并推送。
2. 对包含该文件的提交创建递增的语义版本标签，例如 `v1.1.1` 或 `v1.2.0`。
3. 用该标签发布 GitHub Release，并附上 `taiguang-shilu.auto.json`，供新用户安装。

`@latest` 按 jsDelivr 的语义版本规则解析，不严格以 GitHub Release 的 Latest 标记为准。保持正式版本标签与 Release 同步发布；不要移动已发布标签。通常无需更改或重新导入加载版 JSON。

`index.js` 必须存在于标签对应的仓库中，仅上传到 Release 附件不够。

## 文件

- `index.js`：原始脚本代码。
- `taiguang-shilu.auto.json`：酒馆助手可导入的自动更新入口。

原脚本作者和授权信息未包含于所提供文件中，本仓库未为原代码另行声明许可证。