/**
 * Help Center — /help
 * 처음 사용하는 사용자를 위한 스크롤 문서.
 */

import type { Metadata } from "next";
import { HelpPage } from "@/features/help";

export const metadata: Metadata = {
  title: "Help · Novel Studio",
  description: "Novel Studio 사용 가이드 — 시작하기부터 FAQ까지",
};

export default function HelpRoutePage() {
  return <HelpPage backHref="/" backLabel="작품 목록" />;
}
