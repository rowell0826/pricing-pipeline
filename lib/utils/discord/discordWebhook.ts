import { WebhookMessageOptions } from "@/lib/types/discordWebHookTypes";

const NEXT_PUBLIC_DISCORD_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK;

// function overloading
export function webHookMessage(options: WebhookMessageOptions): Promise<void>;

export async function webHookMessage(options: WebhookMessageOptions): Promise<void> {
	const { title, message, link } = options;
	try {
		const res = await fetch(NEXT_PUBLIC_DISCORD_WEBHOOK as string, {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				content: message,
				embeds: [
					{
						title: title,
						description: link
							? "Below is the link for the CSV file."
							: "Please go to the link provided below.",
						color: 3447003,
						fields: [
							{
								name: "Barker Pricing Pipeline",
								value: link ? link : "https://pricing-pipeline-alpha.vercel.app/",
								inline: true,
							},
						],
					},
				],
			}),
		});

		if (!res.ok) {
			throw new Error("Failed to send message to Discord");
		}
	} catch (error) {
		console.log("Error sending discord: ", error);
	}
}
