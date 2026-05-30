import { useVoiceStore } from "@/store/useVoiceStore";
import SessionSummaryCard from "./SessionSummaryCard";

type SessionState = "listening" | "thinking" | "speaking";

interface TranscriptFeedProps {
	sessionState: SessionState;
}

export default function TranscriptFeed({ sessionState }: TranscriptFeedProps) {
	const messages = useVoiceStore((state) => state.messages);
	const finalSummary = useVoiceStore((state) => state.finalSummary);
	const showSummaryCard = useVoiceStore((state) => state.showSummaryCard);
	const isEndingSession = useVoiceStore((state) => state.isEndingSession);

	const SummarySkeleton = () => (
		<div className='w-full rounded-3xl border border-outline-variant bg-surface-container-low p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-6 animate-pulse'>
			<div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
				<div className='space-y-2'>
					<div className='h-7 w-56 rounded-full bg-outline-variant/35' />
					<div className='h-4 w-72 max-w-full rounded-full bg-outline-variant/20' />
				</div>

				<div className='h-8 w-28 rounded-full bg-outline-variant/25' />
			</div>

			<div className='mb-4 rounded-2xl border border-outline-variant/70 bg-surface-container-high px-4 py-3'>
				<div className='mb-3 h-3 w-32 rounded-full bg-outline-variant/25' />
				<div className='space-y-2'>
					<div className='h-3 w-full rounded-full bg-outline-variant/20' />
					<div className='h-3 w-11/12 rounded-full bg-outline-variant/20' />
					<div className='h-3 w-4/5 rounded-full bg-outline-variant/20' />
				</div>
			</div>

			<div className='grid gap-3 md:grid-cols-2'>
				{Array.from({ length: 5 }).map((_, index) => (
					<div
						key={`summary-skeleton-${index}`}
						className='rounded-2xl border border-outline-variant/70 bg-surface-container-high px-4 py-3'
					>
						<div className='mb-3 h-3 w-36 rounded-full bg-outline-variant/25' />
						<div className='space-y-2'>
							<div className='h-3 w-full rounded-full bg-outline-variant/20' />
							<div className='h-3 w-5/6 rounded-full bg-outline-variant/20' />
						</div>
					</div>
				))}
			</div>
		</div>
	);

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

				{showSummaryCard && finalSummary && <SessionSummaryCard summary={finalSummary} />}

				{isEndingSession && !showSummaryCard && !finalSummary && (
					<SummarySkeleton />
				)}
			</div>
		</div>
	);
}
