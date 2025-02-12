// pages/api/news.js
import * as cheerio from "cheerio";
import { LanguageServiceClient } from "@google-cloud/language";
import path from "path";

// LanguageServiceClient 초기화 부분을 파일 상단으로 이동
const keyFilePath = path.join(process.cwd(), "googlekey.json");
const languageClient = new LanguageServiceClient({
  keyFilename: keyFilePath,
});

/**
 * HTML 콘텐츠에서 순수 텍스트를 추출한 후 감정 분석을 수행하는 함수
 * @param {string} contentHtml - 기사 본문 HTML
 * @returns {Promise<string>} - "positive", "negative", 또는 분석 실패 시 "neutral"
 */
async function analyzeSentimentForContent(contentHtml) {
  // cheerio를 이용해 HTML에서 순수 텍스트 추출
  const $ = cheerio.load(contentHtml);
  const plainText = $.text().replace(/\s+/g, " ").trim();

  if (!plainText) {
    console.log("analyzeSentimentForContent - No text content to analyze");
    return "neutral";
  }

  try {
    // 문서 객체 생성 - 한국어 언어 명시
    const document = {
      content: plainText,
      type: "PLAIN_TEXT",
      language: "ko", // 한국어 명시
    };

    // 감정 분석 요청
    const [result] = await languageClient.analyzeSentiment({
      document: document,
      encodingType: "UTF8",
    });

    const score = result.documentSentiment.score;
    const magnitude = result.documentSentiment.magnitude;
    console.log(
      "Sentiment analysis result - score:",
      score,
      "magnitude:",
      magnitude
    );

    // 감정 분석 기준 수정
    // magnitude가 높을수록 감정의 강도가 강함
    // score는 -1(매우 부정)에서 1(매우 긍정) 사이의 값
    if (magnitude < 0.1) {
      return "neutral"; // 감정 강도가 매우 낮은 경우
    }

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

  // 쿼리 파라미터 (기본값: query="주식", display=30, start=1, sort="date")
  const { query = "주식", display = 30, start = 1, sort = "date" } = req.query;
  const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query
  )}&display=${display}&start=${start}&sort=${sort}`;

  console.log("Handler - Fetching news from Naver API with URL:", apiUrl);

  try {
    // 네이버 뉴스 검색 API 호출
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

    // 각 뉴스 항목에 대해 크롤링 및 감정 분석 수행
    const itemsWithContent = await Promise.all(
      apiData.items.map(async (item, idx) => {
        // 기사 링크: link 값이 있으면 사용, 없으면 originallink 사용
        const urlToCrawl = item.link || item.originallink;
        console.log(`Item ${idx} - URL to crawl:`, urlToCrawl);
        if (!urlToCrawl) {
          console.log(`Item ${idx} - URL is missing.`);
          return null;
        }
        // n.news.naver.com 도메인만 허용
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
          // 뉴스 기사 페이지 HTML 가져오기 (User-Agent 헤더 추가)
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

          // cheerio를 사용해 HTML 파싱 및 본문 추출
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

          // 감정 분석 수행
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

    // null이 아닌 항목만 필터링 (긍정 필터링 제거)
    const filteredItems = itemsWithContent.filter((item) => item !== null);

    console.log("Handler - Total items:", filteredItems.length);

    // 결과 데이터 구성
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
