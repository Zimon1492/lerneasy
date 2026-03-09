"use client";

import type { Teacher } from "@/app/lib/types";
import TeacherCarousel from "./TeacherCarousel";

type Props = {
  teachers: Teacher[];
};

export default function TeacherCarouselWrapper({ teachers }: Props) {
  return <TeacherCarousel teachers={teachers} />;
}
