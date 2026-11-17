import { describe, expect, it } from "vitest";

import {
  createFallbackItemTitle,
  createServiceNumber,
  getDefaultHomeOffers,
  getDefaultHomeReasons,
  getDefaultHomeServices,
  getDefaultHomeSteps,
} from "../app/(main)/page";

describe("homepage fallback content", () => {
  it("generates unique fallback philosophy titles", () => {
    const titles = Array.from({ length: 3 }, (_, index) => createFallbackItemTitle("Principle", index));

    expect(titles).toEqual(["Principle 1", "Principle 2", "Principle 3"]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("generates unique fallback service numbers", () => {
    const numbers = Array.from({ length: 5 }, (_, index) => createServiceNumber(index));

    expect(numbers).toEqual(["01", "02", "03", "04", "05"]);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("generates unique fallback reason titles for the homepage", () => {
    const reasons = getDefaultHomeReasons();
    const titles = reasons.map((reason) => reason.title);

    expect(titles).toEqual(["Reason 1", "Reason 2", "Reason 3", "Reason 4"]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("generates unique fallback service, offer, and step titles", () => {
    const serviceTitles = getDefaultHomeServices().map((item) => item.title);
    const offerTitles = getDefaultHomeOffers().map((item) => item.title);
    const stepTitles = getDefaultHomeSteps().map((item) => item.title);

    expect(serviceTitles).toEqual(["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6"]);
    expect(new Set(serviceTitles).size).toBe(serviceTitles.length);
    expect(new Set(offerTitles).size).toBe(offerTitles.length);
    expect(new Set(stepTitles).size).toBe(stepTitles.length);
  });
});
