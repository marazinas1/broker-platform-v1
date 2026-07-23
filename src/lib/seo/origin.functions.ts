import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getRequestOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  const headers = req?.headers;
  const proto = headers?.get("x-forwarded-proto") ?? "https";
  const host = headers?.get("x-forwarded-host") ?? headers?.get("host") ?? "localhost";
  return `${proto}://${host}`;
});
