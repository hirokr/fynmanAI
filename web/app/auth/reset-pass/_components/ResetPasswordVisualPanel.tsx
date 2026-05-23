export function ResetPasswordVisualPanel() {
	return (
		<div className='relative hidden items-center justify-center overflow-hidden ai-gradient lg:flex'>
			<div
				className='absolute inset-0 opacity-30'
				style={{
					backgroundImage:
						"url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
				}}
			></div>
			<div className='relative z-10 flex h-full w-full items-center justify-center p-12'>
				<div className='glass-panel group relative h-full w-full overflow-hidden rounded-2xl'>
					<div className='absolute inset-0 z-10 bg-linear-to-tr from-primary/40 to-transparent'></div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
						src='/reset_pass.png'
						alt='Futuristic high-gloss AI female avatar glowing with purple light'
					/>
					<div className='absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-background-dark to-transparent p-8'>
						<div className='mb-2 flex items-center gap-2'>
							<span className='inline-block h-1 w-8 rounded-full bg-primary'></span>
							<span className='text-[10px] font-bold uppercase tracking-widest text-primary'>
								Secure Access
							</span>
						</div>
						<h3 className='text-2xl font-bold leading-tight text-foreground'>
							Enhanced Security Protocols Active
						</h3>
					</div>
				</div>
			</div>
			<div className='absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]'></div>
			<div className='absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]'></div>
		</div>
	);
}
