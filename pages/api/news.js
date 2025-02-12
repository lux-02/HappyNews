// pages/api/news.js

export default async function handler(req, res) {
  // 환경변수에서 네이버 API 인증 정보 불러오기
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "네이버 API 클라이언트 아이디와 시크릿이 설정되어 있지 않습니다.",
    });
  }

  // 쿼리 스트링에서 검색어(query)를 받을 수 있도록 처리 (없으면 기본값 '주식' 사용)
  const { query = "주식" } = req.query;
  const display = 10; // 한 번에 보여줄 결과 개수
  const start = 1; // 검색 시작 위치
  const sort = "date"; // 날짜순 정렬 (최신 뉴스부터)

  // 네이버 뉴스 검색 API 요청 URL 구성 (반환형식은 JSON)
  const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query
  )}&display=${display}&start=${start}&sort=${sort}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      // 네이버 API에서 에러가 온 경우 상태코드와 함께 반환
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
