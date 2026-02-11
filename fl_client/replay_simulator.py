"""
Replay Simulator — replays real CIC-IDS2017 preprocessed data for the
CNN-LSTM IDS model instead of generating synthetic traffic.

Data is loaded from .npy files (already preprocessed & StandardScaler-applied):
  - X_seq_chunk_N.npy  →  shape (samples, 10, 78)
  - y_seq_chunk_N.npy  →  shape (samples,)

Two data sources are supported:
  1. **Client data** (default): /app/data/X_seq_chunk_*.npy  — the client's
     FL training partition (e.g. bank_a gets Mon+Tue data).
  2. **Scenario data**: /app/scenarios/<name>/X.npy — pre-built scenario packs
     (ddos_attack, portscan, benign_only, mixed_traffic, etc.)

Env vars
--------
SCENARIO        : str  — scenario name (optional; uses client data if unset)
REPLAY_SPEED    : float — multiplier for replay speed (1.0 = real-time gaps)
REPLAY_LOOP     : bool  — loop back to start when data is exhausted (default true)
REPLAY_SHUFFLE  : bool  — shuffle window order (default false; preserves temporal order)
"""

from __future__ import annotations

import os
import glob
import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np

log = logging.getLogger("replay_simulator")

# Constants matching the model
NUM_FEATURES = 78
WINDOW_SIZE = 10


