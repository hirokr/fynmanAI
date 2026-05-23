export function VerificationFooterLinks() {
	return (
		<div className='mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-muted-foreground'>
			<a href='#' className='transition-colors hover:text-foreground'>
				Contact Support
			</a>
			<span className='h-1 w-1 rounded-full bg-border' />
			<a href='#' className='transition-colors hover:text-foreground'>
				Privacy Policy
			</a>
		</div>
	);
}
