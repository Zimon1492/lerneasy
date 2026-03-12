// app/api/bookings/student/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function combineDateAndTime(dateObj: Date, time: string) {
  const yyyyMmDd = dateObj.toISOString().split("T")[0];
  return new Date(`${yyyyMmDd}T${time}:00`);
}

export async function POST(req: Request) {
  try {
    const { availabilityId, studentEmail, studentName } = await req.json();

    if (!availabilityId || !studentEmail || !studentName) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    const email = String(studentEmail).trim().toLowerCase();

    // 1) Student holen (oder anlegen)
    let student = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        schoolName: true,
        schoolTrack: true,
        schoolForm: true,
        level: true,
        grade: true,
      },
    });

    if (!student) {
      student = await prisma.user.create({
        data: {
          email,
          name: studentName,
          password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
          role: "student",
        },
        select: {
          id: true,
          email: true,
          name: true,
          schoolName: true,
          schoolTrack: true,
          schoolForm: true,
          level: true,
          grade: true,
        },
      });
    } else if (!student.name && studentName) {
      // optional: Namen nachziehen
      await prisma.user.update({
        where: { email },
        data: { name: studentName },
      });
    }

    // 2) Slot holen (inkl teacherId)
    const slot = await prisma.availability.findUnique({
      where: { id: availabilityId },
      select: { id: true, teacherId: true, date: true, start: true, end: true },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot existiert nicht mehr" }, { status: 404 });
    }

    const start = combineDateAndTime(slot.date, slot.start);
    const end = combineDateAndTime(slot.date, slot.end);

    // 3) Booking erstellen (Status pending) – Slot NICHT löschen!
    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        teacherId: slot.teacherId,
        start,
        end,
        priceCents: 0,
        currency: "eur",
        status: "pending",

        // ✅ wichtig: damit update-status später den Slot löschen kann
        availabilityId: slot.id,
      },
      select: {
        id: true,
        status: true,
        start: true,
        end: true,
        availabilityId: true,
      },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    logError("app/api/bookings/student POST", e).catch(() => {});
    console.error("POST /api/bookings/student error:", e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
