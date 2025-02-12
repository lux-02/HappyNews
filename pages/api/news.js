// pages/api/news.js
import * as cheerio from "cheerio";
import { LanguageServiceClient } from "@google-cloud/language";
import path from "path";

// LanguageServiceClient 초기화: GOOGLE_KEY_JSON 환경변수가 있으면 사용, 없으면 로컬 파일 사용
let languageClient;
if (process.env.GOOGLE_KEY_JSON) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_KEY_JSON);
    languageClient = new LanguageServiceClient({ credentials });
    console.log(
      "LanguageServiceClient initialized using GOOGLE_KEY_JSON environment variable."
    );
  } catch (error) {
    console.error("Error parsing GOOGLE_KEY_JSON:", error);
    throw error;
  }
} else {
  const keyFilePath = path.join(process.cwd(), "googlekey.json");
  languageClient = new LanguageServiceClient({ keyFilename: keyFilePath });
  console.log(
    "LanguageServiceClient initialized using keyFilename:",
    keyFilePath
  );
}

/**
 * HTML 콘텐츠에서 순수 텍스트를 추출한 후 감정 분석을 수행하는 함수
 * @param {string} contentHtml - 기사 본문 HTML
 * @returns {Promise<string>} - "positive", "negative", 또는 분석 실패 시 "neutral"
 */
async function analyzeSentimentForContent(contentHtml) {
  const $ = cheerio.load(contentHtml);
  const plainText = $.text().replace(/\s+/g, " ").trim();

  if (!plainText) {
    console.log("analyzeSentimentForContent - No text content to analyze");
    return "neutral";
  }

  try {
    const document = {
      content: plainText,
      type: "PLAIN_TEXT",
      language: "ko", // 한국어 명시 (필요시)
    };

    const request = {
      document,
      encodingType: "UTF8",
    };

    const [result] = await languageClient.analyzeSentiment(request);
    const { score, magnitude } = result.documentSentiment;
    console.log(
      "Sentiment analysis result - score:",
      score,
      "magnitude:",
      magnitude
    );

    if (magnitude < 0.1) return "neutral";
    if (score >= 0.2) return "positive";
    if (score <= -0.2) return "negative";
    return "neutral";
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return "neutral";
  }
}

export default async function handler(req, res) {
  // 네이버 API 관련 환경변수 확인
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "네이버 API 클라이언트 아이디와 시크릿이 설정되어 있지 않습니다.",
    });
  }

  const { query = "주식", display = 30, start = 1, sort = "date" } = req.query;
  const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query
  )}&display=${display}&start=${start}&sort=${sort}`;

  console.log("Handler - Fetching news from Naver API with URL:", apiUrl);

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    console.log("Handler - Naver API response status:", apiResponse.status);
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Handler - Naver API error response:", errorText);
      return res.status(apiResponse.status).json({ error: errorText });
    }
    const apiData = await apiResponse.json();
    console.log(
      "Handler - Received",
      apiData.items.length,
      "news items from Naver API."
    );

    const itemsWithContent = await Promise.all(
      apiData.items.map(async (item, idx) => {
        const urlToCrawl = item.link || item.originallink;
        console.log(`Item ${idx} - URL to crawl:`, urlToCrawl);
        if (!urlToCrawl) {
          console.log(`Item ${idx} - URL is missing.`);
          return null;
        }
        try {
          const parsedUrl = new URL(urlToCrawl);
          console.log(`Item ${idx} - Parsed hostname:`, parsedUrl.hostname);
          if (!parsedUrl.hostname.includes("n.news.naver.com")) {
            console.log(
              `Item ${idx} - Not a n.news.naver.com domain. Skipping.`
            );
            return null;
          }
        } catch (error) {
          console.error(`Item ${idx} - Error parsing URL:`, error);
          return null;
        }

        try {
          console.log(`Item ${idx} - Fetching article page...`);
          const crawlResponse = await fetch(urlToCrawl, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          console.log(
            `Item ${idx} - Crawl response status:`,
            crawlResponse.status
          );
          if (!crawlResponse.ok) {
            console.error(`Item ${idx} - Failed to fetch article page.`);
            return null;
          }
          const html = await crawlResponse.text();
          console.log(
            `Item ${idx} - Article HTML snippet:`,
            html.slice(0, 200)
          );

          const $ = cheerio.load(html);
          let contentHtml = $(".newsct_article").html();
          if (!contentHtml || !contentHtml.trim()) {
            contentHtml = $("#dic_area").html() || "";
          }
          if (!contentHtml.trim()) {
            console.log(`Item ${idx} - No content found in article.`);
            return null;
          }
          console.log(
            `Item ${idx} - Extracted content length:`,
            contentHtml.length
          );

          const sentiment = await analyzeSentimentForContent(contentHtml);
          console.log(`Item ${idx} - Sentiment result:`, sentiment);

          return { ...item, contents: contentHtml, sentiment };
        } catch (error) {
          console.error(
            `Item ${idx} - Error during crawling or sentiment analysis:`,
            error
          );
          return null;
        }
      })
    );

    const filteredItems = itemsWithContent.filter((item) => item !== null);
    console.log("Handler - Total items:", filteredItems.length);

    const resultData = {
      lastBuildDate: apiData.lastBuildDate,
      total: apiData.total,
      start: apiData.start,
      display: filteredItems.length,
      items: filteredItems,
    };

    return res.status(200).json(resultData);
  } catch (error) {
    console.error("Handler - Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
