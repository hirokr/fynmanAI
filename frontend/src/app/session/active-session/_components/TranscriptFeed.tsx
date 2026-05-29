import { useVoiceStore } from "@/store/useVoiceStore";

type SessionState = "listening" | "thinking" | "speaking";

interface TranscriptFeedProps {
	sessionState: SessionState;
}

export default function TranscriptFeed({ sessionState }: TranscriptFeedProps) {
	const transcripts = useVoiceStore((state) => state.transcripts);
	const aiFeedback = useVoiceStore((state) => state.aiFeedback);

	return (
		<div className='flex-1 w-full max-w-2xl mt-8 overflow-y-auto custom-scrollbar-transparent pb-32'>
			<div className='space-y-6'>
				{transcripts.map((text, index) => (
					<div
						key={`transcript-${index}`}
						className='font-body-lg text-body-lg text-on-surface leading-relaxed'
					>
						{text}
					</div>
				))}
				{aiFeedback && (
					<div className='rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-body-md text-on-surface'>
						<div className='mb-2 text-label-md uppercase tracking-wide text-primary'>
							AI response
						</div>
						<pre className='whitespace-pre-wrap break-words font-sans text-body-md leading-relaxed'>
							{aiFeedback}
						</pre>
					</div>
				)}
				{sessionState === "thinking" && (
					<div className='flex items-center gap-1'>
						{Array.from({ length: 3 }).map((_, index) => (
							<span
								key={`dot-${index}`}
								className='w-1 h-1 bg-primary rounded-full animate-bounce'
								style={{ animationDelay: `${index * 0.2}s` }}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
