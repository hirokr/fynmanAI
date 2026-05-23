import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "./../components/Header";
import Footer from "./../components/Footer";
import MainProvider from "@/providers/Provider";
import { getSession } from "@/lib/auth/session";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "template",
	description: "template description",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	return (
		<html lang='en' className='dark'>
			{/* <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap"
        />
      </head> */}
			<body
				className={
					inter.className +
					" bg-white text-black dark:bg-black dark:text-white dark overflow-x-hidden"
				}
			>
				<MainProvider initialUser={session?.user ?? null}>
					<Header />
					<main className=''>{children}</main>
					<Footer />
				</MainProvider>
			</body>
		</html>
	);
}
