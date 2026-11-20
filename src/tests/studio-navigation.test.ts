import { describe, expect, it } from "vitest";

import { STUDIO_NAV_ITEMS, buildSidebarStatusCounts, buildStudioHealthReport, getSidebarStatusCount, getStudioPageActions } from "@/lib/studio-navigation";

describe("studio navigation integrity", () => {
  it("contains working core studio routes without dead links", () => {
    const hrefs = STUDIO_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toContain("/studio");
    expect(hrefs).toContain("/studio/pages");
    expect(hrefs).toContain("/studio/blog");
    expect(hrefs).toContain("/studio/faqs");
    expect(hrefs).toContain("/studio/services");
    expect(hrefs).toContain("/studio/media");
    expect(hrefs).toContain("/studio/navigation");
    expect(hrefs).toContain("/studio/footer");
    expect(hrefs).toContain("/studio/seo");
    expect(hrefs).toContain("/studio/forms");
    expect(hrefs).toContain("/studio/settings");
  });

  it("returns the right action set per content type", () => {
    expect(getStudioPageActions("/studio/media")).toEqual([
      "Upload Media",
      "Bulk Upload",
      "Import Assets",
    ]);

    expect(getStudioPageActions("/studio/faqs")).toEqual([
      "Create FAQ",
      "Import FAQs",
    ]);

    expect(getStudioPageActions("/studio/blog")).toEqual([
      "Create Blog Post",
      "Import Posts",
    ]);

    expect(getStudioPageActions("/studio/pages")).toEqual([
      "Create Page",
    ]);
  });

  it("only shows sidebar status counts when there is real pending work", () => {
    const counts = buildSidebarStatusCounts({
      blog: [{ status: "DRAFT" }, { status: "PUBLISHED" }],
      forms: [{ status: "PUBLISHED" }],
    });

    expect(counts).toEqual({
      "/studio/blog": 1,
      "/studio/forms": 0,
    });
    expect(getSidebarStatusCount("/studio/blog", counts)).toBe(1);
    expect(getSidebarStatusCount("/studio/forms", counts)).toBeNull();
    expect(getSidebarStatusCount("/studio/pages", counts)).toBeNull();
  });

  it("builds a health report with no missing or dead routes", () => {
    const report = buildStudioHealthReport();

    expect(report.missingRoutes).toEqual([]);
    expect(report.deadLinks).toEqual([]);
    expect(report.duplicatePages).toEqual([]);
    expect(report.unreachableScreens).toEqual([]);
    expect(report.incorrectToolbarActions).toEqual([]);
  });
});
