import React, { useState, useRef, useEffect } from 'react';
import { AUTOSUGGEST_QUESTIONS } from './chatbotQuestions';
import { FiMessageCircle } from 'react-icons/fi';
import useCurrencyStore from '../../store/currencyStore';

export default function SlidableChatbot({ currency, setCurrency }) {
	const { currentCurrency, formatCurrency, convertAmount } = useCurrencyStore();
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState([]);
	const [validSuggestions, setValidSuggestions] = useState([]);
	const suggestionTimeout = useRef(null);
	const hideTimeout = useRef(null);
	const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fund-tracker-hppt.onrender.com/api';

		const handleSend = async (question) => {
			const q = question || input;
			if (!q.trim()) return;
			setMessages((msgs) => [...msgs, { role: "user", text: q }]);
			setLoading(true);
			try {
				const res = await fetch(`${API_BASE_URL}/chat`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ question: q })
				});
				const data = await res.json();
				if (typeof data.answer === 'string' && data.answer.trim()) {
					// Try to detect and format numbers as currency in the answer
					let answerText = data.answer;
							// Only convert if rupee symbol is present and USD is selected
							if (currentCurrency === 'USD') {
								answerText = answerText.replace(/₹\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g, (match, num) => {
									const rawNum = parseFloat(num.replace(/,/g, ''));
									if (!isNaN(rawNum)) {
										return formatCurrency(convertAmount(rawNum, 'INR', 'USD'), 'USD');
									}
									return match;
								});
							}
					setMessages((msgs) => [...msgs, { role: "bot", text: answerText }]);
				}
			} catch (err) {
				setMessages((msgs) => [...msgs, { role: "bot", text: "Error fetching answer." }]);
			}
			setInput("");
			setSuggestions([]);
			setLoading(false);
		};

	// Filter suggestions to only those with answers
	const filterValidSuggestions = async (inputVal) => {
		const filtered = AUTOSUGGEST_QUESTIONS.filter(q => q.toLowerCase().includes(inputVal.toLowerCase()));
		const checks = await Promise.all(filtered.slice(0, 8).map(async (q) => {
			try {
				const res = await fetch(`${API_BASE_URL}/chat`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ question: q })
				});
				const data = await res.json();
				return (typeof data.answer === 'string' && data.answer.trim()) ? q : null;
			} catch {
				return null;
			}
		}));
		setValidSuggestions(checks.filter(Boolean));
	};

	useEffect(() => {
		return () => {
			if (hideTimeout.current) {
				clearTimeout(hideTimeout.current);
			}
		};
	}, []);

	return (
		<>
			{/* Floating round button */}
			<button
				aria-label="Open Chatbot"
				onClick={() => setOpen(true)}
				style={{
					position: 'fixed',
					bottom: 32,
					right: 32,
					zIndex: 1002,
					width: 56,
					height: 56,
					borderRadius: '50%',
					background: '#2563eb',
					color: '#fff',
					border: 'none',
					boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
					display: open ? 'none' : 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 32,
					cursor: 'pointer',
				}}
			>
				<FiMessageCircle />
			</button>

			{/* Slidable chatbot panel - dark theme */}
			<div
				style={{
					position: 'fixed',
					bottom: 0,
					right: open ? 0 : -400,
					width: 360,
					height: '70vh',
					background: '#18181b',
					boxShadow: '0 0 24px rgba(0,0,0,0.18)',
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
					zIndex: 1003,
					transition: 'right 0.3s cubic-bezier(.4,0,.2,1)',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<div style={{ padding: 16, borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232326' }}>
					<span style={{ fontWeight: 600, fontSize: 18, color: '#fff' }}>Chatbot Helper</span>
					<button
						aria-label="Close Chatbot"
						onClick={() => setOpen(false)}
						style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#a5b4fc' }}
					>
						×
					</button>
				</div>
				<div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
					{messages.length === 0 && (
						<p style={{ color: '#a1a1aa', fontSize: 15 }}>Ask questions about budgets, transactions, or departments. Answers are fetched from the database.</p>
					)}
					{messages.map((msg, idx) => (
						<div key={idx} style={{
							marginBottom: 12,
							textAlign: msg.role === 'user' ? 'right' : 'left',
						}}>
							<span style={{
								display: 'inline-block',
								background: msg.role === 'user' ? '#2563eb' : '#27272a',
								color: msg.role === 'user' ? '#fff' : '#e5e7eb',
								borderRadius: 8,
								padding: '8px 12px',
								maxWidth: '80%',
								fontSize: 15,
								boxShadow: msg.role === 'user' ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
							}}>{msg.text}</span>
						</div>
					))}
					{loading && <p style={{ color: '#a5b4fc', fontSize: 15 }}>Loading...</p>}
				</div>
				<div style={{ padding: 16, borderTop: '1px solid #27272a', display: 'flex', gap: 8, background: '#232326', alignItems: 'center' }}>
					<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
						<div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
							{validSuggestions.length > 0 && (
								<div style={{
									position: 'absolute',
									left: '-320px',
									top: '-200px',
									minWidth: 240,
									background: '#232326',
									border: '1px solid #27272a',
									borderRadius: 8,
									zIndex: 1004,
									maxHeight: 220,
									overflowY: 'auto',
									boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'stretch',
									opacity: 1,
									transition: 'opacity 0.3s cubic-bezier(.4,0,.2,1)',
									pointerEvents: 'auto',
								}}>
									{validSuggestions.map((s, i) => (
										<div
											key={i}
											onClick={() => handleSend(s)}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												color: '#e5e7eb',
												borderBottom: i !== validSuggestions.length - 1 ? '1px solid #27272a' : 'none',
												background: '#232326',
												transition: 'background 0.2s',
											}}
											onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
											onMouseLeave={e => e.currentTarget.style.background = '#232326'}
										>
											{s}
										</div>
									))}
								</div>
							)}
							<input
								type="text"
								placeholder={`Type your question...`}
								value={input}
								onChange={e => {
									const val = e.target.value;
									setInput(val);
									setSuggestions([]);
									if (suggestionTimeout.current) {
										clearTimeout(suggestionTimeout.current);
									}
									if (hideTimeout.current) {
										clearTimeout(hideTimeout.current);
									}
									if (val.length > 0) {
										suggestionTimeout.current = setTimeout(async () => {
											await filterValidSuggestions(val);
											hideTimeout.current = setTimeout(() => {
												setValidSuggestions([]);
											}, 3000);
										}, 1000);
									} else {
										setValidSuggestions([]);
									}
								}}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										handleSend();
									}
								}}
								style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #27272a', fontSize: 15, background: '#18181b', color: '#fff', transition: 'box-shadow 0.2s' }}
								disabled={loading}
							/>
						</div>
					</div>
					<button
						onClick={() => handleSend()}
						disabled={loading}
						style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
					>
						Send
					</button>
				</div>
			</div>
		</>
	);
}
