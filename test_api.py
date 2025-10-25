from fastapi.testclient import TestClient
from backend.main import app

sample = """>isolate_1
ATGAGTATTCAACATTTCCGTGTCGCCCTTATTCCCTTTTTTG
>isolate_2
ATGGCAGCTATTGTTGACGTTATCGCGGTGATTTTTATC
"""

with TestClient(app) as client:
    response = client.post(
        "/analyze/",
        files={"fasta": ("sample.fasta", sample, "text/plain")},
        params={"seed": 42},
    )
    print("POST status", response.status_code)
    payload = response.json()
    print("POST payload", payload)

    job_id = payload.get("job_id")
    if job_id:
        detail = client.get(f"/jobs/{job_id}")
        print("JOB detail", detail.json())
        summary_resp = client.get(f"/jobs/{job_id}/summary")
        print("Summary status", summary_resp.status_code)
        pdf_resp = client.get(f"/jobs/{job_id}/pdf")
        print("PDF status", pdf_resp.status_code)
