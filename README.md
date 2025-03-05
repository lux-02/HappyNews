# HappyNews 🌞

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

> HAPPY NEWS : 세상에 희망을, 뉴스에 행복을 전하는 긍정 뉴스 필터링 검색 서비스
>
> https://happy-news-phi.vercel.app

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [서비스 컨셉 및 미션](#2-서비스-컨셉-및-미션)
3. [타겟 오디언스](#3-타겟-오디언스)
4. [주요 기능](#4-주요-기능)
5. [기술 스택](#5-기술-스택)
6. [시연영상](#6-시연영상)

## 1. 프로젝트 개요

### 🎯 목표

- 전 세계 및 국내의 긍정적인(positive sentiment) 뉴스 필터링 검색
- 사용자에게 심리적 안정감과 희망, 긍정적 메시지 전달
- 부정적인 뉴스로 인한 불안, 스트레스, 부정적 편향(negative bias) 완화

### 📝 배경 및 필요성

- 전통 언론의 부정적 뉴스 편중 현상
- 부정적 뉴스의 지속적 노출로 인한 심리적 피로감
- 긍정적 뉴스의 사회적 가치와 영향력
- 뉴스 소비자들의 심리적 웰빙을 위한 큐레이션 필요성

## 2. 서비스 컨셉 및 미션

### 💡 핵심 컨셉

- AI 기반 감정 분석을 통한 긍정적 뉴스 필터링
- 직관적이고 사용자 친화적인 UI/UX

### 🚀 미션

- 긍정적 뉴스 큐레이션을 통한 사용자 심리 안정 도모
- 희망적 메시지 전달로 긍정적 사회 변화 유도

## 3. 타겟 오디언스

### 👥 주요 사용자층

- 긍정적 에너지를 추구하는 뉴스 소비자
- 디지털 네이티브 세대
- 정신 건강과 웰빙에 관심 있는 사용자

### 🎭 페르소나

| 이름   | 나이/직업     | 특징                           |
| ------ | ------------- | ------------------------------ |
| 김민준 | 35세/직장인   | 일상적 뉴스 소비에 지친 현대인 |
| 이서연 | 28세/대학원생 | 긍정적 균형을 찾는 젊은 세대   |

## 4. 주요 기능

### 🔍 뉴스 수집 및 분석

- Naver News Search API를 통한 실시간 뉴스 수집
- 구글 클라우드 Natural Language API 감정 분석
- 긍정 지수 기반 뉴스 필터링

### 🎯 맞춤형 큐레이션

- HAPPY/ALL 모드 전환 기능
- 키워드 기반 뉴스 필터링

### 🎨 UI/UX

- 직관적인 검색 인터페이스
- 카드형 뉴스 레이아웃
- 반응형 웹 디자인

## 5. 기술 스택

### 🔧 백엔드

- **메인 프레임워크**: Node.js + Express.js
- **API 통합**

  - Naver Search API
  - Google Cloud Natural Language API

### 🎨 프론트엔드

- **프레임워크**: Next.js 14
- **상태관리**
  - Next.js App Router의 Server Components
  - Context API
- **스타일링**
  - CSS Modules
- **개발 도구**

  - ESLint
  - Prettier

### ⚙️ 인프라

- **배포 및 호스팅**
  - Vercel
- **CI/CD**
  - GitHub Actions
- **모니터링**
  - Vercel Analytics
  - Google Analytics

### 🔍 API 및 외부 서비스

- **뉴스 데이터**
  - Naver News Search API
- **AI/ML**
  - Google Cloud Natural Language API
- **분석 도구**
  - Sentiment Analysis
  - Keyword Extraction

### 📊 개발 도구 및 협업

- **버전 관리**: Git & GitHub

## 6. 시연영상

### 🎥 서비스 시연

<p align="center">
  <img src="public/happy_news_vd.gif" alt="HappyNews 서비스 시연" width="100%">
</p>
