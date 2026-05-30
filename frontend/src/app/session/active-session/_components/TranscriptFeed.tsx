import { useVoiceStore } from "@/store/useVoiceStore";

type SessionState = "listening" | "thinking" | "speaking";

interface TranscriptFeedProps {
	sessionState: SessionState;
}

export default function TranscriptFeed({ sessionState }: TranscriptFeedProps) {
	const messages = useVoiceStore((state) => state.messages);

	return (
		<div className='flex-1 min-h-0 w-full max-w-3xl overflow-y-auto custom-scrollbar-transparent pb-20 px-4'>
			<div className='flex flex-col gap-3'>
				{messages.map((message) => {
					const isUser = message.role === "user";

					return (
						<div
							key={message.id}
							className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[85%] rounded-2xl px-4 py-3 text-body-md leading-relaxed shadow-sm ${isUser
									? "rounded-br-md bg-primary text-on-primary"
									: "rounded-bl-md border border-outline-variant/70 bg-surface-container-high text-on-surface"
								}`}
							>
								<pre className='whitespace-pre-wrap wrap-break-word font-sans text-inherit'>
									{message.content}
								</pre>
							</div>
						</div>
					);
				})}

				{sessionState === "thinking" && (
					<div className='flex w-full justify-start'>
						<div className='flex items-center gap-1 rounded-2xl rounded-bl-md border border-outline-variant/70 bg-surface-container-high px-4 py-3'>
							{Array.from({ length: 3 }).map((_, index) => (
								<span
									key={`dot-${index}`}
									className='h-1.5 w-1.5 animate-bounce rounded-full bg-primary'
									style={{ animationDelay: `${index * 0.15}s` }}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
