import React, { useEffect, useState } from "react";
import ProjectModalForMatrix from "../components/ProjectModalForMatrix";
import BillingPeriodModal from "../components/BillingPeriodModal";

function LoadingOverlay({ color, message }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" style={{ borderTopColor: color }} />
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default function BillingMatrixGeneratorPage() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_BACKEND_KEY;

  const [companiesAndProjects, setCompaniesAndProjects] = useState(null);
  const [showProjectChooser, setShowProjectChooser] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [billingPeriods, setBillingPeriods] = useState(null);
  const [showBillingPeriodModal, setShowBillingPeriodModal] = useState(false);
  const [periodsLoading, setPeriodsLoading] = useState(false);

  const [generatingMatrix, setGeneratingMatrix] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("procore") !== "authed") return;

    params.delete("procore");
    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);

    const fetchCompaniesAndProjects = async () => {
      setProjectsLoading(true);
      try {
        const res = await fetch(apiUrl + "/procore/companies-projects", {
          method: "GET",
          credentials: "include",
          headers: { "x-api-key": apiKey },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch companies/projects");
        }

        const data = await res.json();
        setCompaniesAndProjects(data);
        setShowProjectChooser(true);
      } catch (e) {
        alert("Procore auth succeeded, but fetching companies/projects failed: " + e.message);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchCompaniesAndProjects();
  }, [apiUrl, apiKey]);

  const handleConnectProcore = () => {
    window.location.href = apiUrl + "/auth/procore?return_to=/billing-matrix";
  };

  const handleProjectChosen = async ({ companyId, projectId }) => {
    setSelectedCompanyId(companyId);
    setSelectedProjectId(projectId);
    setShowProjectChooser(false);
    setPeriodsLoading(true);
    setShowBillingPeriodModal(true);

    try {
      const res = await fetch(apiUrl + "/billing/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        credentials: "include",
        body: JSON.stringify({ company_id: Number(companyId), project_id: Number(projectId) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to fetch billing periods");

      setBillingPeriods(data.billing_periods);
    } catch (e) {
      alert("Failed to fetch billing periods: " + e.message);
      setShowBillingPeriodModal(false);
    } finally {
      setPeriodsLoading(false);
    }
  };

  const handlePeriodConfirmed = async (period) => {
    setShowBillingPeriodModal(false);
    setShowProjectChooser(false);
    setGeneratingMatrix(true);

    try {
      const res = await fetch(apiUrl + "/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        credentials: "include",
        body: JSON.stringify({
          company_id: Number(selectedCompanyId),
          project_id: Number(selectedProjectId),
          position: period.position,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate billing matrix");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing_matrix_${period.month}_${period.year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to generate billing matrix: " + e.message);
    } finally {
      setGeneratingMatrix(false);
    }
  };

  return (
    <div>
      <h1>Billing Matrix Generator</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Connect to Procore, select your project and billing period, and download
        the filled billing matrix spreadsheet.
      </p>

      <button className="btn-info" onClick={handleConnectProcore}>
        Connect to Procore &amp; Generate Matrix
      </button>

      {projectsLoading && (
        <LoadingOverlay
          color="var(--color-info)"
          message="Connecting to Procore and fetching your projects…"
        />
      )}

      {generatingMatrix && (
        <LoadingOverlay
          color="var(--color-success)"
          message="Generating billing matrix… This may take a moment."
        />
      )}

      <ProjectModalForMatrix
        open={showProjectChooser}
        companiesAndProjects={companiesAndProjects}
        loading={false}
        onClose={() => setShowProjectChooser(false)}
        onConfirm={handleProjectChosen}
        title="Select Company & Project"
        confirmLabel="Choose Billing Period"
        showSubsCheck={false}
      />

      <BillingPeriodModal
        open={showBillingPeriodModal}
        billingPeriods={billingPeriods}
        loading={periodsLoading}
        onClose={() => setShowBillingPeriodModal(false)}
        onConfirm={handlePeriodConfirmed}
      />
    </div>
  );
}
