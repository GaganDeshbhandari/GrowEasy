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
		icon: "🛒",
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

const Landing = () => {
	const { user } = useAuth();

	const primaryCta = user
		? user.role === "farmer"
			? { to: "/farmer/dashboard", label: "Go to Dashboard" }
			: { to: "/products", label: "Shop Products" }
		: { to: "/register", label: "Get Started" };

	const secondaryCta = user
		? user.role === "farmer"
			? { to: "/profile/farmer", label: "Update Profile" }
			: { to: "/orders", label: "View My Orders" }
		: { to: "/products", label: "Browse Products" };

	return (
		<div className="bg-white dark:bg-gray-950">
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
				<div className="grid lg:grid-cols-2 gap-10 items-center">
					<div>
						<p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full mb-5">
							GrowEasy • Farm to Home
						</p>
						<h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
							Fresh Produce,
							<span className="block text-green-600 dark:text-green-400">Directly from Farmers</span>
						</h1>
						<p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl">
							GrowEasy connects customers with local farmers through a simple, reliable marketplace for everyday fresh essentials.
						</p>

						<div className="mt-7 flex flex-wrap items-center gap-3">
							<Link
								to={primaryCta.to}
								className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
							>
								{primaryCta.label}
							</Link>
							<Link
								to={secondaryCta.to}
								className="inline-flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 font-semibold px-6 py-3 rounded-lg transition"
							>
								{secondaryCta.label}
							</Link>
						</div>
					</div>

					<div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 border border-green-200/70 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm">
						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-xl bg-white/80 dark:bg-gray-900/70 p-4 border border-green-100 dark:border-gray-700">
								<p className="text-2xl font-black text-gray-900 dark:text-white">100+</p>
								<p className="text-sm text-gray-600 dark:text-gray-300">Fresh listings</p>
							</div>
							<div className="rounded-xl bg-white/80 dark:bg-gray-900/70 p-4 border border-green-100 dark:border-gray-700">
								<p className="text-2xl font-black text-gray-900 dark:text-white">50+</p>
								<p className="text-sm text-gray-600 dark:text-gray-300">Local farmers</p>
							</div>
							<div className="rounded-xl bg-white/80 dark:bg-gray-900/70 p-4 border border-green-100 dark:border-gray-700">
								<p className="text-2xl font-black text-gray-900 dark:text-white">24x7</p>
								<p className="text-sm text-gray-600 dark:text-gray-300">Anytime ordering</p>
							</div>
							<div className="rounded-xl bg-white/80 dark:bg-gray-900/70 p-4 border border-green-100 dark:border-gray-700">
								<p className="text-2xl font-black text-gray-900 dark:text-white">Fast</p>
								<p className="text-sm text-gray-600 dark:text-gray-300">Simple checkout</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
				<div className="grid md:grid-cols-3 gap-4 sm:gap-6">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
						>
							<p className="text-2xl mb-3">{feature.icon}</p>
							<h3 className="font-extrabold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
							<p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
						</div>
					))}
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">How GrowEasy Works</h2>
					<div className="grid md:grid-cols-3 gap-5">
						{steps.map((step, index) => (
							<div key={step.title} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
								<p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">STEP {index + 1}</p>
								<h3 className="font-extrabold text-gray-900 dark:text-white mb-1">{step.title}</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300">{step.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
};

export default Landing;
