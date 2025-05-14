'use client';

import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import styles from './MyCourses.module.css';

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

interface Announcement {
  id: string;
  courseId: string;
  text: string;
  createdAt: any;
}

export default function MyCourses() {
  const uid = auth.currentUser?.uid!;
  const [enrolled, setEnrolled] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string[]>>({});

  // load enrolled courses
  useEffect(() => {
    const q = query(
      collection(firestore, 'enrollments'),
      where('userId', '==', uid)
    );
    const unsub = onSnapshot(q, async snap => {
      const courseIds = snap.docs.map(d => (d.data() as any).courseId);
      // fetch course details
      const courses: Course[] = [];
      courseIds.forEach(id => {
        // optimistic: only id and title; you can fetch each doc separately if needed
        courses.push({ id, title: '' });
      });
      setEnrolled(courses);
    });
    return unsub;
  }, [uid]);

  // load lectures for enrolled courses
  useEffect(() => {
    if (enrolled.length === 0) return;
    const q = query(
      collection(firestore, 'lectures'),
      where('courseId', 'in', enrolled.map(c => c.id))
    );
    return onSnapshot(q, snap =>
      setLectures(
        snap.docs.map(d => {
          const { id, ...data } = d.data() as Lecture;
          return { id: d.id, ...data };
        })
      )
    );
  }, [enrolled]);

  // load announcements
  useEffect(() => {
    if (enrolled.length === 0) return;
    const q = query(
      collection(firestore, 'announcements'),
      where('courseId', 'in', enrolled.map(c => c.id))
    );
    return onSnapshot(q, snap =>
      setAnnouncements(
        snap.docs.map(d => {
          const { id, ...data } = d.data() as Announcement;
          return { id: d.id, ...data };
        })
      )
    );
  }, [enrolled]);

  // load attendance
  useEffect(() => {
    const q = collection(firestore, 'attendance');
    const unsub = onSnapshot(q, snap => {
      const map: Record<string, string[]> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        map[data.lectureId] = data.attendees;
      });
      setAttendanceMap(map);
    });
    return unsub;
  }, []);

  return (
    <section>
      <h2 className={styles.title}>My Courses</h2>

      {enrolled.length === 0 && <p>You’re not enrolled in any courses yet.</p>}

      {enrolled.map(course => (
        <div key={course.id} className={styles.courseCard}>
          <h3 className={styles.courseTitle}>{course.title}</h3>

          <div className={styles.subsection}>
            <h4>Upcoming Lectures</h4>
            <ul>
              {lectures
                .filter(l => l.courseId === course.id)
                .map(l => (
                  <li key={l.id} className={styles.item}>
                    <span>{new Date(l.scheduledAt.seconds * 1000).toLocaleString()}</span>
                    <span>{l.topic}</span>
                    <a href={l.meetingLink} target="_blank" rel="noreferrer">
                      Join
                    </a>
                    <span
                      className={
                        attendanceMap[l.id]?.includes(uid)
                          ? styles.present
                          : styles.absent
                      }
                    >
                      {attendanceMap[l.id]?.includes(uid) ? '✔️' : '❌'}
                    </span>
                  </li>
                ))}
              {lectures.filter(l => l.courseId === course.id).length === 0 && (
                <li className={styles.empty}>No lectures scheduled.</li>
              )}
            </ul>
          </div>

          <div className={styles.subsection}>
            <h4>Announcements</h4>
            <ul>
              {announcements
                .filter(a => a.courseId === course.id)
                .map(a => (
                  <li key={a.id} className={styles.announcementItem}>
                    {a.text}
                  </li>
                ))}
              {announcements.filter(a => a.courseId === course.id).length === 0 && (
                <li className={styles.empty}>No announcements.</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
