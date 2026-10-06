// @vitest-environment jsdom
/** El cliente de plataforma: la URL de entrada, las credenciales en cada llamada, la frase del servidor y un solo refresh. */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError, api, fetchMe, signInUrl } from "../lib/platform-client";

// jsdom corre en `localhost`, donde el cliente apuntaría al puerto local de
// desarrollo; el build de producción fija el origen con esta variable.
beforeAll(() => vi.stubEnv("VITE_PLATFORM_ORIGIN", "https://arcade.lat"));

describe("platform client", () => {
	it("signInUrl returns to the page it is given", () => {
		expect(signInUrl("https://admin.arcade.lat/apps")).toBe(
			"https://arcade.lat/auth/signin?return_to=https%3A%2F%2Fadmin.arcade.lat%2Fapps",
		);
	});

	it("api sends credentials and surfaces the server's sentence as an ApiError", async () => {
		const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }));
		const failure = await api("/api/admin").catch((e: unknown) => e);
		expect(failure).toBeInstanceOf(ApiError);
		expect(failure).toMatchObject({ status: 403, message: "Forbidden" });
		expect(spy.mock.calls[0][0]).toBe("https://arcade.lat/api/admin");
		expect(spy.mock.calls[0][1]).toMatchObject({ credentials: "include" });
		spy.mockRestore();
	});

	it("fetchMe tries one refresh and then gives up", async () => {
		const spy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(new Response("{}", { status: 401 }))
			.mockResolvedValueOnce(new Response("{}", { status: 401 }));
		expect(await fetchMe()).toBeNull();
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy.mock.calls[1][0]).toBe("https://arcade.lat/api/auth/refresh");
		spy.mockRestore();
	});
});
