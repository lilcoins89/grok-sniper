import { describe, expect, it } from "vitest";
import { fillPaperOrder, makePaperOrder, transitionOrder } from "@/lib/domain/orders";

describe("paper order lifecycle", () => {
  it("supports intent, submit, partial fill, then full fill", () => {
    const intent = makePaperOrder({ id: "order-1", idempotencyKey: "idem-0001", mint: "So11111111111111111111111111111111111111112", side: "BUY", requestedSol: 0.02 });
    const submitted = transitionOrder(intent, "SUBMITTED");
    const partial = fillPaperOrder(transitionOrder(submitted, "CONFIRMED"), 0.01, 100);
    expect(partial.state).toBe("PARTIALLY_FILLED");
    const filled = fillPaperOrder(partial, 0.02, 101);
    expect(filled.state).toBe("FILLED");
    expect(filled.filledSol).toBe(0.02);
  });
  it("rejects invalid transitions and fills", () => {
    const order = makePaperOrder({ id: "order-2", idempotencyKey: "idem-0002", mint: "So11111111111111111111111111111111111111112", side: "BUY", requestedSol: 0.02 });
    expect(() => transitionOrder(order, "FILLED")).toThrow("Invalid order transition");
    expect(() => fillPaperOrder(order, 0.03, 100)).toThrow("Invalid fill amount");
  });
});
