/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import React, { useState } from 'react';

const App: React.FC = () => {
	const [message, setMessage] = useState('Hello from AIDE!');

	return (
		<div
			style={{
				padding: '20px',
				fontFamily: 'system-ui, sans-serif',
				background: '#1e1e1e',
				color: '#ffffff',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<h1>AIDE - AI Development Environment</h1>
			<p>{message}</p>
			<button
				onClick={() => setMessage('Electron app is working!')}
				style={{
					padding: '10px 20px',
					background: '#0078d4',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
				}}
			>
				Click me!
			</button>
		</div>
	);
};

export default App;
