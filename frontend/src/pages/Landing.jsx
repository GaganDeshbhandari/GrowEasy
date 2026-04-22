import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
	{
		title: "Fresh from local farms",
		description: "Discover seasonal fruits, vegetables, and grains from trusted nearby farmers.",
		icon: "🌱",
	},
	{
		title: "Secure ordering",
		description: "Smooth cart and checkout flow with clear order tracking for every purchase.",
		icon: "🧺",
	},
	{
		title: "Built for farmers",
		description: "Manage products, stock, and visibility easily from your farmer dashboard.",
		icon: "🚜",
	},
];

const steps = [
	{ title: "Browse", text: "Explore fresh products by category and compare options quickly." },
	{ title: "Order", text: "Add items to cart and place an order in just a few clicks." },
	{ title: "Enjoy", text: "Get high-quality farm produce delivered with confidence." },
];

const testimonials = [
	{ name: "Sarah Jenkins", role: "Home Chef", text: "GrowEasy completely changed how I shop. The produce tastes vibrant, and the connection to local growers is exactly what our community needed.", avatar: "👩‍🍳" },
	{ name: "Marcus Rossi", role: "Restaurant Owner", text: "Sourcing locally used to be a full-time logistical nightmare. Now, I order from 5 different farmers in one reliable checkout.", avatar: "👨‍🍳" },
	{ name: "Elena Woods", role: "Health Enthusiast", text: "I love knowing exactly where my food comes from. The transparency and direct support to the people who grow it is unmatched.", avatar: "👩🏽‍🌾" }
];

