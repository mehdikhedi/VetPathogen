from locust import HttpUser, between, task


class VetPathogenUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def healthcheck(self):
        self.client.get("/health")

    @task
    def submit_sample(self):
        sample = (
            ">isolate_1\n"
            "ATGAGTATTCAACATTTCCGTGTCGCCCTTATTCCCTTTTTTG\n"
            ">isolate_2\n"
            "ATGGCAGCTATTGTTGACGTTATCGCGGTGATTTTTATC\n"
        )
        files = {"fasta": ("sample.fasta", sample, "text/plain")}
        self.client.post("/analyze/", files=files)
