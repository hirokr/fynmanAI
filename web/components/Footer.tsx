import React from "react";

const Footer = () => {
	return (
		<footer className="bg-background-dark border-t border-white/5 py-12 px-6 lg:px-20">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "1.875rem" }}>electric_bike</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-white italic">Template</h2>
          </div>
          <div className="flex gap-8 text-slate-500 text-sm">
            <a className="hover:text-primary transition-colors" href="#">Twitter</a>
            <a className="hover:text-primary transition-colors" href="#">Discord</a>
            <a className="hover:text-primary transition-colors" href="#">Instagram</a>
            <a className="hover:text-primary transition-colors" href="#">GitHub</a>
          </div>
          <p className="text-slate-500 text-sm">© 2024 Tryora Inc. All rights reserved.</p>
        </div>
      </footer>
	);
};

export default Footer; // Footer component with a modern, sleek design and social media links
