import { ProxyAgent, request } from "undici";
import getUseragent from "./getUseragent.js";
import getProxy from "./getProxy.js";

// Функция для выполнения запроса
export async function httpRequest(
  url,
  method = "GET",
  headers = {},
  body = null
) {
  const useragent = getUseragent();
  const proxy = getProxy();
  let proxyAgent;

  if (!proxy.auth?.username || String(proxy.auth?.username) === "null") {
    proxyAgent = new ProxyAgent({
      uri: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
    });
  } else {
    proxyAgent = new ProxyAgent({
      uri: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
      token: `Basic ${Buffer.from(
        `${proxy.auth.username}:${proxy.auth.password}`
      ).toString("base64")}`,
    });
  }

  const options = {
    method,
    headers: {
      "User-Agent": useragent,
      ...headers,
    },
    body,
  };

  try {
    const res = await request(url, {
      ...options,
      dispatcher: proxyAgent,
    });

    // Возвращаем результат
    const contentType = res.headers["content-type"];
    let data;

    // Если это JSON
    if (contentType && contentType.includes("application/json")) {
      data = await res.body.json(); // Парсим как JSON
    } else {
      data = await res.body.text(); // Парсим как текст
    }

    return {
      data,
      status: res.statusCode,
      statusText: res.statusMessage,
      headers: res.headers,
    };
  } catch (error) {
    console.error("Request failed", error);
    throw error;
  }
}

export default httpRequest;
