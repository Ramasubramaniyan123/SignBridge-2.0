# SignBridge Connect

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Bun (for package management)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd signbridge-connect
   ```

2. Install dependencies using Bun:
   ```bash
   bun install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` if it exists
   - Add your Supabase URL and anon key to `.env`

### Running the Project
1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open your browser and navigate to `http://localhost:5173` (default Vite port)

### Building for Production
```bash
bun run build
```

### Preview Production Build
```bash
bun run preview
```