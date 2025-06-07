import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
/**
 * Base implementation for all AIDE agents
 * Provides common functionality and patterns
 */
export class BaseAgentImpl {
    constructor(config, memoryGraph) {
        this.config = config;
        this.memoryGraph = memoryGraph;
        this.messageSubject = new Subject();
        this.isInitialized = false;
        this.isShuttingDown = false;
        this.currentTasks = new Map();
        this.metrics = {
            tasksPerMinute: 0,
            averageTaskDuration: 0,
            successRate: 1,
            memoryUsage: 0,
            cpuUsage: 0,
        };
        this.status = {
            isHealthy: true,
            isEnabled: true,
            currentTasks: 0,
            totalTasksCompleted: 0,
            totalTasksFailed: 0,
            lastActivity: new Date(),
        };
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Perform agent-specific initialization
            await this.onInitialize();
            this.isInitialized = true;
            this.status.isHealthy = true;
            this.status.lastActivity = new Date();
            await this.sendMessage({
                type: 'notification',
                content: `${this.config.name} initialized successfully`,
            });
        }
        catch (error) {
            this.status.isHealthy = false;
            this.status.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.isInitialized || this.isShuttingDown) {
            return;
        }
        this.isShuttingDown = true;
        try {
            // Cancel all active tasks
            for (const task of this.currentTasks.values()) {
                await this.onTaskCancelled(task);
            }
            this.currentTasks.clear();
            // Perform agent-specific cleanup
            await this.onShutdown();
            this.isInitialized = false;
            this.status.isEnabled = false;
            await this.sendMessage({
                type: 'notification',
                content: `${this.config.name} shutdown completed`,
            });
            // Close message subject
            this.messageSubject.complete();
        }
        catch (error) {
            this.status.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }
    async sendMessage(message) {
        const fullMessage = {
            id: this.generateId(),
            agentId: this.config.id,
            timestamp: new Date(),
            ...message,
        };
        this.messageSubject.next(fullMessage);
        this.status.lastActivity = new Date();
    }
    onMessage(callback) {
        this.messageSubject.subscribe(callback);
    }
    async updateMemoryGraph(updater) {
        try {
            updater(this.memoryGraph);
            this.status.lastActivity = new Date();
        }
        catch (error) {
            await this.sendMessage({
                type: 'error',
                content: `Memory graph update failed: ${error instanceof Error ? error.message : String(error)}`,
            });
            throw error;
        }
    }
    getStatus() {
        return { ...this.status };
    }
    getMetrics() {
        return { ...this.metrics };
    }
    // Protected helper methods
    generateId() {
        return uuidv4();
    }
    updateTaskMetrics(task, result) {
        this.status.currentTasks = this.currentTasks.size;
        if (result.success) {
            this.status.totalTasksCompleted++;
        }
        else {
            this.status.totalTasksFailed++;
        }
        // Update success rate
        const totalTasks = this.status.totalTasksCompleted + this.status.totalTasksFailed;
        this.metrics.successRate = totalTasks > 0 ? this.status.totalTasksCompleted / totalTasks : 1;
        // Update average task duration
        const currentAvg = this.metrics.averageTaskDuration;
        const completedTasks = this.status.totalTasksCompleted;
        this.metrics.averageTaskDuration = completedTasks > 0
            ? (currentAvg * (completedTasks - 1) + result.duration) / completedTasks
            : result.duration;
        this.status.lastActivity = new Date();
    }
    async executeWithErrorHandling(operation, errorContext) {
        try {
            return await operation();
        }
        catch (error) {
            const errorMessage = `${errorContext}: ${error instanceof Error ? error.message : String(error)}`;
            await this.sendMessage({
                type: 'error',
                content: errorMessage,
            });
            throw new Error(errorMessage);
        }
    }
    // Lifecycle hooks for subclasses
    async onInitialize() {
        // Override in subclasses for custom initialization
    }
    async onShutdown() {
        // Override in subclasses for custom cleanup
    }
    async onTaskStarted(task) {
        this.currentTasks.set(task.id, task);
        await this.sendMessage({
            type: 'notification',
            content: `Started task: ${task.title}`,
            metadata: { taskId: task.id },
        });
    }
    async onTaskCompleted(task, result) {
        this.currentTasks.delete(task.id);
        this.updateTaskMetrics(task, result);
        await this.sendMessage({
            type: 'response',
            content: `Completed task: ${task.title}`,
            metadata: { taskId: task.id, result },
        });
    }
    async onTaskFailed(task, error) {
        this.currentTasks.delete(task.id);
        this.updateTaskMetrics(task, { success: false, error: error.message, duration: 0 });
        await this.sendMessage({
            type: 'error',
            content: `Task failed: ${task.title} - ${error.message}`,
            metadata: { taskId: task.id, error: error.message },
        });
    }
    async onTaskCancelled(task) {
        this.currentTasks.delete(task.id);
        await this.sendMessage({
            type: 'notification',
            content: `Task cancelled: ${task.title}`,
            metadata: { taskId: task.id },
        });
    }
    // AI provider integration helpers
    async callAI(prompt, context) {
        // This would integrate with the actual AI provider
        // For now, return a placeholder response
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI call
        return `AI response for: ${prompt.substring(0, 50)}...`;
    }
    buildPrompt(template, variables) {
        let prompt = template;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
        }
        return prompt;
    }
    // Common validation helpers
    validateTaskInputs(task, requiredInputs) {
        const missingInputs = requiredInputs.filter(input => !(input in task.inputs));
        if (missingInputs.length > 0) {
            throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
        }
    }
    validateMemoryGraphState() {
        if (!this.memoryGraph) {
            throw new Error('Memory graph is not available');
        }
    }
}
