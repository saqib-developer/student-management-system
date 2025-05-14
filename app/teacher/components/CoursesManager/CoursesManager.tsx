"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { auth, firestore } from "@/firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./CoursesManager.module.css";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function CoursesManager() {
  const teacherId = auth.currentUser?.uid;
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    const q = query(collection(firestore, "courses"), where("teacherId", "==", teacherId));
    return onSnapshot(q, (snap) => setCourses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, "id">) }))));
  }, [teacherId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;
    setLoading(true);
    try {
      await addDoc(collection(firestore, "courses"), {
        ...form,
        teacherId,
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", description: "", category: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Your Courses</h2>

      <ul className={styles.list}>
        {courses.length === 0 && <li className={styles.empty}>No courses created yet.</li>}
        {courses.map((c) => (
          <li key={c.id} className={styles.listItem}>
            <div className={styles.itemHeader}>
              <span className={styles.itemTitle}>{c.title}</span>
              <span className={styles.itemMeta}>{c.category}</span>
            </div>
            <p className={styles.itemDescription}>{c.description}</p>
          </li>
        ))}
      </ul>

      <h3 className={styles.subtitle}>Create Course</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className={styles.input} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <textarea className={styles.textarea} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </section>
  );
}
