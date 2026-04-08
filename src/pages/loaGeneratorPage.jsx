import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import UploadBox from '../components/UploadBox';
import ProcoreProjectModal from "../components/ProcoreProjectModal";
import BuyoutReviewModal from "../components/BuyoutReviewModal";
import ProjectDatesModal from '../components/ProjectDatesModal';

function LOAGeneratorPage() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_BACKEND_KEY;
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({ a: null, b: null, b1: [], c: [], d: null, hasp: [] });
  const [subsMetadata, setSubsMetadata] = useState(null);
  const [showCommitmentBranch, setShowCommitmentBranch] = useState(false);
  const [companiesAndProjects, setCompaniesAndProjects] = useState(null);
  const [showProjectChooser, setShowProjectChooser] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [commitmentLoading, setCommitmentLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [phase4Loading, setPhase4Loading] = useState(false);
  const [phase4Result, setPhase4Result] = useState(null);
  const [showPhase4Done, setShowPhase4Done] = useState(false);
  const [phase4Pending, setPhase4Pending] = useState(null);
  const [projectDatesOpen, setProjectDatesOpen] = useState(false);
  const [pendingReviewedSubs, setPendingReviewedSubs] = useState(null);
  const [projectDates, setProjectDates] = useState({ project_start_date: "", project_finish_date: "" });
  const [pendingProjectSelection, setPendingProjectSelection] = useState(null);

  useEffect(() => {
    if (!analyzedData.length) return;
    console.log("✅ FINAL analyzedData:", analyzedData);
  }, [analyzedData]);

  useEffect(() => {
    if (!phase4Pending) return;
    runPhase4CreateCommitments(phase4Pending);
    setPhase4Pending(null);
  }, [phase4Pending]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const procore = params.get("procore");
    if (procore !== "authed") return;

    // Clean URL immediately to prevent re-triggering if the effect re-runs
    params.delete("procore");
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const requiredFields = ['a', 'b', 'b1', 'c', 'd'];
      for (let field of requiredFields) {
        const value = files[field];
        const isArray = Array.isArray(value);
        const fileList = isArray ? value : value ? [value] : [];
        const allArePDFs = fileList.every(f => f && f.type === 'application/pdf');
        if (fileList.length === 0 || !allArePDFs) {
          alert(`Missing or invalid PDF file(s) for Exhibit ${field.toUpperCase()}`);
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('exhibit_a', files.a);
      formData.append('exhibit_b', files.b);
      files.c.forEach(file => formData.append('exhibit_c', file));
      formData.append('exhibit_d', files.d);
      files.b1.forEach(file => formData.append('exhibit_b1', file));
      if (files.hasp) files.hasp.forEach(file => formData.append('exhibit_h', file));

      const response = await fetch(apiUrl + '/generate-loas', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate LOAs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LOA_bundle.zip';
      a.click();
      window.URL.revokeObjectURL(url);

      const metaRes = await fetch(apiUrl + '/get-subs-metadata', {
        headers: { 'x-api-key': apiKey },
        credentials: 'include',
      });
      if (!metaRes.ok) {
        const err = await metaRes.json();
        throw new Error(err.error || 'Failed to fetch subs metadata');
      }
      const metaJson = await metaRes.json();
      setSubsMetadata(metaJson.subs_metadata);
      setShowCommitmentBranch(true);
      console.log(metaJson.subs_metadata);
    } catch (err) {
      alert('Something went wrong while generating LOAs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChosen = ({ companyId, projectId }) => {
    setPendingProjectSelection({ companyId, projectId });
    setProjectDatesOpen(true);
  };

  const handleCreateCommitmentsClick = async () => {
    window.location.href = apiUrl + "/auth/procore";
  };

  const handleFileSelect = (label, selected) => {
    const labelToKey = {
      'Exhibit A': 'a',
      'Exhibit B': 'b',
      'Buyout Files (B.1 will be extracted)': 'b1',
      'Exhibit C': 'c',
      'Exhibit D': 'd',
      'Other Documents (optional)': 'hasp',
    };
    const key = labelToKey[label];
    if (!key) { console.warn(`Unknown label: ${label}`); return; }
    setFiles(prev => ({ ...prev, [key]: selected }));
  };

  const loaIdToCroppedBuyout = useMemo(() => {
    const map = {};
    (subsMetadata || []).forEach((s) => {
      if (s?.loa_id && s?.cropped_buyout_page1) map[s.loa_id] = s.cropped_buyout_page1;
    });
    return map;
  }, [subsMetadata]);

  const handleConfirmReview = (updatedSub) => {
    const total = analyzedData.length;
    const idx = Math.min(reviewIndex, total - 1);
    setAnalyzedData((prev) => { const copy = [...prev]; copy[idx] = updatedSub; return copy; });
    const isLast = idx >= total - 1;
    if (isLast) {
      setReviewOpen(false);
      const finalSubs = analyzedData.map((s, i) => (i === idx ? updatedSub : s));
      setPhase4Pending(finalSubs);
      return;
    }
    setReviewIndex(idx + 1);
  };

  const startPhase3 = async ({ companyId, projectId }) => {
    setSelectedCompanyId(companyId);
    setSelectedProjectId(projectId);
    setCommitmentLoading(true);
    try {
      setShowProjectChooser(false);
      let subs = subsMetadata;
      if (!subs) {
        const metaRes = await fetch(apiUrl + "/get-subs-metadata", {
          headers: { "x-api-key": apiKey },
          credentials: "include",
        });
        if (!metaRes.ok) {
          const err = await metaRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to refetch subs metadata");
        }
        const metaJson = await metaRes.json();
        subs = metaJson.subs_metadata;
        setSubsMetadata(subs);
        setShowCommitmentBranch(true);
      }
      if (!Array.isArray(subs) || subs.length === 0) throw new Error("subs_metadata is empty. Generate LOAs first.");

      const res = await fetch(apiUrl + "/procore/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        credentials: "include",
        body: JSON.stringify({ company_id: Number(companyId), project_id: Number(projectId), subs_metadata: subs }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Phase 3 analysis failed");

      const reviewed = data.subs_metadata;
      if (!Array.isArray(reviewed) || reviewed.length === 0) throw new Error("Analyze succeeded but returned no subs_metadata.");

      setPendingReviewedSubs(reviewed);
      setProjectDatesOpen(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setCommitmentLoading(false);
    }
  };

  const applyDatesAndStartReview = (datesObj) => {
    if (!pendingReviewedSubs?.length) {
      alert("No analyzed subs found. Please rerun analysis.");
      setProjectDatesOpen(false);
      return;
    }
    setProjectDates(datesObj);
    setProjectDatesOpen(false);
    const start = datesObj?.project_start_date?.trim() || null;
    const finish = datesObj?.project_finish_date?.trim() || null;
    const merged = (pendingReviewedSubs || []).map((s) => ({ ...s, project_start_date: start, project_finish_date: finish }));
    setPendingReviewedSubs(null);
    setAnalyzedData(merged);
    setReviewIndex(0);
    setReviewOpen(true);
  };

  const handleDatesSkip = () => {
    applyDatesAndStartReview({ project_start_date: "", project_finish_date: "" });
  };

  const currentAnalyzed = analyzedData?.[reviewIndex] || null;
  const cropped = currentAnalyzed?.loa_id ? loaIdToCroppedBuyout[currentAnalyzed.loa_id] : null;

  const phase4InFlightRef = React.useRef(false);
  const runPhase4CreateCommitments = async (finalSubs) => {
    if (phase4InFlightRef.current) return;
    phase4InFlightRef.current = true;
    setPhase4Loading(true);
    setPhase4Result(null);
    setShowPhase4Done(false);
    try {
      const payload = finalSubs.map((s) => ({ ...s, company_id: Number(selectedCompanyId), project_id: Number(selectedProjectId) }));
      const res = await fetch(apiUrl + "/create-commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Phase 4 commitment creation failed");
      setPhase4Result(data);
      setShowPhase4Done(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setPhase4Loading(false);
      phase4InFlightRef.current = false;
    }
  };

  return (
    <div>
      <h1>Subcontract Generator</h1>
      <h2 style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 400, marginBottom: '1.5rem' }}>
        Upload your subcontract exhibits and we will create the LOA and Procore Commitment for you. Feel free to submit the entire buyout file, we will extract the B.1 automatically.
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        <UploadBox label="Exhibit A" multiple={false} h={180} w={180} onFilesSelected={handleFileSelect} />
        <UploadBox label="Exhibit B" multiple={false} h={180} w={180} onFilesSelected={handleFileSelect} />
        <UploadBox label="Buyout Files (B.1 will be extracted)" multiple={true} h={180} w={180} onFilesSelected={handleFileSelect} />
        <UploadBox label="Exhibit C" multiple={true} h={180} w={180} onFilesSelected={handleFileSelect} />
        <UploadBox label="Exhibit D" multiple={false} h={180} w={180} onFilesSelected={handleFileSelect} />
        <UploadBox label="Other Documents (optional)" multiple={true} h={180} w={180} onFilesSelected={handleFileSelect} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button className="btn-success" onClick={handleSubmit}>
          Generate and Download LOAs
        </button>
      </div>

      {showCommitmentBranch && subsMetadata && (
        <div style={{ marginTop: 16 }}>
          <button className="btn-warning" onClick={handleCreateCommitmentsClick}>
            Create Procore Commitments from these LOAs
          </button>
        </div>
      )}

      {projectsLoading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ borderTopColor: 'var(--color-accent)' }} />
          <p className="loading-message">Connecting to Procore and fetching your projects…</p>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ borderTopColor: 'var(--color-success)' }} />
          <p className="loading-message">Generating LOAs... This may take a few minutes.</p>
        </div>
      )}

      {commitmentLoading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ borderTopColor: 'var(--color-warning)' }} />
          <p className="loading-message">
            Analyzing LOAs and preparing Procore commitments…<br />This may take a moment.
          </p>
        </div>
      )}

      {phase4Loading && (
        <div className="loading-overlay" style={{ zIndex: 1100 }}>
          <div className="spinner" style={{ borderTopColor: 'var(--color-info)' }} />
          <p className="loading-message">
            Creating Procore commitments…<br />Don't close this window.
          </p>
        </div>
      )}

      {showPhase4Done && phase4Result && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.72)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1200, padding: 20,
        }}>
          <div style={{
            width: 'min(700px, 95vw)',
            background: '#1a2638',
            border: '1px solid #2e4060',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}>
            <h2 style={{ marginTop: 0, color: '#eef2f7' }}>Commitment Creation Complete ✅</h2>
            <p style={{ marginBottom: 10, color: '#eef2f7' }}>
              Created: <b>{phase4Result.created_count ?? 0}</b> &nbsp;|&nbsp;
              Failed: <b>{phase4Result.failed_count ?? 0}</b>
            </p>

            <div style={{
              maxHeight: 260, overflow: 'auto',
              border: '1px solid #2e4060',
              borderRadius: 8, padding: 10,
            }}>
              {(phase4Result.results || []).map((r) => (
                <div key={r.index} style={{
                  padding: '6px 0',
                  borderBottom: '1px solid #2e4060',
                  color: '#eef2f7',
                }}>
                  <div><b>{r.contract_number}</b> — {r.vendor_selected || "(no vendor)"} — {r.trade || ""} {r.cost_code || ""}</div>
                  <div style={{ fontSize: 13, color: '#7d97b4' }}>
                    {r.success ? `✅ Created (201)` : `❌ Failed (${r.status_code ?? "server error"})`}
                  </div>
                  {r.success && r.line_item_success === false && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#c9a227' }}>
                      ⚠️ Unable to add a line item for this commitment — please review.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                className="btn-ghost"
                onClick={() => { setShowPhase4Done(false); setPhase4Result(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ProcoreProjectModal
        open={showProjectChooser}
        companiesAndProjects={companiesAndProjects}
        loading={commitmentLoading}
        onClose={() => { if (!commitmentLoading) setShowProjectChooser(false); }}
        onConfirm={startPhase3}
      />

      <BuyoutReviewModal
        open={reviewOpen}
        croppedBuyoutDataUrl={cropped}
        sub={currentAnalyzed}
        index={reviewIndex}
        total={analyzedData?.length || 0}
        loading={false}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleConfirmReview}
      />

      <ProjectDatesModal
        open={projectDatesOpen}
        initialStart={projectDates.project_start_date}
        initialFinish={projectDates.project_finish_date}
        onCancel={handleDatesSkip}
        onConfirm={applyDatesAndStartReview}
      />
    </div>
  );
}

export default LOAGeneratorPage;
