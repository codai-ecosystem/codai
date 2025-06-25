import React from 'react';

export interface PreviewPanelProps {
	children: React.ReactNode;
	title?: string;
	isOpen?: boolean;
	onClose?: () => void;
	className?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
	children,
	title,
	isOpen = true,
	onClose,
	className = '',
}) => {
	if (!isOpen) return null;

	return (
		<div
			className={`bg-white border-l border-gray-200 w-96 h-full overflow-hidden flex flex-col ${className}`}
		>
			{(title || onClose) && (
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					{title && <h3 className="text-lg font-medium">{title}</h3>}
					{onClose && (
						<button
							onClick={onClose}
							className="p-1 hover:bg-gray-100 rounded"
							aria-label="Close preview"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					)}
				</div>
			)}
			<div className="flex-1 overflow-auto p-4">{children}</div>
		</div>
	);
};
