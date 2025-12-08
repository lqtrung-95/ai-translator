# AI 翻译器设置指南

## 环境配置

### 1. 配置 API Keys

在 `frontend` 目录下创建 `.env.local` 文件（已提供模板），然后配置至少一个翻译服务提供商的 API Key。

#### 推荐：使用 Gemini API（免费额度充足）

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 "Create API Key" 创建新的 API Key
3. 复制 API Key 并替换 `.env.local` 文件中的 `GEMINI_API_KEY` 值

```bash
GEMINI_API_KEY=AIza...your-actual-key-here
```

#### 可选：Claude API

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建 API Key
3. 配置 `CLAUDE_API_KEY`

#### 可选：OpenAI API

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建 API Key
3. 配置 `OPENAI_API_KEY`

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 功能说明

### 文档翻译

支持通过 URL 翻译在线文档，具有以下特性：

#### 1. URL 锚点定位
当提供带有锚点的 URL 时，系统会自动定位到指定位置开始翻译：

```
https://docs.cloud.google.com/docs/overview#section-name
```

系统会从 `#section-name` 对应的元素开始翻译，而不是从页面顶部开始。

#### 2. 智能内容过滤
- 自动跳过图片、视频等媒体内容
- 保留代码块原样（不翻译代码）
- 过滤导航、页脚等非内容区域

#### 3. 批量翻译
使用批处理提高翻译效率，每批处理 10 个段落。

## 故障排查

### 翻译显示 "[待翻译]" 或翻译失败

**原因：** API Key 未配置或配置错误

**解决方法：**
1. 检查 `.env.local` 文件是否存在
2. 确认 API Key 格式正确（不包含 `your-` 前缀）
3. 验证 API Key 是否有效（可以在对应平台测试）
4. 查看浏览器控制台或服务器日志获取详细错误信息

### 无法找到锚点位置

**原因：** 目标网站使用了特殊的锚点格式

**解决方法：**
系统会尝试多种格式查找锚点：
- `#section-name`
- `#section_name`
- URL 编码的锚点
- 通过 `data-id` 和 `data-anchor` 属性查找

如果仍然无法找到，系统会从页面开始处翻译。

### 构建错误：supabaseUrl is required

**原因：** Supabase 配置缺失（用于用户认证功能）

**临时解决：** 如果只需要翻译功能，可以添加占位符配置：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
```

**完整解决：** 在 [Supabase](https://supabase.com/) 创建项目并配置真实的 URL 和 Key。

## API 使用限制

- **Gemini API**: 免费层每分钟 15 次请求
- **Claude API**: 根据订阅计划
- **OpenAI API**: 根据订阅计划和账户余额

建议在 `.env.local` 中配置多个提供商，系统会按照选择的提供商顺序尝试。