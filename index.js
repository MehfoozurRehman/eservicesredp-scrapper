import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  { text: "منطقة الرياض", index: 4 },
  { text: "منطقة القصيم", index: 5 },
  { text: "منطقة المدينة المنورة", index: 6 },
  { text: "الشرقية", index: 0 },
];

const selectDropdownOption = async (page, groupIndex, itemIndex) => {
  await page.click(
    `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`
  );
  await page.waitForSelector(
    `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem`
  );
  await page.click(
    `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem:nth-child(${itemIndex})`
  );
};

const getLinksHref = async (page) => {
  await page.waitForNetworkIdle();

  const links = await page.$$eval(".blockForm.clickable", (links) =>
    links.map(
      (link) => "https://eservicesredp.rega.gov.sa" + link.getAttribute("href")
    )
  );

  const data = links.flatMap((link) => link);

  try {
    const existingData = JSON.parse(await fs.readFile("newLinks.json", "utf8"));
    const updatedData = [...existingData, ...data];
    await fs.writeFile("newLinks.json", JSON.stringify(updatedData, null, 2));
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile("newLinks.json", JSON.stringify(data, null, 2));
    } else {
      throw error;
    }
  }
};

const getLastPageNumber = async (page) => {
  return await page.evaluate(() => {
    const lastPageButton = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    );
    return parseInt(lastPageButton.innerText);
  });
};

const processPages = async (page, lastPageNumber) => {
  for (let i = 1; i <= lastPageNumber; i++) {
    await waitFor(1000);
    const nextButtonExists = await page.$(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    if (!nextButtonExists) {
      break;
    }

    await page.click(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );
    await getLinksHref(page);
  }
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });
  await page.waitForSelector(".block-from-group");

  await selectDropdownOption(page, 1, 1);
  await selectDropdownOption(page, 2, 1);

  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  await page.waitForNetworkIdle();
  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPageFirstBroker = await getLastPageNumber(page);
  await processPages(page, lastPageFirstBroker);

  await selectDropdownOption(page, 2, 2);
  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  const lastPageSecondBroker = await getLastPageNumber(page);
  await processPages(lastPageSecondBroker);
})();
