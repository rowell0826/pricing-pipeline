import SideBar from "@/components/sidebar/SideBar";

export default function Home() {
	return (
		<div className="flex w-full h-screen">
			<SideBar />
			<main className="w-full flex justify-center mt-10">
				<div className="flex justify-evenly items-center border-4 w-full h-[300px]">
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Cards
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Cards
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Cards
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Cards
					</div>
				</div>
			</main>
		</div>
	);
}
