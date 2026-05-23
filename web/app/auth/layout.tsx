import { PropsWithChildren } from "react";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return <main className='flex w-full justify-center'>{children}</main>;
};

export default AuthLayout;
