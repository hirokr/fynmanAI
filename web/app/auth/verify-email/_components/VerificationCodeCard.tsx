type VerificationCodeCardProps = {
	code: string[];
	onChangeDigit: (value: string, idx: number) => void;
	onKeyDownDigit: (
		event: React.KeyboardEvent<HTMLInputElement>,
		idx: number,
	) => void;
	setInputRef: (element: HTMLInputElement | null, index: number) => void;
	onSubmit: (token: string) => void;
};

export function VerificationCodeCard({
	code,
	onChangeDigit,
	onKeyDownDigit,
	setInputRef,
	onSubmit,
}: VerificationCodeCardProps) {
	return (
		<div className='w-full max-w-sm rounded-2xl border border-border bg-card/90 p-7 shadow-2xl shadow-primary/10 backdrop-blur'>
			<p className='mb-5 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground'>
				Or enter code manually
			</p>

			<div className='mb-6 flex justify-center gap-2'>
				{code.map((digit, index) => (
					<input
						key={index}
						ref={(element) => setInputRef(element, index)}
						type='text'
						inputMode='numeric'
						maxLength={1}
						value={digit}
						onChange={(event) => onChangeDigit(event.target.value, index)}
						onKeyDown={(event) => onKeyDownDigit(event, index)}
						className='h-12 w-11 rounded-xl border border-border bg-background text-center text-lg font-semibold text-foreground transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring'
					/>
				))}
			</div>

			<button
				type='button'
				onClick={() => onSubmit(code.join(""))}
				disabled={code.some((d) => d === "")}
				className='mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60'
			>
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2.5'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
				</svg>
				Verify Account
			</button>

			<p className='text-center text-xs text-muted-foreground'>
				Didn&apos;t receive the email?{" "}
				<a href='#' className='text-primary transition-colors hover:opacity-80'>
					Resend Email
				</a>
			</p>
		</div>
	);
}
