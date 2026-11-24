import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";

// Use ordinary text in one reading order for CV parsers and copy/paste.
export async function writeCV(document, destination) {
  const person = JSON.parse(
    document.querySelector('script[type="application/ld+json"]').textContent,
  );
  const text = (node) => node.textContent.replace(/\s+/g, " ").trim();
  const pdf = new PDFDocument({
    size: "A4",
    margin: 42,
    info: { Title: person.name + " — CV", Author: person.name },
  });
  const stream = pdf.pipe(createWriteStream(destination));
  const body = (copy, options = {}) =>
    pdf
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#242a2d")
      .text(copy, { lineGap: 2.3, ...options });
  const section = (label) => {
    pdf.moveDown(0.7);
    pdf.font("Helvetica-Bold").fontSize(13).fillColor("#6c431d").text(label);
    pdf.moveDown(0.18);
  };
  const roleHeading = (label) =>
    pdf.font("Helvetica-Bold").fontSize(11.4).fillColor("#162025").text(label);
  pdf.font("Helvetica-Bold").fontSize(26).text(person.name);
  body(person.jobTitle + " | " + person.worksFor.name);
  const contact = document.querySelector("#contact .email");
  body(text(contact) + "   |   davidhall.tech   |   github.com/mopeyjellyfish");
  section("Professional summary");
  body(text(document.getElementById("profile-summary")));
  section("Professional experience");
  const fanatics = document.getElementById("fanatics");
  roleHeading(
    person.jobTitle + " | " + text(fanatics.querySelector("h2")) + " | Current",
  );
  body(text(fanatics.querySelector(".prose p")));
  pdf.moveDown(0.5);
  const blackCow = document.getElementById("black-cow");
  const positions = Array.from(
    document.querySelectorAll("#experience .results > div"),
  );
  const role = (row) =>
    text(row.querySelector("dd")).split(" · ").join(" | ") +
    " | " +
    text(row.querySelector("dt"));
  roleHeading(role(positions[1]));
  const decision = text(blackCow.querySelector(".prose p"));
  const results = Array.from(blackCow.querySelectorAll(".results dd"), text);
  for (const achievement of [decision, ...results.slice(0, -1)]) {
    body("•  " + achievement);
    pdf.moveDown(0.22);
  }
  pdf.moveDown(0.1);
  roleHeading("Earlier roles at Black Cow Technology");
  for (const row of positions.slice(2, 4)) body(role(row));
  body("•  " + results.at(-1));
  pdf.moveDown(0.45);
  for (const row of positions.slice(4)) body(role(row));
  section("Technical skills and open source");
  body(text(document.querySelector("#experience .stack p")));
  body(
    "Rhubarb — " +
      text(document.querySelector("#rhubarb .prose p")) +
      "  github.com/mopeyjellyfish/rhubarb",
  );
  section("Engineering interests");
  body(text(document.querySelector("#experience .summary p:last-child")));
  pdf.end();
  await finished(stream);
}
