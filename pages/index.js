// pages/index.js
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import he from "he";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { MdToggleOn, MdToggleOff } from "react-icons/md";

// HTML 엔티티 디코딩 및 <b> 태그 제거 함수
function cleanText(text) {
  if (!text) return "";
  const decoded = he.decode(text);
  return decoded.replace(/<\/?b>/gi, "");
}

export default function Home() {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPositiveOnly, setShowPositiveOnly] = useState(true);
  const [expandedArticles, setExpandedArticles] = useState({});

  // 기사 펼치기/접기 토글 함수
  const toggleArticle = (index) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 표시할 뉴스 필터링
  const filteredNews =
    newsData?.items?.filter(
      (item) => !showPositiveOnly || item.sentiment === "positive"
    ) || [];

  useEffect(() => {
    fetch("/api/news?query=주식")
      .then((res) => res.json())
      .then((data) => {
        setNewsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API 호출 에러:", err);
        setLoading(false);
      });
  }, []);

  // 헤더 텍스트 동적 생성
  const headerText = showPositiveOnly ? "HAPPY NEWS" : "ALL NEWS";

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>Loading...</h1>
      </div>
    );
  }

  if (!newsData || !newsData.items || newsData.items.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>No news found</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>{headerText}</h1>
        <button
          className={`${styles.toggleButton} ${
            showPositiveOnly ? styles.toggleActive : ""
          }`}
          onClick={() => setShowPositiveOnly(!showPositiveOnly)}
        >
          {showPositiveOnly ? (
            <>
              <MdToggleOn className={styles.toggleIcon} /> ALL SENTIMENT
            </>
          ) : (
            <>
              <MdToggleOff className={styles.toggleIcon} /> ONLY POSITIVE
            </>
          )}
        </button>
      </div>

      {filteredNews.map((item, index) => (
        <div
          key={index}
          className={`${styles.article} ${
            item.sentiment === "positive"
              ? styles.articlePositive
              : item.sentiment === "negative"
              ? styles.articleNegative
              : styles.articleNeutral
          }`}
        >
          <div
            className={styles.articleHeader}
            onClick={() => toggleArticle(index)}
          >
            <h2 className={styles.title}>{cleanText(item.title)}</h2>
            {expandedArticles[index] ? (
              <IoMdArrowDropup size={24} />
            ) : (
              <IoMdArrowDropdown size={24} />
            )}
          </div>
          <div className={styles.metaInfo}>
            <p className={styles.pubDate}>{item.pubDate}</p>
            <p className={styles.sentiment}>
              {item.sentiment === "positive"
                ? "Positive"
                : item.sentiment === "negative"
                ? "Negative"
                : "Neutral"}
            </p>
          </div>
          <p className={styles.description}>{cleanText(item.description)}</p>
          {expandedArticles[index] && item.contents && (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: item.contents }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
