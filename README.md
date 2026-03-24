# SignBridge Connect

## Quick Start
```bash
git clone <repository-url>
cd signbridge-connect
npm install
npm run dev
```
Then open `http://localhost:5173` in your browser.

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Package manager: Bun (recommended) or npm

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd signbridge-connect
   ```

2. Install dependencies:
   - Using Bun (recommended):
     ```bash
     bun install
     ```
   - Using npm:
     ```bash
     npm install
     ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` if it exists
   - Add your Supabase URL and anon key to `.env`

### Running the Project
1. Start the development server:
   - Using Bun:
     ```bash
     bun run dev
     ```
   - Using npm:
     ```bash
     npm run dev
     ```

2. Open your browser and navigate to `http://localhost:5173` (default Vite port)

### Other Commands
- Build for production:
  ```bash
  bun run build
  # or
  npm run build
  ```

- Preview production build:
  ```bash
  bun run preview
  # or
  npm run preview
  ```

- Run tests:
  ```bash
  bun run test
  # or
  npm run test
  ```