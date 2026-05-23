import Link from "next/link";
import Image from "next/image";

import { signOut } from "@/lib/auth/auth";
import { getSession } from "@/lib/auth/session";
import { UserAvatarMenu } from "./UserAvatarMenu";

const Header = async () => {
	const session = await getSession();
	const user = session?.user;

	return (
		<header className='fixed top-0 z-50 w-full border-b border-primary/10 bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4'>
			<div className='mx-auto flex max-w-7xl items-center justify-between'>
				<Link href='/' className='flex items-center' style={{ gap: "7px" }}>
					<Image
						src='/icon0.svg'
						alt='Template Icon'
						width={24}
						height={24}
						style={{ width: "2rem", height: "2rem" }}
					/>
					<h2 className='font-serif text-2xl font-bold tracking-tight text-white italic'>
						Template
					</h2>
				</Link>
				<nav className='hidden md:flex items-center gap-10'>
					<Link
						href='/discover'
						className='text-slate-300 hover:text-primary transition-colors text-sm font-medium'
					>
						Discover
					</Link>
					<Link
						href='/trending'
						className='text-slate-300 hover:text-primary transition-colors text-sm font-medium'
					>
						Trending
					</Link>
					{user ? (
						<Link
							href='/tryon'
							className='text-slate-300 hover:text-primary transition-colors text-sm font-medium'
						>
							TryOn
						</Link>
					) : null}
				</nav>
				<div className='flex items-center gap-4'>
					{user ? (
						<UserAvatarMenu user={user} signOutAction={signOut} />
					) : (
						<div className='flex items-center gap-3'>
							<Link
								href='/auth/signin'
								className='rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/20'
							>
								Sign in
							</Link>
							<Link
								href='/auth/signup'
								className='rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(140,43,238,0.4)]'
							>
								Sign up
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
