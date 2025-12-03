# 🚀 本地测试指南

## ✅ 当前运行状态

### 前端
- **状态**: ✅ 运行中
- **地址**: http://localhost:3000
- **进程 ID**: 58936
- **功能**: 完全可用

### 后端
- **状态**: ✅ 已启动
- **地址**: http://localhost:3001
- **功能**: 测试端点就绪
- **Swagger 文档**: http://localhost:3001/api

### 数据库
- **状态**: ⏳ 未启动（可选）
- **说明**: 目前后端可以在没有数据库的情况下运行测试端点

---

## 📋 测试清单

### 前端测试

#### 1. 访问首页
```
URL: http://localhost:3000
预期: 看到现代化的首页，包含:
  ✓ 首页标题和描述
  ✓ URL 输入框
  ✓ 文件上传区域
  ✓ 翻译模式选择器
  ✓ 导航栏（登录、文档、历史）
```

#### 2. 测试 URL 输入
```
操作:
  1. 在 URL 输入框输入任意链接
  2. 点击"开始翻译"按钮

预期:
  ✓ 显示加载状态
  ✓ 跳转到双栏编辑器
  ✓ 显示模拟的翻译结果
```

#### 3. 测试双栏编辑器
```
功能测试:
  ✓ 左边显示原文(英文)
  ✓ 右边显示译文(中文)
  ✓ 切换视图模式(双栏/仅原文/仅译文)
  ✓ 同步滚动功能
  ✓ 段落编辑功能
  ✓ 复制按钮
```

#### 4. 测试 AI 助手
```
操作:
  1. 点击右上角的聊天图标
  2. 查看 AI 助手侧边栏
  3. 输入问题

预期:
  ✓ 侧边栏展开
  ✓ 显示建议问题
  ✓ 可以输入新问题
```

#### 5. 测试术语库
```
操作:
  1. 点击右上角的书籍图标
  2. 查看术语库面板

预期:
  ✓ 显示 8 个预定义术语
  ✓ 可以搜索术语
  ✓ 可以按分类筛选
  ✓ 可以添加自定义术语
```

---

### 后端 API 测试

#### 1. 健康检查
```bash
# 测试基本连接
curl http://localhost:3001/

预期响应:
{
  "message": "Welcome to AI Document Translation Platform API"
}
```

#### 2. 获取服务状态
```bash
curl http://localhost:3001/status

预期响应:
{
  "status": "ok",
  "timestamp": "2024-11-25T17:43:44.000Z",
  "version": "1.0.0"
}
```

#### 3. 测试翻译端点（模拟）
```bash
curl -X POST http://localhost:3001/test/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "AWS VPC is a virtual network", "mode": "professional"}'

预期响应:
{
  "success": true,
  "message": "翻译测试成功",
  "original": "AWS VPC is a virtual network",
  "translated": "AWS VPC 是一个虚拟网络",
  "mode": "professional",
  "confidence": 0.95,
  "timestamp": "2024-11-25T17:43:44.000Z"
}
```

#### 4. 测试术语库端点（模拟）
```bash
curl http://localhost:3001/test/glossary

预期响应:
{
  "terms": [
    {
      "id": "1",
      "english": "VPC",
      "chinese": "虚拟私有云",
      "category": "infrastructure",
      "explanation": "..."
    },
    {
      "id": "2",
      "english": "IAM",
      "chinese": "身份和访问管理",
      "category": "security",
      "explanation": "..."
    }
  ],
  "total": 2
}
```

#### 5. Swagger 文档
```
地址: http://localhost:3001/api
功能:
  ✓ 查看所有 API 端点
  ✓ 查看请求/响应结构
  ✓ 直接测试 API
```

---

## 🎯 前后端集成测试

### 测试流程

#### 步骤 1: 获取模拟翻译数据
```bash
# 后端提供翻译
curl -X POST http://localhost:3001/test/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}'
```

#### 步骤 2: 前端调用后端
```javascript
// 在浏览器控制台执行
fetch('http://localhost:3001/status')
  .then(r => r.json())
  .then(d => console.log('后端响应:', d))
  .catch(e => console.error('错误:', e))
```

#### 步骤 3: 检查 CORS
```javascript
// 测试跨域请求
fetch('http://localhost:3001/test/glossary')
  .then(r => r.json())
  .then(d => console.log('术语库:', d))
```

---

## 🐛 故障排除

### 前端无法连接后端

**问题**: 浏览器控制台显示 CORS 错误

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:3001/status

# 检查端口占用
netstat -ano | findstr "3001"

# 重启后端
cd D:\ai-translator-website\backend
npm run dev
```

### 后端无法启动

**问题**: 编译错误或模块错误

**解决方案**:
```bash
# 清理编译缓存
cd backend
rm -rf dist
npm run build

# 重新安装依赖
rm -rf node_modules
npm install --legacy-peer-deps

# 重新启动
npm run dev
```

### 前端加载缓慢

**问题**: 首次加载时间长

**解决方案**:
```bash
# 清理 Next.js 缓存
cd frontend
rm -rf .next
npm run dev
```

---

## 📊 实时监控

### 查看前端日志
```bash
# 前端运行日志已在终端显示
# 查看浏览器控制台: F12 → Console
```

### 查看后端日志
```bash
# 后端日志显示在启动终端
# 可以看到:
#  ✓ 编译状态
#  ✓ 模块加载
#  ✓ API 端点映射
#  ✓ 请求日志
```

---

## 📝 测试数据

### 模拟翻译文本
```
原文 (English):
  "Amazon VPC is a virtual network inside AWS. It allows you to
   define a virtual network topology that resembles a traditional
   network."

译文 (Chinese):
  "Amazon VPC 是 AWS 内的虚拟网络。它允许您定义类似于传统网络的虚拟网络拓扑。"
```

### 模拟段落
```
- 标题: "Introduction to AWS VPC"
- 正文: "VPC 是云计算中的基础..."
- 代码块: (自动跳过翻译)
- 表格: (保留格式)
```

---

## ✨ 成功指标

测试完成后，您应该看到:

- ✅ 前端完全加载和交互
- ✅ 双栏编辑器正确显示
- ✅ AI 助手侧边栏工作
- ✅ 术语库面板可用
- ✅ 后端 API 响应正确
- ✅ 模拟翻译返回正确数据
- ✅ 模拟术语库返回正确数据
- ✅ 没有 CORS 错误
- ✅ 没有 JavaScript 错误

---

## 🎉 下一步

### 连接真实数据库
```bash
# 启动 PostgreSQL
docker-compose up -d

# 重启后端（将自动连接数据库）
cd backend && npm run dev
```

### 启用完整翻译
```bash
# 配置 LLM API 密钥
# 编辑 backend/.env
GEMINI_API_KEY=你的密钥
CLAUDE_API_KEY=你的密钥
OPENAI_API_KEY=你的密钥

# 重启后端
npm run dev
```

### 测试完整流程
```
1. 前端输入 URL
2. 后端解析文档
3. 调用 LLM 翻译
4. 返回结果
5. 前端显示双栏编辑器
6. 用户编辑和保存
```

---

## 🔗 快速链接

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| Swagger 文档 | http://localhost:3001/api |
| 数据库管理 | http://localhost:8080 |

---

**测试愉快！** 🚀

如有任何问题，请查看项目文档:
- DEVELOPMENT.md - 开发指南
- ARCHITECTURE.md - 系统架构
- IMPLEMENTATION_EXAMPLES.md - 代码示例