class ReplaySimulator:
    """
    Replay pre-processed CIC-IDS2017 windows for real model inference.

    Parameters
    ----------
    data_dir : str
        Path containing X_seq_chunk_*.npy / y_seq_chunk_*.npy files
        (client training data).
    scenario_dir : str or None
        Path to a specific scenario directory containing X.npy / y.npy.
        If provided, overrides data_dir.
    loop : bool
        Whether to loop back to the beginning when data is exhausted.
    shuffle : bool
        Whether to shuffle the window order (breaks temporal ordering).
    seed : int or None
        Random seed for shuffling.
    """

    def __init__(
        self,
        data_dir: str = "/app/data",
        scenario_dir: Optional[str] = None,
        loop: bool = True,
        shuffle: bool = False,
        seed: Optional[int] = None,
    ):
        self.loop = loop
        self.shuffle = shuffle
        self.rng = np.random.default_rng(seed)
        self._index = 0
        self._total_replayed = 0

        # Load data from scenario or client chunks
        if scenario_dir and os.path.isdir(scenario_dir):
            self._load_scenario(scenario_dir)
        else:
            self._load_client_chunks(data_dir)

        if self.shuffle and len(self.X) > 0:
            self._shuffle_data()

        log.info(
            "ReplaySimulator ready: %d windows, %d attacks (%.1f%%), loop=%s, shuffle=%s",
            len(self.X),
            int(self.y.sum()) if len(self.y) > 0 else 0,
            (self.y.mean() * 100) if len(self.y) > 0 else 0,
            self.loop,
            self.shuffle,
        )

    # ── Data Loading ─────────────────────────────────────

    def _load_scenario(self, scenario_dir: str) -> None:
        """Load a pre-built scenario pack (X.npy + y.npy)."""
        x_path = os.path.join(scenario_dir, "X.npy")
        y_path = os.path.join(scenario_dir, "y.npy")

        if not os.path.isfile(x_path) or not os.path.isfile(y_path):
            log.warning("Scenario data not found at %s — falling back to empty", scenario_dir)
            self.X = np.empty((0, WINDOW_SIZE, NUM_FEATURES), dtype=np.float32)
            self.y = np.empty(0, dtype=np.int64)
            self.metadata = {}
            return

        self.X = np.load(x_path).astype(np.float32)
        self.y = np.load(y_path).astype(np.int64)

        # Load metadata if available
        meta_path = os.path.join(scenario_dir, "metadata.json")
        if os.path.isfile(meta_path):
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}

        log.info("Loaded scenario from %s: %d windows", scenario_dir, len(self.X))

    def _load_client_chunks(self, data_dir: str) -> None:
        """Load chunked .npy files from the client's data directory."""
        x_pattern = os.path.join(data_dir, "X_seq_chunk_*.npy")
        y_pattern = os.path.join(data_dir, "y_seq_chunk_*.npy")

        x_files = sorted(glob.glob(x_pattern))
        y_files = sorted(glob.glob(y_pattern))

        if not x_files or not y_files:
            log.warning(
                "No .npy data found in %s — ReplaySimulator will have no data",
                data_dir,
            )
            self.X = np.empty((0, WINDOW_SIZE, NUM_FEATURES), dtype=np.float32)
            self.y = np.empty(0, dtype=np.int64)
            self.metadata = {}
            return

        x_chunks = [np.load(f).astype(np.float32) for f in x_files]
        y_chunks = [np.load(f).astype(np.int64) for f in y_files]

        self.X = np.concatenate(x_chunks, axis=0)
        self.y = np.concatenate(y_chunks, axis=0)
        self.metadata = {
            "source": "client_data",
            "data_dir": data_dir,
            "num_chunks": len(x_files),
        }

        log.info(
            "Loaded %d chunks from %s: %d total windows",
            len(x_files), data_dir, len(self.X),
        )

    def _shuffle_data(self) -> None:
        """Shuffle X and y in unison."""
        perm = self.rng.permutation(len(self.X))
        self.X = self.X[perm]
        self.y = self.y[perm]

    # ── Replay Interface ─────────────────────────────────

    @property
    def total_windows(self) -> int:
        """Total number of windows available."""
        return len(self.X)

    @property
    def current_index(self) -> int:
        """Current replay position."""
        return self._index

    @property
    def total_replayed(self) -> int:
        """Total windows replayed since construction."""
        return self._total_replayed

    @property
    def progress(self) -> float:
        """Progress through the dataset (0.0 to 1.0)."""
        if self.total_windows == 0:
            return 0.0
        return self._index / self.total_windows

    @property
    def exhausted(self) -> bool:
        """Whether all data has been replayed (only relevant if loop=False)."""
        return self._index >= self.total_windows and not self.loop

    def get_next_window(self) -> tuple[np.ndarray, int, float]:
        """
        Get the next window from the replay buffer.

        Returns
        -------
        (window, true_label, attack_fraction)
            window       : np.ndarray of shape (10, 78) — already scaled
            true_label   : int (0=benign, 1=attack) — ground truth
            attack_fraction: float — fraction of attack labels in this window's
                            neighbourhood (for compatibility with TrafficSimulator API)
        """
        if self.total_windows == 0:
            # Fallback: return zeros (model will predict benign)
            return (
                np.zeros((WINDOW_SIZE, NUM_FEATURES), dtype=np.float32),
                0,
                0.0,
            )

        # Handle exhaustion
        if self._index >= self.total_windows:
            if self.loop:
                self._index = 0
                if self.shuffle:
                    self._shuffle_data()
                log.info("Replay loop: restarting from beginning")
            else:
                # Return the last window
                idx = self.total_windows - 1
                return self.X[idx], int(self.y[idx]), float(self.y[idx])

        idx = self._index
        self._index += 1
        self._total_replayed += 1

        window = self.X[idx]
        label = int(self.y[idx])

        # Compute local attack fraction (surrounding windows)
        start = max(0, idx - 5)
        end = min(self.total_windows, idx + 5)
        local_labels = self.y[start:end]
        attack_fraction = float(local_labels.mean())

        return window, label, attack_fraction

    def generate_window(self) -> tuple[np.ndarray, float]:
        """
        Compatibility wrapper matching TrafficSimulator.generate_window() API.

        Returns
        -------
        (window, attack_fraction)
            window          : np.ndarray (10, 78)
            attack_fraction : float
        """
        window, _, attack_fraction = self.get_next_window()
        return window, attack_fraction

    def get_stats(self) -> dict:
        """Return current replay statistics."""
        return {
            "total_windows": self.total_windows,
            "current_index": self._index,
            "total_replayed": self._total_replayed,
            "progress": round(self.progress, 4),
            "exhausted": self.exhausted,
            "attack_ratio": round(float(self.y.mean()), 4) if len(self.y) > 0 else 0.0,
            "loop": self.loop,
            "shuffle": self.shuffle,
            "metadata": self.metadata,
        }

    def reset(self) -> None:
        """Reset replay to beginning."""
        self._index = 0
        if self.shuffle:
            self._shuffle_data()
        log.info("Replay reset to beginning")
