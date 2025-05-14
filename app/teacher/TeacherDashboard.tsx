"use client";

import React, { useState } from "react";
import styles from "./teacher.module.css";

import CoursesManager from "./components/CoursesManager/CoursesManager";
import ScheduleManager from "./components/ScheduleManager/ScheduleManager";
import AttendanceManager from "./components/AttendanceManager/AttendanceManager";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<"courses" | "schedule" | "attendance">("courses");

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <button className={activeTab === "courses" ? styles.active : ""} onClick={() => setActiveTab("courses")}>
          Courses
        </button>
        <button className={activeTab === "schedule" ? styles.active : ""} onClick={() => setActiveTab("schedule")}>
          Schedule Class
        </button>
        <button className={activeTab === "attendance" ? styles.active : ""} onClick={() => setActiveTab("attendance")}>
          Attendance
        </button>
      </aside>
      <main className={styles.content}>
        {activeTab === "courses" && <CoursesManager />}
        {activeTab === "schedule" && <ScheduleManager />}
        {activeTab === "attendance" && <AttendanceManager />}
      </main>
    </div>
  );
}
