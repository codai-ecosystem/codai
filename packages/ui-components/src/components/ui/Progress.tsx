import React from 'react';

export interface ProgressProps {
	value: number;
	max?: number;
	className?: string;
	showValue?: boolean;
	variant?: 'default' | 'success' | 'warning' | 'error';
}

export const Progress: React.FC<ProgressProps> = ({
	value,
	max = 100,
	className = '',
	showValue = false,
	variant = 'default'
}) => {
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

	const getVariantClasses = () => {
		switch (variant) {
			case 'success':
				return 'bg-green-500';
			case 'warning':
				return 'bg-yellow-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-blue-500';
		}
	};

	return (
		<div className={`w-full ${className}`}>
			<div className="w-full bg-gray-200 rounded-full h-2.5">
				<div
					className={`h-2.5 rounded-full transition-all duration-300 ${getVariantClasses()}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			{showValue && (
				<div className="text-xs text-gray-600 mt-1">
					{Math.round(percentage)}%
				</div>
			)}
		</div>
	);
};
