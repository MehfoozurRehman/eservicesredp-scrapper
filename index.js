import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const selectDropdownOption = async (page, groupIndex, itemIndex) => {
  const dropdownSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`;
  const dropdownItemSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem`;

  await page.waitForSelector(dropdownSelector);
  await page.click(dropdownSelector);
  await page.waitForSelector(dropdownItemSelector);

  const items = await page.$$(dropdownItemSelector);
  if (items.length >= itemIndex) {
    await items[itemIndex - 1].click();
  } else {
    throw new Error(`Dropdown item at index ${itemIndex} not found`);
  }
};

const cities = [1, 5, 6, 7];

const brokerTypes = [1, 2];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });
  await page.waitForSelector(".block-from-group");

  for (const city of cities) {
    for (const brokerType of brokerTypes) {
      await selectDropdownOption(page, 1, 1);
      await selectDropdownOption(page, 2, brokerType);
      await selectDropdownOption(page, 4, city);

      console.log("Clicking search button.");

      await page.waitForNetworkIdle();
      await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");
      await page.waitForNetworkIdle();
      await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

      console.log("Search button clicked, waiting for network idle.");

      while (true) {
        try {
          await waitFor(1000);

          const links = await page.$$eval(".blockForm.clickable", (links) =>
            links.map(
              (link) =>
                "https://eservicesredp.rega.gov.sa" + link.getAttribute("href")
            )
          );

          console.log("Links found:", links);

          try {
            const existingData = JSON.parse(
              await fs.readFile("newLinks.json", "utf8")
            );
            const updatedData = [...existingData, ...links];
            await fs.writeFile(
              "newLinks.json",
              JSON.stringify(updatedData, null, 2)
            );
          } catch (error) {
            if (error.code === "ENOENT") {
              await fs.writeFile(
                "newLinks.json",
                JSON.stringify(links, null, 2)
              );
            } else {
              throw error;
            }
          }

          const nextButton = await page.$$(
            ".sc-irEpRR.hjEfEt.dgaui.dgaui_tab.noAfter"
          );

          if (nextButton.length === 0) {
            console.log("Next button not found, exiting loop.");
            break;
          }

          const lastNextButton = nextButton[nextButton.length - 1];

          if (!lastNextButton) {
            console.log("Last next button not found, exiting loop.");
            break;
          }

          console.log("Clicking next button.");

          await lastNextButton.click();
          await page.waitForNetworkIdle();
        } catch (e) {
          console.log("Error: ", e);
        }
      }
    }
  }

  // await browser.close();
})();
