import TurndownService from "turndown";

const compact = (text) => text.replace(/\s+/g, " ").trim();

export function profileFiles(document) {
  const person = JSON.parse(
    document.querySelector('script[type="application/ld+json"]').textContent,
  );
  const origin = document
    .querySelector('link[rel="canonical"]')
    .getAttribute("href");
  const markdown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
  });
  markdown.remove(["figure", "button"]);
  markdown.addRule("definitions", {
    filter: "dl",
    replacement(_, list) {
      const pairs = Array.from(list.querySelectorAll("dt"), (term) => {
        const description = compact(term.nextElementSibling.textContent);
        return "- **" + compact(term.textContent) + "** — " + description;
      });
      return "\n\n" + pairs.join("\n") + "\n\n";
    },
  });
  markdown.addRule("links", {
    filter: "a",
    replacement(label, anchor) {
      const href = anchor.getAttribute("href");
      return (
        "\n\n[" + compact(label) + "](" + new URL(href, origin).href + ")\n\n"
      );
    },
  });
  const title = "# " + person.name + " — " + person.jobTitle;
  const intro = compact(document.getElementById("profile-summary").textContent);
  const sections = [title, intro];
  for (const id of [
    "fanatics",
    "black-cow",
    "experience",
    "rhubarb",
    "personal-site",
    "contact",
  ]) {
    const article = document.getElementById(id).cloneNode(true);
    // Use the prose evidence in the export. The terminal also shows these figures as large type.
    for (const repeat of article.querySelectorAll(
      '.metrics, #profile-summary, a[href="profile.md"]',
    ))
      repeat.remove();
    const heading = article.querySelector("h2");
    article.insertBefore(heading, article.firstChild);
    sections.push(markdown.turndown(article.innerHTML));
  }
  sections.push("[Portfolio](" + origin + ")");
  const profile =
    sections
      .join("\n\n")
      .replace(/\n[ \t]+\n/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n") + "\n";
  const index =
    [
      title,
      "> " + person.jobTitle + " at " + person.worksFor.name + ".",
      "## Engineering profile",
      "- [Full profile](/profile.md) — career history, platform architecture, measurable outcomes, technical skills, open-source work and contact details.",
    ].join("\n\n") + "\n";
  return { "profile.md": profile, "llms.txt": index };
}
