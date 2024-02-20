const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const scrape = async () => {
  const { data: packageListHTML } = await axios.get(
    "https://packagecontrol.io/browse/labels/color%20scheme"
  );

  const $ = cheerio.load(packageListHTML);

  const packageURLs = $("li.package h3 a")
    .map((index, element) => {
      const urlPath = $(element).attr("href");
      return urlPath ? "https://packagecontrol.io" + urlPath : null;
    })
    .get()
    .filter((url) => url);

  const packageData = [];
  for (let i = 0; i < packageURLs.length; i++) {
    try {
      const { data: packagePageHTML } = await axios.get(packageURLs[i]);
      const $ = cheerio.load(packagePageHTML);
      const packageName = $("h1").first().text().trim();
      const description = $(".description")
        .first()
        .text()
        .trim()
        .replace(/\n/g, " ");
      const homePage = $(".homepage a").first().attr("href");
      const modified = $(".modified span").first().attr("title");
      const firstSeen = $(".first_seen span").first().attr("title");

      if (!modified) {
        console.log(packageName, packageURLs[i]);
      }

      packageData.push({
        packageName,
        description,
        homePage,
        modified: new Date(modified),
        firstSeen: new Date(firstSeen),
        url: packageURLs[i],
      });
    } catch (error) {
      console.error(`Error scraping package at index ${i}: ${error.message}`);
    }
    console.log(
      `Scraped ${i + 1} of ${packageURLs.length} Sublime Text Color Schemes.`
    );
  }

  packageData.sort((a, b) => b.modified - a.modified);

  const tableRows = packageData.map(
    (packageInfo) =>
      `| ${packageInfo.packageName} | ${
        packageInfo.description
      } | [${packageInfo.modified.toISOString()}](${packageInfo.url}) |`
  );

  const readmeContent = `
# Sublime Text Color Schemes Repository

This repository is dedicated to keeping track of up-to-date Sublime Text color schemes. The included script scrapes information from packagecontrol.io, providing details about various color schemes for Sublime Text.

## Color Schemes Information

The table below lists color schemes in descending order based on their last modified date.

| Package Name | Description | Last Updated URL |
| ------------ | ----------- | ----------------- |
${tableRows.join("\n")}
`;

  fs.writeFileSync("README.md", readmeContent);

  console.log("README.md created successfully.");
};

scrape();
