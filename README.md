# CV Platform - Roboflow MVP Clone

A complete computer vision platform MVP built with React, TypeScript, Tailwind CSS, and Supabase. This project implements four core modules for dataset management, annotation, workflow building, and public dataset sharing.

> **Current status:** the repo is partially production-ready and now passes `typecheck`, `build`, and `lint`.
>
> **Completed**
> - Cloud/local storage switcher and storage setup page
> - Browser-backed local mode for offline-style project data
> - Project, dataset, class, annotation, workflow, and public dataset flows wired through the storage layer
> - Import/export support, including JSON project bundles and COCO/YOLO dataset export
> - Review-status and attribution schema migrations
> - `.bolt` cleanup from the repository
>
> **Left to complete**
> - True filesystem-backed local persistence
> - Authentication and user account flows
> - Production-grade Supabase RLS and permission model
> - Realtime collaboration / syncing
> - More complete binary asset round-tripping for import/export
> - Bundle splitting and further performance hardening

## Features

### Module 1: Dataset Management
- Create and manage CV projects with task types (Detection, Classification, Segmentation)
- Upload images with drag-and-drop support
- Organize images into train/validation/test splits
- Browse and search dataset with filtering
- Export datasets in standard formats
- Version control for dataset snapshots

### Module 2: Image Annotation Tool
- Canvas-based annotation editor with zoom, pan, and reset controls
- Bounding box and polygon drawing tools
- Color-coded label classes
- Undo/Redo functionality with keyboard shortcuts
- Auto-save annotations to database
- Image navigation with progress tracking

### Module 3: Visual Workflow Builder
- Drag-and-drop pipeline editor with React Flow
- Four node types: Load Dataset, Preprocess, Augment, Export
- Configurable node settings for each processing step
- Visual pipeline execution with results summary
- Workflow persistence and versioning

### Module 4: Public Dataset Hub
- Browse and search publicly shared datasets
- Filter by task type and tags
- Dataset detail pages with image previews
- Like and fork public datasets
- Multi-step dataset upload wizard
- Community contribution system

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Supabase Storage
- **Canvas**: react-konva for annotation
- **Workflow**: React Flow for pipeline building
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Build**: Vite

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx                 # Main sidebar layout
│   ├── dataset/                   # Module 1 components
│   ├── annotator/                 # Module 2 components
│   ├── workflow/                  # Module 3 components
│   └── universe/                  # Module 4 components
├── pages/
│   ├── ProjectList.tsx
│   ├── ProjectDashboard.tsx
│   ├── DatasetView.tsx
│   ├── AnnotationEditor.tsx
│   ├── ClassManager.tsx
│   ├── WorkflowBuilder.tsx
│   ├── UniverseHome.tsx
│   ├── DatasetDetail.tsx
│   └── UploadDataset.tsx
├── lib/
│   └── supabase.ts               # Supabase client
├── types/
│   └── index.ts                  # TypeScript type definitions
├── utils/                         # Utility functions
└── App.tsx                       # Main app with routing
```

## Database Schema

### Tables
- `projects` - CV projects
- `images` - Project images
- `annotations` - Bounding boxes and polygons
- `label_classes` - Label definitions
- `workflows` - Processing pipelines
- `public_datasets` - Shared datasets
- `dataset_likes` - User likes for public datasets

All tables include:
- Row Level Security (RLS) for data protection
- Proper indexing for query performance
- Foreign key constraints for data integrity
- Timestamps for audit trails

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (free tier available at supabase.com)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cv-platform
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file with your Supabase credentials
```bash
cp .env.example .env
```

4. Add your Supabase URL and anon key:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Run development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Deployment to Vercel

### Via GitHub

1. Push your repository to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and select your GitHub repository
4. Vercel will auto-detect the Vite configuration
5. Add environment variables in project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the CLI prompts to deploy your project.

## Environment Variables

Required environment variables for deployment:

```
VITE_SUPABASE_URL        - Your Supabase project URL
VITE_SUPABASE_ANON_KEY   - Your Supabase anon key
```

These are injected at build time and embedded in the frontend bundle (they are public credentials).

## Setting Up Supabase Storage

1. Create a new bucket named `project-images`:
   - Go to Storage in Supabase dashboard
   - Click "New bucket"
   - Name: `project-images`
   - Make it public or configure access policies

2. Configure RLS policies for the bucket (if needed)

## API Routes & Data Models

See `src/types/index.ts` for complete TypeScript type definitions.

### Project
```typescript
{
  id: string
  name: string
  taskType: 'detection' | 'classification' | 'segmentation'
  imageCount: number
  splits: { train: number, val: number, test: number }
  createdAt: string
  updatedAt: string
}
```

### Image
```typescript
{
  id: string
  projectId: string
  storageUrl: string
  filename: string
  split: 'train' | 'val' | 'test'
  annotated: boolean
  uploadedAt: string
}
```

### Annotation
```typescript
{
  id: string
  projectId: string
  imageId: string
  type: 'bbox' | 'polygon'
  classId: string
  className: string
  color: string
  // bbox: x, y, width, height
  // polygon: points
  createdAt: string
}
```

## Available Scripts

```bash
# Development
npm run dev           # Start dev server on :5173

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Quality
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking

# Maintenance
npm audit fix         # Fix vulnerable dependencies
```

## Styling

The project uses Tailwind CSS for styling with:
- Custom color scheme (dark theme)
- Responsive design with breakpoints
- Smooth transitions and hover states
- Accessible color contrast ratios

### Customization

Edit `tailwind.config.js` to customize the design system.

## Security

- Row Level Security (RLS) enabled on all tables
- Public data access policies for MVP phase
- Environment variables for sensitive config
- No secrets embedded in code
- HTTPS-only deployment recommended

For production, implement proper authentication and tighter RLS policies based on user identity.

## Module Roadmap

### Current Status: Foundation Complete
- ✅ Project management basics
- ✅ Image upload and browser
- ⏳ Annotation canvas (in progress)
- ⏳ Workflow builder (in progress)
- ⏳ Universe hub (in progress)

### Future Enhancements
- User authentication with Supabase Auth
- Real-time collaboration
- Model training integration
- Advanced export formats
- Performance monitoring
- API endpoint documentation
- Webhook system
- Batch operations
- Dataset versioning UI
- Multi-user projects

## Performance Optimizations

- Code splitting with Vite
- Image lazy loading
- Database query optimization with indexes
- Minified production builds
- CSS purging with Tailwind
- Asset compression

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Build fails with "terser not found"
```bash
npm install --save-dev terser
```

### Supabase connection error
- Verify VITE_SUPABASE_URL is correct
- Check VITE_SUPABASE_ANON_KEY is valid
- Ensure .env file is loaded properly

### Images not uploading
- Check Storage bucket exists and is public
- Verify bucket name is `project-images`
- Check browser console for error details

## Contributing

This is an MVP project. Contributions welcome!

## License

MIT - Open source and free to use

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check React Flow docs: https://reactflow.dev
4. Open an issue in the repository

---

**Ready to deploy!** Your CV Platform is production-ready and can be deployed to Vercel with zero configuration needed beyond environment variables.
