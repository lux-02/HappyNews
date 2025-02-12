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

// 로딩 컴포넌트 추가
const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingSpinner}></div>
    <p className={styles.loadingText}>HAPPY NEWS를 검색 중입니다...</p>
  </div>
);

export default function Home() {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPositiveOnly, setShowPositiveOnly] = useState(true);
  const [expandedArticles, setExpandedArticles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 검색 함수
  const fetchNews = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setNewsData(data);
      setHasSearched(true);
    } catch (err) {
      console.error("API 호출 에러:", err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      fetchNews(searchQuery);
    }
  };

  // 기사 펼치기/접기 토글 함수
  const toggleArticle = (index) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 뉴스 정렬 및 필터링 로직 수정
  const sortedNews = newsData?.items
    ? [...newsData.items].sort((a, b) => {
        // HAPPY 모드일 때만 positive 기사를 상위로 정렬
        if (showPositiveOnly) {
          if (a.sentiment === "positive" && b.sentiment !== "positive")
            return -1;
          if (a.sentiment !== "positive" && b.sentiment === "positive")
            return 1;
        }
        // 시간순 정렬 (최신순)
        return new Date(b.pubDate) - new Date(a.pubDate);
      })
    : [];

  // 헤더 텍스트 동적 생성
  const headerText = "HAPPY NEWS";

  // 초기 페이지로 돌아가는 핸들러
  const handleReset = () => {
    setNewsData(null);
    setHasSearched(false);
    setSearchQuery("");
    setShowPositiveOnly(true);
    setExpandedArticles({});
  };

  // 토글 상태 변경 핸들러 수정
  const handleToggle = () => {
    const articles = document.querySelectorAll(`.${styles.article}`);

    // HAPPY 모드로 전환되는 경우
    if (!showPositiveOnly) {
      articles.forEach((article) => {
        if (article.classList.contains(styles.articlePositive)) {
          article.classList.add(styles.articleMoveToTop);
        } else {
          article.classList.add(styles.articleMoveToBottom);
        }
      });
    } else {
      // ALL 모드로 전환되는 경우
      articles.forEach((article, index) => {
        article.classList.add(styles.articleReorder);
      });
    }

    setTimeout(() => {
      setShowPositiveOnly(!showPositiveOnly);
    }, 50);
  };

  // 초기 검색 화면
  if (!hasSearched) {
    // 로딩 중일 때는 로딩 스피너 표시
    if (loading) {
      return (
        <div className={styles.container}>
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.searchInitialContainer}>
          <h1 className={styles.searchInitialTitle}>HAPPY NEWS</h1>
          <p className={styles.searchInitialSubtitle}>
            어떤 뉴스를 보고 싶나요?
          </p>
          <form onSubmit={handleSearch} className={styles.searchInitialForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="keyword..."
              className={styles.searchInitialInput}
              disabled={isSearching}
              autoFocus
            />
            <button
              type="submit"
              className={styles.searchInitialButton}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "검색 중..." : "뉴스 검색"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 로딩 상태 UI 개선
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  // 검색 결과 없음
  if (!newsData || !newsData.items || newsData.items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>No news found</h1>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className={styles.searchInput}
              disabled={isSearching}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1
          className={`${styles.heading} ${styles.headingClickable}`}
          onClick={handleReset}
        >
          {headerText}
        </h1>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news..."
            className={styles.searchInput}
            disabled={isSearching}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
        <button
          className={`${styles.toggleButton} ${
            showPositiveOnly ? styles.toggleActive : ""
          }`}
          onClick={handleToggle}
        >
          {showPositiveOnly ? (
            <>
              <MdToggleOn className={styles.toggleIcon} /> ALL
            </>
          ) : (
            <>
              <MdToggleOff className={styles.toggleIcon} /> HAPPY
            </>
          )}
        </button>
      </div>

      <div className={styles.articleContainer}>
        {sortedNews.map((item, index) => (
          <div
            key={item.link}
            className={`${styles.article} ${
              item.sentiment === "positive"
                ? styles.articlePositive
                : item.sentiment === "negative"
                ? styles.articleNegative
                : styles.articleNeutral
            } ${
              showPositiveOnly && item.sentiment !== "positive"
                ? styles.articleBlurred
                : ""
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
            {expandedArticles[index] && (
              <>
                {item.contents && (
                  <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: item.contents }}
                  />
                )}
                <div className={styles.articleFooter}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    <span>Read full article</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
