import { timingSafeEqual } from "node:crypto";

export function operatorAuthorized(request: Request): boolean {
  const configured = process.env.OPERATOR_API_KEY;
  if (!configured) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-grok-operator") ?? "";
  const left = Buffer.from(provided);
  const right = Buffer.from(configured);
  return left.length === right.length && timingSafeEqual(left, right);
}
