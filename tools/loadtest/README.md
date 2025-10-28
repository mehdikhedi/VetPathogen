# Load Testing Notes

This folder contains a simple [Locust](https://locust.io/) script you can use to exercise the
VetPathogen API once the Docker stack is running.

## Quick start

```bash
pip install locust
locust -f tools/loadtest/locustfile.py --host http://127.0.0.1:8000
```

Navigate to `http://localhost:8089`, set the number of users/spawn rate, and start the test.
The script hits `/health` and repeatedly posts the bundled demo FASTA to `/analyze/`.

Adjust payloads or endpoints as needed when the real pipeline is in place.
