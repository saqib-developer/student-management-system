"use client";

import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/firebase/config";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import styles from "./AttendanceManager.module.css";

interface Lecture {
  id: string;
  topic: string;
  scheduledAt: any;
  courseId: string;
}

interface AttendanceRecord {
  docId: string; // the Firestore doc ID in /attendance
  lectureId: string; // the lecture this record belongs to
  attendees: string[]; // array of student UIDs marked present
}

export default function AttendanceManager() {
  const teacherId = auth.currentUser?.uid;
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, string[]>>({});
  const [userMap, setUserMap] = useState<Record<string, { name: string }>>({});
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!teacherId) return;

    // 1) Lectures
    const lecQ = query(collection(firestore, "lectures"), where("teacherId", "==", teacherId));
    const unsubL = onSnapshot(lecQ, (snap) => setLectures(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lecture, "id">) }))));

    // 2) Attendance records
    const attQ = collection(firestore, "attendance");
    const unsubA = onSnapshot(attQ, (snap) => {
      const map: Record<string, AttendanceRecord> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as { lectureId: string; attendees: string[] };
        map[data.lectureId] = {
          docId: d.id,
          lectureId: data.lectureId,
          attendees: data.attendees,
        };
      });
      setAttendanceRecords(map);
    });

    // 3) Enrollments
    const enrQ = collection(firestore, "enrollments");
    const unsubE = onSnapshot(enrQ, (snap) => {
      const map: Record<string, string[]> = {};
      snap.docs.forEach((d) => {
        const { courseId, userId } = d.data() as { courseId: string; userId: string };
        map[courseId] = map[courseId] || [];
        map[courseId].push(userId);
      });
      setEnrollmentsMap(map);
    });

    // 4) Users
    const usersQ = collection(firestore, "users");
    const unsubU = onSnapshot(usersQ, (snap) => {
      const umap: Record<string, { name: string }> = {};
      snap.docs.forEach((d) => {
        const { name } = d.data() as { name: string };
        umap[d.id] = { name };
      });
      setUserMap(umap);
    });

    // 5) Courses
    const coursesQ = collection(firestore, "courses");
    const unsubC = onSnapshot(coursesQ, (snap) => {
      const cmap: Record<string, string> = {};
      snap.docs.forEach((d) => {
        const { title } = d.data() as { title: string };
        cmap[d.id] = title;
      });
      setCourseMap(cmap);
    });

    return () => {
      unsubL();
      unsubA();
      unsubE();
      unsubU();
      unsubC();
    };
  }, [teacherId]);

  const markPresent = async (lectureId: string, studentId: string) => {
    const rec = attendanceRecords[lectureId];
    if (!rec) return;
    if (!rec.attendees.includes(studentId)) {
      await updateDoc(doc(firestore, "attendance", rec.docId), {
        attendees: [...rec.attendees, studentId],
      });
    }
  };

  const markAbsent = async (lectureId: string, studentId: string) => {
    const rec = attendanceRecords[lectureId];
    if (!rec) return;
    if (rec.attendees.includes(studentId)) {
      await updateDoc(doc(firestore, "attendance", rec.docId), {
        attendees: rec.attendees.filter((id) => id !== studentId),
      });
    }
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Attendance</h2>

      {lectures.length === 0 && <p className={styles.message}>No lectures found.</p>}

      {lectures.map((lecture) => {
        const rec = attendanceRecords[lecture.id] || { attendees: [], docId: "" };
        const enrolled = enrollmentsMap[lecture.courseId] || [];
        const courseName = courseMap[lecture.courseId] || "Unknown Course";
        const dt = new Date(lecture.scheduledAt.seconds * 1000);

        return (
          <div key={lecture.id} className={styles.lectureCard}>
            <div className={styles.header}>
              <h3 className={styles.lectureTitle}>{lecture.topic}</h3>
              <div className={styles.meta}>
                <span className={styles.courseInfo}>
                  {courseName} ({lecture.courseId})
                </span>
                <span className={styles.date}>{dt.toLocaleDateString()}</span>
                <span className={styles.time}>{dt.toLocaleTimeString()}</span>
              </div>
            </div>

            <h4 className={styles.subheading}>Enrolled Students</h4>
            {enrolled.length === 0 && <p className={styles.message}>No students enrolled.</p>}

            <ul className={styles.studentList}>
              {enrolled.map((studentId) => {
                const present = rec.attendees.includes(studentId);
                const user = userMap[studentId];
                return (
                  <li key={studentId} className={styles.studentItem}>
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>{user?.name || "Unknown"}</span>
                      <span className={styles.studentId}>{studentId}</span>
                    </div>
                    <div className={styles.buttons}>
                      <button className={present ? styles.presentActive : styles.presentButton} onClick={() => markPresent(lecture.id, studentId)}>
                        Present
                      </button>
                      <button className={!present ? styles.absentActive : styles.absentButton} onClick={() => markAbsent(lecture.id, studentId)}>
                        Absent
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
