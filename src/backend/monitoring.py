"""
MarketProbe Production Observability, Telemetry & Prometheus Metrics
Tracks request latencies, error counts, active WebSockets, and system memory.
"""

import time
from typing import Dict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class TelemetryCollector:
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.status_codes: Dict[int, int] = {}
        self.total_latency_seconds = 0.0
        self.start_time = time.time()
        self.active_websockets = 0

    def record_request(self, status_code: int, latency: float):
        self.request_count += 1
        self.total_latency_seconds += latency
        self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
        if status_code >= 400:
            self.error_count += 1

    def format_prometheus_metrics(self) -> str:
        uptime = round(time.time() - self.start_time, 2)
        avg_latency = round((self.total_latency_seconds / max(1, self.request_count)) * 1000, 2)
        
        lines = [
            "# HELP marketprobe_uptime_seconds Total seconds the server has been running.",
            "# TYPE marketprobe_uptime_seconds gauge",
            f"marketprobe_uptime_seconds {uptime}",
            "",
            "# HELP marketprobe_requests_total Total number of HTTP requests received.",
            "# TYPE marketprobe_requests_total counter",
            f"marketprobe_requests_total {self.request_count}",
            "",
            "# HELP marketprobe_errors_total Total number of HTTP error responses.",
            "# TYPE marketprobe_errors_total counter",
            f"marketprobe_errors_total {self.error_count}",
            "",
            "# HELP marketprobe_avg_latency_ms Average request latency in milliseconds.",
            "# TYPE marketprobe_avg_latency_ms gauge",
            f"marketprobe_avg_latency_ms {avg_latency}",
            "",
            "# HELP marketprobe_active_websockets Current number of active WebSocket client subscriptions.",
            "# TYPE marketprobe_active_websockets gauge",
            f"marketprobe_active_websockets {self.active_websockets}",
        ]
        
        for code, count in self.status_codes.items():
            lines.append(f'marketprobe_http_responses_total{{status="{code}"}} {count}')
            
        return "\n".join(lines) + "\n"

telemetry = TelemetryCollector()

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        t0 = time.time()
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            telemetry.record_request(500, time.time() - t0)
            raise e
        
        latency = time.time() - t0
        telemetry.record_request(status_code, latency)
        response.headers["X-Response-Time-Ms"] = str(round(latency * 1000, 2))
        response.headers["X-MarketProbe-Engine"] = "v4.5-Enterprise"
        return response
