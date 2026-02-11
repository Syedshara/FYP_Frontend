"""
Monitoring loop — runs inside the FL client container.

In MONITOR mode, this module:
  1. Fetches the device list for this client from the backend API
  2. Replays real CIC-IDS2017 traffic via ReplaySimulator
  3. Runs local CNN-LSTM inference on each 10-flow window
  4. POSTs prediction results back to the backend

Supports two data sources:
  - Client data (default): .npy files from the client's training partition
  - Scenario data: pre-built scenario packs (e.g. ddos_attack, portscan)

Env vars
--------
CLIENT_ID       : str   — e.g. "bank_a"
BACKEND_URL     : str   — e.g. "http://iot_ids_backend:8000"
MONITOR_INTERVAL: float — seconds between prediction cycles (default 3.0)
ATTACK_RATIO    : float — fraction of simulated traffic that is attacks (default 0.2)
SCENARIO        : str   — scenario name (optional; uses client data if unset)
REPLAY_SPEED    : float — replay speed multiplier (default 1.0)
REPLAY_LOOP     : bool  — loop replay when exhausted (default true)
REPLAY_SHUFFLE  : bool  — shuffle window order (default false)
SCENARIO_DIR    : str   — base path for scenario data (default /app/scenarios)
"""

from __future__ import annotations

import os
import sys
import time
import logging
import asyncio
from pathlib import Path
from collections import OrderedDict
from typing import Optional

import numpy as np
import torch
import httpx

# Shared model definition
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fl_common.model import CNN_LSTM_IDS, DEFAULT_CONFIG
from replay_simulator import ReplaySimulator, WINDOW_SIZE, NUM_FEATURES

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")
log = logging.getLogger("monitor")

# ── Config from env ──────────────────────────────────────
CLIENT_ID = os.environ.get("CLIENT_ID", "client_0")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://iot_ids_backend:8000")
MONITOR_INTERVAL = float(os.environ.get("MONITOR_INTERVAL", "3.0"))
ATTACK_RATIO = float(os.environ.get("ATTACK_RATIO", "0.2"))
MONITOR_DEVICE_ID = os.environ.get("MONITOR_DEVICE_ID", None)  # Device-specific monitoring
MODEL_DIR = os.environ.get("MODEL_DIR", "/app/models")
SCENARIO = os.environ.get("SCENARIO", "")           # empty = use client data
REPLAY_SPEED = float(os.environ.get("REPLAY_SPEED", "1.0"))
REPLAY_LOOP = os.environ.get("REPLAY_LOOP", "true").lower() in ("true", "1", "yes")
REPLAY_SHUFFLE = os.environ.get("REPLAY_SHUFFLE", "false").lower() in ("true", "1", "yes")
SCENARIO_BASE = os.environ.get("SCENARIO_DIR", "/app/scenarios")
DATA_DIR = os.environ.get("DATA_PATH", "/app/data")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SEQ_LEN = DEFAULT_CONFIG["SEQUENCE_LENGTH"]
THRESHOLD = DEFAULT_CONFIG["THRESHOLD"]


# ── Model loading ────────────────────────────────────────

