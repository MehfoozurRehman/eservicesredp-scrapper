import fs from "fs/promises";
import { json2csv } from "json-2-csv";
import { parse } from "csv-parse/sync";

(async () => {
  const csv = await fs.readFile("data.csv", "utf8");
  const records = parse(csv, { columns: true });

  const cleanedRecords = records.filter((record) =>
    Object.values(record).every((value) => value && value !== "undefined")
  );

  const cleanedCsv = await json2csv(cleanedRecords);

  await fs.writeFile("cleanedData.csv", cleanedCsv);
})();
