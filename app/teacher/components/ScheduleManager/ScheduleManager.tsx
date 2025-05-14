"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { auth, firestore } from "@/firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./ScheduleManager.module.css";

interface Course {
  id: string;
  title: string;
}

interface Lecture {
  id: string;
  courseId: string;
  topic: string;
  scheduledAt: any;
  meetingLink: string;
}

export default function ScheduleManager() {
  const teacherId = auth.currentUser?.uid;
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [form, setForm] = useState({
    courseId: "",
    topic: "",
    scheduledAt: "",
    meetingLink: "",
  });
  const [loading, setLoading] = useState(false);

  // load courses
  useEffect(() => {
    if (!teacherId) return;
    const q = query(collection(firestore, "courses"), where("teacherId", "==", teacherId));
    return onSnapshot(q, (snap) => setCourses(snap.docs.map((d) => ({ id: d.id, title: (d.data() as any).title }))));
  }, [teacherId]);

  // load lectures
  useEffect(() => {
    if (!teacherId) return;
    const q = query(collection(firestore, "lectures"), where("teacherId", "==", teacherId));
    return onSnapshot(q, (snap) =>
      setLectures(
        snap.docs.map((d) => {
          const { id, ...data } = d.data() as Lecture;
          return { id: d.id, ...data };
        })
      )
    );
  }, [teacherId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(firestore, "lectures"), {
        ...form,
        teacherId,
        scheduledAt: new Date(form.scheduledAt),
        createdAt: serverTimestamp(),
      });
      // create empty attendance record
      await addDoc(collection(firestore, "attendance"), {
        lectureId: docRef.id,
        attendees: [],
        createdAt: serverTimestamp(),
      });
      setForm({ courseId: "", topic: "", scheduledAt: "", meetingLink: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Schedule Lecture</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <select className={styles.select} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <input type="datetime-local" className={styles.input} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />

        <input type="text" className={styles.input} placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required />

        <input type="url" className={styles.input} placeholder="Meeting Link" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} required />

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Scheduling…" : "Schedule"}
        </button>
      </form>

      <h3 className={styles.subtitle}>Upcoming Lectures</h3>
      <ul className={styles.list}>
        {lectures.length === 0 && <li className={styles.empty}>No lectures scheduled.</li>}
        {lectures.map((l) => (
          <li key={l.id} className={styles.listItem}>
            <div className={styles.itemHeader}>
              <span className={styles.itemTopic}>{l.topic}</span>
              <span className={styles.itemMeta}>{new Date((l.scheduledAt as any).seconds * 1000).toLocaleString()}</span>
            </div>
            <div className={styles.itemMeta}>Course: {courses.find((c) => c.id === l.courseId)?.title || "Unknown"}</div>
            <div className={styles.itemLink}>
              <a href={l.meetingLink} target="_blank" rel="noreferrer">
                Join Link
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
