import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const teacher = await prisma.teacher.create({
    data: {
      name: "Test Lehrer",
      email: "lehrer2@example.com",
      subject: "Mathematik",        // <-- REQUIRED
      password: "test1234"         // <-- REQUIRED
    },
  });

  return res.status(200).json(teacher);
}