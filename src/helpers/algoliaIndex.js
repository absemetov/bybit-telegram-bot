import { algoliasearch } from "algoliasearch";
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY,
);
const INDEX_NAME = "crypto";

// 1. Нормализация данных
function normalizeCryptoData(names) {
  return names.map((name) => {
    const numberMatch = name.match(/^(\d+)(\D+)/);
    const numericPart = numberMatch ? parseInt(numberMatch[1], 10) : null;
    const textPart = numberMatch ? numberMatch[2] : name;

    return {
      objectID: name,
      name,
      numericPart,
      textPart: textPart.trim(),
      keywords: [
        name.toLowerCase(),
        textPart.toLowerCase(),
        ...(numericPart ? [numericPart.toString()] : []),
      ],
      exactMatch: name,
    };
  });
}

// 2. Настройка индекса Algolia
export const configureAlgoliaIndex = async () => {
  try {
    await client.setSettings({
      indexName: INDEX_NAME,
      indexSettings: {
        searchableAttributes: ["exactMatch", "name", "textPart", "keywords"],
        //attributesForFaceting: ["numericPart"],
        camelCaseAttributes: [],
        advancedSyntax: true,
        queryType: "prefixLast",
        customRanking: ["desc(exactMatch)"],
        exactOnSingleWordQuery: "word",
        paginationLimitedTo: 100,
      },
      forwardToReplicas: true,
    });
    console.log("Index configured successfully");
  } catch (error) {
    console.error("Configuration error:", error);
  }
};

// 3. Загрузка данных в Algolia
export const uploadDataToAlgolia = async (symbols) => {
  const objects = normalizeCryptoData(symbols);

  try {
    await client.saveObjects({
      indexName: INDEX_NAME,
      objects,
    });
    console.log(`Uploaded ${objects.length} records`);
  } catch (error) {
    console.error("Upload error:", error);
  }
};
