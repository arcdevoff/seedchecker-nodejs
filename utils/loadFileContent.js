import { promises as fs } from "fs";

export default async (source) => {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`Ошибка: ${response.statusText}`);
    }

    return await response.text();
  } else {
    return await fs.readFile(source, "utf-8");
  }
};
