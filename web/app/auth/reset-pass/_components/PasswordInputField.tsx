type PasswordInputFieldProps = {
	label: string;
	value?: string;
	onChange?: (value: string) => void;
	visible: boolean;
	onToggleVisibility: () => void;
};

export function PasswordInputField({
	label,
	value,
	onChange,
	visible,
	onToggleVisibility,
}: PasswordInputFieldProps) {
	return (
		<div className='space-y-2'>
			<label className='block text-sm font-medium text-muted-foreground'>
				{label}
			</label>
			<div className='relative'>
				<input
					type={visible ? "text" : "password"}
					placeholder=''
					value={value}
					onChange={
						onChange ? (event) => onChange(event.target.value) : undefined
					}
					className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring'
				/>
				<button
					type='button'
					onClick={onToggleVisibility}
					className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary'
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? (
						<svg
							width='18'
							height='18'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='m3 3 18 18' />
							<path d='M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58' />
							<path d='M9.88 5.09A10.94 10.94 0 0 1 12 5c6.4 0 10 7 10 7a18.73 18.73 0 0 1-4.11 5.94' />
							<path d='M6.61 6.61A18.7 18.7 0 0 0 2 12s3.6 7 10 7a10.94 10.94 0 0 0 5.09-1.17' />
						</svg>
					) : (
						<svg
							width='18'
							height='18'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z' />
							<circle cx='12' cy='12' r='3' />
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}
