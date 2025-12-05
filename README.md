# 📚 AI Translator - 云文档智能翻译平台

A professional cloud documentation translation platform powered by AI (Google Gemini, Claude, OpenAI). Built as a **serverless-first** application using Next.js.

---

## 🎯 Features

- ✅ **Instant Translation** - Real-time text translation with 3 modes (Professional, Casual, Summary)
- ✅ **Document Translation** - Parse and translate web pages or uploaded files
- ✅ **Multi-AI Provider** - Switch between Gemini, Claude, and OpenAI
- ✅ **Glossary Management** - Custom terminology database
- ✅ **AI Assistant** - Interactive chatbot for technical questions
- ✅ **Translation History** - Persistent history with local storage
- ✅ **Dark/Light Theme** - Full theme support with system preference
- ✅ **Responsive Design** - Mobile-first with adaptive layouts

---

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys (at least GEMINI_API_KEY)

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 📂 Project Structure

```
frontend/
├── app/
│   ├── api/                        # Serverless API endpoints
│   │   ├── instant-translation/    # Text translation API
│   │   ├── document-translate/     # Document translation API
│   │   ├── glossary/               # Glossary CRUD API
│   │   └── _lib/                   # Shared utilities
│   ├── globals.css                 # Theme CSS variables
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main app
│
├── src/
│   ├── components/                 # React components
│   │   ├── InstantTranslator.tsx   # Text translation UI
│   │   ├── HomePage.tsx            # Document upload/URL input
│   │   ├── DualEditor.tsx          # Side-by-side doc view
│   │   ├── HistoryPanel.tsx        # Translation history
│   │   ├── GlossaryPanel.tsx       # Terminology management
│   │   ├── AIAssistant.tsx         # Chat interface
│   │   └── SettingsModal.tsx       # Theme & provider settings
│   ├── store/
│   │   └── translation.ts          # Zustand state management
│   ├── api/
│   │   └── client.ts               # API wrapper
│   └── types/
│       └── index.ts                # TypeScript types
│
├── public/                         # Static assets
├── TECHNICAL_OVERVIEW.md           # Technical documentation
└── package.json
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| Markdown | React Markdown |
| HTML Parsing | Cheerio |
| HTTP Client | Axios |

### AI Providers
| Provider | Model | Best For |
|----------|-------|----------|
| Google Gemini | `gemini-2.5-flash` | Default - fast & cost-effective |
| Anthropic | `claude-3-sonnet` | High quality translations |
| OpenAI | `gpt-4` | Enterprise use cases |

---

## 🔑 Environment Variables

Create a `.env` file in the `frontend` folder:

```env
# Required - at least one AI provider
GEMINI_API_KEY=your-gemini-api-key      # Recommended

# Optional - additional providers
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [TECHNICAL_OVERVIEW.md](./frontend/TECHNICAL_OVERVIEW.md) | Architecture, flows, and technical details |

---

## 🎨 Screenshots

### Instant Translation
- Professional, Casual, and Summary modes
- Language selector with flags
- Copy and clear buttons

### Document Translation
- URL input or file upload
- Side-by-side original and translated view
- Batch processing with progress

### Settings
- Theme switching (Light/Dark/System)
- AI provider selection
- Responsive modals

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Components | 7 |
| API Routes | 4 |
| AI Providers | 3 |
| Theme Support | Light/Dark/System |

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Manual Build

```bash
cd frontend
npm run build
npm start
```

---

## 💡 Usage Tips

1. **For best results**: Use specific documentation URLs, not homepages
2. **Large documents**: Limited to 30 paragraphs to prevent timeout
3. **AI Provider**: Gemini is recommended for cost-effectiveness
4. **Theme**: Follows system preference by default

---

## 🔮 Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] Cloud sync for history/glossary
- [ ] PDF file support
- [ ] More language pairs
- [ ] Translation memory/caching
- [ ] Streaming responses

---

## 📄 License

MIT License

---

**Happy Translating!** 🚀
