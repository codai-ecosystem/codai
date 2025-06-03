# AIDE Memory Graph Advanced Demo

This advanced demonstration showcases the AIDE Memory Graph component in a complex, real-world scenario visualizing a comprehensive software architecture. It builds on the basic demo by adding advanced filtering, multiple layout options, and detailed metadata visualization.

## Features

- **Rich System Architecture Visualization**: View a complete software system with microservices, data stores, and frontend applications
- **Multiple Layout Options**: Switch between force-directed, hierarchical, and circular layouts
- **Filtering & Search**: Filter services by team ownership or search by name/description
- **Detailed Component Information**: Explore metadata, connections, and technical details
- **Edit Mode**: Modify relationships between components
- **Critical Path Highlighting**: Identify mission-critical services and dependencies
- **System Metrics**: View high-level statistics about the system architecture
- **Team-Based Organization**: View services grouped by their owning teams
- **Modern UI with Glassmorphic Design**: Beautiful, responsive interface with depth and visual hierarchy

## Running the Demo

```bash
# From the repository root
pnpm install
cd packages/memory-graph/examples/advanced-demo
pnpm dev
```

The demo will be available at http://localhost:3002

## Implementation Details

This demo showcases:

1. **Complex Node Types**: Feature, API, and Logic nodes with different metadata structures
2. **Rich Relationship Types**: Various relationship types like 'uses', 'depends_on', 'tests'
3. **Interactive UI Components**: Sidebar filtering, detailed information panel, and layout controls
4. **Modern UI Design**: Glassmorphic elements, gradients, and responsive layout
5. **Animation Effects**: Smooth transitions using Framer Motion when selecting nodes or changing views
6. **Component Composition**: Demonstrates how to integrate MemoryGraphVisualization into a larger application
7. **Data Modeling**: Shows how to structure complex system architecture data for visualization

## Architecture Represented

The demo visualizes a modern microservice architecture with:

- Authentication and user management services
- Database and caching layers
- Search functionality
- ML/AI components
- Monitoring and observability
- Frontend applications (web, mobile, admin)

Each component includes realistic metadata such as:

- Technology stack
- Team ownership
- Production status
- Critical path designation
- Detailed description

## Component Structure

The demo consists of the following key components:

1. **Main App Container**: Layouts and coordinates all UI elements
2. **Header**: Displays application title and high-level metrics
3. **Sidebar**: Contains filtering, team selection, and layout controls
4. **Graph Visualization**: Main visualization area showing nodes and relationships
5. **Details Panel**: Shows detailed information about the selected node
6. **System Metrics**: Overlay displaying system-wide statistics

## Next Steps

This demo can be extended with:

1. **Real-time Updates**: Live streaming of service health and performance metrics
2. **Versioning History**: Visualization of architecture changes over time
3. **Service Level Objectives**: Display SLOs and current performance against targets
4. **Dependency Analysis**: Automated impact analysis for proposed changes
5. **Integration Scenarios**: Connection to real monitoring systems like Prometheus or Grafana
6. **Custom Node Types**: Extending the system with custom node types for specific domains

## Using This Demo as a Template

This demo provides a solid foundation for building your own advanced memory graph visualizations:

1. Copy the structure and component organization
2. Replace the demo data with your actual system architecture
3. Customize the visual design to match your application's theme
4. Add domain-specific filters and visualizations

For more complex implementations, consider splitting components into smaller, more focused pieces.

- Time-series data to show system evolution
- Performance metrics visualization
- Deployment status indicators
- Live data integration
