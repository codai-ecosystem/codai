import { useState } from 'react';
import { Task } from '../utils/AgentRuntimeWrapper';
import { AgentRuntimeDemo } from '../utils/AgentRuntimeWrapper';
import { Zap, BarChart2, Search, Code, Layout, RefreshCcw } from 'lucide-react';

interface AgentControlPanelProps {
	agentRuntime: AgentRuntimeDemo | null;
	onTaskSubmit?: (task: Task) => void;
}

/**
 * A control panel for interacting with the AgentRuntime
 * Allows users to create new tasks and monitor agent activities
 */
export const AgentControlPanel = ({
	agentRuntime,
	onTaskSubmit
}: AgentControlPanelProps) => {
	const [activeTab, setActiveTab] = useState<'planner' | 'builder' | 'designer' | 'tester' | 'deployer'>('planner');
	const [taskDescription, setTaskDescription] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	// Task templates for each agent type
	const taskTemplates = {
		planner: 'Create a plan for implementing',
		builder: 'Build the component for',
		designer: 'Design the UI/UX for',
		tester: 'Create tests for',
		deployer: 'Create deployment configuration for'
	};

	// Function to handle task submission
	const handleTaskSubmit = async () => {
		if (!agentRuntime || !taskDescription.trim()) return;

		setIsProcessing(true);

		// Create a task object based on the active agent type
		const task: Task = {
			id: `task-${Date.now()}`,
			type: activeTab,
			description: taskDescription,
			priority: 'medium',
			metadata: {},
			createdAt: new Date(),
		};

		// Submit the task to the agent runtime
		try {
			await agentRuntime.submitTask(task);
			onTaskSubmit?.(task);
			setTaskDescription('');
		} catch (error) {
			console.error('Error submitting task:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Helper function to set a task template
	const useTemplate = () => {
		setTaskDescription(taskTemplates[activeTab]);
	};

	return (
		<div className="agent-control-panel">
			<div className="panel-header">
				<h2>Agent Control Panel</h2>
				<p>Submit tasks to the agent runtime system</p>
			</div>

			<div className="agent-tabs">
				<button
					className={`tab ${activeTab === 'planner' ? 'active' : ''}`}
					onClick={() => setActiveTab('planner')}
				>
					<Layout size={18} />
					<span>Planner</span>
				</button>
				<button
					className={`tab ${activeTab === 'builder' ? 'active' : ''}`}
					onClick={() => setActiveTab('builder')}
				>
					<Code size={18} />
					<span>Builder</span>
				</button>
				<button
					className={`tab ${activeTab === 'designer' ? 'active' : ''}`}
					onClick={() => setActiveTab('designer')}
				>
					<Zap size={18} />
					<span>Designer</span>
				</button>
				<button
					className={`tab ${activeTab === 'tester' ? 'active' : ''}`}
					onClick={() => setActiveTab('tester')}
				>
					<Search size={18} />
					<span>Tester</span>
				</button>
				<button
					className={`tab ${activeTab === 'deployer' ? 'active' : ''}`}
					onClick={() => setActiveTab('deployer')}
				>
					<BarChart2 size={18} />
					<span>Deployer</span>
				</button>
			</div>

			<div className="task-form">
				<div className="form-header">
					<h3>New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Task</h3>
					<button className="template-btn" onClick={useTemplate}>Use Template</button>
				</div>

				<textarea
					value={taskDescription}
					onChange={(e) => setTaskDescription(e.target.value)}
					placeholder={`Enter a description for the ${activeTab} task...`}
					rows={4}
				/>

				<button
					className="submit-btn"
					onClick={handleTaskSubmit}
					disabled={isProcessing || !taskDescription.trim() || !agentRuntime}
				>
					{isProcessing ? (
						<>
							<RefreshCcw size={16} className="spin" />
							Processing...
						</>
					) : (
						'Submit Task'
					)}
				</button>
			</div>
		</div>
	);
};
