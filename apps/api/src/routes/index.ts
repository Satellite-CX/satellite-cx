import { Hono } from "hono";
import { tickets } from "./tickets";

const restApi = new Hono();

restApi.route("/tickets", tickets);

export { restApi };
