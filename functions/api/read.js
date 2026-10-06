import { handleRead } from "../../lib/read-proxy.mjs";
export function onRequest({ request }) { return handleRead(request); }
