# 📖 Bookified — Turn Any Book into an Interactive AI Voice Conversation

<div align="center">
  <img src="public/assets/logo.png" alt="Bookified Logo" width="80" />
  <h3>Don't just read books — talk with them.</h3>
  <p>An intelligent web application that transforms standard PDF books into living, interactive AI reading companions with real-time voice synthesis and instant conversational insights.</p>

  <p>
    <b>Made with ❤️ in Bharat 🇮🇳 | Bookified™</b>
  </p>
</div>

---

## 🌟 Features

- 🎙️ **Real-Time AI Voice Conversations**: Speak directly to your books using low-latency, natural synthetic voices powered by [Vapi AI](https://vapi.ai) and [ElevenLabs](https://elevenlabs.io).
- 📚 **Automated PDF Parsing & Smart Segmentation**: Upload any readable PDF (up to 50MB) and automatically extract text segments and auto-generate book covers.
- ⚡ **Lightning Fast Full-Text Search**: Instant search across your entire book library and chapter segments with MongoDB text indexing.
- 🌐 **Multi-Language Support (20 Indian Languages)**: Seamlessly translate the interface into 20 regional Indian languages via custom Google Translate integration.
- 💳 **Flexible Subscription Plans**: Built-in tiered access (Free, Standard, Pro) powered natively by Clerk User Billing.
- ⚖️ **Indian Law Compliant**: Complete Terms & Conditions and Privacy Policy complying with the **Information Technology Act, 2000**, **SPDI Rules, 2011**, and **Digital Personal Data Protection (DPDP) Act, 2023**.
- 🤝 **Support for Verified Causes**: Direct links to vetted Indian charitable and educational organizations including The Akshaya Patra Foundation, Hindu Fund, Veducation, Shiv Dhaam, and For The People.
- 📱 **Modern, Responsive & Accessible UI**: Fluid layouts, floating auto-hiding navigation, and shimmer skeleton loading states.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: JavaScript (ES2022 / JSX)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Authentication & Billing**: [Clerk](https://clerk.com)
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com) & [Mongoose](https://mongoosejs.com)
- **Voice AI Agent**: [Vapi AI](https://vapi.ai)
- **Voice Synthesis**: [ElevenLabs](https://elevenlabs.io)
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **File Storage**: [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- **Deployment**: [Vercel](https://vercel.com)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NisargDelvadiya/Bookified.git
cd Bookified
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and configure the required keys:

```env
# Clerk Authentication & Billing
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# MongoDB Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bookified?retryWrites=true&w=majority

# Vapi AI & ElevenLabs
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_public_key
NEXT_PUBLIC_ASSISTANT_ID=your_vapi_assistant_id
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
Bookified/
├── app/
│   ├── (root)/
│   │   ├── books/new/          # Upload new book page
│   │   ├── privacy/            # Privacy Policy (DPDP Act 2023)
│   │   ├── subscriptions/      # Pricing & Clerk Billing Table
│   │   ├── terms/              # Terms and Conditions (IT Act 2000)
│   │   ├── loading.jsx         # Root shimmer skeleton loading
│   │   └── page.jsx            # Library dashboard & search
│   ├── api/
│   │   ├── upload/             # Server-side Vercel Blob file upload
│   │   └── vapi/search-book/   # Vapi webhook for live book context lookup
│   ├── books/[slug]/           # Book interactive voice reader
│   ├── globals.css             # Global design tokens and utilities
│   └── layout.jsx              # Global layout with Navbar, Footer & Clerk
├── components/
│   ├── ui/                     # Accessible UI primitives (Button, Form, etc.)
│   ├── BookCard.jsx            # Book presentation card
│   ├── BookCardSkeleton.jsx    # Shimmer skeleton for library
│   ├── FileUploader.jsx        # Drag-and-drop file uploader
│   ├── Footer.jsx              # Compliant footer with causes & legal links
│   ├── GoogleTranslate.jsx     # 20 Indian languages translation switcher
│   ├── HeroSection.jsx         # Library banner with visual walkthrough
│   ├── Navbar.jsx              # Floating auto-hiding responsive header
│   ├── Search.jsx              # Real-time debounced library search
│   ├── Transcript.jsx          # Live voice conversation transcript
│   ├── UploadForm.jsx          # Multi-step book synthesis form
│   ├── VapiControls.jsx        # Voice agent connection & mic controls
│   └── VoiceSelector.jsx       # ElevenLabs assistant voice selector
├── database/
│   ├── models/                 # Mongoose schemas (Book, Segment, Session)
│   └── mongoose.js             # Cached MongoDB connection handler
├── hooks/
│   ├── useSubscription.js      # Clerk subscription plan detection
│   └── useVapi.js              # Real-time Vapi voice session lifecycle
├── lib/
│   ├── actions/                # Next.js Server Actions
│   ├── constants.js            # Voices, limits, and UI presets
│   ├── subscription-constants.js # Free / Standard / Pro tier limits
│   └── utils.js                # PDF parser, slug generator, segmentation
├── public/                     # Static assets, logos, and favicons
└── jsconfig.json               # Path aliases configuration
```

---

## 🏛️ Legal & Grievance Redressal

In accordance with the **Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021** and the **Digital Personal Data Protection Act, 2023**:

- **Grievance & Data Protection Officer**: Nisarg Jayesh Delvadiya
- **Email**: [nisarg.delvadiya1@zohomail.in](mailto:nisarg.delvadiya1@zohomail.in)
- **Location**: Vadodara, Gujarat, Bharat

---

## 💛 Credits & Acknowledgments

This project is built upon the foundation of the open-source **Bookified** tutorial and repository by **Adrian Hajdin (JavaScript Mastery)**:
- Original Repository: [adrianhajdin/jsm_bookified](https://github.com/adrianhajdin/jsm_bookified)
- Creator: [Adrian Hajdin / JavaScript Mastery](https://jsmastery.pro)

Special thanks to the JavaScript Mastery community for providing an inspiring architectural baseline.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
