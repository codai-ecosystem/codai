/**
 * AIDE UI Components Library
 * Shared React components for conversation, memory graph, and preview interfaces
 */

// Core components
export { ConversationView } from './components/ConversationView';
export { MessageBubble } from './components/MessageBubble';
export { MemoryGraphVisualization } from './components/MemoryGraphVisualization';
export { NodeCard } from './components/NodeCard';
export { PreviewPanel } from './components/PreviewPanel';
export { TimelineView } from './components/TimelineView';
export { TaskStatus } from './components/TaskStatus';
export { AgentIndicator } from './components/AgentIndicator';

// Layout components
export { Layout } from './components/Layout';
export { Sidebar } from './components/Sidebar';
export { Header } from './components/Header';
export { StatusBar } from './components/StatusBar';

// UI primitives
export { Button } from './components/ui/Button';
export { Input } from './components/ui/Input';
export { Select } from './components/ui/Select';
export { Dialog } from './components/ui/Dialog';
export { Toast } from './components/ui/Toast';
export { Card } from './components/ui/Card';
export { Badge } from './components/ui/Badge';
export { Progress } from './components/ui/Progress';

// Hooks
export { useMemoryGraph } from './hooks/useMemoryGraph';
export { useAgentStatus } from './hooks/useAgentStatus';
export { useConversation } from './hooks/useConversation';
export { useTaskProgress } from './hooks/useTaskProgress';

// Types
export type { ConversationViewProps, MessageBubbleProps, MemoryGraphVisualizationProps } from './types';

// Styles
import './styles/globals.css';
