import { parentPort, workerData } from "worker_threads";
import bip39 from "bip39";
import generateAddresses from "./utils/generateAddresses.js";
import getBalances from "./utils/getBalances.js";

async function processMnemonic({ mnemonic, id }) {
  try {
    // Генерация адресов
    const addresses = await generateAddresses(mnemonic);
    const result = await getBalances(addresses);

    // Отправляем результат в родительский поток
    parentPort.postMessage({ result, id, mnemonic });
  } catch (error) {
    console.error("Ошибка при генерации адресов:", error);
    parentPort.postMessage({ error: error.message, mnemonic });
  }
}

async function processAllMnemonics() {
  for (let i = 0; i < workerData.chunk.length; i++) {
    const seed = workerData.chunk[i];
    const id = workerData.id[i];
    const mnemonic = seed.replace(/\r/g, ""); // Убираем \r

    // Проверка на валидность мнемонической фразы
    if (!bip39.validateMnemonic(mnemonic)) {
      parentPort.postMessage({
        error: "invalid_mnemonic",
        id,
        mnemonic,
      });
    } else {
      // Обработка корректной мнемонической фразы
      await processMnemonic({ mnemonic, id });
    }
  }
}

processAllMnemonics().catch((error) => {
  console.error("Ошибка в процессе обработки:", error);
  parentPort.postMessage({ error: error.message });
});
