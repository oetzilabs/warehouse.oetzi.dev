import { json } from "../utils";

export const handler = async (event: any, context: any) => {
  console.dir(event, {
    depth: Infinity,
  });
  return json({ status: "ok" });
};
