import React, { PropsWithChildren } from "react";


const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<div
			className='flex min-h-screen flex-col'
			style={{
				background:
					"radial-gradient(1200px 600px at 20% 0%, #22103a 0%, #140b24 45%, #0d0b18 100%)",
			}}
		>
			<main className='flex-1 px-4 py-6 md:px-6 md:py-8'>{children}</main>
		</div>
	);
};

export default AuthLayout;
