type PasswordRequirementItemProps = {
	met: boolean;
	text: string;
};

export function PasswordRequirementItem({
	met,
	text,
}: PasswordRequirementItemProps) {
	return (
		<div className='flex items-center gap-2 text-xs text-muted-foreground'>
			<span
				className={`flex h-4 w-4 items-center justify-center rounded-full border ${met ? "border-primary bg-primary/20" : "border-border"}`}
			>
				{met && (
					<svg
						width='10'
						height='10'
						viewBox='0 0 16 16'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							d='M3.5 8.5L6.5 11.5L12.5 5.5'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='text-primary'
						/>
					</svg>
				)}
			</span>
			{text}
		</div>
	);
}
