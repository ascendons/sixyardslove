import { describe, it, expect } from "vitest";
import {
  TAGLINE,
  TAGLINE_SUBLINE,
  CONCEPT_POINTS,
  MISSION,
  VISION,
  WEBSITE_ARTICULATION,
  NAV_ITEMS,
  SECTORS,
  CATEGORY_DISCLAIMER,
  FOOTER_TAGLINE,
  POSITIONING,
  THEME,
  VISUAL_NARRATIVE,
} from "./brand";

describe("brand", () => {
  describe("TAGLINE", () => {
    it("is the main tagline string", () => {
      expect(TAGLINE).toBe("Six Yards. Endless Love.");
    });
  });

  describe("TAGLINE_SUBLINE", () => {
    it("is a non-empty string", () => {
      expect(typeof TAGLINE_SUBLINE).toBe("string");
      expect(TAGLINE_SUBLINE.length).toBeGreaterThan(0);
    });
    it("mentions target audience", () => {
      expect(TAGLINE_SUBLINE).toMatch(/saree/i);
    });
  });

  describe("CONCEPT_POINTS", () => {
    it("has 5 items", () => {
      expect(CONCEPT_POINTS).toHaveLength(5);
    });
    it("includes One quality standard and One brand promise", () => {
      expect(CONCEPT_POINTS).toContain("One quality standard");
      expect(CONCEPT_POINTS).toContain("One brand promise");
    });
  });

  describe("MISSION", () => {
    it("is a non-empty string", () => {
      expect(typeof MISSION).toBe("string");
      expect(MISSION.length).toBeGreaterThan(50);
    });
  });

  describe("VISION", () => {
    it("is a non-empty string", () => {
      expect(typeof VISION).toBe("string");
      expect(VISION.length).toBeGreaterThan(50);
    });
  });

  describe("WEBSITE_ARTICULATION", () => {
    it("is a non-empty string", () => {
      expect(typeof WEBSITE_ARTICULATION).toBe("string");
      expect(WEBSITE_ARTICULATION.length).toBeGreaterThan(50);
    });
  });

  describe("NAV_ITEMS", () => {
    it("has at least 4 items", () => {
      expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(4);
    });
    it("each item has name and href", () => {
      NAV_ITEMS.forEach((item) => {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("href");
        expect(typeof item.name).toBe("string");
        expect(typeof item.href).toBe("string");
        expect(item.href.startsWith("/")).toBe(true);
      });
    });
    it("includes About, Categories, Contact", () => {
      const names = NAV_ITEMS.map((i) => i.name);
      expect(names).toContain("About Six Yards Love");
      expect(names).toContain("Product Categories");
      expect(names).toContain("Contact");
    });
  });

  describe("SECTORS", () => {
    it("has 5 sectors", () => {
      expect(SECTORS).toHaveLength(5);
    });
    it("each sector has id, name, description", () => {
      const ids = new Set<string>();
      SECTORS.forEach((s) => {
        expect(s).toHaveProperty("id");
        expect(s).toHaveProperty("name");
        expect(s).toHaveProperty("description");
        expect(typeof s.id).toBe("string");
        expect(typeof s.name).toBe("string");
        expect(typeof s.description).toBe("string");
        ids.add(s.id);
      });
      expect(ids.size).toBe(5);
    });
    it("includes the saree categories", () => {
      const sectorIds = SECTORS.map((s) => s.id);
      expect(sectorIds).toContain("silk");
      expect(sectorIds).toContain("cotton");
      expect(sectorIds).toContain("handloom");
      expect(sectorIds).toContain("designer");
      expect(sectorIds).toContain("accessories");
    });
  });

  describe("CATEGORY_DISCLAIMER", () => {
    it("is a non-empty string", () => {
      expect(typeof CATEGORY_DISCLAIMER).toBe("string");
      expect(CATEGORY_DISCLAIMER.length).toBeGreaterThan(20);
    });
    it("mentions quality", () => {
      expect(CATEGORY_DISCLAIMER).toMatch(/quality|Six Yards Love/i);
    });
  });

  describe("FOOTER_TAGLINE", () => {
    it("is a non-empty string", () => {
      expect(typeof FOOTER_TAGLINE).toBe("string");
      expect(FOOTER_TAGLINE.length).toBeGreaterThan(20);
    });
  });

  describe("POSITIONING", () => {
    it("has syl and craft keys", () => {
      expect(POSITIONING).toHaveProperty("syl");
      expect(POSITIONING).toHaveProperty("craft");
    });
  });

  describe("THEME", () => {
    it("is a non-empty string", () => {
      expect(typeof THEME).toBe("string");
      expect(THEME.length).toBeGreaterThan(0);
    });
  });

  describe("VISUAL_NARRATIVE", () => {
    it("has at least 2 items", () => {
      expect(VISUAL_NARRATIVE.length).toBeGreaterThanOrEqual(2);
    });
  });
});
