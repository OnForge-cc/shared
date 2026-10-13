// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://admin.onforge.cc/apps"}
/** Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. */
import { describe, expect, it } from "vitest";
import { platformOrigin } from "../lib/platform-client";

describe("platformOrigin", () => {
	it("is onforge.cc from a console subdomain", () => {
		expect(platformOrigin()).toBe("https://onforge.cc");
	});
});
