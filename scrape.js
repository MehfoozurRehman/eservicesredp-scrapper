import fs from "fs/promises";
import { json2csv } from "json-2-csv";
import puppeteer from "puppeteer";

(async () => {
  let data = [];
  const links = JSON.parse(await fs.readFile("newLinks.json", "utf8"));

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  for (const link of links) {
    try {
      await page.goto(link, { waitUntil: "networkidle2" });

      const blockFormContents = await page.$$eval(".blockForm", (elements) =>
        elements.map((el) => el.innerHTML)
      );

      async function parseHtmlContentAndCreateObject(htmlArray) {
        const result = {};

        for (const html of htmlArray) {
          const keyValuePairs = await page.evaluate((htmlContent) => {
            const doc = new DOMParser().parseFromString(
              htmlContent,
              "text/html"
            );
            const dataForm = doc.querySelectorAll(".groupItemShow");

            const data = {};
            dataForm.forEach((item) => {
              const labelElement = item.querySelector(".lableShow");
              const showDataElement = item.querySelector(".showData");

              if (labelElement && showDataElement) {
                const key = labelElement.innerText.trim();
                const value = showDataElement.innerText.trim();

                data[key] = value;
              }
            });

            return data;
          }, html);

          Object.assign(result, keyValuePairs);
        }

        return result;
      }

      const parsedData = await parseHtmlContentAndCreateObject(
        blockFormContents
      );
      data.push(parsedData);

      console.log(`Data collected from ${link}`);
    } catch (error) {
      console.error(`Failed to process ${link}:`, error);
    }
  }

  try {
    const csv = await json2csv(data);
    await fs.writeFile("data.csv", csv);
    console.log("Data successfully saved to data.csv");
  } catch (error) {
    console.error("Failed to save data to CSV:", error);
  }

  await browser.close();
})();
