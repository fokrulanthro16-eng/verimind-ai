"use client";

import React, { useState, useEffect } from "react";
import Masthead from "@/components/Masthead";
import AssessmentWorkspace from "@/components/AssessmentWorkspace";
import CohortDiagnostics from "@/components/CohortDiagnostics";
import ModelFairnessAudit from "@/components/ModelFairnessAudit";
import { HealthResponse, DemoCase, fetchHealth, fetchDemoCases } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [demos, setDemos] = useState<DemoCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [h, d] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchDemoCases().catch(() => []),
        ]);
        if (h) setHealth(h);
        if (d && d.length > 0) setDemos(d);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();

    // Periodic telemetry ping
    const timer = setInterval(() => {
      fetchHealth()
        .then((h) => setHealth(h))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-alabaster text-ink-primary font-sans">
      {/* Top Architectural Masthead (56px height, sticky) */}
      <Masthead
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center font-mono text-xs text-ink-muted">
            <span>CONNECTING TO VERIMIND FORENSIC ENGINE...</span>
          </div>
        ) : (
          <>
            {activeTab === 1 && <AssessmentWorkspace demos={demos} />}
            {activeTab === 2 && <CohortDiagnostics />}
            {activeTab === 3 && <ModelFairnessAudit />}
          </>
        )}
      </main>
    </div>
  );
}
