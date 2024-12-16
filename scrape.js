import puppeteer from "puppeteer";
import { json2csv } from "json-2-csv";
import fs from "fs/promises";

(async () => {
  let data = [];
  const links = JSON.parse(await fs.readFile("newLinks.json", "utf8"));

  const browser = await puppeteer.launch({
    headless: false,
  });

  for (const link of links) {
    const page = await browser.newPage();

    try {
      await page.goto(link);
      await page.setViewport({ width: 1024, height: 768 });
      await page.waitForNetworkIdle();

      const blockFormContents = await page.$$eval(".blockForm", (elements) =>
        elements.map((el) => el.innerHTML)
      );

      async function parseHtmlContentAndCreateObject(htmlArray) {
        const result = {};

        for (const html of htmlArray) {
          const keyValuePairs = await page.evaluate((htmlContent) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");
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
    } finally {
      await page.close();
    }
  }

  // Convert the collected data to CSV and save it
  try {
    const csv = await json2csv(data);
    await fs.writeFile("data.csv", csv);
    console.log("Data successfully saved to data.csv");
  } catch (error) {
    console.error("Failed to save data to CSV:", error);
  }

  await browser.close();
})();
