'use client';

import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/firebase/config';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import styles from './CourseCatalog.module.css';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function CourseCatalog() {
  const uid = auth.currentUser?.uid!;
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  // load all courses
  useEffect(() => {
    const q = query(collection(firestore, 'courses'));
    return onSnapshot(q, snap =>
      setCourses(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) }))
      )
    );
  }, []);

  // load this user's enrollments
  useEffect(() => {
    const q = query(
      collection(firestore, 'enrollments'),
      where('userId', '==', uid)
    );
    return onSnapshot(q, snap => {
      const ids = snap.docs.map(d => (d.data() as any).courseId);
      setEnrolledIds(new Set(ids));
    });
  }, [uid]);

  const handleEnroll = async (courseId: string) => {
    await addDoc(collection(firestore, 'enrollments'), {
      userId: uid,
      courseId,
      createdAt: serverTimestamp()
    });
  };

  return (
    <section>
      <h2 className={styles.title}>Course Catalog</h2>
      <ul className={styles.list}>
        {courses.map(c => {
          const isEnrolled = enrolledIds.has(c.id);
          return (
            <li key={c.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardCategory}>{c.category}</p>
              <p className={styles.cardDesc}>{c.description}</p>
              <button
                className={styles.button}
                disabled={isEnrolled}
                onClick={() => handleEnroll(c.id)}
              >
                {isEnrolled ? 'Enrolled' : 'Enroll'}
              </button>
            </li>
          );
        })}
        {courses.length === 0 && <li>No courses available.</li>}
      </ul>
    </section>
  );
}
