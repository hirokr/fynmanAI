type VerificationHeaderProps = {
	userEmail: string;
};

export function VerificationHeader({ userEmail }: VerificationHeaderProps) {
	return (
		<>
			<div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-card/90 shadow-lg shadow-primary/10 backdrop-blur'>
				<svg
					width='36'
					height='36'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='1.5'
					strokeLinecap='round'
					strokeLinejoin='round'
					className='text-primary'
				>
					<rect width='20' height='16' x='2' y='4' rx='2' />
					<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
				</svg>
			</div>

			<h1 className='mb-3 text-center text-4xl font-bold tracking-tight text-foreground'>
				Check your inbox
			</h1>
			<p className='mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground'>
				Verification link sent to{" "}
				<span className='text-primary'>{userEmail}</span>
			</p>
		</>
	);
}
