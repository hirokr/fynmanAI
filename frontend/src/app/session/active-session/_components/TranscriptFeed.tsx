import { useVoiceStore } from "@/store/useVoiceStore";

type SessionState = "listening" | "thinking" | "speaking";

interface TranscriptFeedProps {
	sessionState: SessionState;
}

export default function TranscriptFeed({ sessionState }: TranscriptFeedProps) {
	const transcripts = useVoiceStore((state) => state.transcripts);

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