const categories = [
	{ name: "Fresh Vegetables", count: "120+ items", icon: "🥕", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
	{ name: "Seasonal Fruits", count: "85+ items", icon: "🍎", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
	{ name: "Dairy & Eggs", count: "40+ items", icon: "🥚", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
	{ name: "Grains & Seeds", count: "60+ items", icon: "🌾", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" }
];

const Landing = () => {
	const { user } = useAuth();

	const primaryCta = user
		? user.role === "farmer"
			? { to: "/farmer/dashboard", label: "Go to Dashboard" }
			: user.role === "delivery_partner"
			? { to: "/delivery/dashboard", label: "Go to Dashboard" }
			: { to: "/products", label: "Shop Products" }
		: { to: "/register", label: "Get Started" };

	const secondaryCta = user
		? user.role === "farmer"
			? { to: "/profile/farmer", label: "Update Profile" }
			: user.role === "delivery_partner"
			? { to: "/delivery/profile", label: "Update Profile" }
			: { to: "/orders", label: "View My Orders" }
		: { to: "/products", label: "Browse Products" };

	return (
		<div className="bg-[#FAF9F6] dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden selection:bg-green-200 selection:text-green-900 dark:selection:bg-green-800 dark:selection:text-emerald-100">

			{/* Decorative background element */}
			<div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen">
				<div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-green-300/40 to-emerald-100/10 blur-3xl"></div>
				<div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-100/40 to-orange-50/10 blur-3xl"></div>
			</div>

			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-16">
				<div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">

					{/* Left Content */}
					<div className="flex-1 w-full relative z-10">
						<div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30 backdrop-blur-md border border-emerald-200/50 dark:border-emerald-800/50 px-4 py-2 rounded-full mb-8 shadow-sm">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
							</span>
							GrowEasy • Farm to Home
						</div>

						<h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.05]">
							Fresh Produce,
							<span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-400 dark:from-emerald-400 dark:to-green-300">
								Directly from Farmers
							</span>
						</h1>

						<p className="mt-8 text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-xl font-medium leading-relaxed">
							GrowEasy connects customers with local farmers through a visually stunning, reliable marketplace tailored for your everyday fresh essentials.
						</p>

						<div className="mt-10 flex flex-wrap items-center gap-4">
							<Link
								to={primaryCta.to}
								className="group relative inline-flex items-center justify-center bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-2xl overflow-hidden shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-600/40 active:scale-[0.98]"
							>
								<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
								<span className="relative">{primaryCta.label}</span>
							</Link>
							<Link
								to={secondaryCta.to}
								className="inline-flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800 font-bold text-lg px-8 py-4 rounded-2xl shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
							>
								{secondaryCta.label}
							</Link>
						</div>
					</div>

					{/* Right Content - Stats */}
					<div className="flex-1 w-full relative">
						{/* Organic Shape Blob */}
						<div className="absolute inset-0 bg-emerald-200/40 dark:bg-emerald-900/40 blur-3xl rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_20s_linear_infinite] -z-10 aspect-square"></div>

						<div className="relative glass-panel bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-gray-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-900/5 dark:shadow-black/40">
							<div className="grid grid-cols-2 gap-4 sm:gap-6 relative">
								{/* Decorative line spanning grid */}
								<div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800/50 to-transparent -translate-y-1/2"></div>
								<div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-emerald-200 dark:via-emerald-800/50 to-transparent -translate-x-1/2"></div>

								<div className="relative z-10 flex flex-col justify-center p-4 hover:scale-105 transition-transform duration-300">
									<p className="font-heading text-4xl sm:text-5xl font-black text-emerald-800 dark:text-emerald-400 drop-shadow-sm">100+</p>
									<p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mt-1">Fresh listings</p>
								</div>
								<div className="relative z-10 flex flex-col justify-center p-4 hover:scale-105 transition-transform duration-300">
									<p className="font-heading text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 drop-shadow-sm">50+</p>
									<p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mt-1">Local farmers</p>
								</div>
								<div className="relative z-10 flex flex-col justify-center p-4 hover:scale-105 transition-transform duration-300">
									<p className="font-heading text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">24x7</p>
									<p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mt-1">Ordering</p>
								</div>
								<div className="relative z-10 flex flex-col justify-center p-4 hover:scale-105 transition-transform duration-300">
									<p className="font-heading text-4xl sm:text-5xl font-black text-rose-600 dark:text-rose-400 drop-shadow-sm">Fast</p>
									<p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mt-1">Checkout</p>
								</div>
							</div>
						</div>
					</div>

				</div>
			</section>

			{/* Features Section */}
			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
				<div className="grid md:grid-cols-3 gap-8 sm:gap-12 relative z-10">
					{features.map((feature, i) => (
						<div
							key={feature.title}
							className="group flex flex-col gap-5 p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-white/80 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-black/20 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:-translate-y-2"
						>
							<div className="w-16 h-16 rounded-2xl bg-emerald-100/80 dark:bg-emerald-900/40 flex items-center justify-center text-3xl shadow-inner border border-emerald-50 dark:border-emerald-800/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
								{feature.icon}
							</div>
							<div>
								<h3 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
									{feature.title}
								</h3>
								<p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Featured Categories Section */}
			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
				<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
					<div>
						<h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Shop by Category</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Explore the freshest arrivals straight from the soil.</p>
					</div>
					<Link to="/products" className="inline-flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group">
						View All
						<span className="group-hover:translate-x-1 transition-transform">→</span>
					</Link>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
					{categories.map((cat) => (
						<Link key={cat.name} to="/products" className="group p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
							<div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
								{cat.icon}
							</div>
							<h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">{cat.name}</h3>
							<p className="text-sm text-gray-500 mt-1 font-medium">{cat.count}</p>
						</Link>
					))}
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
				<div className="bg-emerald-50/50 dark:bg-gray-900/50 rounded-[3rem] p-8 sm:p-12 border border-emerald-100 dark:border-gray-800">
					<div className="text-center mb-12">
						<h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Loved by the Community</h2>
					</div>
					<div className="grid md:grid-cols-3 gap-6 sm:gap-8">
						{testimonials.map((t, i) => (
							<div key={i} className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative z-10 hover:shadow-lg transition-shadow">
								<div className="text-4xl absolute top-6 right-6 opacity-10">❝</div>
								<p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed font-medium mb-8 relative z-10">
									"{t.text}"
								</p>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl border border-emerald-200 dark:border-emerald-800">
										{t.avatar}
									</div>
									<div>
										<h4 className="font-bold text-gray-900 dark:text-white">{t.name}</h4>
										<p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{t.role}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 mb-10">
				<div className="relative p-8 sm:p-14 rounded-[3rem] bg-gradient-to-br from-emerald-900 to-green-950 dark:from-gray-900 dark:to-gray-950 text-white overflow-hidden shadow-2xl">
					{/* Background texture for the dark card */}
					<div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent blur-2xl"></div>

					<div className="relative z-10 flex flex-col items-center text-center mb-16">
						<h2 className="font-heading text-4xl sm:text-5xl font-black text-white mb-4">How GrowEasy Works</h2>
						<p className="text-emerald-200 text-lg max-w-2xl font-medium">From farm to fork, we make it effortlessly simple.</p>
					</div>

					<div className="relative z-10 grid md:grid-cols-3 gap-10 lg:gap-16">
						{/* Connecting dashed line on desktop */}
						<div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-emerald-700/50 -z-10"></div>

						{steps.map((step, index) => (
							<div key={step.title} className="flex flex-col items-center text-center group">
								<div className="w-24 h-24 rounded-[2rem] bg-emerald-800/50 backdrop-blur-md border border-emerald-600/50 flex items-center justify-center mb-8 shadow-inner shadow-emerald-400/20 group-hover:bg-emerald-700/50 group-hover:-translate-y-2 transition-all duration-300">
									<span className="font-heading text-4xl font-black text-emerald-300 group-hover:text-white transition-colors">{index + 1}</span>
								</div>
								<h3 className="font-heading text-2xl font-bold text-white mb-3">{step.title}</h3>
								<p className="text-emerald-100/80 text-base font-medium leading-relaxed max-w-xs">{step.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

		</div>
	);
};

export default Landing;
