import { PropsWithChildren } from "react";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<main className='flex flex-col min-w-screen mx-auto items-center justify-center my-10'>
			{children}
		</main>
	);
};

export default AuthLayout;
