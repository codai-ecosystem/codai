# Memory Graph Basic Demo

This is a basic demonstration of the AIDE Memory Graph components, showcasing interactive visualization of project structures and relationships.

## Features Demonstrated

- **Interactive Graph Visualization**: Click, zoom, and pan through the memory graph
- **Multiple Layout Options**: Force, hierarchical, circular, and grid layouts
- **Node Selection**: Click nodes to view detailed information
- **Relationship Visualization**: See connections between different components
- **Edit Mode**: Enable editing to interact with relationships
- **Responsive Design**: Modern, beautiful UI that adapts to different screen sizes

## Running the Demo

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The demo will open at `http://localhost:3001`

## Sample Data

The demo includes a realistic project structure with:

- **Authentication System**: Core security features
- **UI Component Library**: Reusable React components
- **API Gateway**: Central service routing
- **Memory Graph System**: The visualization system itself
- **Database Layer**: Data abstraction
- **Notification Service**: Real-time updates

## Interactions

- **Mouse wheel**: Zoom in and out
- **Click and drag**: Pan around the graph
- **Click nodes**: Select and view node details
- **Layout buttons**: Switch between different graph layouts
- **Checkboxes**: Toggle editing mode and relationship visibility

## Architecture

This demo uses:

- React 18 with TypeScript
- Vite for fast development
- Modern CSS with backdrop filters and gradients
- The AIDE Memory Graph components library
