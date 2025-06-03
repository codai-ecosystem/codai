import React, { useState, useEffect } from 'react';
import { Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import './styles/streaming.css';

interface StreamingMessageRendererProps {
	agentId: string;
	content: string;
	complete: boolean;
	className?: string;
}

/**
 * Renders streaming messages from AI agents in real-time
 */
export const StreamingMessageRenderer: React.FC<StreamingMessageRendererProps> = ({
	agentId,
	content,
	complete,
	className = '',
}) => {
	const [displayContent, setDisplayContent] = useState('');
	const [currentIndex, setCurrentIndex] = useState(0);

	// Simulate typewriter effect for better UX
	useEffect(() => {
		if (complete) {
			setDisplayContent(content);
			return;
		}

		const timer = setTimeout(() => {
			if (currentIndex < content.length) {
				setDisplayContent(content.slice(0, currentIndex + 1));
				setCurrentIndex(prev => prev + 1);
			}
		}, 20); // Adjust speed as needed

		return () => clearTimeout(timer);
	}, [content, currentIndex, complete]);

	const getAgentName = (agentId: string) => {
		const agentNames: Record<string, string> = {
			'planner': 'Planner',
			'builder': 'Builder',
			'designer': 'Designer',
			'tester': 'Tester',
			'deployer': 'Deployer',
			'history': 'History'
		};
		return agentNames[agentId] || agentId;
	};

	const getAgentIcon = (agentId: string) => {
		// Different icons for different agent types
		const icons: Record<string, React.ReactNode> = {
			'planner': <Bot className="w-4 h-4 text-blue-500" />,
			'builder': <Bot className="w-4 h-4 text-green-500" />,
			'designer': <Bot className="w-4 h-4 text-purple-500" />,
			'tester': <Bot className="w-4 h-4 text-orange-500" />,
			'deployer': <Bot className="w-4 h-4 text-red-500" />,
			'history': <Bot className="w-4 h-4 text-gray-500" />
		};
		return icons[agentId] || <Bot className="w-4 h-4" />;
	};

	return (
		<div className={`flex justify-start ${className}`}>
			<div className="aide-message-bubble aide-message-agent max-w-4xl">
				{/* Agent Header */}
				<div className="flex items-center space-x-2 mb-2">
					{getAgentIcon(agentId)}
					<span className="text-xs font-medium">{getAgentName(agentId)}</span>

					{complete ? (
						<CheckCircle className="w-3 h-3 text-green-500" />
					) : (
						<Loader2 className="w-3 h-3 animate-spin text-blue-500" />
					)}

					<Badge variant={complete ? 'default' : 'secondary'} className="text-xs">
						{complete ? 'Complete' : 'Thinking...'}
					</Badge>
				</div>

				{/* Streaming Content */}
				<div className="text-sm whitespace-pre-wrap break-words">
					{displayContent}
					{!complete && (
						<span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />
					)}
				</div>				{/* Progress indicator for incomplete messages */}
				{!complete && (
					<div className="mt-2">
						<div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
							<div
								className="bg-blue-600 h-1 rounded-full transition-all duration-300"
								style={{
									'--progress-value': Math.min((displayContent.length / Math.max(content.length, 1)) * 100, 90)
								} as React.CSSProperties}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