def _find_model() -> Optional[str]:
    """Find the best available model checkpoint."""
    candidates = [
        os.path.join(MODEL_DIR, "global_final.pt"),
        os.path.join(MODEL_DIR, "cnn_lstm_global_with_HE_25rounds_16k.pt"),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    # Try any .pt file in the directory
    if os.path.isdir(MODEL_DIR):
        for fname in sorted(os.listdir(MODEL_DIR)):
            if fname.endswith(".pt"):
                return os.path.join(MODEL_DIR, fname)
    return None


def load_model() -> CNN_LSTM_IDS:
    """Load the CNN-LSTM model from checkpoint."""
    model_path = _find_model()
    if model_path is None:
        log.warning("No model checkpoint found — using randomly initialised model")
        model = CNN_LSTM_IDS(SEQ_LEN, NUM_FEATURES).to(DEVICE)
        model.eval()
        return model

    model = CNN_LSTM_IDS(SEQ_LEN, NUM_FEATURES).to(DEVICE)
    state = torch.load(model_path, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state)
    model.eval()
    log.info("Loaded model from %s", model_path)
    return model


# ── Inference ────────────────────────────────────────────

def run_local_inference(
    model: CNN_LSTM_IDS, window: np.ndarray,
) -> dict:
    """
    Run inference on a single window (10, 78).

    Returns dict with score, label, confidence, inference_latency_ms.
    """
    t0 = time.perf_counter()
    tensor = torch.from_numpy(window).unsqueeze(0).to(DEVICE)  # (1, 10, 78)

    with torch.no_grad():
        logit = model(tensor).squeeze()
        prob = torch.sigmoid(logit).item()

    latency = (time.perf_counter() - t0) * 1000

    label = "attack" if prob >= THRESHOLD else "benign"
    confidence = prob if label == "attack" else 1.0 - prob

    return {
        "score": round(prob, 6),
        "label": label,
        "confidence": round(confidence, 6),
        "inference_latency_ms": round(latency, 2),
    }


# ── Backend API helpers ──────────────────────────────────

async def fetch_devices(
    http: httpx.AsyncClient, client_db_id: int,
) -> list[dict]:
    """Fetch devices assigned to this FL client from the backend."""
    try:
        r = await http.get(
            f"{BACKEND_URL}/api/v1/internal/client/{client_db_id}/devices"
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.error("Failed to fetch devices: %s", exc)
        return []


async def fetch_client_info(http: httpx.AsyncClient) -> Optional[dict]:
    """Fetch this client's DB record by client_id string."""
    try:
        r = await http.get(
            f"{BACKEND_URL}/api/v1/internal/client/by-client-id/{CLIENT_ID}"
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.error("Failed to fetch client info for '%s': %s", CLIENT_ID, exc)
        return None


async def post_prediction(
    http: httpx.AsyncClient,
    device_id: str,
    client_db_id: int,
    result: dict,
) -> bool:
    """POST prediction result to the backend internal endpoint."""
    payload = {
        "device_id": device_id,
        "client_id": client_db_id,
        "score": result["score"],
        "label": result["label"],
        "confidence": result["confidence"],
        "inference_latency_ms": result["inference_latency_ms"],
        "model_version": "local",
    }
    try:
        r = await http.post(
            f"{BACKEND_URL}/api/v1/internal/predictions",
            json=payload,
        )
        r.raise_for_status()
        return True
    except Exception as exc:
        log.error("Failed to POST prediction: %s", exc)
        return False


# ── Main monitoring loop ────────────────────────────────

async def monitor_loop(stop_event: asyncio.Event | None = None):
    """
    Main monitoring loop.

    1. Resolve this client's DB id
    2. Fetch assigned devices
    3. For each device, generate traffic, run inference, POST prediction
    4. Sleep for MONITOR_INTERVAL seconds
    5. Repeat
    """
    model = load_model()

    # Determine data source: scenario or client data
    scenario_dir = None
    if SCENARIO:
        scenario_dir = os.path.join(SCENARIO_BASE, SCENARIO)
        if not os.path.isdir(scenario_dir):
            log.warning("Scenario dir %s not found — falling back to client data", scenario_dir)
            scenario_dir = None
        else:
            log.info("Using scenario: %s (%s)", SCENARIO, scenario_dir)

    # Use HybridSimulator if attack_ratio is configured or device is specified
    use_hybrid = ATTACK_RATIO > 0 or MONITOR_DEVICE_ID is not None
    
    if use_hybrid:
        try:
            from hybrid_simulator import HybridSimulator
            simulator = HybridSimulator(
                data_dir=DATA_DIR,
                scenario_dir=scenario_dir,
                attack_ratio=ATTACK_RATIO,
                device_id=MONITOR_DEVICE_ID or "default",
                client_id=CLIENT_ID,
                loop=REPLAY_LOOP,
                shuffle=REPLAY_SHUFFLE,                use_temporal=True,  # Enable realistic temporal attack patterns            )
            log.info("Using HybridSimulator with attack_ratio=%.2f, device=%s", ATTACK_RATIO, MONITOR_DEVICE_ID or "all")
        except ImportError:
            log.warning("HybridSimulator not available, falling back to ReplaySimulator")
            simulator = ReplaySimulator(
                data_dir=DATA_DIR,
                scenario_dir=scenario_dir,
                loop=REPLAY_LOOP,
                shuffle=REPLAY_SHUFFLE,
            )
    else:
        simulator = ReplaySimulator(
            data_dir=DATA_DIR,
            scenario_dir=scenario_dir,
            loop=REPLAY_LOOP,
            shuffle=REPLAY_SHUFFLE,
        )

    effective_interval = MONITOR_INTERVAL / max(REPLAY_SPEED, 0.1)

    log.info(
        "Starting monitor for client '%s' (interval=%.1fs, speed=%.1fx, scenario=%s, windows=%d)",
        CLIENT_ID, effective_interval, REPLAY_SPEED,
        SCENARIO or "client_data", simulator.total_windows,
    )

    async with httpx.AsyncClient(timeout=10.0) as http:
        # ── Resolve our client DB id ────────────────────
        client_info = None
        while client_info is None:
            client_info = await fetch_client_info(http)
            if client_info is None:
                log.warning("Waiting for client '%s' to be registered in backend...", CLIENT_ID)
                await asyncio.sleep(5)
                if stop_event and stop_event.is_set():
                    return

        client_db_id = client_info["id"]
        log.info("Resolved client '%s' → DB id=%d", CLIENT_ID, client_db_id)

        # ── Main loop ──────────────────────────────────
        cycle = 0
        while not (stop_event and stop_event.is_set()):
            cycle += 1

            # Refresh device list periodically (every 10 cycles)
            if cycle == 1 or cycle % 10 == 0:
                devices = await fetch_devices(http, client_db_id)
                if not devices:
                    log.warning("No devices assigned — waiting...")
                    await asyncio.sleep(MONITOR_INTERVAL)
                    continue
                log.info("Monitoring %d devices", len(devices))

            # For each device, replay real traffic and predict
            for device in devices:
                device_id = device["id"]
                device_name = device.get("name", device_id)

                # Check if replay data is exhausted (non-looping mode)
                if hasattr(simulator, 'exhausted') and simulator.exhausted:
                    log.info("Replay data exhausted — stopping monitor")
                    return

                # Get next window (API differs between HybridSimulator and ReplaySimulator)
                if isinstance(simulator, ReplaySimulator):
                    window, true_label, attack_frac = simulator.get_next_window()
                    result_metadata = {"true_label": "attack" if true_label == 1 else "benign"}
                else:
                    # HybridSimulator API: returns (window, metadata)
                    window, sim_metadata = simulator.generate_window()
                    true_label = 1 if sim_metadata.get("has_attack") else 0
                    result_metadata = {
                        "true_label": "attack" if true_label == 1 else "benign",
                        "is_synthetic": sim_metadata.get("is_synthetic", False),
                        "window_id": sim_metadata.get("window_id"),
                    }

                # Run real CNN-LSTM inference on real preprocessed data
                result = run_local_inference(model, window)
                result.update(result_metadata)

                # Include ground truth and replay stats in the prediction
                result["replay_progress"] = simulator.progress if hasattr(simulator, 'progress') else 0
                result["attack_type"] = SCENARIO if SCENARIO else None
                
                if MONITOR_DEVICE_ID:
                    result["monitoring_device"] = MONITOR_DEVICE_ID

                # POST to backend
                ok = await post_prediction(http, device_id, client_db_id, result)

                log.info(
                    "[%s] device=%s  pred=%s  truth=%s  score=%.4f  conf=%.4f  latency=%.1fms  synthetic=%s  posted=%s",
                    CLIENT_ID, device_name[:20],
                    result["label"], result.get("true_label", "unknown"),
                    result["score"], result["confidence"],
                    result["inference_latency_ms"],
                    result.get("is_synthetic", False),
                    "✓" if ok else "✗",
                )

            # Wait before next cycle (adjusted by replay speed)
            try:
                await asyncio.sleep(effective_interval)
            except asyncio.CancelledError:
                break

    log.info("Monitor stopped for client '%s'", CLIENT_ID)


def run_monitor():
    """Entry point to run the monitor loop."""
    asyncio.run(monitor_loop())


if __name__ == "__main__":
    run_monitor()
