import { describe, expect, it } from "vitest";
import { generateWebsiteStructuredData } from "./json-ld-schemas";

const website = {
  name: "CodeRacer",
  url: "https://coderacer.codes",
  description: "Real-time algorithm coding races.",
};

describe("website structured data", () => {
  it("does not advertise a search action when the site has no search page", () => {
    expect(generateWebsiteStructuredData(website)).not.toHaveProperty(
      "potentialAction",
    );
  });

  it("keeps an explicitly configured search action", () => {
    const potentialAction = {
      "@type": "SearchAction",
      target: "https://coderacer.codes/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    };

    expect(
      generateWebsiteStructuredData({ ...website, potentialAction }),
    ).toHaveProperty("potentialAction", potentialAction);
  });
});
